const express = require('express');

const router = express.Router();
const GlobalPoolController = require('../controllers/globalPoolController');
const { isAuth, isPoolAdmin } = require('../middlewares/checkAuth');

router.get('/', isAuth, isPoolAdmin, GlobalPoolController.GetGlobalPools);

module.exports = router;
