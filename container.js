const Config = require('./config');
const Env = require('./env');

class Container {
  constructor() {
    this.services = {};
    this.properties = {};
  }

  /**
   * Get service
   * @param {string} name
   */
  service(name) {
    return this.service[name] || null;
  }

  /**
   * Get property
   * @param {string} name
   */
  property(name) {
    return this.properties[name];
  }

  /**
   * Register new service
   * @param {string} name
   * @param {*} value
   */
  registerService(name, value) {
    this.service[name] = value;
    this[`${ name }`] = value;

    return this;
  }

  /**
   * Add new property
   * @param {string} name
   * @param {*} value
   */
  setProperty(name, value) {
    this.properties[name] = value;
    this[`$${ name }`] = value;

    return this;
  }

  /**
   * Create container
   */
  static async create() {
    const container = new this();
    const config = await Config.create(Env.environment());

    container.setProperty(this.CONFIG, config);

    return container;
  }

  /**
   * Default configuration key
   */
  static get CONFIG() {
    return 'config';
  }
}

module.exports = Container;
