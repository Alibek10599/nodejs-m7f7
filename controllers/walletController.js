const { Wallet } = require("../models");

module.exports = {
    CreateWallet: async (req, res) => {
        try {
            const wallet = await Wallet.create(req.body)

            return res.status(201).json(wallet)
        } catch(error){
            return res.status(500).send("Error on creating wallet: " + error.message)
        }
    },
    ActivateWallet: async (req, res) => {
        try {
            const { id } = req.params
            const wallet = await Wallet.findByPk(id)

            wallet.isActive = true
            wallet.save()

            return res.status(200).json(wallet)
        } catch(error) {
            res.status(500).send("Error: " + error.message)
        }  
    },
    DeactivateWallet: async (req, res) => {
        try {
            const { id } = req.params
            const wallet = await Wallet.findByPk(id)
    
            wallet.isActive = false
            wallet.save()
    
            return res.status(200).json(wallet)
        } catch(error) {
            res.status(500).send("Error: " + error.message)
        }  
    }
};
