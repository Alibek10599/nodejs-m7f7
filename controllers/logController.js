const { Log, LoginLog, User } = require('../models');

module.exports = {
    GetLogs: async (req, res) => {
        try {
            const logs = await Log.findAll({
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

            return res.status(200).json(logs);
        } catch (error) {
            console.log(error);
            return res.status(500).send(`Error: ${ error.message }`);
        }
    },
    GetUserLoginHistory: async (req, res) => {
        const id = req.user.dataValues.id;
        const limit = parseInt(req.query.limit);

        try {
            const logs = await LoginLog.findAll({
                where: {
                    userId: id
                },
                limit: limit,
                order: [
                    ['createdAt', 'DESC'],
                ],
            });

            res.status(200).json(logs);
        } catch (error) {
            console.log(error);
            return res.status(500).send(`Error: ${ error.message }`);
        }
    }
};
