const express = require('express');
const TelegramController = require("../controllers/telegramController");

const router = express.Router();

router.post('/telegram', TelegramController.sendMessageToUser);

module.exports = router;