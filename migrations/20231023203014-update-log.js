'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.removeColumn('Logs', 'type')
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.addColumn('Logs', 'type', {
      type: Sequelize.STRING(45)
    })
  }
};
