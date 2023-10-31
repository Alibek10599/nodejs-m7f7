const { GlobalPool, User } = require('../models');

module.exports = {
    GetGlobalPools: async (req, res) => {
        try {
            const globalPools = await GlobalPool.findAll({
                // include: [
                //     {
                //         model: User,
                //         attributes: ['userName'],
                //         as: 'user'
                //     }
                // ]
            });

            return res.status(200).json(globalPools);
        } catch (error) {
            console.log(error);
            return res.status(500).send(`Error: ${ error.message }`);
        }
    }
};
