// serviceFactory.js

const { POOL_SELECTOR } = process.env;

const serviceMap = {
  SBI: require('../services/sbi-pool/sbi.service'),
};

function getService() {
  if (serviceMap[POOL_SELECTOR]) {
    return new serviceMap[POOL_SELECTOR]();
  } else {
    throw new Error(`Service not found for POOL_SELECTOR: ${POOL_SELECTOR}`);
  }
}

module.exports = getService;
