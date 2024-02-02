const { Op } = require("sequelize")
const { GlobalPool, SubAccount } = require("../models")
const { PoolFactory } = require("../pool/pool-factory");
const PoolTypes = require("../pool/pool-types");

module.exports = {
  GetPayouts: async (req, res) => {
    try {
      const orgId = req.query.id !== 'undefined' ? req.query.id : req.user.orgId
      const subaccountNames = (await SubAccount.findAll({ where: { orgId } })).map(subaccount => subaccount.subAccName);
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
  },

  GetEarnings: async (req, res) => {
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

      const { orgId } = req.user.dataValues;
      if (!orgId) res.status(404).send(`This user has not organization`);

      const subAccounts = await SubAccount.findAll({
        where: {
          orgId,
          [globalPool.name === PoolTypes.SBI ? "collectorId" : "luxorId"]: {
            [Op.ne]: null,
          },
        }
      })

      const { fromDate, toDate } = req.query;

      const earnings = await pool.getEarnings(fromDate, toDate, 100, subaccountNames)
      // const result = earnings.filter((earning) => {
      //   return subAccounts.some((subAccount) => subAccount.subAccName === earning.subaccountName)
      // })

      return res.status(200).json(earnings);
    } catch (error) {
      console.log(error);
      return res.status(500).send(`Error: ${error.message}`);
    }
  },

  GetEstimatedRevenue: async (req, res) => {
    const { subaccountNames } = req.query;
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
      return res.status(500).send(`Error: ${error.message}`);
    }
  },

  GetTaxReport: async (req, res) => {
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

      const {month, year} = req.query;
      const transactions = await pool.getTaxReport(month, year);

      return res.status(200).json(transactions);
    } catch (error) {
      console.log(error);
      return res.status(500).send(`Error: ${error.message}`);
    }
  },
};
