const { User, Log, Role, SubUser } = require('../models');
const jwt = require('jsonwebtoken');
const sendMail = require('../notifications/mail-sender/sendMail');
const UserValidation = require('../validators/UserValidation');

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
      })

      exisitingUser = await User.create({
        email,
        userName: email,
        roleId: role.id,
        orgId,
        password: 'default'
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
      await sendMail(
        exisitingUser.email,
        activationUrl,
        exisitingUser.userName,
        'Accept Invitation',
        'acceptinvitation',
      );

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
    console.log(req.body);
    try {

    } catch (error) {
      return res.status(500).send(`Error: ${ error.message }`);
    }
  },
  deactivateUser: async (req, res) => {
    console.log(req.body);
    try {

    } catch (error) {
      return res.status(500).send(`Error: ${ error.message }`);
    }
  }
}
