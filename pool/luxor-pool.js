const axios = require("axios");
const { SubAccount, Organization, SubWallet, Wallet } = require("../models");
const { Op } = require("sequelize");

const { LUXOR_URL, MIDAS_GLOBAL_POOL_ADDRESS } = process.env;

class LuxorPool {
  #url = LUXOR_URL;
  #midasPoolAddress = MIDAS_GLOBAL_POOL_ADDRESS;
  #client;

  constructor(pool) {
    this.type = pool.name;
    this.#client = axios.create({
      headers: {
        "x-lux-api-key": pool.apiKey,
      },
    });
  }

  async createSubAccount(payload) {
    const { accountName, walletAddress, organization } = payload;

    const subAccount = await this.#createSubAccount(accountName);

    const {
      data: { errors: subAccountErrors },
    } = subAccount;

    if (subAccountErrors) return this.#error(subAccountErrors);

    const wallet = await this.#provisionNewWallet(accountName);

    const {
      data: { data: walletData, errors: walletErrors },
    } = wallet;

    if (walletErrors) return this.#error(walletErrors);

    const {
      provisionWallet: {
        wallet: { rowId: walletId },
      },
    } = walletData;

    const userWalletAddress = await this.#createWalletAddress(
      walletAddress,
      accountName,
      walletId
    );

    const {
      data: { data: userWalletAddressData, errors: userWalletAddressErrors },
    } = userWalletAddress;

    if (userWalletAddressErrors) return this.#error(userWalletAddressErrors);

    const midasWalletAddress = await this.#createWalletAddress(
      this.#midasPoolAddress,
      accountName,
      walletId,
      `${accountName}_midaswallet`
    );

    const {
      data: { data: midasWalletAddressData, errors: midasWalletAddressErrors },
    } = midasWalletAddress;

    if (midasWalletAddressErrors) return this.#error(midasWalletAddressErrors);

    const {
      createWalletAddress: {
        walletAddress: { rowId: userWalletAddressId },
      },
    } = userWalletAddressData;
    const {
      createWalletAddress: {
        walletAddress: { rowId: midasWalletAddressId },
      },
    } = midasWalletAddressData;

    const feeRate = organization.feesRate || 0;

    const splitPercentage = await this.#setWalletAddressSplitPercentage(
      accountName,
      walletId,
      [
        {
          addressId: userWalletAddressId,
          splitPercentage: 1e6 - feeRate * 1e4,
        },
        {
          addressId: midasWalletAddressId,
          splitPercentage: feeRate * 1e4,
        },
      ]
    );

    const {
      data: { errors: splitPercentageErrors },
    } = splitPercentage;

    if (splitPercentageErrors) return this.#error(splitPercentageErrors);

    return subAccount;
  }

  async updateWallet(payload) {
    const { subAccount, address } = payload;

    const wallet = await this.#wallet(subAccount.subAccName);

    const {
      data: { data: walletData, errors: walletErrors },
    } = wallet;

    if (walletErrors) return this.#error(walletErrors);

    const {
      getWallet: { rowId: walletId },
    } = walletData;

    const walletAddresses = await this.#walletAddresses(
      walletId,
      subAccount.subAccName
    );

    const {
      data: { data: walletAddressesData, errors: walletAddressesError },
    } = walletAddresses;

    if (walletAddressesError) return this.#error(walletAddressesError);

    const {
      getWalletAddresses: { edges },
    } = walletAddressesData;

    const targetWalletAddress = edges.find(
      (edge) =>
        edge.node.addressName === this.#walletName(subAccount.subAccName)
    );

    if (!targetWalletAddress)
      throw new Error("Target wallet address was not found");

    const {
      node: { rowId: addressId },
    } = targetWalletAddress;

    const changeAddress = await this.#setWalletAddressPayoutAddress(
      address,
      addressId,
      subAccount.subAccName
    );

    const {
      data: { data: changeAddressData, errors: changeAddressErrors },
    } = changeAddress;

    if (changeAddressErrors) return this.#error(changeAddressErrors);

    return changeAddressData.setWalletAddressPayoutAddress;
  }

  async getSubaccountInfo(subAccounts) {
    const {
      data: { errors: usersErrors, data: usersData },
    } = await this.#users(1000);

    if (usersErrors) return this.#error(usersErrors);

    const {
      users: { edges },
    } = usersData;

    const subAccountInfo = [];

    for (const subAccount of subAccounts) {
      const subaccountInfo = await edges.find(
        (item) => item.node.username === subAccount.subAccName
      );

      if (subaccountInfo) {
        const {
          data: { errors: miningSummary15mErrors, data: miningSummary15mData },
        } = await this.#miningSummary(subaccountInfo.node.username);

        if (miningSummary15mErrors) return this.#error(miningSummary15mErrors);

        const {
          data: { errors: miningSummary6hErrors, data: miningSummary6hData },
        } = await this.#miningSummary(subaccountInfo.node.username, "_6_HOUR");

        if (miningSummary6hErrors) return this.#error(miningSummary6hErrors);

        const {
          data: { errors: miningSummary1dErrors, data: miningSummary1dData },
        } = await this.#miningSummary(subaccountInfo.node.username, "_1_DAY");

        if (miningSummary1dErrors) return this.#error(miningSummary1dErrors);

        const {
          data: { data: walletData, errors: walletErrors },
        } = await this.#wallet(subaccountInfo.node.username);

        if (walletErrors) return this.#error(walletErrors);

        let addresses = [];

        if (walletData.getWallet) {
          const {
            data: { data: addressesData, errors: addressesErrors },
          } = await this.#walletAddresses(
            walletData.getWallet.rowId,
            subaccountInfo.node.username
          );

          if (addressesErrors) return this.#error(addressesErrors);

          addresses = addressesData.getWalletAddresses.edges;
        }

        const {
          data: { data: userMinersStatusData, errors: userMinersStatusErrors },
        } = await this.#userMinersStatusCount(subaccountInfo.node.username);

        if (userMinersStatusErrors) return this.#error(userMinersStatusErrors);

        const { getUserMinersStatusCount } = userMinersStatusData;

        subAccountInfo.push({
          subAccount,
          info: [
            {
              hashrate: [
                Math.floor(miningSummary15mData.getMiningSummary.hashrate / 1e12),
                Math.floor(miningSummary6hData.getMiningSummary.hashrate / 1e12),
                Math.floor(miningSummary1dData.getMiningSummary.hashrate / 1e12),
              ],
              revenue: [
                miningSummary15mData.getMiningSummary.revenue,
                miningSummary6hData.getMiningSummary.revenue,
                miningSummary1dData.getMiningSummary.revenue,
              ],
              ...walletData.getWallet,
              addresses,
              workerStatus: getUserMinersStatusCount,
              ...subaccountInfo.node,
            },
          ],
        });
      }
    }

    return subAccountInfo;
  }

  async getTransactions(fromDate, toDate, size) {
    const subAccounts = await SubAccount.findAll({
      where: {
        luxorId: {
          [Op.ne]: null,
        },
      },
    });

    if (!subAccounts.length) return { content: [] };

    const result = await Promise.all(
      subAccounts.map(async (item) => {
        const result = await this.#transactionHistory(
          item.subAccName,
          "BTC",
          size
        );

        const {
          data: {
            data: {
              getTransactionHistory: { nodes },
            },
          },
        } = result;

        return nodes;
      })
    ).then((result) => result.flat());

    return result;
  }

  async getSubAccountsStatus(subAccounts) {
    const info = await this.getSubaccountInfo(subAccounts);

    return info
      .map((item) => {
        return item.info;
      })
      .flat();
  }

  async getReport(year, month) {
    const startDate = new Date(`${year}-${month}-01T00:00:00+00:00`);
    const endDate = new Date(
      new Date(startDate).setMonth(startDate.getMonth() + 1)
    );

    const subAccounts = await SubAccount.findAll({
      where: {
        luxorId: {
          [Op.ne]: null,
        },
      },
      include: [{ model: Organization, as: "organization" }],
    });

    let id = 1;

    const result = [];

    const subAccountRevenues = {};
    const subAccountWallets = {};

    for (let d = startDate; d < endDate; d.setDate(d.getDate() + 1)) {
      for (const subAccount of subAccounts) {
        let wallet = subAccountWallets[subAccount.subAccName];

        if (!wallet) {
          const walletDb = await SubWallet.findOne({
            where: { isActive: true, subAccountId: subAccount.id },
            include: { model: Wallet, as: "wallet" },
          });

          if (!walletDb) wallet = "";
          else {
            subAccountWallets[subAccount.subAccName] = walletDb.wallet.address;
            wallet = walletDb.wallet.address;
          }
        }

        let revenues = subAccountRevenues[subAccount.subAccName];

        if (!revenues) {
          const {
            data: {
              data: {
                getHashrateScoreHistory: { edges },
              },
            },
          } = await this.#hashrateScoreHistory(subAccount.subAccName);

          subAccountRevenues[subAccount.subAccName] = edges;
          revenues = edges;
        }

        let revenue = await this.#getRevenueByDate(
          subAccount.subAccName,
          d,
          revenues
        );
        let fee = "0";

        if (revenue > 0) {
          fee = revenue * subAccount.organization.feesRate;
          revenue = revenue - fee;
        }

        result.push({
          id: id++,
          name: subAccount.organization.orgName,
          bin: subAccount.organization.bin,
          licId: subAccount.organization.licId,
          licDate: subAccount.organization.licDate,
          wallet,
          currency: "BTC",
          date: d.toLocaleDateString(),
          revenue: Number(revenue).toFixed(8),
          fee: {
            currency: "BTC",
            amount: Number(fee).toFixed(8),
          },
        });
      }
    }

    return result;
  }

  async #getRevenueByDate(username, date, revenues) {
    if (!revenues.length) return "0";

    const revenue = revenues.find(
      (item) => new Date(item.node.date).valueOf() === new Date(date).valueOf()
    );

    if (!revenue) {
      if (revenues.length < 100) return "0";

      const firstRecord = revenues[0];

      if (new Date(firstRecord.node.date).valueOf() < new Date(date))
        return "0";

      const {
        data: {
          data: {
            getHashrateScoreHistory: { edges },
          },
        },
      } = await this.#hashrateScoreHistory(
        username,
        "BTC",
        100,
        revenues[revenues.length - 1].cursor
      );

      return this.#getRevenueByDate(username, date, edges);
    }

    return revenue.node.revenue;
  }

  async getWorkers(subaccountnames) {
    subaccountnames = subaccountnames.toLowerCase()
    const subAccounts = await SubAccount.findAll({
      where: {
        subAccName: {
          [Op.in]: Array.isArray(subaccountnames)
            ? subaccountnames
            : [subaccountnames],
        },
      },
    });

    const result = await Promise.all(
      subAccounts.map((item) => this.#workerDetails(item.subAccName))
    );

    return result.map((item) => item.data.data.getWorkerDetails.nodes).flat();
  }

  async getEstimatedRevenue(subaccountName) {
    const usernames = []

    if (subaccountName) usernames.push(subaccountName)
    else {
      const subAccounts = await SubAccount.findAll({
        where: {
          luxorId: {
            [Op.ne]: null,
          },
        },
      });

      usernames.push(...subAccounts.map((item) => item.subAccName))
    }

    const result = await Promise.all(usernames.map(async (item) => {
      const {
        data: {
          data: {
            getMiningSummary: { revenue },
          },
        },
      } = await this.#miningSummary(item, "_1_DAY");

      return { subaccount: item, data: [revenue] }
    }))

    return result;
  }

  async getEarnings(fromDate, toDate, size) {
    const subAccounts = await SubAccount.findAll({
      where: {
        luxorId: {
          [Op.ne]: null,
        },
      },
    });

    const result = await Promise.all(subAccounts.map(async (item) => {
      const list = await this.#hashrateScoreHistory(item.subAccName);

      return list.data.data.getHashrateScoreHistory.edges.map((listItem) => ({ ...listItem.node, ...item.dataValues }))
    }))

    return result.flat();
  }

  async #workerDetails(username, mpn = "BTC", first = 100) {
    return this.#client.post(this.#url, this.#workerDetailsQuery(username));
  }

  #workerDetailsQuery(username, mpn = "BTC", first = 100) {
    return {
      query: `
        query getWorkerDetails {
          getWorkerDetails(uname: "${username}", mpn: ${mpn}, first: ${first}, duration: { days: 10 }) {
            nodes {
              minerId
              workerName
              miningProfileName
              updatedAt
              status
              hashrate
              validShares
              staleShares
              invalidShares
              lowDiffShares
              badShares
              duplicateShares
              revenue
              efficiency
            }
          }
        }
      `,
    };
  }

  #hashrateScoreHistory(username, mpn = "BTC", first = 100, after) {
    return this.#client.post(
      this.#url,
      this.#hashrateScoreHistoryQuery(username, mpn, first, after)
    );
  }

  #hashrateScoreHistoryQuery(username, mpn = "BTC", first = 100, after) {
    return {
      query: `
        query getHashrateScoreHistory {
          getHashrateScoreHistory(uname: "${username}", mpn: ${mpn}, first: ${first}, orderBy: DATE_DESC ${after ? `, after: "${after}"` : ""
        }) {
            edges {
              cursor
              node {
                date
                revenue
                hashrate
                efficiency
                uptimePercentage
                uptimeTotalMinutes
                uptimeTotalMachines
              }
            }
          }
        }
      `,
    };
  }

  async #createSubAccount(username) {
    return this.#client.post(
      this.#url,
      this.#createSubAccountMutation(username)
    );
  }

  #createSubAccountMutation(username) {
    return {
      query: `
          mutation provisionNewUser($input: ProvisionNewUserInput!) {
            provisionNewUser (input: $input) {
              user {
                id,
                username
              }
            }
          }
        `,
      variables: {
        input: {
          inputUsername: username,
        },
      },
    };
  }

  async #provisionNewWallet(username, coinId = "BTC") {
    return this.#client.post(
      this.#url,
      this.#provisionWalletMutation(username, coinId)
    );
  }

  #provisionWalletMutation(username, coinId = "BTC") {
    return {
      query: `
        mutation provisionWallet {
          provisionWallet (input: { coinId: ${coinId}, inputUsername: "${username}" }) {
            wallet {
              address
              currencyProfileName
              isFrozen
              id
              pendingBalance
              rowId
            }
          }
        }
      `,
    };
  }

  async #createWalletAddress(address, username, walletId, walletName) {
    return this.#client.post(
      this.#url,
      this.#createWalletAddressMutation(address, username, walletId, walletName)
    );
  }

  #createWalletAddressMutation(address, username, walletId, walletName) {
    return {
      query: `
        mutation createWalletAddress {
          createWalletAddress(input: { address: "${address}", addressName: "${walletName ?? this.#walletName(username)
        }", uname: "${username}", walletId: ${walletId} }) {
            walletAddress {
              address,
              addressName,
              paymentSplitPercentage,
              rowId
            }
          }
        }
      `,
    };
  }

  async #setWalletAddressSplitPercentage(accountName, walletId, percentage) {
    return this.#client.post(
      this.#url,
      this.#setWalletAddressesSplitPercentageMutation(
        accountName,
        walletId,
        percentage
      )
    );
  }

  #setWalletAddressesSplitPercentageMutation(
    username,
    walletId,
    addresses = []
  ) {
    return {
      query: `
        mutation setWalletAddressesSplitPercentage($input: SetWalletAddressesSplitPercentageInput!) {
          setWalletAddressesSplitPercentage(input: $input) {
            results {
              walletAddress
              paymentSplitPercentage
            }
          }
        }
      `,
      variables: {
        input: {
          uname: username,
          walletId,
          addresses,
        },
      },
    };
  }

  async #wallet(username, coinId = "BTC") {
    return this.#client.post(this.#url, this.#walletQuery(username, coinId));
  }

  #walletQuery(username, coinId = "BTC") {
    return {
      query: `
        query getWallet($uname: String!, $coinId: CurrencyProfileName!) {
          getWallet(uname: $uname, coinId: $coinId) {
            id
            rowId
            address
            paymentIntervalHours
            paymentThreshold
            currencyProfileName
            isFrozen
            pendingBalance
            remainingFreezingTime
          }
        }
      `,
      variables: {
        uname: username,
        coinId,
      },
    };
  }

  async #walletAddresses(walletId, username) {
    return this.#client.post(
      this.#url,
      this.#walletAddressesQuery(walletId, username)
    );
  }

  #walletAddressesQuery(walletId, username) {
    return {
      query: `
      query getWalletAddresses {
        getWalletAddresses(coinWalletId: ${walletId}, uname: "${username}", first: 10) {
          edges {
            node {
              rowId
              addressName
              address
            }
          }
        }
      }
      `,
    };
  }

  async #setWalletAddressPayoutAddress(address, addressId, username) {
    return this.#client.post(
      this.#url,
      this.#setWalletAddressPayoutAddressMutation(
        address,
        addressId,
        subAccount.subAccName
      )
    );
  }

  #setWalletAddressPayoutAddressMutation(address, addressId, username) {
    return {
      query: `
        mutation setWalletAddressPayoutAddress {
          setWalletAddressPayoutAddress(input: { addressHash: "${address}", addressId: ${addressId}, uname: "${username}" }) {
            walletAddress {
              address
              addressName
              paymentSplitPercentage
              walletId
              rowId
            }
          }
        }
      `,
    };
  }

  #profileHashrateQuery(mpn = "BTC") {
    return {
      query: `
        query getProfileHashrate {
          getProfileHashrate(mpn: ${mpn})
        }
      `,
    };
  }

  async #miningSummary(username, duration = "_15_MINUTE", mpn = "BTC") {
    return this.#client.post(
      this.#url,
      this.#miningSummaryQuery(username, duration, mpn)
    );
  }

  // duration = _15_MINUTE | _1_HOUR | _6_HOUR | _1_DAY
  #miningSummaryQuery(username, duration = "_15_MINUTE", mpn = "BTC") {
    return {
      query: `
        query getMiningSummary {
          getMiningSummary(mpn: ${mpn}, userName: "${username}", inputDuration: ${duration}) {
            username
            validShares
            invalidShares
            staleShares
            lowDiffShares
            badShares
            duplicateShares
            revenue
            hashrate
          }
        }
      `,
    };
  }

  async #users(first = 10) {
    return this.#client.post(this.#url, this.#usersQuery(first));
  }

  #usersQuery(first = 10) {
    return {
      query: `
        query users {
          users (first: ${first}) {
            edges {
              node {
                id
                username
              }
            }
          }
        }
      `,
    };
  }

  async #transactionHistory(username, cid = "BTC", first = 10) {
    return this.#client.post(
      this.#url,
      this.#transactionHistoryQuery(username, cid, first)
    );
  }

  #transactionHistoryQuery(username, cid = "BTC", first = 10) {
    return {
      query: `
        query getTransactionHistory {
          getTransactionHistory(cid: ${cid}, uname: "${username}", first: ${first}) {
            nodes {
              amount
              coinPrice
              createdAt
              rowId
              status
              transactionId
            }
          }
        }
      `,
    };
  }

  async #userMinersStatusCount(username, mpn = "BTC") {
    return this.#client.post(
      this.#url,
      this.#userMinersStatusCountQuery(username, mpn)
    );
  }

  #userMinersStatusCountQuery(username, mpn = "BTC") {
    return {
      query: `
        query getUserMinersStatusCount {
          getUserMinersStatusCount(mpn: ${mpn}, usrname: "${username}") {
            active
            dead
            warning
          }
        }
      `,
    };
  }

  #walletName(accountName) {
    return `${accountName}_wallet`;
  }

  #error(errors) {
    return { error: errors };
  }
}

module.exports = LuxorPool;
