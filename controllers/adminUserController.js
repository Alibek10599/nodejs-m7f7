const { User, Log, Role, SubUser, Organization } = require('../models');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const UserValidation = require('../validators/UserValidation');
const selectNotifyService = require("../notifications/service/notification-selector");
const { EMAIL } = require("../utils/constants/selectors");
const generatePassword = require('../utils/generatePassword');
const sendPoolAdminNotification = require("../notifications/service/poolAdminsNotification");
const sendOrgAdminNotification = require('../notifications/service/orgAdminNotification');
const graylog = require('../services/logger/graylog')

const createActivationToken = (user) => jwt.sign(user, process.env.ACTIVATION_SECRET);

module.exports = {
  GetUsers: async (req, res) => {
    try {
      const roles = await Role.findAll({
        where: {
          roleName: ['OrgAdmin', 'OrgAccount', 'OrgTech']
        }
      });

      const roleIds = roles.map(role => role.id);

      const users = await User.findAll(
        {
          where: {
            roleId: roleIds
          },
          include: [
            {
              model: Role,
              attributes: ['roleName'],
              as: 'role'
            }
          ]
        }
      );

      return res.status(200).json(users);
    } catch (error) {
      return res.status(500).send(`Error: ${error.message}`);
    }
  },

  GetAdminUsers: async (req, res) => {
    try {
      const roles = await Role.findAll({
        where: {
          roleName: ['PoolAdmin', 'PoolAccount', 'PoolTech']
        }
      });

      const roleIds = roles.map(role => role.id);

      const users = await User.findAll(
        {
          where: {
            roleId: roleIds
          },
          include: [
            {
              model: Role,
              attributes: ['roleName'],
              as: 'role'
            }
          ]
        }
      );

      return res.status(200).json(users);
    } catch (error) {
      return res.status(500).send(`Error: ${error.message}`);
    }
  },

  GetOrganizationUsers: async (req, res) => {
    const orgId = req.user.dataValues.orgId;

    try {
      const users = await User.findAll({
        where: {
          orgId: orgId
        },
        include: [
          {
            model: Role,
            attributes: ['roleName'],
            as: 'role'
          }
        ]
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
      return res.status(500).send(`Error: ${error.message}`);
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

      graylog.info({
        'userId': req.user.dataValues.id,
        'action': 'update',
        'controller': 'adminUser',
        'description': req.user.dataValues.userName + ' verify: ' + user.userName
      })


      return res.status(200).json(user);
    } catch (error) {
      return res.status(500).send(`Error: ${error.message}`);
    }
  },

  inviteAdminOrg: async (req, res) => {
    const { email, name } = req.body;
    const { errors, isValid } = UserValidation(req.body);

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

      let role = await Role.findOne({
        where: {
          roleName: 'OrgAdmin'
        }
      });

      const password = generatePassword();
      const hashedpassword = await bcrypt.hash(password, 8);

      exisitingUser = await User.create({
        email,
        userName: name,
        roleId: role.id,
        orgId: req.user.orgId,
        password: hashedpassword
      });

      const user = {
        userId: exisitingUser.id,
        email: exisitingUser.email,
      };

      const activationToken = createActivationToken(user);
      const activationUrl = `${process.env.FRONTEND_URL}/acceptinvitation?activationToken=${activationToken}`;

      await selectNotifyService.notificationSelector({
        email: exisitingUser.email,
        urlOrCode: activationUrl,
        userName: exisitingUser.userName,
        subject: 'Accept Invitation',
        template: 'acceptinvitation'
      }, EMAIL)

      sendPoolAdminNotification(`New user was invited`, `${role.roleName} with a name ${exisitingUser.userName} and email ${exisitingUser.email} was succesfully invited.
Новый пользователь ${exisitingUser.userName} был приглашен успешно.
${exisitingUser.userName} атты жаңа қолданушы шақырылды.
`)
      graylog.info(`${role.roleName} with a name ${exisitingUser.userName} and email ${exisitingUser.email} was succesfully invited.`)
      await Log.create({
        userId: req.user.dataValues.id,
        action: 'update',
        controller: 'adminUser',
        description: req.user.dataValues.userName + ' invite: ' + user.email
      });

      graylog.log({
        'userId': req.user.dataValues.id,
        'action': 'update',
        'controller': 'adminUser',
        'description': req.user.dataValues.userName + ' invite: ' + user.email
      })

      res.status(201).json({
        success: true,
        message: `please wait your invited user to activate his account!`,
      });

    } catch (error) {
      return res.status(500).send(`Error: ${error.message}`);
    }
  },

  inviteAdminUser: async (req, res) => {
    const { email, name, roleValue } = req.body;
    const { errors, isValid } = UserValidation(req.body);

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

      let role = await Role.findOne({
        where: {
          roleName: roleValue
        }
      });

      const password = generatePassword();
      const hashedpassword = await bcrypt.hash(password, 8);

      exisitingUser = await User.create({
        email,
        userName: name,
        roleId: role.id,
        password: hashedpassword
      });

      const user = {
        userId: exisitingUser.id,
        email: exisitingUser.email,
      };

      const activationToken = createActivationToken(user);
      const activationUrl = `${process.env.FRONTEND_URL}/acceptinvitation?activationToken=${activationToken}`;

      Promise.allSettled([
        selectNotifyService.notificationSelector({
          email: exisitingUser.email,
          urlOrCode: activationUrl,
          userName: exisitingUser.userName,
          subject: 'Accept Invitation',
          template: 'acceptinvitation'
        }, EMAIL),
        sendPoolAdminNotification('User registered!', `
User ${exisitingUser.email} with a name ${exisitingUser.userName} was succesfully registered in a platform!
Новый пользователь ${exisitingUser.email} с именем ${exisitingUser.userName} был успешно зарегистрирован в платформу!
${exisitingUser.email} ${exisitingUser.userName} атты жаңа қолданушы платвормаға сәтті тіркелді!
`),
      ])
      graylog.info(`User ${exisitingUser.email} with a name ${exisitingUser.userName} was succesfully registered in a platform!`)

      await Log.create({
        userId: req.user.dataValues.id,
        action: 'update',
        controller: 'adminUser',
        description: req.user.dataValues.userName + ' add admin user: ' + user.email
      });

      res.status(201).json({
        success: true,
        message: `please wait your invited user to activate his account!`,
      });
    } catch (error) {
      console.log(error);
      return res.status(500).send(`Error: ${error.message}`);
    }
  },

  inviteUser: async (req, res) => {
    const { email, roleValue, subAccountId, orgId } = req.body;
    const { errors, isValid } = UserValidation(req.body);
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

        // errors.email = 'User with given email already Exist';
        // return res.status(404).json(errors);

        const exisitingSubUser = await SubUser.findOne({
          where: {
            subAccountId,
            userId: exisitingUser.id
          }
        });

        if (exisitingSubUser == null) {
          await SubUser.create({
            subAccountId,
            userId: exisitingUser.id
          });
        }

        res.status(201).json({
          success: true,
          message: `user added to subAccount`,
        });

        return;
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

      const exisitingSubUser = await SubUser.create({
        subAccountId,
        userId: user.userId
      });

      const activationToken = createActivationToken(user);
      const activationUrl = `${process.env.FRONTEND_URL}/acceptinvitation?activationToken=${activationToken}`;

      Promise.allSettled([
        selectNotifyService.notificationSelector({
          email: exisitingUser.email,
          urlOrCode: activationUrl,
          userName: exisitingUser.userName,
          subject: 'Accept Invitation',
          template: 'acceptinvitation'
        }, EMAIL),
        sendPoolAdminNotification(`New user was invited`, `New user with a name ${exisitingUser.userName} was succesfully invited.
Новый пользователь ${exisitingUser.userName} был добавлен успешно.
${exisitingUser.userName} атты жаңа қолданушы қосылды.
`),
        sendOrgAdminNotification('Accept Invitation', `User ${exisitingUser.userName} was succesfully invited.
Новый пользователь ${exisitingUser.userName} был добавлен успешно.
${exisitingUser.userName} атты жаңа қолданушы қосылды.
`, orgId)
      ])
      await Log.create({
        userId: req.user.dataValues.id,
        action: 'update',
        controller: 'adminUser',
        description: req.user.dataValues.userName + ' invite: ' + user.email + ' to SubAccountId: ' + subAccountId
      });

      graylog.log({
        'userId': req.user.dataValues.id,
        'action': 'update',
        'controller': 'adminUser',
        'description': req.user.dataValues.userName + ' invite: ' + user.email + ' to SubAccountId: ' + subAccountId
      })

      res.status(201).json({
        success: true,
        message: `please wait your invited user to activate his account!`,
      });
    } catch (error) {
      console.log(error);
      return res.status(500).send(`Error: ${error.message}`);
    }
  },
  GetUserInfo: async (req, res) => {
    const id = req.query.id;

    try {
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

      res.status(200).json({ user, logs })
    } catch (error) {
      console.log(error);
      return res.status(500).send(`Error: ${error.message}`);
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
      graylog.log({
        'userId': req.user.dataValues.id,
        'action': 'update',
        'controller': 'user',
        'description': req.user.dataValues.userName + ' activate: ' + user.userName
      })

      return res.status(200).json(user);
    } catch (error) {
      return res.status(500).send(`Error: ${error.message}`);
    }
  },
  deactivateUser: async (req, res) => {
    const { id } = req.body;

    try {
      const user = await User.findByPk(id);

      user.isActive = false;
      user.isDeleted = true;
      user.save();

      await Log.create({
        userId: req.user.dataValues.id,
        action: 'update',
        controller: 'user',
        description: req.user.dataValues.userName + ' deactivate: ' + user.userName
      });

      sendPoolAdminNotification('User deactivated', `
User ${user.email} was deactivated sucessfully.
Пользователь ${user.email} был успешно деактивирован.
Қолданушы ${user.email} сәтті ажыратылды.   
`)
      graylog.info(`User ${user.email} was deactivated sucessfully.`)
      return res.status(200).json(user);
    } catch (error) {
      console.log(error);
      return res.status(500).send(`Error: ${error.message}`);
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
      sendPoolAdminNotification('User 2FA deactivated', `
Two factor authentication for ${user.userName} was succesfully deactivated.
Двух факторная аутентификация для ${user.userName} была успешно деактивирована.
${user.userName} үшін екі факторлық аутентификациясы сәтті ажыратылды.
`)
      graylog.info(`Two factor authentication for ${user.userName} was succesfully deactivated.`)

      return res.status(200).json(user);
    } catch (error) {
      console.log(error);
      return res.status(500).send(`Error: ${error.message}`);
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
        description: req.user.dataValues.userName + ' add: ' + user.email + ' to SubAccountId: ' + id
      });

      Promise.allSettled([
        sendPoolAdminNotification('User was added', `
User for ${user.userName} was added.
Пользователь для ${user.userName} был добавлен.
${user.userName} пайдаланушысы қосылды.
`),
        sendOrgAdminNotification('User was added', `
User for ${user.userName} was added
User ${user.userName} пайдаланушысы қосылды
Пользователь ${user.userName} был добавлен
`, user?.orgId)
      ])

      graylog.info(`User for ${user.userName} was added`)

      return res.status(200).json(existingSubUser);
    } catch (error) {
      console.log(error);
      return res.status(500).send(`Error: ${error.message}`);
    }
  }
}
