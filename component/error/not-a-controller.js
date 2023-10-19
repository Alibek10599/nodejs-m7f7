class NotAComponentError extends Error {
  /**
   * @param {string} name
   */
  constructor(name) {
    super(`${ name } is not a controller`);
  }
}

module.exports = NotAComponentError;
