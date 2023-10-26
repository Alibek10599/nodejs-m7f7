'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class SubStratum extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      SubStratum.belongsTo(models.Stratum, {
        as: 'stratumId',
        foreignKey: 'stratumId',
        targetKey: 'id'
      })
      SubStratum.belongsTo(models.SubAccount, {
        as: 'subAccount',
        foreignKey: 'subAccountId',
        targetKey: 'id'
      })
    }
  }
  SubStratum.init({
    subAccountId: DataTypes.INTEGER,
    stratumId: DataTypes.INTEGER,
    isDeleted: DataTypes.BOOLEAN,
    isActive: DataTypes.BOOLEAN
  }, {
    sequelize,
    modelName: 'SubStratum',
  });
  return SubStratum;
};