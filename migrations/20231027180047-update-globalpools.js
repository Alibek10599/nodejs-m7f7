'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.addColumn('GlobalPools', 'globalFees', {
      type: Sequelize.DECIMAL(5, 2),
      allowNull: true
     })
     await queryInterface.addColumn('GlobalPools', 'apiSecret', {
      type: Sequelize.STRING(45),
      allowNull: true
     })
     await queryInterface.addColumn('GlobalPools', 'apiKey', {
      type: Sequelize.STRING(45),
      allowNull: true
     })
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeColumn('GlobalPools', 'globalFees')
    await queryInterface.removeColumn('GlobalPools', 'apiSecret')
    await queryInterface.removeColumn('GlobalPools', 'apiKey')
  }
};
