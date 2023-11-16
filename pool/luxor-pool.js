const axios = require("axios");

const { LUXOR_URL, LUXOR_API_KEY, MIDAS_GLOBAL_POOL_ADDRESS } = process.env;

class LuxorPool {
  #url = LUXOR_URL;
  #midasPoolAddress = MIDAS_GLOBAL_POOL_ADDRESS;
  #client;

  constructor(type) {
    this.type = type;
    this.#client = axios.create({
      headers: {
        "x-lux-api-key": LUXOR_API_KEY,
      },
    });
  }

  async createSubAccount(payload) {
    const { accountName, walletAddress, organization } = payload;

    const subAccount = await this.#client.post(
      this.#url,
      this.#createSubAccountMutation(accountName)
    );

    const {
      data: { errors: subAccountErrors },
    } = subAccount;

    if (subAccountErrors) return this.#error(subAccountErrors);

    const wallet = await this.#client.post(
      this.#url,
      this.#provisionWalletMutation(accountName)
    );

    const {
      data: { data: walletData, errors: walletErrors },
    } = wallet;

    if (walletErrors) return this.#error(walletErrors);

    const {
      provisionWallet: {
        wallet: { rowId: walletId },
      },
    } = walletData;

    const userWalletAddress = await this.#client.post(
      this.#url,
      this.#createWalletAddressMutation(walletAddress, accountName, walletId)
    );

    const {
      data: { data: userWalletAddressData, errors: userWalletAddressErrors },
    } = userWalletAddress;

    if (userWalletAddressErrors) return this.#error(userWalletAddressErrors);

    const midasWalletAddress = await this.#client.post(
      this.#url,
      this.#createWalletAddressMutation(
        this.#midasPoolAddress,
        accountName,
        walletId,
        `${accountName}_midaswallet`
      )
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

    const splitPercentage = await this.#client.post(
      this.#url,
      this.#setWalletAddressesSplitPercentageMutation(accountName, walletId, [
        {
          addressId: userWalletAddressId,
          splitPercentage: 1e6 - feeRate * 1e4,
        },
        {
          addressId: midasWalletAddressId,
          splitPercentage: feeRate * 1e4,
        },
      ])
    );

    const {
      data: { errors: splitPercentageErrors },
    } = splitPercentage;

    if (splitPercentageErrors) return this.#error(splitPercentageErrors);

    return subAccount;
  }

  async updateWallet(payload) {
    const { subAccount, address } = payload;

    const wallet = await this.#client.post(
      this.#url,
      this.#walletQuery(subAccount.subAccName)
    );

    const {
      data: { data: walletData, errors: walletErrors },
    } = wallet;

    if (walletErrors) return this.#error(walletErrors);

    const {
      getWallet: { rowId: walletId },
    } = walletData;

    const walletAddresses = await this.#client.post(
      this.#url,
      this.#walletAddressesQuery(walletId, subAccount.subAccName)
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

    const changeAddress = await this.#client.post(
      this.#url,
      this.#setWalletAddressPayoutAddressMutation(
        address,
        addressId,
        subAccount.subAccName
      )
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
    } = await this.#client.post(this.#url, this.#usersQuery(1000));

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
        } = await this.#client.post(
          this.#url,
          this.#miningSummaryQuery(subaccountInfo.node.username)
        );

        if (miningSummary15mErrors) return this.#error(miningSummary15mErrors);

        const {
          data: { errors: miningSummary6hErrors, data: miningSummary6hData },
        } = await this.#client.post(
          this.#url,
          this.#miningSummaryQuery(subaccountInfo.node.username, "_6_HOUR")
        );

        if (miningSummary6hErrors) return this.#error(miningSummary6hErrors);

        const {
          data: { errors: miningSummary1dErrors, data: miningSummary1dData },
        } = await this.#client.post(
          this.#url,
          this.#miningSummaryQuery(subaccountInfo.node.username, "_1_DAY")
        );

        if (miningSummary1dErrors) return this.#error(miningSummary1dErrors);

        const {
          data: { data: walletData, errors: walletErrors },
        } = await this.#client.post(
          this.#url,
          this.#walletQuery(subaccountInfo.node.username)
        );

        if (walletErrors) return this.#error(walletErrors)

        let addresses = []

        if (walletData.getWallet) {
          const { data: { data: addressesData, errors: addressesErrors } } = await this.#client.post(
            this.#url,
            this.#walletAddressesQuery(
              walletData.getWallet.rowId,
              subaccountInfo.node.username
            )
          );
  
          if (addressesErrors) return this.#error(addressesErrors);
          
          addresses = addressesData.getWalletAddresses.edges;
        }

        subAccountInfo.push({
          subAccount,
          info: [
            {
              ...subaccountInfo.node,
              hashrate: [
                miningSummary15mData.getMiningSummary.hashrate,
                miningSummary6hData.getMiningSummary.hashrate,
                miningSummary1dData.getMiningSummary.hashrate,
              ],
              revenue: [
                miningSummary15mData.getMiningSummary.revenue,
                miningSummary6hData.getMiningSummary.revenue,
                miningSummary1dData.getMiningSummary.revenue,
              ],
              ...walletData.getWallet,
              addresses,
            },
          ],
        });
      }
    }

    return subAccountInfo;
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

  #createWalletAddressMutation(address, username, walletId, walletName) {
    return {
      query: `
        mutation createWalletAddress {
          createWalletAddress(input: { address: "${address}", addressName: "${
        walletName ?? this.#walletName(username)
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

  #transactionHistoryQuery(username, cid = 'BTC', first = 10) {
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
      `
    }
  }

  #walletName(accountName) {
    return `${accountName}_wallet`;
  }

  #error(errors) {
    return { error: errors };
  }
}

module.exports = LuxorPool;
