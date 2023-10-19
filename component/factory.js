/* eslint-disable no-restricted-syntax, import/no-dynamic-require, global-require */
const AbstractComponent = require('./abstract-component');
const NotAComponentError = require('./error/not-a-component');

class Factory {
  /**
   * Creates components from container
   * @param {Container} container
   * @param {boolean} register
   */
  static async fromContainer(container, register = true, prop = Factory.COMPONENT) {
    const config = container.$config.$components || {};

    const components = await this.fromConfig(config);

    if (register) {
      const names = Object.keys(config);
      const registry = {};

      for (const i in components) {
        registry[names[i]] = components[i];
      }

      container.setProperty(prop, registry);
    }

    return components;
  }

  /**
   * Creates components from config
   * @param {*} config
   */
  static async fromConfig(config) {
    const components = [];

    for (const name in config) {
      const component = this.create(name);

      await component.configure(config[name]);

      components.push(component);
    }

    return components;
  }

  /**
   * Load components
   * @param {AbstractComponent[]} components
   * @param {Container} container
   * @param {Express} app
   */
  static async load(components, container, app) {
    for (const component of components) {
      await component.load(container, app);
    }

    return app;
  }

  /**
   * Assign components
   * @param {AbstractComponent[]} components
   * @param {Container} container
   * @param {Express} app
   */
  static async assign(components, container, app) {
    for (const component of components) {
      await component.assign(container, app);
    }

    return app;
  }

  /**
   * Create component instance
   * @param {string} name
   */
  static create(name) {
    const Component = require(`./${ name }/${ name }`);
    const component = new Component(name);

    if (!(component instanceof AbstractComponent)) {
      throw new NotAComponentError(name);
    }

    return component;
  }

  /**
   * Key components are stored in container
   */
  static get COMPONENT() {
    return 'component';
  }
}

module.exports = Factory;
