const { Wallet, Log, SubWallet } = require('../models');
const WalletValidation = require('../validators/WalletValidation');

module.exports = {
  CreateWallet: async (req, res) => {
    const {name, address, subAccountId} = req.body
    const {errors, isValid} = WalletValidation(req.body)
    try {
      if (!isValid) {
        return res.status(400).json(errors);
      }
      const wallet = await Wallet.create({
        name: name,
        address: address
      });

      const subWallet = await SubWallet.create({
        subAccountId: subAccountId,
        walletId: wallet.id
      });

      await Log.create({
        userId: req.user.dataValues.id,
        action: 'create',
        controller: 'wallet',
        description: req.user.dataValues.userName + ' create: ' + wallet.name
      });

      return res.status(201).json(subWallet);
    } catch (error) {
      return res.status(500).send(`Error on creating wallet: ${ error.message }`);
    }
  },
  ActivateWallet: async (req, res) => {
    try {
      const { id } = req.params;
      const wallet = await Wallet.findByPk(id);

      wallet.isActive = true;
      wallet.save();

      await Log.create({
        userId: req.user.dataValues.id,
        action: 'update',
        controller: 'wallet',
        description: req.user.dataValues.userName + ' activate: ' + wallet.name
      });

      return res.status(200).json(wallet);
    } catch (error) {
      res.status(500).send(`Error: ${ error.message }`);
    }
  },
  DeactivateWallet: async (req, res) => {
    try {
      const { id } = req.params;
      const wallet = await Wallet.findByPk(id);

      wallet.isActive = false;
      wallet.save();

      await Log.create({
        userId: req.user.dataValues.id,
        action: 'update',
        controller: 'wallet',
        description: req.user.dataValues.userName + ' deactivate: ' + wallet.name
      });

      return res.status(200).json(wallet);
    } catch (error) {
      res.status(500).send(`Error: ${ error.message }`);
    }
  },
  GetWallets: async (req, res) => {
    try {
      const wallets = await SubWallet.findAll({
        where: {
          subAccountId: req.query.id,
        },
        include: [
          {
            model: Wallet,
            attributes: ['name', 'address'],
            as: 'wallet'
          }
        ]
      });

      return res.status(200).json(wallets);
    } catch (error) {
      res.status(500).send(`Error: ${ error.message }`);
    }
  },
  GetInfo: async (req, res) => {
    try {
      const wallet = await SubWallet.findByPk(req.query.id, {
        include: [
          {
            model: Wallet,
            attributes: ['name', 'address'],
            as: 'wallet'
          }
        ]
      });
      
      return res.status(200).json(wallet);
    } catch (error) {
      res.status(500).send(`Error: ${ error.message }`);
    }
  }
};
