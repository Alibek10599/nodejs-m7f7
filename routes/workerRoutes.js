const express = require('express');

const router = express.Router();
const { isAuth } = require('../middlewares/checkAuth');
const workerController = require('../controllers/workerController');

router.get('/getworkers', isAuth, workerController.GetWorkers);

module.exports = router;
