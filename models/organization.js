'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Organization extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      Organization.hasMany(models.SubAccount, {
        as: 'subAccounts',
        foreignKey: 'orgId',
        targetKeyId: 'id',
      }),
      Organization.hasMany(models.User, {
        as: 'users',
        foreignKey: 'orgId',
        targetKeyId: 'id'
      })
    }
  }
  Organization.init({
    name: DataTypes.STRING,
    bin: DataTypes.STRING,
    feesRate: DataTypes.DOUBLE,
    isApproved: DataTypes.BOOLEAN,
    isActive: DataTypes.BOOLEAN,
    isDeleted: DataTypes.BOOLEAN
  }, {
    sequelize,
    modelName: 'Organization',
  });
  return Organization;
};