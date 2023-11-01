const { GlobalPool } = require('../models');
const { POOL_SELECTOR } = process.env;

const serviceMap = {
  SBI: require('../services/sbi-pool/sbi.service'),
};

async function getService() {
  const globalPool = await GlobalPool.findOne({
    where: {
      isActive: true
    },
    order: [
      ['id', 'DESC'],
    ]
  })
  if (serviceMap[globalPool.name]) {
    const service = new serviceMap[POOL_SELECTOR]();
    return { service, globalPool };
  } else {
    throw new Error(`Service not found for POOL_SELECTOR: ${POOL_SELECTOR}`);
  }
}

module.exports = getService;
