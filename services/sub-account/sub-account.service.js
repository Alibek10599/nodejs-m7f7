const AbstractService = require('../abstract-service');

class SubAccountService extends AbstractService {

    async create(){
        return this;
    }
}

module.exports = SubAccountService;
