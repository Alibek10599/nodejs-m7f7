const express = require('express');

const router = express.Router();
const LogController = require('../controllers/logController');
const { isAuth, isPoolAdmin } = require('../middlewares/checkAuth');

router.get('/', isAuth, isPoolAdmin, LogController.GetLogs);
router.get('/userloginhistory', isAuth, LogController.GetUserLoginHistory);

module.exports = router;
