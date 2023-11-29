const sendMail = require("../sendMail");
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

        const info = !(await sendMail(message.email,message.url,message.userName,message.subject,message.template,))

        if(info) {
            await Message.update({isDelivered: true}, {
                where: {
                    email: message.email
                }
            })
        }
    }
}