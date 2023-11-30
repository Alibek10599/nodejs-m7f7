const {
  Organization,
  SubAccount,
  SubUser,
  SubWallet,
  Wallet,
  Log,
  Role,
  User,
  SubPoolApi,
  Stratum,
  SubStratum,
  GlobalPool,
} = require("../models");
const StratumService = require("../services/stratum/stratum.service");
const SubAccountValidation = require("../validators/SubAccountValidation");
const getService = require("../config/pool");
const { default: axios } = require("axios");
const { PoolFactory, isSBIPool, isLuxorPool } = require("../pool/pool-factory");
const PoolTypes = require("../pool/pool-types");
const { Op } = require("sequelize");

module.exports = {
  CreateSubAccount: async (req, res) => {
    try {
      const globalPool = await GlobalPool.findOne({
        where: {
          isActive: true,
        },
        order: [["id", "DESC"]],
      });

      if (!globalPool) {
        throw new Error("No one global pool active");
      }

      console.info("req body is", req.body);
      const stratumService = new StratumService();
      const pool = PoolFactory.createPool(globalPool);

      const { walletName, walletAddress } = req.body;
      const { errors, isValid } = SubAccountValidation(req.body);

      if (!isValid) {
        return res.status(400).json(errors);
      }

      const name = req.body.name.toLowerCase()

      let exisitingSubAcc = await SubAccount.findOne({
        where: {
          subAccName: name,
        },
      });

      if (exisitingSubAcc) {
        errors.name = "SubAccount with given name already Exist";
        return res.status(404).json(errors);
      }

      const exisitingOrganization = await Organization.findOne({
        where: {
          id: req.user.dataValues.orgId,
        },
      });

      const poolSubAccount = await pool.createSubAccount({
        accountName: name,
        organization: exisitingOrganization,
        walletAddress,
      });

      let subAccount;

      if (isSBIPool(pool)) {
        const {
          data: { id, virtualSubaccounts },
        } = poolSubAccount;

        subAccount = await SubAccount.create({
          subAccName: name,
          orgId: exisitingOrganization.id,
          collectorId: id,
          vsub1Id: virtualSubaccounts.find((item) => item.name === "vsub1").id,
          vsub2Id: virtualSubaccounts.find((item) => item.name === "vsub2").id,
        });
      }

      if (isLuxorPool(pool)) {
        const { data: luxorSubAccountData, error } = poolSubAccount;

        if (error && error.length) {
          return res.status(400).json({ message: error[0].message });
        }

        const {
          data: {
            provisionNewUser: {
              user: { id },
            },
          },
        } = luxorSubAccountData;

        subAccount = await SubAccount.create({
          subAccName: name,
          orgId: exisitingOrganization.id,
          luxorId: id,
        });
      }

      const wallet = await Wallet.create({
        name: walletName,
        address: walletAddress,
      });

      SubWallet.create({
        subAccountId: subAccount.id,
        walletId: wallet.id,
        isActive: true,
      });

      await SubPoolApi.create({
        globalPoolId: globalPool.id,
        subAccountId: subAccount.id,
        apiKey: globalPool.apiKey,
        apiSecret: globalPool.apiSecret,
      });

      const { isSuccess } = await stratumService.createSubAccount(
        subAccount.dataValues,
        exisitingOrganization
      );

      if (isSuccess) {
        await Log.create({
          userId: req.user.dataValues.id,
          action: "create",
          controller: "subAccount",
          description:
            req.user.dataValues.userName +
            " create: " +
            subAccount.subAccName +
            " with wallet name: " +
            "wallet.name",
        });

        await SubUser.create({
          subAccountId: subAccount.id,
          userId: req.user.dataValues.id,
        });

        res.status(201).json({
          success: true,
          message: "Создание СубСчета прошло успешно",
        });
      } else {
        await Log.create({
          userId: req.user.dataValues.id,
          action: "create",
          controller: "subAccount",
          description:
            req.user.dataValues.userName +
            " failed on: " +
            "creating subAccount.",
        });
        res.status(403).json({
          success: false,
          message: "Создание СубСчета провалилось",
        });
      }
    } catch (error) {
      console.log(error);
      console.log("user datavalues: ", req.user.dataValues.id);
      return res
        .status(500)
        .send(
          `Error on creating organization: ${error.message} Datavalues: user - ${req.user.dataValues}, subAccount : ${subAccount.dataValues}.`
        );
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
        action: "update",
        controller: "subAccount",
        description:
          req.user.dataValues.userName + " activate: " + subAccount.subAccName,
      });

      return res.status(200).json(subAccount);
    } catch (error) {
      res.status(500).send(`Error: ${error.message} `);
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
        action: "update",
        controller: "subAccount",
        description:
          req.user.dataValues.userName +
          " deactivate: " +
          subAccount.subAccName,
      });

      return res.status(200).json(subAccount);
    } catch (error) {
      res.status(500).send(`Error: ${error.message}`);
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
      res.status(500).send(`Error: ${error.message}`);
    }
  },
  GetInfo: async (req, res) => {
    try {
      const subAccount = await SubAccount.findByPk(req.query.id);

      const subUsers = await SubUser.findAll({
        where: {
          SubAccountId: req.query.id,
        },
        include: [
          {
            model: User,
            attributes: ["email", "isConfirmed"],
            as: "user",
            include: [
              {
                model: Role,
                attributes: ["roleName"],
                as: "role",
              },
            ],
          },
        ],
      });

      const info = {
        subAccount,
        subUsers,
      };

      res.status(200).json(info);
    } catch (error) {
      console.log(error);
      return res.status(500).send(`Error: ${error.message}`);
    }
  },
  GetSBISubAccounts: async (req, res) => {
    try {
      const { service: sbiService } = await getService();
      const { data: sbiSubAccount } = await sbiService.getSubAccounts();
      res.status(200).json(sbiSubAccount);
    } catch (error) {
      console.log(error);
      return res.status(500).send(`Error: ${error.message}`);
    }
  },
  GetSubPoolSubAccountInfo: async (req, res) => {
    try {
      const { orgId } = req.user.dataValues;
      if (!orgId) res.status(404).send(`This user has not organization`);

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

      // const { service: sbiService } = await getService();
      // const {
      //   data: { subaccounts: sbiSubAccounts },
      // } = await sbiService.getSubAccounts();

      const subAccounts = await SubAccount.findAll({
        where: {
          orgId,
        },
      });

      const result = await pool.getSubaccountInfo(subAccounts);

      // const subAccountInfo = [];
      // for (const subAccount of subAccounts) {
      //   const sbiSubAccountInfo = await sbiSubAccounts.find(
      //     (item) => item.subaccountName === subAccount.subAccName
      //   );
      //   if (sbiSubAccountInfo && sbiSubAccountInfo.subaccountId) {
      //     const {
      //       data: { content: collectorInfo },
      //     } = await sbiService.getCollector(sbiSubAccountInfo.subaccountId);
      //     subAccountInfo.push({ subAccount, info: collectorInfo });
      //   }
      // }
      res.status(200).json(result);
    } catch (error) {
      console.log(error);
      return res.status(500).send(`Error: ${error.message}`);
    }
  },
  GetStatus: async (req, res) => {
    try {
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

      const { orgId } = req.user.dataValues;
      if (!orgId) res.status(404).send(`This user has not organization`);

      // const { service: sbiService } = await getService();

      const subAccounts = await SubAccount.findAll({
        where: {
          orgId,
          [globalPool.name === PoolTypes.SBI ? "collectorId" : "luxorId"]: {
            [Op.ne]: null,
          },
        },
      });

      const poolSubaccounts = await pool.getSubAccountsStatus(subAccounts);

      // const subAccountNames = subAccounts
      //   .map((subAccount) => subAccount.subAccName)
      //   .join(",");

      // const {
      //   data: { subaccounts: sbiSubAccounts },
      // } = await sbiService.getSubAccountsByNames(subAccountNames);

      // console.log('sbiSubAccounts')
      // console.dir(sbiSubAccounts, { depth: 10 })

      // const walletPromises = subAccounts.map(async (subAccount) => {
      //   const subWallets = await SubWallet.findAll({
      //     where: {
      //       subAccountId: subAccount.id,
      //       isActive: true
      //     },
      //     include: [
      //       {
      //         model: Wallet,
      //         attributes: ['address'],
      //         as: 'wallet',
      //       },
      //       {
      //         model: SubAccount,
      //         attributes: ['subAccName'],
      //         as: 'subAccount'
      //       }
      //     ]
      //   });

      //   return subWallets;
      // });

      const subAccountIds = subAccounts.map((item) => item.id);

      const subStrata = await SubStratum.findAll({
        where: {
          subAccountId: subAccountIds,
        },
      });

      const stratumIds = subStrata.map((item) => item.stratumId);

      const strata = await Stratum.findAll({
        where: {
          id: stratumIds,
        },
      });

      const subAccountStrataMapper = {};

      for (const subAccountId of subAccountIds) {
        const stratumId = subStrata.find(
          (item) => item.subAccountId === subAccountId
        ).stratumId;
        subAccountStrataMapper[subAccountId] = strata.find(
          (item) => item.id === stratumId
        ).intPort;
      }

      // const walletsArrays = await Promise.all(walletPromises);
      // const wallets = walletsArrays.flat();
      // const newWallets = wallets.map((wallet) => {return {address: wallet.wallet.address, subAccName: wallet.subAccount.subAccName}});

      const subAccountInfo = [];
      for (const subAccount of subAccounts) {
        const poolSubAccountInfo = poolSubaccounts.find(
          (item) =>
            item.subaccountId === subAccount.collectorId ||
            item.id === subAccount.luxorId
        );
        // const {data: { content: collectorInfo }} = await sbiService.getCollector(sbiSubAccountInfo.subaccountId);
        // const orgSbiSubAccInfo = await collectorInfo.find(item => item.address === subAccount.address);
        // <--- поиск по адресам кошельков

        subAccountInfo.push({
          subAccName: subAccount.subAccName,
          subAccountId: subAccount.id,
          hashrate: poolSubAccountInfo?.hashrate || [0, 0, 0],
          workerStatus: poolSubAccountInfo?.workerStatus || [0, 0, 0],
          port: subAccountStrataMapper[subAccount.id],
        });
      }
      res.status(200).json(subAccountInfo);
    } catch (error) {
      console.log(error);
      return res.status(500).send(`Error: ${error.message}`);
    }
  },
  GetHashRate: async (req, res) => {
    try {
      const { data } = await axios.get(
        "https://pool-api.sbicrypto.com/api/observer/v1/workers/hashrates?ranges=10,60,1440",
        {
          headers: {
            "x-observer-key": "iU9kiayLLTKtACtlMUv4vbk_bzuIQt-7",
          },
        }
      );

      res.status(200).json(data);
    } catch (error) {
      console.log(error);
      return res.status(500).send(`Error: ${error.message}`);
    }
  },
  Report: async (req, res) => {
    const globalPool = await GlobalPool.findOne({
      where: {
        isActive: true,
      },
      order: [["id", "DESC"]],
    });

    if (!globalPool) {
      throw new Error("No one global pool active");
    }

    const {
      year = new Date().getFullYear(),
      month = new Date().getMonth() + 1,
    } = req.query;

    const pool = PoolFactory.createPool(globalPool);

    const result = await pool.getReport(year, month);

    res.status(200).json(result);
  },
};
