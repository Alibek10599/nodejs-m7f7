const express = require('express');

const router = express.Router();
const AdminUserController = require('../controllers/adminUserController');
const { isAuth, isPoolAdmin, isOrgAdmin } = require('../middlewares/checkAuth');

router.get('/', isAuth, isPoolAdmin, AdminUserController.GetUsers);
router.get('/getAdminUsers', isAuth, isPoolAdmin, AdminUserController.GetAdminUsers);
router.get('/getOrganizationUsers', isAuth, AdminUserController.GetOrganizationUsers);
router.post('/inviteUser', isAuth, AdminUserController.inviteUser);
router.post('/inviteAdminUser', isAuth, isPoolAdmin, AdminUserController.inviteAdminUser);
router.post('/verify/:id', isAuth, isPoolAdmin, AdminUserController.verifyUser);
router.get('/user-info', isAuth, isPoolAdmin, AdminUserController.GetUserInfo);
router.patch('/activate', isAuth, isOrgAdmin, AdminUserController.activateUser);
router.patch('/deactivate', isAuth, isOrgAdmin, AdminUserController.deactivateUser);
router.patch('/delete2fa', isAuth, isPoolAdmin, AdminUserController.delete2fa);
router.post('/addUserToSubAcc', isAuth, isOrgAdmin, AdminUserController.addUserToSubAcc);

module.exports = router;
