const util = require('node:util');

const slugify = require('slugify');
const Config = require('../config');
const NotImplementedError = require('./error/not-implemented');

class AbstractService {
  constructor() {
    this.config = null;
    this.container = null;

    // add the ability to call async methods with cache
    Object
      .getOwnPropertyNames(this.constructor.prototype)
      .filter((property) => {
        const descriptor = Object.getOwnPropertyDescriptor(this.constructor.prototype, property);

        return !descriptor.get && !descriptor.set && util.types.isAsyncFunction(this[property]);
      })
      .forEach((method) => {
        this[method].withCache = (ttl = 60, alwaysUseCache = false, ignored = []) => (
          this.container.cache.decorate(this[method].bind(this), {
            key: `service.${ this.constructor.name }.${ method }`,
            alwaysUseCache,
            ignored,
            ttl,
          })
        );
      });
  }

  get name() {
    return slugify(this.constructor.name, {
      replacement: '_',
      lower: true,
    });
  }

  /**
   * Configure component
   * @param {*} config
   */
  async configure(config) {
    this.config = new Config(config);
  }

  /**
   * Trigger an event
   * @param {string} name
   * @param {*} value
   * @todo think on abstracting this
   */
  event(name, value = null) {
    if (this.container && this.container.event) {
      this.container.event
        .bus(this.name)
        .emitAsync(name, value);
    }

    return this;
  }

  /**
   * Load service
   * @param {Container} container
   */
  async register(container) {
    this.container = container;

    const service = await this.create(container);

    container.registerService(this.name, service);

    return this;
  }

  /**
   * After all services registered service
   */
  async afterRegistration() {
    return this;
  }

  /**
   * Create service instance
   * @abstract
   */
  async create() {
    throw new NotImplementedError();
  }
}

module.exports = AbstractService;
