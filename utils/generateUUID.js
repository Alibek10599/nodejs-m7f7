const uuid = require('uuid');

const generateUUID = () => {
    return uuid.v4();
};

module.exports = generateUUID