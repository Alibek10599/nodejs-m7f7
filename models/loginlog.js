'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class LoginLog extends Model {
    static associate(models) {
        LoginLog.belongsTo(models.User, {
        as: 'user',
        foreignKey: 'userId',
        targetKey: 'id'
      });
    }
  }
  LoginLog.init({
    userId: {
      type: DataTypes.INTEGER,
      references: {
        model: 'User',
        key: 'id',
      },
      allowNull: false
    },
    ip: DataTypes.STRING,
    device: DataTypes.STRING,
    location: DataTypes.STRING,
    type: DataTypes.INTEGER
  }, {
    sequelize,
    updatedAt: false,
    modelName: 'LoginLog',
  });
  return LoginLog;
};
