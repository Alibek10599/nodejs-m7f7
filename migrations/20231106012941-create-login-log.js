'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('LoginLogs', {
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
      ip: {
        type: Sequelize.STRING(45)
      },
      device: {
        type: Sequelize.STRING(45)
      },
      location: {
        type: Sequelize.STRING(45)
      },
      type: {
        type: Sequelize.INTEGER
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    }, {
      charset: 'utf8mb4',
      collate: 'utf8mb4_unicode_ci',
      name: {
        singular: 'LoginLog',
        plural: 'LoginLogs',
      },
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable('LoginLogs');
  }
};
