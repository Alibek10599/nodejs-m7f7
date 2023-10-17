const { Organization, User } = require("../models");
const OrganizationValidation = require("../validators/OrganizationValidation");

module.exports = {
    GetOrganizations: async (req, res) => {
        try {
            const organizations = await Organization.findAll([
        ]);

        return res.status(200).json(organizations);

        } catch (error) {
            return res.status(500).send("Error: " + error.message);
        }
    },
    CreateOrganization: async (req, res) => {
        try {
            const { name } = req.body;
            const { errors, isValid } = OrganizationValidation(req.body);
            
            if (!isValid) {
                return res.status(400).json(errors);
            }
            let exisitingOrganization = await Organization.findOne({
                where: {
                    orgName: name
                }
            });
            if (exisitingOrganization) {
                errors.name = "Organization with given name already Exist";
                return res.status(404).json(errors);
            }
            exisitingOrganization = await Organization.create({
                orgName: name
            });
            const user = await User.findOne({
                where: {
                    id: req.user.dataValues.id,
                }
            });

            if(!user) {
                return res.status(404).json('user not found');
            }

            user.orgId = exisitingOrganization.id;
            await user.save();
            
            res.status(201).json({
                success: true,
                message: `please wait for activation of your Organization:- ${name}.`,
            });
        } catch(error){
            return res.status(500).send("Error on creating organization: " + error.message)
        }
    },
    ActivateOrganization: async (req, res) => {
        try {
            const { id } = req.params
            const organization = await Organization.findByPk(id);
            organization.isActive = true;
            organization.save();

            return res.status(200).json(organization);

        } catch (error) {
            return res.status(500).send("Error: " + error.message)
        }
    },
    GetInfo: async (req, res) => {
        try {
            const organization = await Organization.findByPk(req.user.dataValues.orgId);

            const info = {
                organization
            }

            res.status(200).json(info);
        } catch (error) {
            return res.status(500).send("Error: " + error.message)
        }
    }
};
