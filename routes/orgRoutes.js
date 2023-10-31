const express = require('express');

const router = express.Router();
const OrganizationController = require('../controllers/organizationController');
const { isAuth, isPoolAdmin } = require('../middlewares/checkAuth');

router.get('/', isAuth, isPoolAdmin, OrganizationController.GetOrganizations);
router.post('/', isAuth, OrganizationController.CreateOrganization);
router.post('/activate/:id', isAuth, isPoolAdmin, OrganizationController.ActivateOrganization);
router.get('/getinfo', isAuth, OrganizationController.GetInfo);
router.patch('/update', isAuth, OrganizationController.UpdateOrganization);
router.patch('/approve', isAuth, isPoolAdmin, OrganizationController.ApproveOrganization)

module.exports = router;
