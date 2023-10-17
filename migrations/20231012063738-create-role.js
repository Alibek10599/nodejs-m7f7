'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Roles', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      roleName: {
        type: Sequelize.STRING(45)
      },
      isPoolAdmin: {
        type: Sequelize.BOOLEAN
      },
      isPoolAccount: {
        type: Sequelize.BOOLEAN
      },
      isPoolTech: {
        type: Sequelize.BOOLEAN
      },
      isOrgAdmin: {
        type: Sequelize.BOOLEAN
      },
      isOrgAccount: {
        type: Sequelize.BOOLEAN
      },
      isOrgTech: {
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
    }, {
      charset: 'utf8mb4',
      collate: 'utf8mb4_unicode_ci',
      name: {
        singular: 'Role',
        plural: 'Roles',
      },
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Roles');
  }
};