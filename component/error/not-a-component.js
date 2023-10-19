class NotAComponentError extends Error {
  /**
   * @param {string} name
   */
  constructor(name) {
    super(`${ name } is not a component`);
  }
}

module.exports = NotAComponentError;
