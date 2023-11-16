'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.addColumn('Users', 'tgUserId', {
      type: Sequelize.STRING(45)
    })
    await queryInterface.addColumn('Users', 'isActiveTg', {
      type: Sequelize.BOOLEAN,
      defaultValue: false
    })
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeColumn('Users', 'tgUserId')
    await queryInterface.removeColumn('Users', 'isActiveTg')
  }
};