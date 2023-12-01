const sendMail = require("../mail-sender/service/sendMail");

async function sendEmailMessage(options) {
    const newOptions = {
        to: options.email,
        urlOrCode: options.urlOrCode,
        userName: options.userName,
        subject: options.subject,
        template: options.template
    }

    await sendMail(newOptions);
}

module.exports = {
    sendEmailMessage
}
