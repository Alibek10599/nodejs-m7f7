const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User } = require('../models');
const SignupValidation = require('../validators/SignupValidation');
const SigninValidation = require('../validators/SigninValidation');
const ResetValidation = require('../validators/ResetValidation');
const sendMail = require('../utils/sendMail');
const { AccessToken, RefreshToken } = require('../utils/jwt');
const QRCode = require('qrcode');
const speakeasy = require('speakeasy');

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
      const activationUrl = `${ process.env.FRONTEND_URL }/emailverification?activationToken=${ activationToken }`;
      await sendMail(
        exisitingUser.email,
        activationUrl,
        exisitingUser.userName,
        'Email Verification',
        'verificationmail',
      );
      res.status(201).json({
        success: true,
        message: `please check your email:- ${ exisitingUser.email } to activate your account!`,
      });
    } catch (error) {
      return res.status(500).send(`Error: ${ error.message }`);
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
      const user = await User.findOne({ where: { email } });
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
      return res.status(500).send(`Error: ${ error.message }`);
    }
  },

  //  ------------------------ //signin method to add a new user//------------------------- //
  signin: async (req, res) => {
    const { email, password } = req.body;
    const { errors, isValid } = SigninValidation(req.body);

    try {
      if (!isValid) {
        return res.status(400).json(errors);
      }
      const userExist = await User.findOne({ where: { email } });
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
      return res.status(500).send(`Error: ${ error.message }`);
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
      const reseturl = `${ process.env.FRONTEND_URL }/resetpassword?resetPasswordToken=${ resetPasswordToken }`;
      await sendMail(
        user.email,
        reseturl,
        user.userName,
        'RESET YOUR PASSWORD',
        'forgotpasswordmail',
      );
      res.status(200).json({
        success: true,
        message: `please check your email:- ${ user.email } to Reset your password!`,
      });
    } catch (error) {
      return res.status(500).send(`Error: ${ error.message }`);
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
      return res.status(500).send(`Error: ${ error.message }`);
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
      name: 'Midas Pool', // app name
      algorithm: 'sha1', // Use the SHA-1 algorithm
      digits: 6, // Generate 8-digit OTP codes
      totp: true, // Use TOTP (Time-Based One-Time Password) mode
    });
    
    QRCode.toDataURL(secret.otpauth_url, (err, data_url) => {
      res.json({ secret: secret.base32, qrcode: data_url });
    });
  },

  verify2fa: async (req, res ) => {
    const { secret, otp } = req.body;
    const verified = speakeasy.totp.verify({
      secret: secret,
      encoding: 'base32',
      token: otp,
    });

    if(!verified) {
      return res.status(500).send('Wrong OTP');
    }

    const user = await User.findOne({
      where: {
        id: req.user.dataValues.id,
      },
    });

    if (!user) {
      return res.status(404).json('user not found');
    }

    user.secret2FA = secret;

    await user.save();

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

  delete2fa: async (req, res ) => {
    const { secret, otp } = req.body;
    const verified = speakeasy.totp.verify({
      secret: secret,
      encoding: 'base32',
      token: otp,
    });
    if(!verified){
      return res.status(500).send('Wrong OTP');
    }
    const user = await User.findOne({
      where: {
        id: req.user.dataValues.id,
      },
    });

    if (!user) {
      return res.status(404).json('user not found');
    }

    user.secret2FA = null;

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
  }
};
