'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('GlobalPools', 'minTreashold', {
      type: Sequelize.STRING(45),
      allowNull: true
    })

    await queryInterface.addColumn('GlobalPools', 'typeEarnings', {
      type: Sequelize.STRING(45),
      allowNull: true
    })
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('GlobalPools', 'minTreashold')
    await queryInterface.removeColumn('GlobalPools', 'typeEarnings')
  }
};
