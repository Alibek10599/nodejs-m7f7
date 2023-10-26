'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('SubStratum', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      subAccountId: {
        type: Sequelize.INTEGER,
        references: {
          model: 'SubAccounts',
          key: 'id'
        },
        allowNull: false
      },
      stratumId: {
        type: Sequelize.INTEGER,
        references: {
          model: 'Stratum',
          key: 'id'
        }
      },
      isDeleted: {
        type: Sequelize.BOOLEAN
      },
      isActive: {
        type: Sequelize.BOOLEAN
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('SubStratum');
  }
};