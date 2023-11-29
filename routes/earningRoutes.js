const express = require('express');

const router = express.Router();
const { isAuth } = require('../middlewares/checkAuth');
const EarningController = require('../controllers/EarningController');

router.get('/', isAuth, EarningController.GetEarnings);

router.get('/payouts', isAuth, EarningController.GetPayouts);

router.get('/revenue', isAuth, EarningController.GetEstimatedRevenue);

module.exports = router;
