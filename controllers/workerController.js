const getService = require("../config/pool");
const {
  GlobalPool,
} = require("../models");
const { PoolFactory } = require("../pool/pool-factory");

module.exports = {
  GetWorkers: async (req, res) => {
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
    const { subaccountnames } = req.query;
    console.log('1', subaccountnames)
    try {
      // const { service: sbiService } = await getService();
      // const { data: sbiworkers } = await sbiService.getWorkers(subaccountnames);
      const result = await pool.getWorkers(subaccountnames);

      res.status(200).json(result);
    } catch (error) {
      console.log(error);
      console.error(error.response.data)
      res.status(500).send(`Error: ${error.message}`);
    }
  }
};
