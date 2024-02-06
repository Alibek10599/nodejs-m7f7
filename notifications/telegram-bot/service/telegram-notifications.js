const { bot } = require("../config/telegram-config");
const {
    greetingsMessage,
    helpMessageCommand,
    sendVerifiedCode,
    completeVerificationMessage,
} = require("../../templates/telegram-templates");
const matchUserMessage = require("../../../validators/emailRegexpMatch");
const generateCode = require("../../../utils/generate-code");
const timeToMs = require("../../../utils/time-utils");
const { User } = require("../../../models");
const { isInt } = require("validator");
const { EMAIL } = require("../../../utils/constants/selectors");
const selectNotifyService = require("../../service/notification-selector");

bot.on('text', async msg => {
    if (msg.text === '/start') {
        await bot.sendMessage(msg.chat.id, greetingsMessage).catch((error) => {
            console.log(error.code);  // => 'ETELEGRAM'
            console.log(error.response.body); // => { ok: false, error_code: 400, description: 'Bad Request: chat not found' }
        });

    } else if (msg.text === '/help') {
        await bot.sendMessage(msg.chat.id, helpMessageCommand).catch((error) => {
            console.log(error.code);
            console.log(error.response.body);
        });

    } else if (msg.text.length === 6 && isInt(msg.text)) {
        await validateConfirmationCode(msg)

        await bot.sendMessage(msg.chat.id, completeVerificationMessage).catch((error) => {
            console.log(error.code);
            console.log(error.response.body);
        });

    } else {
        if (!matchUserMessage(msg.text).isValid) {
            await bot.sendMessage(msg.chat.id, sendVerifiedCode).catch((error) => {
                console.log(error.code);
                console.log(error.response.body);
            });
        }
        await findUserByEmail(msg)

        await bot.sendMessage(msg.chat.id, sendVerifiedCode).catch((error) => {
            console.log(error.code);
            console.log(error.response.body);
        });
    }
})

async function sendTelegramNotification(options) {
    try {
        const user = await User.findOne({
            where: {
                id: options.userId
            }
        })

        return bot.sendMessage(user.tgUserId, options.message);
    } catch (error) {
        console.error('Failed to send message:', error);
    }
}

async function findUserByEmail(message) {
    const user = await User.findOne({
        where: {
            email: message.text,
        },
    });
    if (!user) {
        return false
    }
    try {
        const confirmationCode = generateCode()

        const expirationDate = new Date(
            +new Date().getTime() + timeToMs(process.env.LIFE_TIME_IN_MINUTE, 'minute'),
        ).getTime();

        await User.update({ tgUserId: message.from.id, confirmationCode, expirationDate }, {
            where: {
                email: user.email,
            },
        });

        await selectNotifyService.notificationSelector({
            email: user.email,
            urlOrCode: confirmationCode,
            userName: user.userName,
            subject: 'Confirmation code',
            template: 'confirmationcode'
        }, EMAIL)

        return true

    } catch (error) {
        console.error('Failed to send message:', error);
        return false
    }
}

async function validateConfirmationCode(message) {
    const user = await User.findOne({
        where: {
            tgUserId: message.from.id,
            confirmationCode: message.text,
        },
    });

    if (!user || user.expirationDate < new Date().getTime()) {
        return false
    } else {
        return User.update({ isActiveTg: true }, {
            where: {
                tgUserId: message.from.id,
            },
        });
    }

}

module.exports = sendTelegramNotification