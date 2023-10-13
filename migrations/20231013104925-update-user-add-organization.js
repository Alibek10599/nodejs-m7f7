'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.changeColumn('Users', 'orgId', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'Organizations',
        key: 'id'
      }
    })
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.changeColumn('Users', 'orgId', {
      type: Sequelize.INTEGER
    })
  }
};
