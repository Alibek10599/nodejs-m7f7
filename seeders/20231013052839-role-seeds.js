'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up (queryInterface, Sequelize) {
        await queryInterface.bulkInsert('Roles', [
            {
                roleName: 'PoolAdmin',
                createdAt: new Date(),
                updatedAt: new Date(),
                isPoolAdmin: true,
            },
            {
                roleName: 'OrgAdmin',
                createdAt: new Date(),
                updatedAt: new Date(),
                isOrgAdmin: true,
            },
            {
                roleName: 'OrgAccount',
                createdAt: new Date(),
                updatedAt: new Date(),
                isOrgAccount: true,
            },
            {
                roleName: 'OrgTech',
                createdAt: new Date(),
                updatedAt: new Date(),
                isOrgTech: true,
            },
            {
                roleName: 'PoolAccount',
                createdAt: new Date(),
                updatedAt: new Date(),
                isPoolAccount: true,
            },
            {
                roleName: 'PoolTech',
                createdAt: new Date(),
                updatedAt: new Date(),
                isPoolTech: true,
            }
        ], {});
    },

    async down (queryInterface, Sequelize) {
        await queryInterface.bulkDelete('Roles', null, {});
    }
};
