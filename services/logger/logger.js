const winston = require('winston');
const AbstractService = require('../abstract-service');

class Logger extends AbstractService {
  /**
   * @inheritDoc
   */
  async create() {
    return new winston.Logger(this.config.config);
  }
}

module.exports = Logger;
