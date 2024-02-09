const express = require('express');

const router = express.Router();
const OrganizationController = require('../controllers/organizationController');
const { isAuth, isPoolAdmin, isPoolAccount } = require('../middlewares/checkAuth');

router.get('/', isAuth, isPoolAccount, OrganizationController.GetOrganizations);
router.get('/info/:id', isAuth, OrganizationController.GetOrganization);
router.post('/', isAuth, OrganizationController.CreateOrganization);
router.post('/activate/:id', isAuth, isPoolAdmin, OrganizationController.ActivateOrganizationInKDP);
router.post('/sms/:id', isAuth, isPoolAdmin, OrganizationController.SendSMS);
router.get('/getinfo', isAuth, OrganizationController.GetInfo);
router.patch('/update', isAuth, OrganizationController.UpdateOrganization);
router.put('/fee', isAuth, isPoolAdmin, OrganizationController.UpdateOrganizationFee);
router.patch('/approve', isAuth, isPoolAdmin, OrganizationController.ApproveOrganization);
router.get('/organization-info', isAuth, isPoolAccount, OrganizationController.GetOrganizationIfo);

module.exports = router;
