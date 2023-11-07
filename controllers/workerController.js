const getService = require("../config/pool");

module.exports = {
  GetWorkers: async (req, res) => {
    const { subaccountnames } = req.query;
    try {
      const { service: sbiService } = await getService();
      const { data: sbiworkers } = await sbiService.getWorkers(subaccountnames);
      
      res.status(200).json(sbiworkers.content);
    } catch (error) {
      console.log(error);
      res.status(500).send(`Error: ${ error.message }`);
    }
  }
};
