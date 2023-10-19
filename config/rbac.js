const userRoles = require('../utils/constants/userRoles');


module.exports = [
  ...[
    '^/organization',
  ].map((r) => [new RegExp(r), userRoles.USER])];
