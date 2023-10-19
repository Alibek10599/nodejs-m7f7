/* eslint-disable no-restricted-syntax */
const slugify = require('slugify');
const NotImplementedError = require('./error/not-implemented');
const AbstractController = require('./abstract-controller');
const NotAControllerError = require('./error/not-a-controller');
const Config = require('../config');

class AbstractComponent {
  constructor(name) {
    this.config = null;
    this.name = name;
  }

  /**
   * Configure component
   * @param {*} config
   */
  async configure(config) {
    this.config = new Config(config);
  }

  /**
   * Load component
   * @param {Container} container
   */
  async load(container) {
    container.debug('mount component:', this.constructor.name);

    return this;
  }

  /**
   * Assign component
   * @param {Container} container
   * @param {Express} app
   */
  async assign(container, app) {
    container.debug(
      'assign routing:',
      this.constructor.name,
      'to',
      this.config.$mountPoint || AbstractController.DEFAULT_MOUNTING_POINT,
    );

    await this.registerControllers(container, app);

    return this;
  }

  /**
   * Get controllers list
   * @abstract
   */
  get controllers() {
    throw new NotImplementedError();
  }

  /**
   * Register controllers
   * @param {Container} container
   * @param {Express} app
   */
  async registerControllers(container, app) {
    const { namespace } = this;

    for (const controller of this.controllers) {
      if (!(controller instanceof AbstractController)) {
        throw new NotAControllerError(controller.constructor.name);
      }

      controller.setNamespace(namespace);

      if (this.config.$mountPoint) {
        controller.mountPoint = this.config.$mountPoint;
      }

      try {
        controller.setDto(require(`./${ this.name }/dto`)); // eslint-disable-line
      } catch (e) {
        if (e.code !== 'MODULE_NOT_FOUND') {
          throw e;
        }
      }

      container.debug('setup controller:', controller.constructor.name);
      container.debug(`using namespace for ${ controller.constructor.name }:`, namespace);

      await controller.setup(this.config, container, app);

      container.debug('register controller:', controller.constructor.name);

      await controller.register();
    }

    return this;
  }

  /**
   * Default namespace
   */
  get namespace() {
    return slugify(this.constructor.name, {
      replacement: '_',
      lower: true,
    });
  }
}

module.exports = AbstractComponent;
