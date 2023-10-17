'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('SubAccounts', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      subAccName: {
        type: Sequelize.STRING(45),
        allowNull: false
      },
      orgId: {
        type: Sequelize.INTEGER,
        references: {
          model: 'Organizations',
          key: 'id'
        },
        allowNull: false
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
        singular: 'SubAccount',
        plural: 'SubAccounts',
      },
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('SubAccounts');
  }
};