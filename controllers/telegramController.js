const sendMessage = require("../notifications/telegram-bot/service/telegram-notifications");

module.exports = {
    sendMessageToUser: async (req, res) => {
        const { tgUserId } = req.body;
        try {
            const message = await sendMessage(tgUserId, 'test message');

            if (!message) {
                return res.status(404).json('Telegram message delivered failed');
            }
            return res.status(200).json(message);
        } catch (error) {
            return res.status(500).send(`Error: ${ error.message }`);
        }
    }
}