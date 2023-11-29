'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.removeColumn('Users', 'egovToken')
    await queryInterface.removeColumn('Users', 'iin')
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.addColumn('Users', 'egovToken', {
      type: Sequelize.STRING(45)
    })
    await queryInterface.addColumn('Users', 'iin', {
      type: Sequelize.STRING(12)
    })
  }
};
