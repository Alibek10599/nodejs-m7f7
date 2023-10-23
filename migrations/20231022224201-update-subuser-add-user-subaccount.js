'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.addColumn('SubUsers', 'userId', {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id'
      }
    })
    await queryInterface.addColumn('SubUsers', 'subAccountId', {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: {
        model: 'SubAccounts',
        key: 'id'
      }
    })
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeColumn('SubUsers', 'userId')
    await queryInterface.removeColumn('SubUsers', 'subAccountId')
  }
};
