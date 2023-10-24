'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Log extends Model {
    static associate(models) {
      Log.belongsTo(models.User, {
        as: 'user',
        foreignKey: 'userId',
        targetKey: 'id'
      });
    }
  }
  Log.init({
    userId: {
      type: DataTypes.INTEGER,
      references: {
        model: 'User',
        key: 'id',
      },
      allowNull: false
    },
    action: DataTypes.STRING,
    controller: DataTypes.STRING,
    description: DataTypes.TEXT
  }, {
    sequelize,
    updatedAt: false,
    modelName: 'Log',
  });
  return Log;
};