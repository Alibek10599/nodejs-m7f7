const {
    GlobalPool,
    SubAccount,
    SubUser,
    SubStratum,
    Stratum
} = require('../models');
const PoolTypes = require("../pool/pool-types");
const { Op } = require("sequelize");
const { PoolFactory, isSBIPool, isLuxorPool } = require("../pool/pool-factory");

module.exports = {
    GetSubUsers: async (req, res) => {
        try {
            const subAccounts = await SubUser.findAll({
                where: {
                    userId: req.user.dataValues.id,
                    isActive: true
                },
                include: [
                    {
                        model: SubAccount,
                        attributes: ["subAccName", 'vsub1Id', 'luxorId'],
                        as: "subAccount"
                    }
                ]
          });
    
          return res.status(200).json(subAccounts);
        } catch (error) {
            console.log(error);
            res.status(500).send(`Error: ${error.message}`);
        }
    },

    GetSubAccountInfo: async (req, res) => {
        const { subAccName } = req.query;
        const userId = req.user.dataValues.id;
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

            const result = await pool.getStatus(subAccName, userId);
            
            res.status(200).json(result);
        } catch (error) {
            console.log(error);
            res.status(500).send(`Error: ${error.message}`);
        }
    },

    GetSubAccountEarnings: async (req, res) => {
        const { subAccName, fromDate, toDate } = req.query;
        const userId = req.user.dataValues.id;
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

            const result = await pool.getEarnings(fromDate, toDate, 100, subAccName);
            
            res.status(200).json(result);
        } catch (error) {
            console.log(error);
            res.status(500).send(`Error: ${error.message}`);
        }
    },

    GetSubAccountPayouts: async (req, res) => {
        try {
            const { subaccountNames } = req.query;
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
            const transactions = await pool.getTransactions(fromDate, toDate, 100, subaccountNames);
      
            return res.status(200).json(transactions);
        } catch (error) {
            console.log(error);
            return res.status(500).send(`Error: ${error.message}`);
        }
    }
}
