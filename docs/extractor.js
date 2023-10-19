/* eslint-disable import/no-extraneous-dependencies */
const _ = require('underscore');

class Extractor {
  /**
   * Get routes from Express app/router
   * @param {Array|} routes
   */
  getRoutes(routes) {
    // Array of routers
    if (_.isArray(routes)) {
      return _.reduce(routes, (result, item) => result.concat(this.buildRoutes(item.stack)), []);

      // App default router
    } if (routes._router) {
      return this.buildRoutes(routes._router.stack);
    }

    // Single route
    return this.buildRoutes(routes.stack);
  }

  /**
   * Build routes
   * @param {Array} routes
   */
  buildRoutes(routes) {
    return _.reduce(routes, (result, item) => {
      if (item.route) {
        result.push({
          path: item.route.path,
          methods: _.keys(item.route.methods),
        });
      }

      return result;
    }, []);
  }
}

module.exports = Extractor;
