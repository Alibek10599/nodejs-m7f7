const getService = require("../config/pool");

module.exports = {
    GetPayouts: async (req, res) => {
        try {
            const { fromDate, toDate } = req.query;

            const {service: sbiService } = await getService();

            const payouts = await sbiService.getPayouts({fromDate, toDate});

            // const payoutsInfo = payouts.content.find((item) => item.)

            return res.status(200).json(payouts.data);
        } catch (error) {
            console.log(error);
            return res.status(500).send(`Error: ${ error.message }`);
        }
    }
};
