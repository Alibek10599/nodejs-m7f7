const { Organization, User, Log, Role, SubAccount, SubUser } = require('../models');
const OrganizationValidation = require('../validators/OrganizationValidation');
const selectNotifyService = require("../notifications/service/notification-selector");
const { EMAIL } = require("../utils/constants/selectors");

module.exports = {
  GetOrganizations: async (req, res) => {
    try {
      const organizations = await Organization.findAll();

      return res.status(200).json(organizations);
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
      exisitingOrganization = await Organization.create({
        orgName: name,
        bin,
        iinDir: iin
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

      res.status(201).json({
        success: true,
        message: `please wait for activation of your Organization:- ${name}.`,
      });
    } catch (error) {
      return res.status(500).send(`Error on creating organization: ${error.message}`);
    }
  },
  ActivateOrganization: async (req, res) => {
    try {
      const { id } = req.params;
      const organization = await Organization.findByPk(id);
      organization.isActive = true;
      organization.save();

      await Log.create({
        userId: req.user.dataValues.id,
        action: 'update',
        controller: 'organization',
        description: req.user.dataValues.userName + ' activate: ' + organization.orgName
      });

      return res.status(200).json(organization);
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

    try {
      const organization = await Organization.findByPk(orgId);
      const subAccounts = await SubAccount.findAll({
        where: {
          orgId
        }
      });

      const subUsersPromises = subAccounts.map(async (subAccount) => {
        const subUsers = await SubUser.findAll({
          where: {
            subAccountId: subAccount.id,
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
