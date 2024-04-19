'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert('GlobalPools', [
      {
        name: 'demoSbiPool',
        login: 'kairhat@gmail.com',
        password: '',
        token: '',
        isActive: true,
        apiSecret: '',
        apiKey: '',
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    ], {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('GlobalPools', null, {});
  }
};
