const express = require('express');

const router = express.Router();
const LogController = require('../controllers/logController');
const { isAuth } = require('../middlewares/checkAuth');

router.get('/', isAuth, LogController.GetLogs);

module.exports = router;
