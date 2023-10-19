/* eslint-disable global-require, import/no-dynamic-require */
const path = require('path');
// eslint-disable-next-line import/no-extraneous-dependencies
const fs = require('fs-extra');
const Env = require('./env');

class Config {
  /**
   * @param {*} config
   */
  constructor(config) {
    this.config = config;

    this._inject();
  }

  /**
   * Inject configuration into the object
   */
  _inject() {
    Object.keys(this.config).forEach((key) => {
      this[`$${ key }`] = this.config[key];
    });
  }

  /**
   * Create configuration
   * @param {string} environment
   * @param {string} dir
   */
  static async create(environment, dir = Config.DEFAULT_DIR) {
    const configFile = `${ environment.toLowerCase() }.js`;
    let config = require(path.join(dir, configFile));

    const { customConfigPath } = Env;

    if (customConfigPath) {
      const customConfigFilePath = path.join(
        __dirname,
        '..',
        customConfigPath,
        configFile,
      );

      if (await fs.pathExists(customConfigFilePath)) {
        const customConfigLoader = require(customConfigFilePath);

        config = await customConfigLoader(config);
      }
    }

    return new this(config);
  }

  /**
   * Default configuration directory
   */
  static get DEFAULT_DIR() {
    return path.join(__dirname, './config');
  }
}

module.exports = Config;
