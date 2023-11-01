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
    },
    GetActivePool: async (req, res) =>{
        try {
            const globalPool = await GlobalPool.findOne({
                where: {
                    isActive: true
                }
            })
            return res.status(201).json(globalPool)
        } catch (error) {
            console.log(error);
            return res.status(500).send(`Error: ${ error.message }`);
        }
    },
    ActivateGlobalPool: async (req, res) =>{
        try {
            const { id } = req.params
            const globalPools = await GlobalPool.findAll()
            for (const pool of globalPools){
                pool.isActive  = false
                pool.save()
            }
            const globalPool = await GlobalPool.update(
                { isActive: true },
                { where: { id } }
            )
            return res.status(201).json(globalPool)
        } catch (error) {
            console.log(error);
            return res.status(500).send(`Error: ${ error.message }`);
        }
    }
};
