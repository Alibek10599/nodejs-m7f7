'use strict';
const bcrypt = require("bcryptjs");

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    /**
     * Add seed commands here.
     *
     * Example:
     * await queryInterface.bulkInsert('People', [{
     *   name: 'John Doe',
     *   isBetaMember: false
     * }], {});
    */
    await queryInterface.bulkInsert('Users', [
      {
       userName: 'testAdmin',
       createdAt: new Date(),
       updatedAt: new Date(),
       roleId: 2,
       isConfirmed: 1,
       email: 'admin@mail.com',
       password: await bcrypt.hash('Asd12345', 8),
      },
      {
        userName: 'testUser',
        createdAt: new Date(),
        updatedAt: new Date(),
        roleId: 1,
        isConfirmed: 1,
        email: 'test@mail.com',
        password: await bcrypt.hash('Asd12345', 8),
      },
      {
        userName: 'testUser1',
        createdAt: new Date(),
        updatedAt: new Date(),
        roleId: 1,
        isConfirmed: 1,
        email: 'test1@mail.com',
        password: await bcrypt.hash('Asd12345', 8),
      },
      {
        userName: 'testUser2',
        createdAt: new Date(),
        updatedAt: new Date(),
        roleId: 1,
        isConfirmed: 1,
        email: 'test2@mail.com',
        password: await bcrypt.hash('Asd12345', 8),
      },
      {
        userName: 'testUser3',
        createdAt: new Date(),
        updatedAt: new Date(),
        roleId: 1,
        isConfirmed: 1,
        email: 'test3@mail.com',
        password: await bcrypt.hash('Asd12345', 8),
      },
      {
        userName: 'testUser4',
        createdAt: new Date(),
        updatedAt: new Date(),
        roleId: 1,
        isConfirmed: 1,
        email: 'test4@mail.com',
        password: await bcrypt.hash('Asd12345', 8),
      }
    ], {});
  },

  async down (queryInterface, Sequelize) {
    /**
     * Add commands to revert seed here.
     *
     * Example:
     * await queryInterface.bulkDelete('People', null, {});
     */
    await queryInterface.bulkDelete('Users', null, {});
  }
};
