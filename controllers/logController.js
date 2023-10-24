const { Log, User } = require('../models');

module.exports = {
    GetLogs: async (req, res) => {
        try {
            const logs = await Log.findAll({
                include: [
                    {
                        model: User,
                        attributes: ['userName'],
                        as: 'user'
                    }
                ]
            });

            return res.status(200).json(logs);
        } catch (error) {
            console.log(error);
            return res.status(500).send(`Error: ${ error.message }`);
        }
    }
};
