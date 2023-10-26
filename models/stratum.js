'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Stratum extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      Stratum.hasOne(models.SubStratum, {
        foreignKey: 'stratumId', 
        as: 'stratum'
      })
    }
  }
  Stratum.init({
    strCaption: DataTypes.STRING,
    intPort: DataTypes.INTEGER,
    isActive: DataTypes.BOOLEAN
  }, {
    sequelize,
    modelName: 'Stratum',
  });
  return Stratum;
};