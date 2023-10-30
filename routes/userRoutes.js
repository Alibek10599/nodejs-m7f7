const express = require('express');

const router = express.Router();
const AdminUserController = require('../controllers/adminUserController');
const { isAuth, isPoolAdmin } = require('../middlewares/checkAuth');

router.get('/', isAuth, isPoolAdmin, AdminUserController.GetUsers);
router.post('/inviteUser', isAuth, AdminUserController.inviteUser);
router.post('/verify/:id', isAuth, isPoolAdmin, AdminUserController.verifyUser);

module.exports = router;
