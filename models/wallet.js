'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Wallet extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      Wallet.hasMany(models.SubWallet, {
        as: 'SubWallets',
        foreignKey: 'walletId',
        targetKey: 'id'
      })
    }
  }
  Wallet.init({
    name: DataTypes.STRING,
    address: DataTypes.STRING,
    isConfirmed: DataTypes.BOOLEAN,
    isActive: DataTypes.BOOLEAN,
    isDeleted: DataTypes.BOOLEAN
  }, {
    sequelize,
    modelName: 'Wallet',
  });
  return Wallet;
};