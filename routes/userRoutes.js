const express = require('express');

const router = express.Router();
const AdminUserController = require('../controllers/adminUserController');
const { isAuth, isPoolAdmin } = require('../middlewares/checkAuth');

router.get('/', isAuth, isPoolAdmin, AdminUserController.GetUsers);
router.post('/inviteUser', isAuth, AdminUserController.inviteUser);
router.post('/verify/:id', isAuth, isPoolAdmin, AdminUserController.verifyUser);
router.get('/user-info', isAuth, isPoolAdmin, AdminUserController.GetUserInfo);
router.patch('/activate', isAuth, isPoolAdmin, AdminUserController.activateUser);
router.patch('/deactivate', isAuth, isPoolAdmin, AdminUserController.deactivateUser);
router.patch('/delete2fa', isAuth, isPoolAdmin, AdminUserController.delete2fa);

module.exports = router;
