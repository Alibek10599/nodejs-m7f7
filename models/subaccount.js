'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class SubAccount extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      SubAccount.belongsTo(models.Organization, {
        targetKey: 'id',
        foreignKey: 'orgId',
        as: 'organization'
      }),
      SubAccount.hasMany(models.SubWallet, {
        as: 'subWallets',
        foreignKey: 'walletId',
        targetKey: 'id'
      }),
      SubAccount.hasOne(models.SubStratum, {
        foreignKey: 'stratumId',
        as: 'stratum',
        sourceKey: 'id'
      })
    }
  }
  SubAccount.init({
    subAccName: DataTypes.STRING,
    orgId: {
      type:DataTypes.INTEGER,
      references: {
        model: 'Organization',
        key: 'id'
      },
      allowNull: false
    },
    collectorId: {
      type:DataTypes.INTEGER,
      allowNull: true,
    },
    vsub1Id:{
      type:DataTypes.INTEGER,
      allowNull: true,
    },
    vsub2Id:{
      type:DataTypes.INTEGER,
      allowNull: true,
    },
    luxorId:{
      type: DataTypes.STRING,
      allowNull: true,
    }
  }, {
    sequelize,
    modelName: 'SubAccount',
  });
  return SubAccount;
};