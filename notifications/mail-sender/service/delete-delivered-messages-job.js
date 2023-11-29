const {Message} = require("../../../models");

module.exports = async function deleteDeliveredMessages() {
    await Message.destroy({where: {isDelivered: true}})
}