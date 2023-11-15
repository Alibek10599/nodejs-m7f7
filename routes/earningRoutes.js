const express = require('express');

const router = express.Router();
const { isAuth } = require('../middlewares/checkAuth');
const EarningController = require('../controllers/EarningController');

router.get('/', isAuth, EarningController.GetPayouts);

module.exports = router;
