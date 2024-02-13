const axios = require("axios");
const {SubAccount, SubUser, SubStratum, Stratum, Or, Organization } = require("../models");
const { Op } = require("sequelize");

const {formatDatePoolAPI} = require("../utils/date");

const {
  SBI_URL,
  MIDAS_GLOBAL_POOL_ADDRESS,
  SBI_API_KEY,
  SBI_API_SECRET
} = process.env;

class SBIPool {
  constructor(pool) {
    this.type = pool.name;
    this.client = axios.create({
      baseURL: SBI_URL,
      headers: {
        "x-api-key": SBI_API_KEY,
        "x-api-secret": SBI_API_SECRET,
      },
    });
  }

  async getUserSubAccounts(userId) {
    let subAccounts = [];

    const subUsers = await SubUser.findAll({
      where: {
        userId: userId,
        isActive: true
      },
      include: [{
        model: SubAccount,
        attributes: ["subAccName", 'id'],
        as: 'subAccount' // Use the correct alias as defined in your association
      }],
      raw: true,
      nest: true // This will nest the included objects making it easier to work with
    });

    if (Array.isArray(subUsers) && subUsers.length) {
      // Map over the results to extract the subAccount data
      subAccounts = subUsers.map(subUser => subUser.subAccount ? { subAccName: subUser.subAccount.subAccName, id: subUser.subAccount.id } : null).filter(Boolean); // filter(Boolean) will remove any undefined or null entries
      // Now subAccounts is an array of SubAccount objects
    } else {
      // Handle the case where there are no sub users or sub accounts
      console.log('No sub accounts found or subUsers is not an array.');
    }

    return subAccounts;
  }

  async createSubAccount(payload) {
    const { accountName, organization, walletAddress } = payload;

    const dblFeesRate = organization.feesRate ? organization.feesRate : 0;
    const vsub2_allocation = (dblFeesRate / 100) * 1000000000000000;
    const vsub1_allocation = 1000000000000000 - vsub2_allocation;

    const collectorRequest = {
      name: accountName,
      miningCurrency: "BTC",
      withdrawAddress: MIDAS_GLOBAL_POOL_ADDRESS,
      isPaymentEnabled: true,
      virtualSubaccounts: [
        {
          name: "vsub1",
          withdrawAddress: walletAddress,
          allocation: vsub1_allocation,
          tier: 1,
          isPaymentEnabled: true,
        },
        {
          name: "vsub2",
          withdrawAddress: MIDAS_GLOBAL_POOL_ADDRESS,
          allocation: vsub2_allocation,
          tier: 1,
          isPaymentEnabled: true,
        },
      ],
    };

    return this.client.post("api/external/v1/subaccount", collectorRequest);
  }

  async updateWallet(payload) {
    const { subAccount, address } = payload;

    const collector = await this.getCollector(subAccount.collectorId);

    const {
      data: { content },
    } = collector;

    const virtualSubaccount = content.find(
      (item) => item.vsubaccountId === subAccount.vsub1Id
    );

    const sbiRequest = {
      collector: virtualSubaccount.collectorName,
      collectorId: virtualSubaccount.collectorId,
      virtual: "vsub1",
      allocation: virtualSubaccount.allocation,
      withdrawAddress: address,
      tier: virtualSubaccount.newTier,
      isPaymentEnabled: virtualSubaccount.isPaymentEnabled,
    };

    return this.updateSubaccount(sbiRequest);
  }

  async getSubaccountInfo(subAccounts) {
    const {
      data: { subaccounts },
    } = await this.getSubAccounts();

    const subAccountInfo = [];
    for (const subAccount of subAccounts) {
      const sbiSubAccountInfo = await subaccounts.find(
        (item) => item.subaccountName === subAccount.subAccName
      );
      if (sbiSubAccountInfo && sbiSubAccountInfo.subaccountId) {
        const {
          data: { content: collectorInfo },
        } = await this.getCollector(sbiSubAccountInfo.subaccountId);
        subAccountInfo.push({ subAccount, info: collectorInfo });
      }
    }

    return subAccountInfo;
  }

  async getTransactions(fromDate, toDate, size, subaccountNames) {
    const sbiPayouts = await this.client(
      `api/external/v1/earnings?fromDate=${fromDate}&toDate=${toDate}`
    );

    const payoutsContent = sbiPayouts.data.content.filter((transaction) => subaccountNames.includes(transaction.subaccountName));
    return payoutsContent;
  }

  async getEarnings(fromDate, toDate, size, subaccountName) {
    const sbiEarnings = await this.client(
      `api/external/v2/earnings?startDate=${fromDate}&endDate=${toDate}&size=${size}`
    );

    let filteredEarnings = sbiEarnings.data.content.filter(
      (item) => item.vsubaccountName === "vsub1"
    );

    if (subaccountName) {
      filteredEarnings = filteredEarnings.filter((item) => item.subaccountName === subaccountName)
    }

    return filteredEarnings;
  }

  async getPoolStatus() {
    const subAccountInfo = [];
    const subAccounts = await SubAccount.findAll({
      where: {
        collectorId: {
          [Op.ne]: null,
        },
      },
    });

    //     const subAccountNames = subAccounts
    //       .map((subAccount) => subAccount.subAccName)
    //       .join(",");
    // console.log(subAccountNames);
    //     const {
    //       data: { poolSubaccounts },
    //     } = await this.client.get(
    //       // `api/external/v1/subaccounts?subAccountNames=${subAccountNames}`
    //       `api/external/v1/subaccounts?subAccountNames=[MidasTest1]`
    //     );
    // console.log(poolSubaccounts);

    const poolSubaccounts = await this.getSubAccountsStatus(subAccounts);
    for (const subAccount of subAccounts) {
      const poolSubAccountInfo = poolSubaccounts.find(
        (item) =>
          item.subaccountId === subAccount.collectorId ||
          item.id === subAccount.luxorId
      );
      subAccountInfo.push({
        subAccName: subAccount.subAccName,
        subAccountId: subAccount.id,
        hashrate: poolSubAccountInfo?.hashrate || [0, 0, 0],
        workerStatus: poolSubAccountInfo?.workerStatus || { online: 0, dead: 0, offline: 0 }
      });
    }

    let totalDead = 0;
    let totalOffline = 0;
    let totalOnline = 0;
    let totalHashrate = 0;
    let totalHashrate24 = 0;
    let totalActiveSubAccounts = 0;
    const totalSubAccounts = subAccountInfo.length;

    subAccountInfo.forEach(item => {
      totalDead += item.workerStatus.dead;
      totalOffline += item.workerStatus.offline;
      totalOnline += item.workerStatus.online;
      totalHashrate += item.hashrate[0];
      totalHashrate24 += item.hashrate[2];
      if (item.workerStatus.online > 0) {
        totalActiveSubAccounts++;
      }
    });

    // console.log(subAccountInfo);
    // return subAccountInfo
    return { totalDead, totalOffline, totalOnline, totalHashrate, totalHashrate24, totalActiveSubAccounts, totalSubAccounts };
  }

  async getSubAccountsStatus(subAccounts) {
    const subAccountNames = subAccounts
      .map((subAccount) => subAccount.subAccName)
      .join(",");

    const {
      data: { subaccounts },
    } = await this.client.get(
      `api/external/v1/subaccounts?subAccountNames=${subAccountNames}`
    );

    return subaccounts;
  }

  async getWorkers(subaccountnames) {
    try {
      const { data: workers } = await this.client.get(
        `/api/external/v1/workers?subaccountNames=${subaccountnames}`
      );

      return workers
    } catch (error) {
      console.error('Error upon SBI getWorkers: ', error.message)
      return { isSuccess: false, error }
    }
  }

  async getEstimatedRevenue(subaccountName) {
    const usernames = []

    if (subaccountName) usernames.push(subaccountName)
    else {
      const subAccounts = await SubAccount.findAll({
        where: {
          collectorId: {
            [Op.ne]: null,
          },
        },
      });

      usernames.push(...subAccounts.map((item) => item.subAccName))
    }

    const result = await Promise.all(
      usernames.map(async (item) => {
        const data = await this.client.get("api/external/v1/revenue", {
          params: { subaccountNames: item },
        });

        return { subaccount: item, data: Object.values(data.data.estimatedRevenues) }
      })
    );

    return result;
  }

  getCollector(collectorId, query) {
    return this.client.get(
      `/api/external/v1/subaccount/${collectorId}/virtual`,
      {
        params: query,
      }
    );
  }

  updateSubaccount(collectorData) {
    return this.client.patch(
      "/api/external/v1/subaccount/virtual",
      collectorData
    );
  }

  getSubAccounts(query) {
    return this.client.get("api/external/v1/subaccounts", {
      params: query,
    });
  }

  getPayouts(query) {
    return this.client.get("/api/external/v2/earnings", {
      params: query,
    });
  }

  async getStatus(subaccountName, userId) {
    let subAccounts = [];
    const subAccountInfo = [];

    if (subaccountName) {
      subAccounts = await SubAccount.findAll({
        where: {
          subAccName: subaccountName
        }
      })
    }

    else {
      subAccounts = await this.getUserSubAccounts(userId);
    }

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

    const poolSubaccounts = await this.getSubAccountsStatus(subAccounts);
    for (const subAccount of subAccounts) {
      const poolSubAccountInfo = poolSubaccounts.find(
        (item) =>
          item.subaccountId === subAccount.collectorId ||
          item.id === subAccount.luxorId
      );
      subAccountInfo.push({
        subAccName: subAccount.subAccName,
        subAccountId: subAccount.id,
        hashrate: poolSubAccountInfo?.hashrate || [0, 0, 0],
        workerStatus: poolSubAccountInfo?.workerStatus || { online: 0, dead: 0, offline: 0 },
        port: subAccountStrataMapper[subAccount.id],
      });
    }
    console.log(subAccountInfo);

    return subAccountInfo;
  }

  async getTransactionLst({startDate, endDate, isConfirmed, subaccountNameLst}) {

    // processing parameters

    // earningsFor filter
    startDate = formatDatePoolAPI(startDate);
    endDate = formatDatePoolAPI(endDate);

    isConfirmed = isConfirmed ?? false;
    isConfirmed = isConfirmed == "true";
    subaccountNameLst = subaccountNameLst ?? [];

    // get data from API

    let transactionLst = [];
    let responseLen = 1;
    let page = 0;
    while (responseLen > 0) {
      responseLen = 0;
      const response = await this.getPayouts({
        startDate, endDate, page: page++, size: 50
      });
      responseLen = response?.data?.content?.length ?? 0;
      transactionLst = transactionLst.concat(response.data.content);
    }

    if (isConfirmed) {
      // CONFIRMED, PENDING, POSTED, NEW
      transactionLst = transactionLst.filter(transaction => {return transaction.state == "CONFIRMED";});
    }

    if (subaccountNameLst.length > 0) {
      transactionLst = transactionLst.filter(transaction => {
        return subaccountNameLst.includes(transaction.subaccountName);
      });
    }

    // add organization info
    const organizationLst = await Organization.findAll({
      include: [
        {
          model: SubAccount,
          as: 'subAccounts'
        }
      ]
    });

    organizationLst.forEach(organization => {
      organization.subAccountIdLst = organization.subAccounts.map(subAccounts => subAccounts.collectorId);
    });

    transactionLst.forEach(transaction => {

      transaction.organizationDb = organizationLst.find(organization => {
        return organization.subAccountIdLst.includes(transaction.subaccountId);
      });

      transaction.subAccountDb = transaction.organizationDb.subAccounts.find(subAccountDb => {
        return subAccountDb.collectorId == transaction.subaccountId;
      });

    });

    // processing report
    const transactionGrp = {};
    transactionLst.forEach(transaction => {

      const key = `
      ${transaction.earningsFor}
      ${transaction.subaccountName}
      ${transaction.subaccountId}
      ${transaction.coin}
      `;

      if (transactionGrp[key] == null) {
        transactionGrp[key] = {
          earningsFor: transaction.earningsFor,
          subaccountName: transaction.subaccountName,
          subaccountId: transaction.subaccountId,
          coin: transaction.coin,

          vsub1Sum: 0,
          vsub2Sum: 0,

          vsub1HashRate: 0,
          vsub2HashRate: 0,
          hashrate: 0,

          feeTotal: 0, // vsub1.feesPaid + vsub2.feesPaid + vsub2.netOwed

          walletAddress: "",
          organization: null,
          subAccount: null,

        };
      }

      transactionGrp[key].hashrate = transactionGrp[key].hashrate + transaction.hashrate;
      transactionGrp[key].feeTotal = transactionGrp[key].feeTotal + transaction.feesPaid;
      
      switch (transaction.vsubaccountId) {
        case transaction.subAccountDb.vsub1Id:
          transactionGrp[key].vsub1Sum =
            transactionGrp[key].vsub1Sum +
            transaction.netOwed;

          transactionGrp[key].vsub1HashRate =
            transactionGrp[key].vsub1HashRate +
            transaction.hashrate;

          transactionGrp[key].walletAddress = transaction.address;
          transactionGrp[key].organization = transaction.organizationDb;
          transactionGrp[key].subAccount = transaction.subAccountDb;

          transactionGrp[key].vsub1Transaction = transaction;

          break;
        case transaction.subAccountDb.vsub2Id:
          transactionGrp[key].vsub2Sum =
            transactionGrp[key].vsub2Sum +
            transaction.netOwed;

          transactionGrp[key].vsub2HashRate =
            transactionGrp[key].vsub2HashRate +
            transaction.hashrate;

          transactionGrp[key].vsub2Transaction = transaction;

          transactionGrp[key].feeTotal = transactionGrp[key].feeTotal + transaction.netOwed;

          break;
        default:
          break;
      }

    });

    const report = Object.keys(transactionGrp).map(key => {return transactionGrp[key]});

    return (report);
  }

}

module.exports = SBIPool;
