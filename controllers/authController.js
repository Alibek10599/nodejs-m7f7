const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Organization, User, Log, LoginLog, Role } = require('../models');
const SignupValidation = require('../validators/SignupValidation');
const SigninValidation = require('../validators/SigninValidation');
const ResetValidation = require('../validators/ResetValidation');
const { AccessToken, RefreshToken } = require('../utils/jwt');
const QRCode = require('qrcode');
const speakeasy = require('speakeasy');
const requestIp = require('request-ip');
const TwoFAValidation = require('../validators/TwoFAValidation');
const UAParser = require('ua-parser-js');
const axios = require('axios');
const selectNotifyService = require("../notifications/service/notification-selector");
const { EMAIL } = require("../utils/constants/selectors");
const sendPoolAdminNotification = require("../notifications/service/poolAdminsNotification");
const graylog = require('../services/logger/graylog');

const createActivationToken = (user) => jwt.sign(user, process.env.ACTIVATION_SECRET);

const createResetPasswordToken = (user) => jwt.sign(user, process.env.RESET_PASSWORD_SECRET);

module.exports = {

  //  ---------------- //signup method to create a new user//-------------- //
  signup: async (req, res) => {
    const { name: userName, email, password } = req.body;
    const { errors, isValid } = SignupValidation(req.body);

    try {
      if (!isValid) {
        return res.status(400).json(errors);
      }
      let exisitingUser = await User.findOne({
        where: {
          email,
        },
      });
      if (exisitingUser) {
        errors.email = 'User with given email already Exist';
        return res.status(404).json(errors);
      }
      const hashedpassword = await bcrypt.hash(password, 8);
      // const { id:userRole } = await Role.findOne({ where: { roleName: ROLES.USER }})

      exisitingUser = await User.create({
        userName,
        email,
        password: hashedpassword,
        roleId: 1,
      });

      const user = {
        userId: exisitingUser._id,
        email: exisitingUser.email,
      };

      const activationToken = createActivationToken(user);
      const activationUrl = `${process.env.FRONTEND_URL}/emailverification?activationToken=${activationToken}`;

      Promise.allSettled([
        selectNotifyService.notificationSelector({
          email: exisitingUser.email,
          urlOrCode: activationUrl,
          userName: exisitingUser.userName,
          subject: 'Email Verification',
          template: 'verificationmail',
        }, EMAIL),
        sendPoolAdminNotification('New User!', `User ${exisitingUser.email} with a name ${exisitingUser.userName} was succesfully registered.
Новый пользователь ${exisitingUser.email} с именем ${exisitingUser.userName} был успешно зарегистрирован!
${exisitingUser.email} ${exisitingUser.userName} атты жаңа қолданушы тіркелді!
`)
      ])
      graylog.info(`User ${exisitingUser.email} with a name ${exisitingUser.userName} was succesfully registered.
      Новый пользователь ${exisitingUser.email} с именем ${exisitingUser.userName} был успешно зарегистрирован!
      ${exisitingUser.email} ${exisitingUser.userName} атты жаңа қолданушы тіркелді!`)
      res.status(201).json({
        success: true,
        message: `please check your email:- ${exisitingUser.email} to activate your account!`,
      });
    } catch (error) {
      return res.status(500).send(`Error: ${error.message}`);
    }
  },

  //  --------------- //verifyemail method to verify user email //--------------- //
  verifyemail: async (req, res) => {
    const { query } = req;
    const { activationToken } = query;

    if (!activationToken) {
      return res.status(401).json('Invalid token');
    }
    try {
      const { email } = jwt.verify(
        activationToken,
        process.env.ACTIVATION_SECRET,
      );
      const user = await User.findOne({
        where: {
          email
        },
        include: [
          {
            model: Role,
            attributes: ['roleName'],
            as: 'role'
          }
        ]
      });
      if (!user) {
        return res.status(404).json('Invalid token');
      }
      user.isConfirmed = true;
      await user.save();
      const token = AccessToken(user);
      const refreshToken = RefreshToken(user._id);

      res.cookie('token', refreshToken, {
        httpOnly: true, // accessible only by web server
        secure: true, // https
        sameSite: 'None', // cross-site cookie
        maxAge: 7 * 24 * 60 * 60 * 1000, // cookie expiry: set to match rT
      });
      res.status(200).json(token);
    } catch (error) {
      console.log(error);
      return res.status(500).send(`Error: ${error.message}`);
    }
  },

  //  ------------------------ //signin method to add a new user//------------------------- //
  signin: async (req, res) => {
    const { email, password, otp } = req.body;
    const { errors, isValid } = SigninValidation(req.body);
    const clientIp = requestIp.getClientIp(req);

    try {
      if (!isValid) {
        return res.status(400).json(errors);
      }
      const userExist = await User.findOne({
        where: { email },
        include: [
          {
            model: Role,
            attributes: ['roleName'],
            as: 'role'
          }
        ]
      });
      if (!userExist) {
        errors.email = 'Email does not exist ! please Enter the right Email or You can make account';
        return res.status(404).json(errors);
      }
      const passwordMatch = await bcrypt.compare(password, userExist.password);
      if (!passwordMatch) {
        errors.password = 'Wrong Password';
        return res.status(400).json(errors);
      }
      if (!userExist.dataValues.isConfirmed) {
        return res.status(401).json('Please Verify Your Email and Try again');
      }

      const orgExist = await Organization.findByPk(userExist.orgId);

      if (orgExist) {
        if (!orgExist.dataValues.isRequestedApprove) {
          return res.status(401).json('Please Wait Your Organization Verification');
        }
      }

      if (userExist.dataValues.secret2FA) {
        if (!otp) {
          return res.status(400).json('Please Verify 2FA');
        } else {
          const { errors: errors2FA, isValid: isValid2FA } = TwoFAValidation({ secret: userExist.dataValues.secret2FA, otp: otp });

          if (!isValid2FA) {
            return res.status(400).json({ otp: errors2FA.otp });
          }
        }
      }

      await selectNotifyService.notificationSelector({
        email: userExist.email,
        urlOrCode: clientIp,
        userName: userExist.userName,
        subject: 'Login Attempted',
        template: 'loginattempt',
      }, EMAIL)

      // // Create a new instance of UAParser
      const parser = new UAParser();

      // Parse the User-Agent string
      const result = parser.setUA(req.get('user-agent')).getResult();

      // Get the device information
      const deviceModel = result.device.model;
      // const deviceType = result.device.type; // This will be 'mobile', 'tablet', 'smarttv', 'console', or 'desktop'

      const apiKey = 'cef741fa768b78';

      const apiUrl = `https://ipinfo.io/${clientIp}?token=${apiKey}`;

      const location = await axios.get(apiUrl)
        .then(response => {
          const data = response.data;
          const locationStr = data.region + ', ' + data.country
          return locationStr;
        })
        .catch(error => {
          console.error('Error:', error);
        });

      await LoginLog.create({
        userId: userExist.id,
        ip: clientIp,
        device: deviceModel,
        location: location,
        type: 1
      });

      graylog.log({
        'userId': userExist.id,
        'ip': clientIp,
        'device': deviceModel,
        'location': location,
        'type': 1
      })

      if (!userExist.dataValues.isActive) {
        return res.status(401).json('Your account is deactivated');
      }

      const token = AccessToken(userExist);
      const refreshToken = RefreshToken(userExist._id);
      // Create secure cookie with refresh token
      res.cookie('token', refreshToken, {
        httpOnly: true, // accessible only by web server
        secure: true, // https
        sameSite: 'None', // cross-site cookie
        maxAge: 7 * 24 * 60 * 60 * 1000, // cookie expiry: set to match rT
      });
      res.status(200).json(token);
    } catch (error) {
      console.log(error);
      return res.status(500).send(`Error: ${error.message}`);
    }
  },

  //  -------------------- //forgetPassword method to add a new user//------------------- //
  forgetPassword: async (req, res) => {
    const { email } = req.body;
    try {
      if (!email) {
        return res.status(400).json('email is required');
      }
      const user = await User.findOne({ where: { email } });
      if (!user) {
        return res.status(400).json('Email could not be sent');
      }

      const resetPasswordToken = createResetPasswordToken({
        userId: user.id,
        email: user.email,
      });
      user.resetPasswordToken = resetPasswordToken;
      await user.save();
      const reseturl = `${process.env.FRONTEND_URL}/resetpassword?resetPasswordToken=${resetPasswordToken}`;

      await selectNotifyService.notificationSelector({
        email: user.email,
        urlOrCode: reseturl,
        userName: user.userName,
        subject: 'RESET YOUR PASSWORD',
        template: 'forgotpasswordmail',
      }, EMAIL)

      res.status(200).json({
        success: true,
        message: `please check your email:- ${user.email} to Reset your password!`,
      });
    } catch (error) {
      return res.status(500).send(`Error: ${error.message}`);
    }
  },

  //  ------------- //resetpassword method to let the user creat a new password //--------------- //
  resetpassword: async (req, res) => {
    const { password, confirmPassword } = req.body;

    if (password !== confirmPassword) return res.status(404).json('Passwords do not match');

    const { query } = req;
    const { resetPasswordToken } = query;
    const { errors, isValid } = ResetValidation(req.body);

    try {
      if (!resetPasswordToken) {
        return res.status(401).json('Unauthoriazed');
      }
      const decoded = jwt.verify(
        resetPasswordToken,
        process.env.RESET_PASSWORD_SECRET,
      );
      const user = await User.findOne({
        where: {
          id: decoded.userId,
          resetPasswordToken,
        },
        include: [
          {
            model: Role,
            attributes: ['roleName'],
            as: 'role'
          }
        ]
      });
      if (!user) {
        return res.status(404).json('Wrong Reset Password token');
      }
      if (!isValid) {
        return res.status(400).json(errors);
      }
      const hashedpassword = await bcrypt.hash(password, 8);
      user.password = hashedpassword;
      user.resetPasswordToken = null;
      await user.save();
      const token = AccessToken(user);
      return res.status(200).json(token);
    } catch (error) {
      console.log(error);
      return res.status(500).send(`Error: ${error.message}`);
    }
  },

  //  ---------------------------------------- //refresh token //--------------------------- //
  refresh: async (req, res) => {
    const { cookies } = req;
    try {
      if (!cookies?.token) return res.status(401).json('Unauthorized');
      const decoded = jwt.verify(
        req.cookies.token,
        process.env.REFRESH_TOKEN_SECRET,
      );
      const foundUser = await User.findByPk(decoded.userId);
      if (!foundUser) return res.status(401).json('Unauthorized');
      const token = AccessToken(foundUser);

      return res.json(token);
    } catch (error) {
      return res.status(403).send('Error: Forbidden ');
    }
  },

  //  ---------------------------------------- //LOgOut //--------------------------- //
  logout: async (req, res) => {
    // const { cookies } = req;
    // if (!cookies?.token) {
    //     res.status(402).json({message: "No CONTENT FOUND IN THE COOKIE"}); //No content
    //     return;
    // }
    res.clearCookie('token', {
      httpOnly: true,
      sameSite: 'None',
      secure: true,
    });
    res.json({ message: 'Cookie cleared' });
  },

  generate2fa: async (req, res) => {
    const secret = speakeasy.generateSecret({
      length: 20, // Adjust the length of the secret as needed
      name: 'Midas Pool: ' + req.user.dataValues.email, // app name
      algorithm: 'sha1', // Use the SHA-1 algorithm
      digits: 6, // Generate 8-digit OTP codes
      totp: true, // Use TOTP (Time-Based One-Time Password) mode
    });

    QRCode.toDataURL(secret.otpauth_url, (err, data_url) => {
      res.json({ secret: secret.base32, qrcode: data_url });
    });
  },

  add2fa: async (req, res) => {
    const { secret } = req.body;

    const { errors, isValid } = TwoFAValidation(req.body);

    if (!isValid) {
      return res.status(500).json(errors);
    }

    const user = await User.findOne({
      where: {
        id: req.user.dataValues.id,
      },
      include: [
        {
          model: Role,
          attributes: ['roleName'],
          as: 'role'
        }
      ]
    });

    if (!user) {
      return res.status(404).json('user not found');
    }

    user.secret2FA = secret;
    user.isActive2FA = true;

    await user.save();

    await Log.create({
      userId: req.user.dataValues.id,
      action: 'update',
      controller: 'auth',
      description: req.user.dataValues.userName + ' add 2FA'
    });

    graylog.log({
      userId: req.user.dataValues.id,
      action: 'update',
      controller: 'auth',
      description: req.user.dataValues.userName + ' add 2FA'
    })

    const token = AccessToken(user);
    const refreshToken = RefreshToken(user.id);

    res.cookie('token', refreshToken, {
      httpOnly: true, // accessible only by web server
      secure: true, // https
      sameSite: 'None', // cross-site cookie
      maxAge: 7 * 24 * 60 * 60 * 1000, // cookie expiry: set to match rT
    });
    res.status(200).json(token);
  },

  delete2fa: async (req, res) => {
    const { errors, isValid } = TwoFAValidation(req.body);

    if (!isValid) {
      return res.status(500).json(errors);
    }

    const user = await User.findOne({
      where: {
        id: req.user.dataValues.id,
      },
      include: [
        {
          model: Role,
          attributes: ['roleName'],
          as: 'role'
        }
      ]
    });

    if (!user) {
      return res.status(404).json('user not found');
    }

    user.secret2FA = null;

    await user.save();

    await Log.create({
      userId: req.user.dataValues.id,
      action: 'delete',
      controller: 'auth',
      description: req.user.dataValues.userName + ' delete 2FA'
    });

    const token = AccessToken(user);
    const refreshToken = RefreshToken(user._id);

    res.cookie('token', refreshToken, {
      httpOnly: true, // accessible only by web server
      secure: true, // https
      sameSite: 'None', // cross-site cookie
      maxAge: 7 * 24 * 60 * 60 * 1000, // cookie expiry: set to match rT
    });
    res.status(200).json(token);
  },

  addTg: async (req, res) => {
    const { id, tgUserId } = req.body;
    try {
      const user = await User.findByPk(id);

      user.isActiveTg = true;
      user.tgUserId = tgUserId;
      user.save();

      await Log.create({
        userId: req.user.dataValues.id,
        action: 'update',
        controller: 'user',
        description: req.user.dataValues.userName + ' add Telegram: ' + user.userName
      });

      return res.status(200).json(user);
    } catch (error) {
      return res.status(500).send(`Error: ${error.message}`);
    }
  },

  activateTg: async (req, res) => {
    const { id } = req.body;
    try {
      const user = await User.findByPk(id);

      user.isActiveTg = true;
      user.save();

      await Log.create({
        userId: req.user.dataValues.id,
        action: 'update',
        controller: 'user',
        description: req.user.dataValues.userName + ' activate Telegram: ' + user.userName
      });

      return res.status(200).json(user);
    } catch (error) {
      return res.status(500).send(`Error: ${error.message}`);
    }
  },

  deactivateTg: async (req, res) => {
    const { id } = req.body;
    try {
      const user = await User.findByPk(id);

      user.isActiveTg = false;
      user.save();

      await Log.create({
        userId: req.user.dataValues.id,
        action: 'update',
        controller: 'user',
        description: req.user.dataValues.userName + ' deactivate Telegram: ' + user.userName
      });

      return res.status(200).json(user);
    } catch (error) {
      return res.status(500).send(`Error: ${error.message}`);
    }
  }
};
