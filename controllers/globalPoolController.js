const { GlobalPool, User } = require('../models');

module.exports = {
    GetGlobalPools: async (req, res) => {
        try {
            const globalPools = await GlobalPool.findAll();

            return res.status(200).json(globalPools);
        } catch (error) {
            console.log(error);
            return res.status(500).send(`Error: ${error.message}`);
        }
    },
    GetActivePoolStatus: async (req, res) => {
        try {
            const globalPool = await GlobalPool.findOne({
                where: {
                    isActive: true
                },
                order: [["id", "DESC"]],
            });

            if (!globalPool) {
                throw new Error("No one global pool active");
            }

            return res.status(200).json({ fees: globalPool.globalFees, minTreashold: globalPool.minTreashold, typeEarnings: globalPool.typeEarnings });
        } catch (error) {
            console.log(error);
            return res.status(500).send(`Error: ${error.message}`);
        }
    },
    CreateGlobalPool: async (req, res) => {
        try {
            const data = req.body
            const globalPool = await GlobalPool.create({ ...data })
            return res.status(201).json(globalPool)
        } catch (error) {
            console.log(error);
            return res.status(500).send(`Error: ${error.message}`);
        }
    },
    GetActivePool: async (req, res) => {
        try {
            const globalPool = await GlobalPool.findOne({
                where: {
                    isActive: true
                }
            })
            return res.status(201).json(globalPool)
        } catch (error) {
            return res.status(500).send(`Error: ${error.message}`);
        }
    },
    ActivateGlobalPool: async (req, res) => {
        try {
            const { id } = req.body
            const globalPools = await GlobalPool.findAll()
            for (const pool of globalPools) {
                if (pool.id === id)
                    await GlobalPool.update({ isActive: true }, { where: { id } })
                else
                    await GlobalPool.update({ isActive: false }, { where: { id: pool.id } })
            }
            return res.status(201).json(globalPools.find((item) => item.id === id))
        } catch (error) {
            return res.status(500).send(`Error: ${error.message}`);
        }
    }
};
