'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.addColumn('Organizations', 'tokenEgov', {
      type: Sequelize.STRING(45)
    })
    await queryInterface.addColumn('Organizations', 'iinDir', {
      type: Sequelize.STRING(12)
    })
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeColumn('Organizations', 'tokenEgov')
    await queryInterface.removeColumn('Organizations', 'iinDir')
  }
};
