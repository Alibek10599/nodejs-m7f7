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
    }
  }
  SubStratum.init({
    subAccountId: DataTypes.NUMBER,
    stratumId: DataTypes.NUMBER,
    isDeleted: DataTypes.BOOLEAN,
    isActive: DataTypes.BOOLEAN
  }, {
    sequelize,
    modelName: 'SubStratum',
  });
  return SubStratum;
};