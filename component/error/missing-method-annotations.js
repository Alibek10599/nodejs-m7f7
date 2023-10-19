class MissingMethodAnnotationsError extends Error {
  /**
   * @param {string} method
   */
  constructor(method) {
    super(`Missing annotations for method "${ method }"`);
  }
}

module.exports = MissingMethodAnnotationsError;
