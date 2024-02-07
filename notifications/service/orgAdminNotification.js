const { User, Role } = require('../../models')
const { notificationSelector } = require('./notification-selector')

const sendOrgAdminNotification = async (subject, message, orgId) => {
    const { id: roleId } = await Role.findOne({ where: { roleName: 'OrgAdmin' } })
    const orgAdmins = await User.findAll({
        where: {
            roleId,
            orgId
        }
    })

    for (const orgAdmin of orgAdmins) {
        await notificationSelector({
            userId: orgAdmin.id,
            email: orgAdmin.email,
            userName: orgAdmin.userName,
            subject,
            template: 'notification',
            message
        })
    }
}

module.exports = sendOrgAdminNotification