'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class SubUser extends Model {
    static associate(models) {
      SubUser.belongsTo(models.User, {
        as: 'user',
        foreignKey: 'userId',
        targetKey: 'id'
      });
      SubUser.belongsTo(models.SubAccount, {
        as: 'subAccount',
        foreignKey: 'subAccountId',
        targetKey: 'id'
      });
    }
  }
  SubUser.init({
    userId: {
      type: DataTypes.INTEGER,
      references: {
        model: 'User',
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
    isActive: DataTypes.BOOLEAN,
    isDeleted: DataTypes.BOOLEAN,
  }, {
    sequelize,
    modelName: 'SubUser',
  });
  return SubUser;
};