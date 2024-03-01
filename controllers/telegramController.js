const { TELEGRAM } = require("../utils/constants/selectors");
const notificationSelector = require("../notifications/service/notification-selector");

module.exports = {
    sendMessageToUser: async (req, res) => {
        const { tgUserId } = req.body;
        try {
            const message = await notificationSelector({ tgUserId, message: 'test message' }, TELEGRAM);

            if (!message) {
                return res.status(404).json('Telegram message delivered failed');
            }
            return res.status(200).json(message);
        } catch (error) {
            return res.status(500).send(`Error: ${error.message}`);
        }
    }
}