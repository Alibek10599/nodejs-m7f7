/* eslint-disable global-require */
const winston = require('winston');
const path = require('path');
// const mailgunTransport = require('nodemailer-mailgun-transport');
const Docs = require('../docs');
const Env = require('../env');

require('winston-daily-rotate-file');


module.exports = {
  express: {
    port: Env.readVar('EXPRESS_PORT', 3000),
    hook: {
      async beforeLoad(app, container) {
        await Docs.create()
          .setThrottleMatchers(require('./throttle'))
          .register(app, container);
      },
    },
  },
  services: {
    logger: {
      level: 'debug',
      transports: [
        new (winston.transports.Console)(),
        // new (winston.transports.DailyRotateFile)({
        //   filename: path.join(__dirname, '../logs'),
        //   datePattern: '/yyyy/MM/dd.log',
        //   createTree: true,
        // }),
      ],
    },
  },
};
