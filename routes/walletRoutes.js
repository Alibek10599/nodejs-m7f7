const express = require('express');

const router = express.Router();
const walletController = require('../controllers/walletController');
const { isAuth } = require('../middlewares/checkAuth');

router.post('/', isAuth, walletController.CreateWallet);
router.get('/getwallets', isAuth, walletController.GetWallets);
router.get('/getsubwallets', isAuth, walletController.GetSubWallets);
router.get('/getinfo', isAuth, walletController.GetInfo)
router.post('/activate/:id', isAuth, walletController.ActivateWallet);
router.post('/deactivate/:id', isAuth, walletController.DeactivateWallet);

module.exports = router;
