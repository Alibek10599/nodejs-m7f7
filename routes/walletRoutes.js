const express = require("express");
const router = express.Router();
const walletController = require("../controllers/walletController");
const { isAuth, isAdmin } = require("../middlewares/checkAuth");

router.post("/", isAuth, isAdmin, walletController.CreateWallet);
router.post("/activate/:id", isAuth, isAdmin, walletController.ActivateWallet);
router.post("/deactivate/:id", isAuth, isAdmin, walletController.DeactivateWallet);


module.exports = router;
