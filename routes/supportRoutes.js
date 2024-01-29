const express = require('express');
const {appendUser} = require('../middlewares/checkAuth');

const router = express.Router();
const SupportController = require('../controllers/SupportController');

router.post('/ticket', appendUser, SupportController.SendMail);

module.exports = router;
