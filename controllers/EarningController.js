const { Op } = require("sequelize")
const { GlobalPool, SubAccount, Role } = require("../models")
const { PoolFactory } = require("../pool/pool-factory");
const PoolTypes = require("../pool/pool-types");
const ExcelJS = require('exceljs');
const fs = require('fs');
const { MIDAS_GLOBAL_POOL_ADDRESS } = process.env

module.exports = {
  GetPayouts: async (req, res) => {
    try {
      const orgId = req.query.id !== 'undefined' ? req.query.id : req.user.orgId
      const subaccountNames = (await SubAccount.findAll({ where: { orgId } })).map(subaccount => subaccount.subAccName);
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

      const { fromDate, toDate } = req.query;
      let transactions = await pool.getTransactions(fromDate, toDate, 100, subaccountNames);

      transactions = transactions.map((transaction, index, array) => {
        return {
          ...transaction, comissionFee: array.find(item =>
            item.asOf === transaction.asOf &&
            item.subaccountId === transaction.subaccountId &&
            item.payoutAddress === MIDAS_GLOBAL_POOL_ADDRESS)?.amount
        }
      }).filter((transaction) => transaction.payoutAddress !== MIDAS_GLOBAL_POOL_ADDRESS)

      return res.status(200).json(transactions);
    } catch (error) {
      console.log(error);
      return res.status(500).send(`Error: ${error.message}`);
    }
  },

  GetEarnings: async (req, res) => {
    try {
      const { subaccountNames } = req.query;
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

      const subAccounts = await SubAccount.findAll({
        where: {
          orgId,
          [globalPool.name === PoolTypes.SBI ? "collectorId" : "luxorId"]: {
            [Op.ne]: null,
          },
        }
      })

      const { fromDate, toDate } = req.query;

      const earnings = await pool.getEarnings(fromDate, toDate, 100, subaccountNames)

      return res.status(200).json(earnings);
    } catch (error) {
      console.log(error);
      return res.status(500).send(`Error: ${error.message}`);
    }
  },

  GetEstimatedRevenue: async (req, res) => {
    const { subaccountNames } = req.query;
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

      const result = await pool.getEstimatedRevenue(subaccountNames)

      // const {service: sbiService } = await getService();

      // const sbiRevenues = await sbiService.getRevenues({subaccountNames: 'MidasTest1'});

      // const revenues = Object.values(sbiRevenues.data.estimatedRevenues)

      return res.status(200).json(result);
    } catch (error) {
      console.log(error);
      return res.status(500).send(`Error: ${error.message}`);
    }
  },

  // pool report
  GetTaxReport: async (req, res) => {
    try {

      // permisions
      const role = await getRole(req.user);

      const isEarning = checkIsEarning(role.roleName);
      if (!isEarning) {
        const report = [];
        return res.status(200).json({ report });
      }

      const isGlobal = checkIsGlobal(role.roleName);
      if (!isGlobal) {
        const report = [];
        return res.status(200).json({ report });
      }

      // processing parameters

      const { month, year, isExcel, isConfirmed } = req.query;

      let startDate = new Date(`${year}-${month}-01T00:00:00+00:00`);
      let endDate = new Date(
        new Date(startDate).setMonth(startDate.getMonth() + 1)
      );

      const pool = await getPool();

      const report = await pool.getTransactionLst({ startDate, endDate, isConfirmed });

      // generate excel
      if ((isExcel ?? false)) {

        const reportName = `tax report ${month} ${year}`;

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader("Content-Disposition", "attachment; filename=" + reportName + ".xlsx");

        const file = await taxReportGanerateExcel(report, reportName);
        await file.workbook.xlsx.write(res);

        res.end();
        return;

      }

      return res.status(200).json({ report });

    } catch (error) {
      console.log(error);
      return res.status(500).send(`Error: ${error.message}`);
    }
  },

  GetTransactions: async (req, res) => {
    try {

      // check permission

      const role = await getRole(req.user);
      const isEarning = checkIsEarning(role.roleName);
      if (!isEarning) {
        const report = [];
        return res.status(200).json({ report });
      }

      const isGlobal = checkIsGlobal(role.roleName);
      if (isGlobal) {
        const result = await GetTransactionsPool(req, res);
        return result;
      }

      const isOrg = checkIsOrg(role.roleName);
      if (isOrg) {
        const result = await GetTransactionsOrg(req, res);
        return result;
      }

      const report = [];
      return res.status(200).json({ report });

    } catch (error) {

      console.log(error);
      return res.status(500).send(`Error: ${error.message}`);

    }

  },

  // org report (доход - Начисления)
  GetIncome: async (req, res) => {

    // processing parameters

    let { startDate, endDate, subAccName } = req.query;
    const orgId = req.user.orgId;

    if (orgId == null) {
      return res.status(400).send(`Error:no orgId`);
    }

    let subAccNameLst = subAccName ?? [];
    if (!Array.isArray(subAccNameLst)) { subAccNameLst = [subAccNameLst]; }

    if (subAccNameLst.length == 0) {
      const report = [];
      return res.status(200).json({ report });
    }

    const subaccountNames = (await SubAccount.findAll({
      where: { orgId }
    })).map(subaccount => subaccount.subAccName);

    subAccNameLst = subAccNameLst.filter((subAccName) => {
      return subaccountNames.includes(subAccName);
    });

    if (subAccNameLst.length == 0) {
      const report = [];
      return res.status(200).json({ report });
    }

    const pool = await getPool();

    // get report
    const report = await pool.getTransactionLst({ startDate, endDate, subaccountNameLst: subAccNameLst });

    report.forEach(e => {
      delete e.vsub2Sum;
      delete e.vsub1HashRate;
      delete e.vsub2HashRate;
    });

    return res.status(200).json({ report });
  },

};

const taxReportGanerateExcel = async (report, reportName) => {

  const fileName = __dirname + "/../utils/templates/tax-report.xlsx";
  const readable = fs.createReadStream(fileName);

  let workbook = new ExcelJS.Workbook();
  workbook = await workbook.xlsx.read(readable);
  const sheet = workbook.worksheets[0];

  let i = 1;
  report.forEach((row) => {
    sheet.addRow([

      // 1 № пп
      i++,

      // 2 Наименование цифрового майнера и цифрового майнингового пула
      "OOO Мидаспул",

      // 3 Бизнес идентификационный номер, индивидуальный идентификационный номер цифрового майнера и цифрового майнингового пула
      row?.organization?.bin ?? "",

      // 4 Номер лицензии на осуществление деятельности по цифровому майнингу и дата ее выдачи
      row?.organization?.licId ?? "",

      // 5 Реквизиты (адрес) цифрового электронного кошелька
      row.walletAddress,

      // 6 Дата распределения цифрового актива
      new Date(row.earningsFor),

      // 7 Наименование цифрового актива, распределенного цифровому майнеру
      row.coin,

      // 8 Количество цифрового актива, переданного цифровому майнеру, единиц
      row.vsub1,

      // 9 Комиссия цифрового майнингового пула, выраженная в цифровых активах
      row.vsub2,

      // // 9.1 наименование цифрового актива
      row.coin,

      // // 9.2 Количество, единиц
      row.vsub1 + row.vsub2,

    ]);
  });

  return { workbook, reportName };

};

const getPool = async () => {

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
  return pool;
};

const checkIsGlobal = (roleName) => {
  return (
    roleName.toLowerCase().includes("pool")
  );
};

const checkIsOrg = (roleName) => {
  return (
    roleName.toLowerCase().includes("org")
  );
};

const checkIsEarning = (roleName) => {
  return (
    roleName.toLowerCase().includes("account") ||
    roleName.toLowerCase().includes("admin")
  );
};

const getRole = async (user) => {
  const role = await Role.findOne({
    where: {
      id: user.roleId,
    },
  });
  return role;
};

// pool report (Транзакции - История выплат)
const GetTransactionsPool = async (req, res) => {

  // processing parameters

  let { startDate, endDate, orgId } = req.query;

  if (orgId == null) {
    return res.status(400).send(`Error:need param orgId`);
  }

  const subaccountNameLst = (await SubAccount.findAll({
    where: { orgId }
  })).map(subaccount => subaccount.subAccName);

  const pool = await getPool();

  // get report
  const report = await pool.getTransactionLst({ startDate, endDate, subaccountNameLst });

  return res.status(200).json({ report });

};

// org report (Транзакции - История выплат - вывод)
const GetTransactionsOrg = async (req, res) => {

  // processing parameters

  let { startDate, endDate, subAccName } = req.query;
  const orgId = req.user.orgId;

  if (orgId == null) {
    return res.status(400).send(`Error:no orgId`);
  }

  let subAccNameLst = subAccName ?? [];
  if (!Array.isArray(subAccNameLst)) { subAccNameLst = [subAccNameLst]; }

  if (subAccNameLst.length == 0) {
    const report = [];
    return res.status(200).json({ report });
  }

  const subaccountNames = (await SubAccount.findAll({
    where: { orgId }
  })).map(subaccount => subaccount.subAccName);

  subAccNameLst = subAccNameLst.filter((subAccName) => {
    return subaccountNames.includes(subAccName);
  });

  if (subAccNameLst.length == 0) {
    const report = [];
    return res.status(200).json({ report });
  }

  const pool = await getPool();

  // get report
  const report = await pool.getTransactionLst({ startDate, endDate, subaccountNameLst: subAccNameLst, isConfirmed: true });

  report.forEach(e => {
    delete e.vsub2Sum;
    delete e.vsub1HashRate;
    delete e.vsub2HashRate;
  });

  return res.status(200).json({ report });
};