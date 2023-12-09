const util = require('util');
const fs = require('fs');

module.exports = {
    mkdir: util.promisify(fs.mkdir),
    copyFile: util.promisify(fs.copyFile),
    writeFile: util.promisify(fs.writeFile),
    readFile: util.promisify(fs.readFile)
};
