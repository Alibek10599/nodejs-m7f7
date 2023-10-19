const { Wallet } = require("../models");
const WalletValidation = require('../validators/WalletValidation');

module.exports = {
    CreateWallet: async (req, res) => {
        try {
            const { errors, isValid } = WalletValidation(req.body);
            if (!isValid) {
                return res.status(400).json(errors);
            }
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
    },
    GetWallets: async (req, res) => {
        try {
            // const wallets = await Wallet.findAll({
            //     where: {
            //         orgId: req.user.dataValues.orgId
            //     }
            // })

            // return res.status(200).json(wallets);
        } catch(error) {
            res.status(500).send("Error: " + error.message)
        }  
    }
};
