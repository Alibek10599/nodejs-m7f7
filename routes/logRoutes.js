const express = require('express');

const router = express.Router();
const LogController = require('../controllers/logController');
const { isAuth, isPoolTech } = require('../middlewares/checkAuth');

router.get('/', isAuth, isPoolTech, LogController.GetLogs);
router.get('/userloginhistory', isAuth, LogController.GetUserLoginHistory);

module.exports = router;
