/* eslint-disable no-restricted-syntax, import/no-dynamic-require, global-require */
const AbstractService = require('./abstract-service');
const NotAServiceError = require('./error/not-a-service');

const { dashCase } = require('../utils/string');

class Factory {
  /**
   * Loads services from container
   * @param {Container} container
   * @param {boolean} register
   */
  static async fromContainer(container) {
    const config = container.$config.$services || {};

    const services = await this.fromConfig(config);

    return services;
  }

  /**
   * Creates services from config
   * @param {*} config
   */
  static async fromConfig(config) {
    const services = [];

    for (const name in config) {
      const service = this.create(name);

      await service.configure(config[name]);

      services.push(service);
    }

    return services;
  }

  /**
   * Load services
   * @param {AbstractService[]} services
   * @param {Container} container
   */
  static async register(services, container) {
    for (const service of services) {
      await service.register(container);
    }
  }

  /**
   * Load services
   * @param {AbstractService[]} services
   */
  static async afterRegistration(services) {
    for (const service of services) {
      await service.afterRegistration();
    }
  }

  /**
   * Create service instance
   * @param {string} name
   */
  static create(name) {
    const Service = require(`./${ dashCase(name) }/${ dashCase(name) }`);
    const service = new Service();

    if (!(service instanceof AbstractService)) {
      throw new NotAServiceError(name);
    }

    return service;
  }
}

module.exports = Factory;
