const express = require('express');

const router = express.Router();
const { isAuth } = require('../middlewares/checkAuth');
const SubUserController = require('../controllers/SubUserController');

router.get('/', isAuth, SubUserController.GetSubUsers);
router.get('/getSubAccountInfo', isAuth, SubUserController.GetSubAccountInfo);
router.get('/getSubAccountEarnings', isAuth, SubUserController.GetSubAccountEarnings);
router.get('/getSubAccountPayouts', isAuth, SubUserController.GetSubAccountPayouts);

module.exports = router;
