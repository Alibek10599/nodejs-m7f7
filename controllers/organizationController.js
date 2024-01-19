const { GlobalPool, Organization, User, Log, Role, SubAccount, SubUser } = require('../models');
const OrganizationValidation = require('../validators/OrganizationValidation');
const selectNotifyService = require("../notifications/service/notification-selector");
const { EMAIL } = require("../utils/constants/selectors");
const KdpService = require('../services/kdp/kdp.service');
const { KDP_RESPONSE } = require('../services/kdp/constants');
const { PoolFactory } = require('../pool/pool-factory');
const kdpService = new KdpService();
const { Op } = require("sequelize");

module.exports = {
  GetOrganizations: async (req, res) => {
    try {
      const organizations = await Organization.findAll();

      return res.status(200).json(organizations);
    } catch (error) {
      return res.status(500).send(`Error: ${error.message}`);
    }
  },
  GetOrganization: async (req, res) => {
    try {
      const { id } = req.params
      const organization = await Organization.findByPk(id);

      return res.status(200).json(organization);
    } catch (error) {
      return res.status(500).send(`Error: ${error.message}`);
    }
  },
  CreateOrganization: async (req, res) => {
    try {
      const { name, bin, iin } = req.body;
      const { errors, isValid } = OrganizationValidation(req.body);

      if (!isValid) {
        return res.status(400).json(errors);
      }

      let exisitingOrganization = await Organization.findOne({
        where: {
          orgName: name,
        },
      });

      if (exisitingOrganization) {
        errors.name = 'Organization with given name already Exist';
        return res.status(404).json(errors);
      }

      if (!iin) res.status(400).json('iin is not provided')


      exisitingOrganization = await Organization.create({
        orgName: name,
        bin,
        iinDir: iin,
      });

      const user = await User.findOne({
        where: {
          id: req.user.dataValues.id,
        },
      });

      if (!user) {
        return res.status(404).json('user not found');
      }

      user.orgId = exisitingOrganization.id;
      await user.save();

      await Log.create({
        userId: req.user.dataValues.id,
        action: 'create',
        controller: 'organization',
        description: req.user.dataValues.userName + ' create: ' + exisitingOrganization.orgName
      });

      kdpService.sendXml(iin).then(response => {
        const { isSuccess, data: { messageDate, messageId, sessionId, kdpStatus } } = response
        if (isSuccess) exisitingOrganization.set({ messageDate, messageId, sessionId, kdpStatus })
        return exisitingOrganization.save()
      }).catch(error => {
        console.error("Error with kdp service call:", error);
      });

      res.status(201).json({
        success: true,
        message: `please wait for activation of your Organization:- ${name}.`,
      });
    } catch (error) {
      return res.status(500).send(`Error on creating organization: ${error.message}`);
    }
  },
  ActivateOrganizationInKDP: async (req, res) => {
    try {
      const { id } = req.params;
      const organization = await Organization.findByPk(id);

      const { iinDir: iin } = organization

      const { isSuccess,
        data: {
          kdpStatus,
          tokenEgov,
          messageDate: newMessageDate,
          messageId: newMessageId,
          sessionId: newSessionId
        }
      } = await kdpService.sendXml(iin)

      if (isSuccess && tokenEgov) {
        organization.tokenEgov = tokenEgov
        organization.kdpStatus = kdpStatus
      } else if (isSuccess && kdpStatus === KDP_RESPONSE.PENDING) {
        organization.messageDate = newMessageDate
        organization.messageId = newMessageId
        organization.sessionId = newSessionId
      }

      await organization.save()

      await Log.create({
        userId: req.user.dataValues.id,
        action: 'update',
        controller: 'organization',
        description: req.user.dataValues.userName + ' ActivateOrganizationInKDP: ' + organization.orgName
      });

      return res.status(200).json(organization);
    } catch (error) {
      return res.status(500).send(`Error: ${error.message}`);
    }
  },
  SendSMS: async (req, res) => {
    try {
      const { id } = req.params;
      const organization = await Organization.findByPk(id);

      const { isSuccess, data: { messageDate, messageId, sessionId, kdpStatus } } = await kdpService.sendXml(organization.iinDir)

      if (!isSuccess) return res.status(503).json(`Error upon KDP request with status: ${kdpStatus}`);

      await organization.update(
        {
          iinDir: organization.iinDir,
          messageDate,
          messageId,
          sessionId,
          kdpStatus
        }
      );

    } catch (error) {
      return res.status(500).send(`Error: ${error.message}`);
    }
  },
  GetInfo: async (req, res) => {
    try {
      const organization = await Organization.findByPk(req.user.dataValues.orgId);

      const info = {
        organization,
      };

      res.status(200).json(info);
    } catch (error) {
      return res.status(500).send(`Error: ${error.message}`);
    }
  },
  UpdateOrganization: async (req, res) => {
    const { orgName, bin } = req.body;

    try {
      const organization = await Organization.findByPk(req.user.dataValues.orgId);

      if (!organization) {
        return res.status(400).json('Organization not found');
      }

      organization.orgName = orgName;
      organization.bin = bin;
      organization.save();

      await Log.create({
        userId: req.user.dataValues.id,
        action: 'update',
        controller: 'organization',
        description: req.user.dataValues.userName + ' update: ' + organization.orgName + ', with values: ' + orgName + ' and ' + bin
      });

      return res.status(200).json(organization);
    } catch (error) {
      return res.status(500).send(`Error: ${error.message}`);
    }
  },
  ApproveOrganization: async (req, res) => {
    const { feesRate, orgId } = req.body;

    try {
      const organization = await Organization.findByPk(orgId);

      if (!organization) {
        return res.status(400).json('Organization not found');
      }

      organization.feesRate = feesRate;
      organization.isRequestedApprove = true;
      organization.save();

      const orgUser = await User.findOne({
        where: { orgId: organization.id }
      })

      await selectNotifyService.notificationSelector({
        email: orgUser.email,
        userName: orgUser.userName,
        subject: 'Organization Approved',
        template: 'approveOrganization',
      }, EMAIL)

      await Log.create({
        userId: req.user.dataValues.id,
        action: 'update',
        controller: 'organization',
        description: req.user.dataValues.userName + ' approved: ' + organization.orgName + ', with value of FeesRate: ' + feesRate
      });

      return res.status(200).json(organization);
    } catch (error) {
      console.log(error);
      return res.status(500).send(`Error: ${error.message}`);
    }
  },
  GetOrganizationIfo: async (req, res) => {
    const orgId = req.query.id;
    const organizationInfo = [];

    try {
      const organization = await Organization.findByPk(orgId);
      const subAccounts = await SubAccount.findAll({
        where: {
          orgId,
          collectorId: {
            [Op.ne]: null,
          },
        }
      });
      
      const globalPool = await GlobalPool.findOne({
        where: {
            isActive: true,
        },
        order: [["id", "DESC"]],
      });
        
      if (!globalPool) {
          throw new Error("No one global pool active");
      }

      const pool = PoolFactory.createPool(globalPool);

      const poolSubaccounts = await pool.getSubAccountsStatus(subAccounts);

      for (const subAccount of subAccounts) {
        const poolSubAccountInfo = poolSubaccounts.find(
        (item) =>
            item.subaccountId === subAccount.collectorId ||
            item.id === subAccount.luxorId
        );
        organizationInfo.push({
            subAccName: subAccount.subAccName,
            subAccountId: subAccount.id,
            hashrate: poolSubAccountInfo?.hashrate || [0, 0, 0],
            workerStatus: poolSubAccountInfo?.workerStatus || {online: 0, dead: 0, offline: 0}
        });
        
      }

      const subUsersPromises = organizationInfo.map(async (subAccount) => {
        const subUsers = await SubUser.findAll({
          where: {
            subAccountId: subAccount.subAccountId,
          },
          include: [
            {
              model: User,
              attributes: ['userName', 'email', 'isConfirmed'],
              as: 'user',
              include: [{
                model: Role,
                attributes: ['roleName'],
                as: 'role'
              }]
            }
          ]
        });

        const subAccountWithUsers = { subAccount, subUsers };

        return subAccountWithUsers;
      });

      const subAccountsArrays = await Promise.all(subUsersPromises);
      const subAccountsFlat = subAccountsArrays.flat();

      res.status(200).json({ organization, subAccounts: subAccountsFlat })
    } catch (error) {
      console.log(error);
      return res.status(500).send(`Error: ${error.message}`);
    }
  }
};
