'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class GlobalPool extends Model {
    static associate(models) {

    }
  }
  GlobalPool.init({
    name: DataTypes.STRING,
    login: DataTypes.STRING,
    password: DataTypes.STRING,
    token: DataTypes.STRING,
    tokenExpiredDate: DataTypes.DATE,
    isActive: DataTypes.BOOLEAN,
    globalFees: DataTypes.DECIMAL,
    apiSecret: DataTypes.STRING,
    apiKey: DataTypes.STRING,
    minTreashold: DataTypes.STRING,
    typeEarnings: DataTypes.STRING,
  }, {
    sequelize,
    modelName: 'GlobalPool',
  });
  return GlobalPool;
};