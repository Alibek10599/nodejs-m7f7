const { Organization } = require("../models");

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
            const organization = await Organization.create(req.body)

            return res.status(201).json(organization)
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
};
