const express = require("express");
const router = express.Router();
const AdminUserController = require("../controllers/adminUserController");
const { isAuth, isAdmin } = require("../middlewares/checkAuth");

router.get("/", isAuth, isAdmin, AdminUserController.GetUsers);
router.post('/verify/:id', isAuth, isAdmin, AdminUserController.verifyUser)

module.exports = router;
