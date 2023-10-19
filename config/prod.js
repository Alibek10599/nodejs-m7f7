const localConfig = require('./local');

delete localConfig.express.hook;

module.exports = localConfig;
