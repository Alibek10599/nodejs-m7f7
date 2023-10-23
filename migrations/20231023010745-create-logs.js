'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Logs', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      userId: {
        type: Sequelize.INTEGER,
        references: {
          model: 'Users',
          key: 'id'
        },
        allowNull: false,
      },
      type: {
        type: Sequelize.STRING(45)
      },
      action: {
        type: Sequelize.STRING(255)
      },
      controller: {
        type: Sequelize.STRING(45)
      },
      description: {
        type: Sequelize.TEXT
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    }, {
      charset: 'utf8mb4',
      collate: 'utf8mb4_unicode_ci',
      name: {
        singular: 'Log',
        plural: 'Logs',
      },
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Logs');
  }
};