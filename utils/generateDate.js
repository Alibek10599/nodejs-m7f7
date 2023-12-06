const moment = require('moment-timezone');

const generateFormattedDate = () => {
    const formattedDate = moment().tz('Asia/Almaty').format('YYYY-MM-DDTHH:mm:ss.SSSZ');

    return formattedDate;
};

module.exports = generateFormattedDate