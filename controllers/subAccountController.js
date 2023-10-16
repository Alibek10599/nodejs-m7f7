const { SubAccount } = require("../models");

module.exports = {
    CreateSubAccount: async (req, res) => {
        try {
            const subAccount = await SubAccount.create(req.body)

            return res.status(201).json(subAccount)
        } catch(error){
            return res.status(500).send("Error on creating organization: " + error.message)
        }
    },
    ActivateSubAccount: async (req, res) => {
        try {
            const { id } = req.params
            const subAccount = await SubAccount.findByPk(id)

            subAccount.isActive = true
            subAccount.save()

            return res.status(200).json(subAccount)
        } catch(error) {
            res.status(500).send("Error: " + error.message)
        }  
    },
    DeactivateSubAccount: async (req, res) => {
        try {
            const { id } = req.params
            const subAccount = await SubAccount.findByPk(id)
    
            subAccount.isActive = false
            subAccount.save()
    
            return res.status(200).json(subAccount)
        } catch(error) {
            res.status(500).send("Error: " + error.message)
        }  
    }
    
};
