'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
   await queryInterface.addColumn('Users', 'isActive2FA', {
    type: Sequelize.BOOLEAN,
    allowNull: true,
    defaultValue: false
   })
   await queryInterface.addColumn('Users', 'secret2FA', {
    type: Sequelize.STRING(20),
    allowNull: true
   })
   await queryInterface.addColumn('Users', 'iin', {
    type: Sequelize.STRING(12),
    allowNull: true
   })
  },

  async down (queryInterface, Sequelize) {
   await queryInterface.removeColumn('Users', 'isActive2FA')
   await queryInterface.removeColumn('Users', 'secret2FA')
   await queryInterface.removeColumn('Users', 'iin')
  }
};
