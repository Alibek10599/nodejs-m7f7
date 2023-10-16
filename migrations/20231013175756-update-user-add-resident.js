'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
   await queryInterface.addColumn('Users', 'twoFAEnabled', {
    type: Sequelize.BOOLEAN,
    allowNull: true,
    defaultValue: false
   })
   await queryInterface.addColumn('Users', 'twoFASecret', {
    type: Sequelize.STRING,
    allowNull: true
   })
   await queryInterface.addColumn('Users', 'isResident', {
    type: Sequelize.BOOLEAN,
    allowNull: true
   })
   await queryInterface.addColumn('Users', 'IIN', {
    type: Sequelize.STRING,
    allowNull: true
   })
  },

  async down (queryInterface, Sequelize) {
   await queryInterface.removeColumn('Users', 'twoFAEnabled')
   await queryInterface.removeColumn('Users', 'twoFASecret')
   await queryInterface.removeColumn('Users', 'isResident')
   await queryInterface.removeColumn('Users', 'IIN')
  }
};
