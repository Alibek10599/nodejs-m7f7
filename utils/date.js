const moment = require('moment-timezone');

const generateFormattedDate = () => {
    const formattedDate = moment().tz('Asia/Almaty').format('YYYY-MM-DDTHH:mm:ss.SSSZ');

    return formattedDate;
};

function has15MinutesPassed(messageDate) {
    const storedDate = moment(messageDate).tz('Asia/Almaty');

    const currentDate = moment().tz('Asia/Almaty');

    const minutesDifference = currentDate.diff(storedDate, 'minutes');

    return minutesDifference >= 15;
}

const formatDatePoolAPI = (dt) => {
    const formattedDate = moment(dt).tz('Asia/Almaty').format('YYYY-MM-DD');

    return formattedDate;
};

module.exports = {generateFormattedDate, has15MinutesPassed, formatDatePoolAPI }