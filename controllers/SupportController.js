// const sendMail = require("../mail-sender/service/sendMail");
// const sendMail = require("../notifications/mail-sender/service/sendMail");
const nodemailer = require("nodemailer");

module.exports = {
    SendMail: async (req, res) => {
        try {
            const {
                name,
                phone,
                email,
                details,
            } = req?.body?.ticket;
            
            const userId = req?.user?.id;
            const file = req?.files?.file;

            const transporter = nodemailer.createTransport({
                host: process.env.SMPT_HOST,
                port: process.env.SMPT_PORT,
                service: process.env.SMPT_SERVICE,
                auth: {
                    user: process.env.SMPT_MAIL,
                    pass: process.env.SMPT_PASSWORD,
                },
            });

            const mailResult = await transporter.sendMail({
                from: process.env.SMPT_MAIL,
                to: process.env.SMPT_MAIL,
                subject: `Обращение в службу поддержки ${name}`,
                text: `
                    phone: ${phone},
                    email: ${email},
                    message: ${details}
                    userId: ${userId ?? "unauthorized"}
                    sendTime: ${new Date().toISOString()}
                `,
                attachments: file,
            });

            return res.status(200).send();

        } catch (error) {
            console.log(error);
            res.status(500).send(`Error: ${error.message}`);
        }
    },

}
