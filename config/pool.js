const { GlobalPool } = require('../models');

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
    const service = new serviceMap[globalPool.name]();
    return { service, globalPool };
  } else {
    throw new Error(`Service not found for global pool: ${globalPool.name}`);
  }
}

module.exports = getService;
