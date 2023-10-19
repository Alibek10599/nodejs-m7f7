const { Organization, SubAccount } = require('../models');
const StratumService = require('../services/stratum/stratum.service');
const SubAccountValidation = require('../validators/SubAccountValidation');

module.exports = {
  CreateSubAccount: async (req, res) => {
    try {
      const stratumService = new StratumService();
      const { name } = req.body;
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
      const { isSuccess } = await stratumService.createSubAccount();
      if (isSuccess) {
        exisitingSubAcc = await SubAccount.create({
          subAccName: name,
          orgId: exisitingOrganization.id,
        });
        res.status(201).json({
          success: true,
          message: 'Создание СубСчета прошло успешно',
        });
      } else {
        res.status(403).json({
          success: false,
          message: 'Создание СубСчета провалилось',
        });
      }
    } catch (error) {
      return res.status(500).send(`Error on creating organization: ${ error.message }`);
    }
  },
  ActivateSubAccount: async (req, res) => {
    try {
      const { id } = req.params;
      const subAccount = await SubAccount.findByPk(id);

      subAccount.isActive = true;
      subAccount.save();

      return res.status(200).json(subAccount);
    } catch (error) {
      res.status(500).send(`Error: ${ error.message }`);
    }
  },
  DeactivateSubAccount: async (req, res) => {
    try {
      const { id } = req.params;
      const subAccount = await SubAccount.findByPk(id);

      subAccount.isActive = false;
      subAccount.save();

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
};
