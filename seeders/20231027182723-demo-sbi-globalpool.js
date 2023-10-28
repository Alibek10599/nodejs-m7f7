'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.bulkInsert('GlobalPools', [
      {
        name: 'demoSbiPool',
        login: 'mailto:kairhat@gmail.com',
        password: '2KCj68JCAjHrpb@',
        token: '',
        isActive: true,
        apiSecret: 'vMLY98aCqSBh2gWVo9YL5SIvoQV3HFAd',
        apiKey: 'c6f4c463-3daa-4b1e-95e3-b5eda7890a8d',
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    ], {});
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.bulkDelete('GlobalPools', null, {});
  }
};
