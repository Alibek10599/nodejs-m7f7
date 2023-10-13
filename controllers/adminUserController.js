const { User } = require("../models");

module.exports = {
    GetUsers: async (req, res) => {
        try {
            const users = await User.findAll([
        ]);

        return res.status(200).json(users);

        } catch (error) {
            return res.status(500).send("Error: " + error.message);
        }
    },
    verifyUser: async (req, res) => {
        try {
            const { id } = req.params
            const user = await User.findByPk(id)
            user.isConfirmed = true
            user.save()

            return res.status(200).json(user)
        } catch (error) {
            return res.status(500).send('Error: ' + error.message);
        }
    }
};
