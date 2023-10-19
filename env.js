require('dotenv').config();

class Env {
  /**
   * Custom configuration path
   */
  static get customConfigPath() {
    return this.readVar('config');
  }

  /**
   * Check for local environment
   */
  static isLocal() {
    return this.environment() === this.LOCAL_ENVIRONMENT;
  }

  /**
   * Check for production environment
   */
  static isProduction() {
    return this.environment() === this.PROD_ENVIRONMENT;
  }

  /**
   * Read current environment name
   */
  static environment() {
    return this.readVar(this.ENVIRONMENT, this.LOCAL_ENVIRONMENT);
  }

  /**
   * Read env var
   * @param {string} name
   * @param {*} defaultValue
   */
  static readVar(name, defaultValue = null) {
    return this.hasVar(name) ? process.env[this.envKey(name)] : defaultValue;
  }

  /**
   * Check if env var exists
   * @param {string} name
   */
  static hasVar(name) {
    return process.env[this.envKey(name)] !== undefined;
  }

  /**
   * Real environment key
   * @param {string} name
   */
  static envKey(name) {
    return `MD_${ name.toUpperCase() }`;
  }

  /**
   * Environment var key
   */
  static get ENVIRONMENT() {
    return 'env';
  }

  /**
   * Local environment
   */
  static get LOCAL_ENVIRONMENT() {
    return 'local';
  }

  /**
   * Production environment
   */
  static get PROD_ENVIRONMENT() {
    return 'prod';
  }
}

module.exports = Env;
