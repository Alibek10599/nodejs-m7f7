class MissingAnnotationKeyError extends Error {
  /**
   * @param {string} key
   */
  constructor(key) {
    super(`Missing annotation value for "${ key }"`);
  }
}

module.exports = MissingAnnotationKeyError;
