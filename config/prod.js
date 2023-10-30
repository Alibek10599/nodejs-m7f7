const localConfig = require('./local');
const winston = require('winston');
const path = require('path');

require('winston-daily-rotate-file')

delete localConfig.express.hook;

localConfig.services.logger = {
    level: 'info',
    transports: [
      new (winston.transports.Console)(),
      new (winston.transports.DailyRotateFile)({
        filename: path.join(__dirname, '../logs.'),
        datePattern: '/yyyy/MM/dd.log',
        createTree: true,
      }),
    ],
  };

module.exports = localConfig;
