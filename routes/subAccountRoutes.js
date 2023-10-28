const express = require('express');

const router = express.Router();
const SubAccountController = require('../controllers/subAccountController');
const { isAuth, isPoolAdmin } = require('../middlewares/checkAuth');

router.post('/', isAuth, SubAccountController.CreateSubAccount);
router.get('/', isAuth, SubAccountController.GetSubAccounts);
router.get('/getinfo', isAuth, SubAccountController.GetInfo);
router.post('/activate/:id', isAuth, isPoolAdmin, SubAccountController.ActivateSubAccount);
router.post('/deactivate/:id', isAuth, isPoolAdmin, SubAccountController.DeactivateSubAccount);

module.exports = router;
