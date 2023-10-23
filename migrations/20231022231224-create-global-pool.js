'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('GlobalPools', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      name: {
        type: Sequelize.STRING(45)
      },
      login: {
        type: Sequelize.STRING(45)
      },
      password: {
        type: Sequelize.STRING(45)
      },
      token: {
        type: Sequelize.STRING(45)
      },
      isActive: {
        type: Sequelize.BOOLEAN
      },
      tokenExpiredDate: {
        type: Sequelize.DATE
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    }, {
      charset: 'utf8mb4',
      collate: 'utf8mb4_unicode_ci',
      name: {
        singular: 'GlobalPool',
        plural: 'GlobalPools',
      },
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('GlobalPools');
  }
};