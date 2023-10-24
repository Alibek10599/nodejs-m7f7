const { User, Log } = require('../models');

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
};
