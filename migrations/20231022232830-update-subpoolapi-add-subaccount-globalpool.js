'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.addColumn('SubPoolApis', 'subAccountId', {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: {
        model: 'SubAccounts',
        key: 'id'
      }
    })
    await queryInterface.addColumn('SubPoolApis', 'globalPoolId', {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: {
        model: 'GlobalPools',
        key: 'id'
      }
    })
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeColumn('SubPoolApis', 'subAccountId')
    await queryInterface.removeColumn('SubPoolApis', 'globalPoolId')
  }
};
