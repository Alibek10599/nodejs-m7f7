const {
    GlobalPool,
    SubAccount,
    SubUser,
    SubStratum,
    Stratum
} = require('../models');
const { PoolFactory, isSBIPool, isLuxorPool } = require("../pool/pool-factory");

module.exports = {
    GetSubUsers: async (req, res) => {
        try {
            const subAccounts = await SubUser.findAll({
                where: {
                    userId: req.user.dataValues.id,
                    isActive: true
                },
                include: [
                    {
                        model: SubAccount,
                        attributes: ["subAccName", 'vsub1Id', 'luxorId'],
                        as: "subAccount"
                    }
                ]
          });
    
          return res.status(200).json(subAccounts);
        } catch (error) {
            console.log(error);
            res.status(500).send(`Error: ${error.message}`);
        }
    },

    GetSubAccountInfo: async (req, res) => {
        const { subAccName } = req.query;

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

            let subAccounts;

            if(subAccName === ''){
                // Perform the query to get sub users with their sub accounts
                const subUsers = await SubUser.findAll({
                    where: {
                        userId: req.user.dataValues.id,
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
                
                // Check if the result is an array and has content
                if (Array.isArray(subUsers) && subUsers.length) {
                    // Map over the results to extract the subAccount data
                    subAccounts = subUsers.map(subUser => subUser.subAccount ? {subAccName: subUser.subAccount.subAccName, id: subUser.subAccount.id} : null).filter(Boolean); // filter(Boolean) will remove any undefined or null entries
                    // Now subAccounts is an array of SubAccount objects
                } else {
                    // Handle the case where there are no sub users or sub accounts
                    console.log('No sub accounts found or subUsers is not an array.');
                }
            } else {
                subAccounts = await SubAccount.findAll({
                    where: {
                        subAccName
                    }
                });
                //is subAccount Name unique?
            }

            const poolSubaccounts = await pool.getSubAccountsStatus(subAccounts);

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

            const subAccountInfo = [];
            subAccounts = [];
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

            res.status(200).json(subAccountInfo);
        } catch (error) {
            console.log(error);
            res.status(500).send(`Error: ${error.message}`);
        }
    }
}
