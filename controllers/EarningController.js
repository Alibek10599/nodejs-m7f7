const getService = require("../config/pool");
const { GlobalPool } = require('../models')
const { PoolFactory } = require("../pool/pool-factory");

module.exports = {
    GetPayouts: async (req, res) => {
        try {
            const globalPool = await GlobalPool.findOne({
              where: {
                isActive: true,
              },
              order: [["id", "DESC"]],
            });

            if (!globalPool) {
              throw new Error("No one global pool active");
            }

            const pool = PoolFactory.createPool(globalPool);

            const { fromDate, toDate } = req.query;
            const transactions = await pool.getTransactions(fromDate, toDate, 100);
            
            return res.status(200).json(transactions);
        } catch (error) {
            console.log(error);
            return res.status(500).send(`Error: ${ error.message }`);
        }
    },

    GetEarnings: async (req, res) => {
        try {
            const globalPool = await GlobalPool.findOne({
              where: {
                isActive: true,
              },
              order: [["id", "DESC"]],
            });

            if (!globalPool) {
              throw new Error("No one global pool active");
            }

            const pool = PoolFactory.createPool(globalPool);

            const { fromDate, toDate } = req.query;
            
            const earnings = await pool.getEarnings(fromDate, toDate, 100)
            
            return res.status(200).json(earnings);
        } catch (error) {
            console.log(error);
            return res.status(500).send(`Error: ${ error.message }`);
        }
    },

    GetEstimatedRevenue: async (req, res) => {
        const { subaccountNames } = req.body;
        try {
          const globalPool = await GlobalPool.findOne({
            where: {
              isActive: true,
            },
            order: [["id", "DESC"]],
          });

          if (!globalPool) {
            throw new Error("No one global pool active");
          }

          const pool = PoolFactory.createPool(globalPool);

          const result = await pool.getEstimatedRevenue(subaccountNames)

            // const {service: sbiService } = await getService();
            
            // const sbiRevenues = await sbiService.getRevenues({subaccountNames: 'MidasTest1'});

            // const revenues = Object.values(sbiRevenues.data.estimatedRevenues)

            return res.status(200).json(result);
        } catch (error) {
            console.log(error);
            return res.status(500).send(`Error: ${ error.message }`);
        }
    }
};
