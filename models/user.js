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
      User.belongsTo(models.Organization, {
        as: 'organization',
        foreignKey: 'orgId',
        targetKey: 'id'
      })
    }
  }
  User.init({
    userName: DataTypes.STRING,
    email: DataTypes.STRING,
    iin: DataTypes.STRING,
    egovToken: DataTypes.STRING,
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
    orgId: {
      type: DataTypes.INTEGER,
      references: {
        model: 'Organization',
        key: 'id'
      }
    },
    resetPasswordToken: DataTypes.STRING,
    isActive2FA: DataTypes.BOOLEAN,
    secret2FA: DataTypes.STRING,
    iin: DataTypes.STRING
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