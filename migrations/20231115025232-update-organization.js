'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.addColumn('Organizations', 'licId', {
      type: Sequelize.STRING(45)
    })
    await queryInterface.addColumn('Organizations', 'licDate', {
      type: Sequelize.DATE
    })
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeColumn('Organizations', 'licId')
    await queryInterface.removeColumn('Organizations', 'licDate')
  }
};
