'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Role extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      Role.hasMany(models.User, {
        foreignKey: 'id'
      })
    }
  }
  Role.init({
    roleName: DataTypes.STRING,
    isPoolAdmin: DataTypes.BOOLEAN,
    isPoolAccount: DataTypes.BOOLEAN,
    isPoolTech: DataTypes.BOOLEAN,
    isOrgAdmin: DataTypes.BOOLEAN,
    isOrgAccount: DataTypes.BOOLEAN,
    isOrgTech: DataTypes.BOOLEAN,
  }, {
    sequelize,
    modelName: 'Role',
  });
  return Role;
};