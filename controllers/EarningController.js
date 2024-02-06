const { Op } = require("sequelize")
const { GlobalPool, SubAccount } = require("../models")
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
      // const result = earnings.filter((earning) => {
      //   return subAccounts.some((subAccount) => subAccount.subAccName === earning.subaccountName)
      // })

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

  GetTaxReport: async (req, res) => {
    try {

      // get pool
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

      // processing parameters

      const {month, year, isExcel} = req.query;

      let startDate = new Date(`${year}-${month}-01T00:00:00+00:00`);
      let endDate = new Date(
        new Date(startDate).setMonth(startDate.getMonth() + 1)
      );

      // get report
      const report = await pool.getTaxReport(startDate, endDate);

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

      return res.status(200).json({report});

    } catch (error) {
      console.log(error);
      return res.status(500).send(`Error: ${error.message}`);
    }
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

  return {workbook, reportName};

}