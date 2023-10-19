const AbstractService = require('../abstract-service');

class StratumService extends AbstractService {
  /**
     * crete sub account on global pool
     * @param{string} subAccountName
     * @returns {Object}
     */
  async createSubAccount(subAccountName) {
    console.info(`Sub account created with name: ${ subAccountName }`);
    return { isSuccess: true };
  }
}

module.exports = StratumService;
