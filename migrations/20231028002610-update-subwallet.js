'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.renameColumn('SubWallets', 'accountId', 'subAccountId')
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.changeColumn('SubWallets', 'subAccountId', 'accountId')
  }
};
