'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('Organizations', 'messageDate', {
      type: Sequelize.DATE
    })
    await queryInterface.addColumn('Organizations', 'messageId', {
      type: Sequelize.STRING(45)
    })

    await queryInterface.addColumn('Organizations', 'sessionId', {
      type: Sequelize.STRING(45)
    })

    await queryInterface.addColumn('Organizations', 'kdpStatus', {
      type: Sequelize.STRING(45)
    })

    await queryInterface.changeColumn('Organizations', 'tokenEgov', {
      type: Sequelize.STRING(4000)
    })
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('Organizations', 'messageDate')
    await queryInterface.removeColumn('Organizations', 'messageId')
    await queryInterface.removeColumn('Organizations', 'sessionId')
    await queryInterface.removeColumn('Organizations', 'kdpStatus')
    await queryInterface.changeColumn('Organizations', 'tokenEgov', {
      type: Sequelize.STRING(45)
    })
  }
};
