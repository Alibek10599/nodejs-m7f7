const { sendEmailMessage } = require('./email-message-options')
const sendTelegramNotification = require("../telegram-bot/service/telegram-notifications");
async function chooseSelector(options, type) {
    switch (type) {
        case 'telegram':
            return sendTelegramNotification(options);
        case 'email':
            return sendEmailMessage(options);
        default:
            const telegramPromise = sendTelegramNotification(options);
            const emailPromise = sendEmailMessage(options);

            await Promise.all([telegramPromise, emailPromise]);
    }
}

module.exports.notificationSelector = chooseSelector