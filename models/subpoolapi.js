'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class SubPoolApi extends Model {
    static associate(models) {
      SubPoolApi.belongsTo(models.User, {
        as: 'globalPool',
        foreignKey: 'globalPoolId',
        targetKey: 'id'
      });
      SubPoolApi.belongsTo(models.SubAccount, {
        as: 'subAccount',
        foreignKey: 'subAccountId',
        targetKey: 'id'
      });
    }
  }
  SubPoolApi.init({
    globalPoolId: {
      type: DataTypes.INTEGER,
      references: {
        model: 'GlobalPool',
        key: 'id',
      },
      allowNull: false
    },
    subAccountId: {
      type: DataTypes.INTEGER,
      references: {
        model: 'SubAccount',
        key: 'id'
      },
      allowNull: false
    },
    apiKey: DataTypes.STRING,
    apiSecret: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'SubPoolApi',
  });
  return SubPoolApi;
};