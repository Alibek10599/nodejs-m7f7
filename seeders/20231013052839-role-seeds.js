'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up (queryInterface, Sequelize) {
        await queryInterface.bulkInsert('Roles', [
            {
                roleName: 'OrgAdmin',
                createdAt: new Date(),
                updatedAt: new Date(),
                isPoolAdmin: true,
            },
            {
                roleName: 'PoolAdmin',
                createdAt: new Date(),
                updatedAt: new Date(),
                isOrgAdmin: true,
            }
        ], {});
    },

    async down (queryInterface, Sequelize) {
        await queryInterface.bulkDelete('Roles', null, {});
    }
};
