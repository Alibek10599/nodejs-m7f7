const sendMail = require("../service/sendMail");
const {Message} = require("../../../models");

module.exports = async function findAndSendUndeliveredMessages() {
    const messages = await Message.findAll({
        where: {
            isDelivered: false
        },
        attributes: ['email', 'userName', 'subject', 'template', 'url'],
        raw: true
    })

    for (const message of messages) {

        const info = !(await sendMail({
            to: message.email,
            urlOrCode: message.url,
            userName: message.userName,
            subject: message.subject,
            template: message.template
        }))

        if(info) {
            await Message.update({isDelivered: true}, {
                where: {
                    email: message.email
                }
            })
        }
    }
}