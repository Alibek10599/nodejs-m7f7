const Sequelize = require('sequelize');

const UNCHANGED = Symbol.for('UNCHANGED');

/**
 * @typedef {object} Dto DTO element to process
 * @typedef {Array<Dto>} ArrayDto an array with one DTO to process all elements
 * @typedef {Function} FunctionDto function or String/Number/Date/Boolean
 * @typedef {Symbol('UNCHANGED')} UnchangedDto don't modify the original data
 *
 * @param {{ [key]: Dto|ArrayDto|FunctionDto|UnchangedDto }} dto
 * @param {object} data
 *
 * @returns {object}
 */
function useDto(dto, data) {
  if (Array.isArray(data)) {
    return data.map((item) => useDto(dto, item));
  }

  const modifiedData = (data instanceof Sequelize.Model) ? data.toJSON() : data;
  const result = {};

  Object.entries(dto).forEach(([key, value]) => {
    if (modifiedData[key] === null || typeof modifiedData[key] === 'undefined') {
      result[key] = null;
    } else if (value === Date) {
      result[key] = new Date(modifiedData[key]);
    } else if (typeof value === 'object') {
      result[key] = useDto(value, modifiedData[key]);
    } else if (typeof value === 'function') {
      result[key] = value(modifiedData[key]);
    } else if (value === UNCHANGED) {
      result[key] = modifiedData[key];
    } else {
      result[key] = value;
    }
  });

  return result;
}

module.exports = { useDto, UNCHANGED };
