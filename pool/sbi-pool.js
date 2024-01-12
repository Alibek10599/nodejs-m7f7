const axios = require("axios");
const { SubAccount, SubUser, SubStratum, Stratum } = require("../models");
const { Op } = require("sequelize");

const { SBI_URL, MIDAS_GLOBAL_POOL_ADDRESS, SBI_API_KEY, SBI_API_SECRET } =
  process.env;

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

  async getUserSubAccounts(userId ) {
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
      subAccounts = subUsers.map(subUser => subUser.subAccount ? {subAccName: subUser.subAccount.subAccName, id: subUser.subAccount.id } : null).filter(Boolean); // filter(Boolean) will remove any undefined or null entries
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

  async getTransactions(fromDate, toDate, size, subaccountName) {
    const sbiPayouts = await this.client(
      `api/external/v1/earnings?fromDate=${fromDate}&toDate=${toDate}`
    );

    const payoutsContent = sbiPayouts.data.content.filter((earnings) => earnings.subAccountName === subaccountName);

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

    if (subaccountName){
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
          workerStatus: poolSubAccountInfo?.workerStatus || {online: 0, dead: 0, offline: 0},
          port: subAccountStrataMapper[subAccount.id],
      });
    }
    console.log(subAccountInfo);
    
    return subAccountInfo;
  }
}

module.exports = SBIPool;
