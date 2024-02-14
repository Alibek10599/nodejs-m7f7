const { User, Role } = require('../../models')
const userRoles = require('../../utils/constants/userRoles')
const { notificationSelector } = require('./notification-selector')

const sendOrgAdminNotification = async (subject, message, orgId) => {
    const { id: roleId } = await Role.findOne({ where: { roleName: userRoles.ORGADMIN } })
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