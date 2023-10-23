'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('SubPoolApis', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      apiKey: {
        type: Sequelize.STRING(45)
      },
      apiSecret: {
        type: Sequelize.STRING(45)
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
        singular: 'SubPoolApi',
        plural: 'SubPoolApis',
      },
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('SubPoolApis');
  }
};