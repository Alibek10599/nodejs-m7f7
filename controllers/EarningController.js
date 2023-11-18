const getService = require("../config/pool");

module.exports = {
    GetPayouts: async (req, res) => {
        try {
            const { fromDate, toDate } = req.query;
            const {service: sbiService } = await getService();

            const sbiPayouts = await sbiService.getPayouts({fromDate, toDate, size: 40});
            // console.log(sbiPayouts);
            const filteredPayouts = await sbiPayouts.data.content.filter((item) => item.vsubaccountName === 'vsub1');
            
            return res.status(200).json(filteredPayouts);
        } catch (error) {
            console.log(error);
            return res.status(500).send(`Error: ${ error.message }`);
        }
    },

    GetEstimatedRevenue: async (req, res) => {
        const { subaccountNames } = req.body;
        try {
            const {service: sbiService } = await getService();
            
            const sbiRevenues = await sbiService.getRevenues({subaccountNames: 'MidasTest1'});

            const revenues = Object.values(sbiRevenues.data.estimatedRevenues)

            return res.status(200).json(revenues);
        } catch (error) {
            console.log(error);
            return res.status(500).send(`Error: ${ error.message }`);
        }
    }
};
