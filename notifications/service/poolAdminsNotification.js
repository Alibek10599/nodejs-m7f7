const { User, Role } = require('../../models')
const { notificationSelector } = require('./notification-selector')

const sendPoolAdminNotification = async (subject, message) => {
    const { id: roleId } = await Role.findOne({ where: { roleName: 'PoolAdmin' } })
    const poolAdmins = await User.findAll({
        where: {
            roleId
        }
    })

    for (const poolAdmin of poolAdmins) {
        await notificationSelector({
            userId: poolAdmin.id,
            email: poolAdmin.email,
            userName: poolAdmin.userName,
            subject,
            template: 'notification',
            message
        })
    }
}

module.exports = sendPoolAdminNotification