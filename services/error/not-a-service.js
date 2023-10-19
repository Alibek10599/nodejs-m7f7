class NotAServiceError extends Error {
  /**
   * @param {string} name
   */
  constructor(name) {
    super(`${ name } is not a service`);
  }
}

module.exports = NotAServiceError;
