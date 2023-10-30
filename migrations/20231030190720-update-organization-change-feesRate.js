'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {

     await queryInterface.changeColumn('Organizations', 'feesRate', { 
        type: Sequelize.DECIMAL(5,2)
     });
     
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.changeColumn('Organizations', 'feesRate', {
      type: Sequelize.DOUBLE
    })
  }
};
