const express = require('express');

const router = express.Router();
const GlobalPoolController = require('../controllers/globalPoolController');
const { isAuth, isPoolTech } = require('../middlewares/checkAuth');

router.get('/', isAuth, isPoolTech, GlobalPoolController.GetGlobalPools);
router.post('/', isAuth, isPoolTech, GlobalPoolController.CreateGlobalPool);
router.get('/active', isAuth, isPoolTech, GlobalPoolController.GetActivePool);
router.patch('/activate', isAuth, isPoolTech, GlobalPoolController.ActivateGlobalPool);
router.get('/getStatus', isAuth, GlobalPoolController.GetActivePoolStatus);

module.exports = router;
