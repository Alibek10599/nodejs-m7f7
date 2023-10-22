const express = require('express');

const router = express.Router();
const AuthController = require('../controllers/authController');
const { isAuth } = require('../middlewares/checkAuth');

router.post('/signup', AuthController.signup);

router.post('/emailverification', AuthController.verifyemail);

router.post('/signin', AuthController.signin);

router.get('/refresh', AuthController.refresh);

router.post('/forgotpassword', AuthController.forgetPassword);

router.post('/resetpassword', AuthController.resetpassword);

router.post('/logout', AuthController.logout);

router.get('/generate2fa', isAuth, AuthController.generate2fa);

router.post('/verify2fa', isAuth, AuthController.verify2fa);

router.patch('/delete2fa', isAuth, AuthController.delete2fa);

module.exports = router;
