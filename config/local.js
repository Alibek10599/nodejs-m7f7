/* eslint-disable global-require */
// const winston = require('winston');
// const path = require('path');
// const mailgunTransport = require('nodemailer-mailgun-transport');
const Docs = require('../docs');
const Env = require('../env');

// require('winston-daily-rotate-file');


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
};
