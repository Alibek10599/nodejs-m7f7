const { Wallet, Log, SubAccount, SubWallet, GlobalPool } = require('../models');
const WalletValidation = require('../validators/WalletValidation');
const { PoolFactory } = require('../pool/pool-factory');
const PoolTypes = require('../pool/pool-types');
const sendPoolAdminNotification = require("../notifications/service/poolAdminsNotification");
const sendOrgAdminNotification = require('../notifications/service/orgAdminNotification');
const graylog = require('../services/logger/graylog');

module.exports = {
  CreateWallet: async (req, res) => {
    const { name, address, subAccountId } = req.body
    const { errors, isValid } = WalletValidation(req.body)
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

      Promise.allSettled([
        sendPoolAdminNotification('Wallet Created', `
        Wallet with an address ${wallet.address} was succesfully created.
        Кошелек с адресом ${wallet.address} был успешно создан.
        ${wallet.address} адрестегі әмиян сәтті жасалды.
        `),
        sendOrgAdminNotification('Wallet Created', `
        Wallet with an address ${wallet.address} was succesfully created.
        Кошелек с адресом ${wallet.address} был успешно создан.
        ${wallet.address} адрестегі әмиян сәтті жасалды.
        `, req?.user?.orgId)
      ])
      graylog.info(`Wallet with an address ${wallet.address} was succesfully created.
      Кошелек с адресом ${wallet.address} был успешно создан.
      ${wallet.address} адрестегі әмиян сәтті жасалды.`)
      const wallets = await SubWallet.findAll({
        where: {
          subAccountId,
        },
        include: [
          {
            model: Wallet,
            attributes: ['name', 'address'],
            as: 'wallet'
          }
        ]
      });

      return res.status(201).json(wallets);
    } catch (error) {
      console.log(error);
      return res.status(500).send(`Error on creating wallet: ${error.message}`);
    }
  },
  ActivateWallet: async (req, res) => {
    try {
      const { subAccountId, subWalletId } = req.body
      const subWallets = await SubWallet.findAll({
        where: {
          subAccountId
        }
      });

      for (const subWallet of subWallets) {
        subWallet.isActive = subWallet.id === subWalletId ? true : false;
        subWallet.save();
      }

      const subWallet = await SubWallet.findByPk(subWalletId)

      const subAccount = await SubAccount.findByPk(subAccountId)
      const wallet = await Wallet.findByPk(subWallet.walletId);

      const globalPool = await GlobalPool.findOne({
        where: {
          isActive: true,
          name: subAccount.collectorId ? PoolTypes.SBI : PoolTypes.Luxor,
        },
        order: [["id", "DESC"]],
      });

      const pool = PoolFactory.createPool(globalPool)

      const { error: updateWalletError } = await pool.updateWallet({ subAccount, address: wallet.address })

      if (updateWalletError && updateWalletError.length) {
        return res.status(400).json({ message: updateWalletError[0].message })
      }

      await Log.create({
        userId: req.user.dataValues.id,
        action: 'update',
        controller: 'wallet',
        description: req.user.dataValues.userName + ' activate: ' + subWallet
      });

      Promise.allSettled([
        sendPoolAdminNotification('Wallet updated', `
        Wallet address for ${subAccount?.subAccName} was succesfully updated to a ${wallet.address}.
        Адрес кошелька для ${subAccount?.subAccName} был успешно обновлен до ${wallet.address}.
        ${subAccount?.subAccName} әмияны ${wallet.address} мәніне сәтті жаңартылды.
        `),
        sendOrgAdminNotification('Wallet updated', `
        Wallet address for ${subAccount?.subAccName} was succesfully updated to a ${wallet.address}.
        Адрес кошелька для ${subAccount?.subAccName} был успешно обновлен до ${wallet.address}.
        ${subAccount?.subAccName} әмияны ${wallet.address} мәніне сәтті жаңартылды.
        `, subAccount.orgId)
      ])
      graylog.info(`Wallet address for ${subAccount?.subAccName} was succesfully updated to a ${wallet.address}.
      Адрес кошелька для ${subAccount?.subAccName} был успешно обновлен до ${wallet.address}.
      ${subAccount?.subAccName} әмияны ${wallet.address} мәніне сәтті жаңартылды.`)
      return res.status(200).json(subWallet);
    } catch (error) {
      res.status(500).send(`Error: ${error.message}`);
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

      sendPoolAdminNotification('Wallet Deactivated', `
      Wallet with an address ${wallet.address} was succesfully deactivated.
      Кошелек с адресом ${wallet.address} был успешно деактивирован.
      ${wallet.address} әмияны сәтті ажыратылды.
      `)
      graylog.info(`Wallet with an address ${wallet.address} was succesfully deactivated.
      Кошелек с адресом ${wallet.address} был успешно деактивирован.
      ${wallet.address} әмияны сәтті ажыратылды.`)
      return res.status(200).json(wallet);
    } catch (error) {
      res.status(500).send(`Error: ${error.message}`);
    }
  },
  GetSubWallets: async (req, res) => {
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
      res.status(500).send(`Error: ${error.message}`);
    }
  },
  GetWallets: async (req, res) => {
    try {
      const subAccounts = await SubAccount.findAll({
        where: {
          orgId: req.query.id,
        },
      });

      const walletPromises = subAccounts.map(async (subAccount) => {
        const subWallets = await SubWallet.findAll({
          where: {
            subAccountId: subAccount.id,
          },
          include: [
            {
              model: Wallet,
              attributes: ['address'],
              as: 'wallet',
            },
          ],
        });

        // Extract only the wallets from subWallets
        return subWallets.map((subWallet) => subWallet.wallet);
      });

      const walletsArrays = await Promise.all(walletPromises);
      const wallets = walletsArrays.flat(); // Flatten the array of arrays into a single array
      const uniqueWallets = wallets.filter((obj, index, self) =>
        index === self.findIndex((t) => (
          t.address === obj.address
        ))
      );
      return res.status(200).json(uniqueWallets);
    } catch (error) {
      console.log(error);
      res.status(500).send(`Error: ${error.message}`);
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
      res.status(500).send(`Error: ${error.message}`);
    }
  }
};
