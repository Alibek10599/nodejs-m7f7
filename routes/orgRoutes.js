const express = require("express");
const router = express.Router();
const OrganizationController = require("../controllers/organizationController");
const { isAuth, isAdmin } = require("../middlewares/checkAuth");

router.get("/", isAuth, isAdmin, OrganizationController.GetOrganizations);
router.post("/", isAuth, OrganizationController.CreateOrganization);
router.post("/activate/:id", isAuth, isAdmin, OrganizationController.ActivateOrganization);
router.get('/getinfo', isAuth, OrganizationController.GetInfo);

module.exports = router;
