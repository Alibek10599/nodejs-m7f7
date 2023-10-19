/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable no-restricted-syntax, no-shadow, global-require */
const fs = require('fs');
const path = require('path');
const HttpStatus = require('http-status-codes');
const Twig = require('twig');
const Extractor = require('./extractor');

class Docs {
  /**
   * @param {*} metadata
   */
  constructor(metadata) {
    this.metadata = metadata;
    this.extractor = new Extractor();
    this.validationSchemas = {};
    this.trottleMatchers = [];
  }

  /**
   * Set throttle matchers
   * @param {Array} matchers
   */
  setThrottleMatchers(matchers) {
    this.trottleMatchers = matchers;

    return this;
  }

  /**
   * Set validation schema for a route
   * @param {string} route
   * @param {string} method
   * @param {*} schema
   */
  setVaidationSchema(route, method, schema) {
    this.validationSchemas[route] = this.validationSchemas[route] || {};
    this.validationSchemas[route][method.toUpperCase()] = schema;

    return this;
  }

  /**
   * Get route params from validation schema
   * @param {*} route
   */
  getRouteParams(route) {
    const params = {};

    for (let method of route.methods) {
      method = method.toUpperCase();
      params[method] = [];

      if (this.validationSchemas[route.path]
        && this.validationSchemas[route.path][method]) {
        const schema = this.validationSchemas[route.path][method];

        for (const name of Object.keys(schema)) {
          const isOptional = schema[name].optional || false;

          params[method].push({ name, isOptional });
        }
      }
    }

    return params;
  }

  /**
   * Registers docs
   * @param {Express} app
   * @param {Container} container
   */
  async register(app, container) {
    container.registerService(Docs.SERVICE, this);

    return this.mount(app, container);
  }

  /**
   * Mount docs endpoint
   * @param {Express} app
   * @param {Container} container
   */
  async mount(app, container) {
    app.get(Docs.ROUTE, async (req, res) => {
      this.metadata.baseUrl = `${ req.protocol }://${ req.hostname }:${
        container.$config.$express.port }`;

      try {
        const content = await this.generate(app, container);

        res.status(HttpStatus.OK).send(content);
      } catch (error) {
        res.status(HttpStatus.INTERNAL_SERVER_ERROR)
          .send(error.toString());
      }
    });

    return this;
  }

  /**
   * Generate API docs
   * @param {Express} app
   * @param {Container} container
   */
  async generate(app, container) {
    const { metadata } = this;
    const routes = this.normalizeRoutes(
      container,
      this.extractor.getRoutes(app),
    );
    let events = null;

    if (container.event) {
      events = container.event.registeredEvents;
    }

    return Twig.compile(
      Docs.TEMPLATE,
      { settings: { 'twig options': {} } },
    )({ routes, events, metadata });
  }

  /**
   * Normalize routes
   * @param {Container} container
   * @param {Array} routes
   */
  normalizeRoutes(container, routes) {
    // const identity = container[require('../component/identity/identity').SERVICE];
    const normalizedRoutes = [];

    for (const route of routes) {
      const { path, methods } = route;
      const params = this.getRouteParams(route);
      // const isSecured = identity ? identity.isEndpointSecured(path) : false;
      // const allowed = (identity && isSecured)
      //   ? identity.minAllowedRole(identity.rolesAllowed(path))
      //   : null;
      const throttle = this.getThrottleSettings(path);

      for (const method of methods) {
        normalizedRoutes.push({
          path,
          method,
          // isSecured,
          // allowed,
          throttle,
          params: params[method.toUpperCase()],
        });
      }
    }

    return normalizedRoutes;
  }

  /**
   * Get throttle settings
   * @param {string} route
   */
  getThrottleSettings(route) {
    for (const matcher of this.trottleMatchers) {
      const [criteria, settings] = matcher;
      const isMatched = this._matchRoute(criteria, route);

      if (isMatched) {
        return settings;
      }
    }

    return null;
  }

  /**
   * Match gives route
   * @param {*} matcher
   * @param {string} route
   */
  _matchRoute(matcher, route) {
    if (!matcher) {
      return false;
    } if (typeof matcher === 'string') {
      return matcher === route;
    } if (matcher instanceof RegExp) {
      return matcher.test(route);
    } if (Array.isArray(matcher) && matcher.length >= 2) {
      return this._matchRoute(matcher[0], route);
    }

    return false;
  }

  /**
   * Creates an instance of Docs
   */
  static create() {
    const metadata = require('../package.json');

    return new this(metadata);
  }

  /**
   * Docs template
   */
  static get TEMPLATE() {
    return fs.readFileSync(path.join(
      __dirname,
      './assets/index.twig',
    )).toString();
  }

  /**
   * Docs service
   */
  static get SERVICE() {
    return 'docs';
  }

  /**
   * Docs route endpoint
   */
  static get ROUTE() {
    return '/docs';
  }
}

module.exports = Docs;
