'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      User.belongsTo(models.Role, { foreignKey: 'roleId' });
    }
  }
  User.init({
    userName: DataTypes.STRING,
    hash: DataTypes.STRING,
    email: DataTypes.STRING,
    isConfirmed: DataTypes.BOOLEAN,
    isActive: DataTypes.BOOLEAN,
    isDeleted: DataTypes.BOOLEAN,
    password: DataTypes.STRING,
    roleId: {
      type: DataTypes.INTEGER,
      references: {
        model: 'Role',
        key: 'id',
      },
    },
    orgId: DataTypes.NUMBER,
    resetPasswordToken: DataTypes.STRING,
  }, {
    sequelize,
    modelName: 'User',
  });

  User.prototype.toJSON = function toJSON() {
    const values = Object.assign({}, this.get());

    delete values.password;

    return values;
  };

  return User;
};