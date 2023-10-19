class NotImplementedError extends Error {
  constructor() {
    super('Method not implemented.');
  }
}

module.exports = NotImplementedError;
