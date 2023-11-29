const SBIPool = require("./sbi-pool");
const LuxorPool = require("./luxor-pool");
const PoolTypes = require("./pool-types");

class PoolFactory {
  static createPool(pool) {
    let Pool;

    switch (pool.name) {
      case PoolTypes.SBI:
        Pool = SBIPool;
        break;
      case PoolTypes.Luxor:
        Pool = LuxorPool;
        break;
    }

    if (!Pool) {
      throw new Error(`Unknown type ${type} for pool`);
    }

    return new Pool(pool);
  }
}

function isSBIPool(pool) {
  return pool.type === PoolTypes.SBI;
}

function isLuxorPool(pool) {
  return pool.type === PoolTypes.Luxor;
}

module.exports = { PoolFactory, isSBIPool, isLuxorPool };
