'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class SubWallet extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      SubWallet.belongsTo(models.SubAccount, {
        as: 'subAccount',
        foreignKey: 'accountId',
        targetKey: 'id'
      })
      SubWallet.belongsTo(models.Wallet, {
        as: 'wallet',
        foreignKey: 'walletId',
        targetKey: 'id'
      })
    }
  }
  SubWallet.init({
    accountId: {
      type: DataTypes.INTEGER,
      references: {
        model: 'SubAccount',
        key: 'id'
      },
      allowNull: false
    },
    walletId: {
      type: DataTypes.INTEGER,
      references: {
        model: 'Wallet',
        key: 'id'
      },
      allowNull: false
    },
    isActive: DataTypes.BOOLEAN,
    isDeleted: DataTypes.BOOLEAN
  }, {
    sequelize,
    modelName: 'SubWallet',
  });
  return SubWallet;
};