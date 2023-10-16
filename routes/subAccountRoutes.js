const express = require("express");
const router = express.Router();
const SubAccountController = require("../controllers/subAccountController");
const { isAuth, isAdmin } = require("../middlewares/checkAuth");

router.post("/", isAuth, isAdmin, SubAccountController.CreateSubAccount);
router.post("/activate/:id", isAuth, isAdmin, SubAccountController.ActivateSubAccount);
router.post("/deactivate/:id", isAuth, isAdmin, SubAccountController.DeactivateSubAccount);

module.exports = router;
