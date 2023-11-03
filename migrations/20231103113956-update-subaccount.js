'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.addColumn('SubAccounts', 'collectorId', {
      type: Sequelize.INTEGER,
      allowNull: true,
    });

    await queryInterface.addColumn('SubAccounts', 'vsub1Id', {
      type: Sequelize.INTEGER,
      allowNull: true,
    });

    await queryInterface.addColumn('SubAccounts', 'vsub2Id', {
      type: Sequelize.INTEGER,
      allowNull: true,
    });
   
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeColumn('SubAccounts', 'collectorId');
    await queryInterface.removeColumn('SubAccounts', 'vsub1Id');
    await queryInterface.removeColumn('SubAccounts', 'vsub2Id');
  }
};
