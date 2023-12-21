const { User, Log, Role, SubUser } = require('../models');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const UserValidation = require('../validators/UserValidation');
const selectNotifyService = require("../notifications/service/notification-selector");
const {EMAIL} = require("../utils/constants/selectors");
const generatePassword = require('../utils/generatePassword');

const createActivationToken = (user) => jwt.sign(user, process.env.ACTIVATION_SECRET);

module.exports = {
  GetUsers: async (req, res) => {
    try {
      const users = await User.findAll();

      return res.status(200).json(users);
    } catch (error) {
      return res.status(500).send(`Error: ${ error.message }`);
    }
  },

  GetOrganizationUsers: async (req, res) => {
    const orgId = req.user.dataValues.orgId;

    try {
      const users = await User.findAll({
        where: {
          orgId: orgId
        }
      });

      // users.forEach(async element => {
      //   const subUsers = await SubUser.findAll({
      //     where: {
      //       userId: element.id
      //     },
      //     attributes: ['subAccountId']
      //   });
      //   users.push(subUsers);
      // });

      return res.status(200).json(users);
    } catch (error) {
      console.log(error);
      return res.status(500).send(`Error: ${ error.message }`);
    }
  },

  verifyUser: async (req, res) => {
    try {
      const { id } = req.params;
      const user = await User.findByPk(id);
      user.isConfirmed = true;
      user.save();

      await Log.create({
        userId: req.user.dataValues.id,
        action: 'update',
        controller: 'adminUser',
        description: req.user.dataValues.userName + ' verify: ' + user.userName
      });


      return res.status(200).json(user);
    } catch (error) {
      return res.status(500).send(`Error: ${ error.message }`);
    }
  },
  
  inviteUser: async (req, res) => {
    const { email, roleValue, subAccountId, orgId } = req.body;
    const { errors, isValid } = UserValidation(req.body);
    try{
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

      let role = await Role.findOne({
        where: {
          roleName: roleValue
        }
      });

      const password = generatePassword();
      const hashedpassword = await bcrypt.hash(password, 8);

      exisitingUser = await User.create({
        email,
        userName: email,
        roleId: role.id,
        orgId,
        password: hashedpassword
      });

      const user = {
        userId: exisitingUser.id,
        email: exisitingUser.email,
      };
        
      exisitingSubUser = await SubUser.create({
        subAccountId,
        userId: user.userId
      });
      
      const activationToken = createActivationToken(user);
      const activationUrl = `${ process.env.FRONTEND_URL }/acceptinvitation?activationToken=${ activationToken }`;

      await selectNotifyService.notificationSelector({
        email: exisitingUser.email,
        urlOrCode: activationUrl,
        userName: exisitingUser.userName,
        subject: 'Accept Invitation',
        template: 'acceptinvitation'
      }, EMAIL)

      await Log.create({
        userId: req.user.dataValues.id,
        action: 'update',
        controller: 'adminUser',
        description: req.user.dataValues.userName + ' invite: ' + user.email  + ' to SubAccountId: ' + subAccountId
      });

      res.status(201).json({
        success: true,
        message: `please wait your invited user to activate his account!`,
      });
    } catch (error) {
      console.log(error);
      return res.status(500).send(`Error: ${ error.message }`);
    }
  },
  GetUserInfo: async (req, res) => {
    const id = req.query.id;

    try{
      const user = await User.findByPk(id);
      const logs = await Log.findAll({
        where: {
          userId: id
        },                
        order: [
          ['createdAt', 'DESC'],
        ],
        include: [
          {
            model: User,
            attributes: ['userName'],
            as: 'user'
          }
        ]
      });

      res.status(200).json({user, logs})
    } catch (error) {
      console.log(error);
      return res.status(500).send(`Error: ${ error.message }`);
    }
  },
  activateUser: async (req, res) => {
    const { id } = req.body;

    try {
      const user = await User.findByPk(id);

      user.isActive = true;
      user.save();

      await Log.create({
        userId: req.user.dataValues.id,
        action: 'update',
        controller: 'user',
        description: req.user.dataValues.userName + ' activate: ' + user.userName
      });

      return res.status(200).json(user);
    } catch (error) {
      return res.status(500).send(`Error: ${ error.message }`);
    }
  },
  deactivateUser: async (req, res) => {
    const { id } = req.body;

    try {
      const user = await User.findByPk(id);

      user.isActive = false;
      user.save();

      await Log.create({
        userId: req.user.dataValues.id,
        action: 'update',
        controller: 'user',
        description: req.user.dataValues.userName + ' deactivate: ' + user.userName
      });

      return res.status(200).json(user);
    } catch (error) {
      console.log(error);
      return res.status(500).send(`Error: ${ error.message }`);
    }
  },
  delete2fa: async (req, res) => {
    const { id } = req.body;

    try {
      const user = await User.findByPk(id);

      user.isActive2FA = false;
      user.secret2FA = null;
      user.save();

      await Log.create({
        userId: req.user.dataValues.id,
        action: 'update',
        controller: 'user',
        description: req.user.dataValues.userName + ' deactivate 2FA: ' + user.userName
      });

      return res.status(200).json(user);
    } catch (error) {
      console.log(error);
      return res.status(500).send(`Error: ${ error.message }`);
    }
  },
  addUserToSubAcc: async (req, res) => {
    const { userName, id } = req.body;
    try {
      const user = await User.findOne({
        where: {
          userName
        }
      });

      const existingSubUser = await SubUser.create({
        subAccountId: id,
        userId: user.id
      });

      await Log.create({
        userId: req.user.dataValues.id,
        action: 'update',
        controller: 'adminUser',
        description: req.user.dataValues.userName + ' add: ' + user.email  + ' to SubAccountId: ' + id
      });

      return res.status(200).json(existingSubUser);
    } catch (error) {
      console.log(error);
      return res.status(500).send(`Error: ${ error.message }`);
    }
  }
}
