const { User, Log, SubUser } = require('../models');
const UserValidation = require('../validators/UserValidation');

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
// <-- to finish
  inviteUser: async (req, res) => {
    const { email, roleId, subAccountId, orgId } = req.body;
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

      exisitingUser = await User.create({
        email,
        roleId,
        orgId
      });

      const user = {
        userId: exisitingUser._id,
        email: exisitingUser.email,
      };
        
      exisitingSubUser = await SubUser.create({
        subAccountId,
        userId: user.userId
      });

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
  }
}
