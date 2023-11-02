const { 
    Organization,
    SubAccount,
    SubUser,
    SubWallet,
    Wallet,
    Log,
    Role,
    User, 
    SubPoolApi } = require('../models');
const SbiService = require('../services/sbi-pool/sbi.service');
const StratumService = require('../services/stratum/stratum.service');
const SubAccountValidation = require('../validators/SubAccountValidation');
const getService = require('../config/pool')

module.exports = {
  CreateSubAccount: async (req, res) => {
    try {
      const stratumService = new StratumService();
      const {service: sbiService, globalPool } = await getService();
      
      const { name, walletName, walletAddress } = req.body;
      const { errors, isValid } = SubAccountValidation(req.body);

      if (!isValid) {
        return res.status(400).json(errors);
      }

      let exisitingSubAcc = await SubAccount.findOne({
        where: {
          subAccName: name,
        },
      });

      if (exisitingSubAcc) {
        errors.name = 'SubAccount with given name already Exist';
        return res.status(404).json(errors);
      }
      
      const exisitingOrganization = await Organization.findOne({
        where: {
          id: req.user.dataValues.orgId,
        },
      });

      const response = await sbiService.createCollector(name, exisitingOrganization.dataValues, walletAddress)

      const subAccount = await SubAccount.create({
        subAccName: name,
        orgId: exisitingOrganization.id,
      });

      const wallet = await Wallet.create({
        name: walletName,
        address: walletAddress
      });

      SubWallet.create({
        subAccountId: subAccount.id,
        walletId: wallet.id
      });

      await SubPoolApi.create({
        globalPoolId: globalPool.id,
        subAccountId: subAccount.id,
        apiKey: globalPool.apiKey,
        apiSecret: globalPool.apiSecret
      })

      const { isSuccess } = await stratumService.createSubAccount(subAccount.dataValues, exisitingOrganization);

      if (isSuccess) {
        await Log.create({
          userId: req.user.dataValues.id,
          action: 'create',
          controller: 'subAccount',
          description: req.user.dataValues.userName + ' create: ' + subAccount.subAccName + ' with wallet name: ' + 'wallet.name'
        });

        await SubUser.create({
          subAccountId: subAccount.id,
          userId: req.user.dataValues.id
        });

        res.status(201).json({
          success: true,
          message: 'Создание СубСчета прошло успешно',
        });
      } else {
        await Log.create({
          userId: req.user.dataValues.id,
          action: 'create',
          controller: 'subAccount',
          description: req.user.dataValues.userName + ' failed on: ' + 'creating subAccount.'
        });
        res.status(403).json({
          success: false,
          message: 'Создание СубСчета провалилось',
        });
      }
    } catch (error) {
      console.log(error);
      console.log('user datavalues: ',  req.user.dataValues.id)
      return res.status(500).send(`Error on creating organization: ${ error.message } Datavalues: user - ${req.user.dataValues}, subAccount : ${subAccount.dataValues}.`);
    }
  },
  ActivateSubAccount: async (req, res) => {
    try {
      const { id } = req.params;
      const subAccount = await SubAccount.findByPk(id);

      subAccount.isActive = true;
      subAccount.save();

      await Log.create({
        userId: req.user.dataValues.id,
        action: 'update',
        controller: 'subAccount',
        description: req.user.dataValues.userName + ' activate: ' + subAccount.subAccName
      });

      return res.status(200).json(subAccount);
    } catch (error) {
      res.status(500).send(`Error: ${ error.message } `);
    }
  },
  DeactivateSubAccount: async (req, res) => {
    try {
      const { id } = req.params;
      const subAccount = await SubAccount.findByPk(id);

      subAccount.isActive = false;
      subAccount.save();

      await Log.create({
        userId: req.user.dataValues.id,
        action: 'update',
        controller: 'subAccount',
        description: req.user.dataValues.userName + ' deactivate: ' + subAccount.subAccName
      });

      return res.status(200).json(subAccount);
    } catch (error) {
      res.status(500).send(`Error: ${ error.message }`);
    }
  },
  GetSubAccounts: async (req, res) => {
    try {
      const subAccounts = await SubAccount.findAll({
        where: {
          orgId: req.user.dataValues.orgId,
        },
      });

      return res.status(200).json(subAccounts);
    } catch (error) {
      res.status(500).send(`Error: ${ error.message }`);
    }
  },
  GetInfo: async (req, res) => {
    try {
      const subAccount = await SubAccount.findByPk(req.query.id);

      const subUsers = await SubUser.findAll({
        where: {
          SubAccountId: req.query.id
        },
        include: [
          {
            model: User,
            attributes: ['email', 'isConfirmed'],
            as: 'user',
            include: [{
              model: Role,
              attributes: ['roleName'],
              as: 'role'
            }]
          }
        ]
      })

      const info = {
        subAccount,
        subUsers
      };
      
      res.status(200).json(info);
    } catch (error) {
      console.log(error);
      return res.status(500).send(`Error: ${ error.message }`);
    }
  },
  GetSBISubAccounts: async (req, res) => {
    try {
      const {service: sbiService } = await getService();
      const { data: sbiSubAccount } = await sbiService.getSubAccounts()
      res.status(200).json(sbiSubAccount)
    } catch (error) {
      console.log(error);
      return res.status(500).send(`Error: ${ error.message }`);
    }
  },
  GetSubPoolSubAccountInfo: async (req, res) => {
    try {
      const {service: sbiService } = await getService();
      const { data: { subaccounts } } = await sbiService.getSubAccounts()
      const subAccount = await SubAccount.findByPk(req.params.id);
      const subAccountInfo = await subaccounts.filter(item => item.subaccountName === subAccount.subAccName)
      res.status(200).json(subAccountInfo)
    } catch (error) {
      console.log(error);
      return res.status(500).send(`Error: ${ error.message }`);
    }
  }
};
