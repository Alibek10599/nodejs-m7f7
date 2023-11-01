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
    },
    CreateGlobalPool: async (req, res) =>{
        try {
            const data = req.body
            const globalPool = await GlobalPool.create({...data})
            return res.status(201).json(globalPool)
        } catch (error) {
            console.log(error);
            return res.status(500).send(`Error: ${ error.message }`);
        }
    }
};
