const dashCase = (str) => str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();

/**
 *
 * @example
 *    - Group31 -> group31
 *
 * @param {*} str
 * @returns
 */
const snakeCase = (str) => str.replace(/([a-z])([A-Z])/g, '$1_$2').toLowerCase();

const camelCase = (str) => str
  .replace(/\s(.)/g, ($1) => $1.toUpperCase())
  .replace(/\s/g, '')
  .replace(/^(.)/, ($1) => $1.toLowerCase());

const pascalCase = (str) => str.replace(/(\w)(\w*)/g, (_, $1, $2) => $1.toUpperCase() + $2.toLowerCase());

const truncate = (value, amount = 250) => {
  const safeString = String(value);

  if (safeString.length > amount) {
    return `${ safeString.substring(0, amount) }...`;
  }

  return safeString;
};

const hide = (text, begin, length) => {
  const subString = text.substr(begin || text.length / 3, length || text.length / 3);
  return text.replace(subString, '*'.repeat(subString.length));
};

const spacedPascalCase = (str) => str
  .replace(/^([a-z])(\w+)/, (_, $1, $2) => $1.toUpperCase() + $2)
  .replace(/([a-z])([A-Z])/g, '$1 $2');

const snakeToCamelCase = (str) => str.replace(/(_\w)/g, (m) => m[1].toUpperCase());

const camelToSnakeCase = (str) => str.replace(/[\w]([A-Z])/g, (m) => `${ m[0] }_${ m[1] }`).toLowerCase();

module.exports = {
  dashCase,
  snakeCase,
  camelCase,
  pascalCase,
  truncate,
  hide,
  spacedPascalCase,
  snakeToCamelCase,
  camelToSnakeCase,
};
