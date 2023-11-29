'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.addColumn('Users', 'tgUserId', {
      type: Sequelize.STRING(45),
      defaultValue: null
    })
    await queryInterface.addColumn('Users', 'isActiveTg', {
      type: Sequelize.BOOLEAN,
      defaultValue: false
    })
    await queryInterface.addColumn('Users', 'expirationDate', {
      type: Sequelize.STRING,
      defaultValue: false
    })
    await queryInterface.addColumn('Users', 'confirmationCode', {
      type: Sequelize.INTEGER,
      defaultValue: false
    })
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeColumn('Users', 'tgUserId')
    await queryInterface.removeColumn('Users', 'isActiveTg')
    await queryInterface.removeColumn('Users', 'expirationDate')
    await queryInterface.removeColumn('Users', 'confirmationCode')
  }
};
