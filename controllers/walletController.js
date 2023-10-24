const { Wallet, Log } = require('../models');

module.exports = {
  CreateWallet: async (req, res) => {
    try {
      const wallet = await Wallet.create(req.body);

      await Log.create({
        userId: req.user.dataValues.id,
        action: 'create',
        controller: 'wallet',
        description: req.user.dataValues.userName + ' create: ' + wallet.name
      });

      return res.status(201).json(wallet);
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
      // const wallets = await Wallet.findAll({
      //     where: {
      //         orgId: req.user.dataValues.orgId
      //     }
      // })

      // return res.status(200).json(wallets);
    } catch (error) {
      res.status(500).send(`Error: ${ error.message }`);
    }
  },
};
