const getTransport = require("./config/email-config");
const {Message} = require("../../models");

const sendMail = async (to, url, name, subject, template) => {
  try {
    const transporter = getTransport()

    const mailOptions = {
      from: {
        name: 'MidasPool',
        address: process.env.SMPT_MAIL,
      },
      to,
      subject,
      template,
      context: {
        name,
        url,
      },
    };

    return await transporter.sendMail(mailOptions, async (err, info) => {
        if(err) {
          await Message.create({
            userName: mailOptions.context.name,
            email: mailOptions.to,
            isDelivered: false,
            subject: mailOptions.subject,
            template: mailOptions.template,
            url: mailOptions.context.url
          })
          return console.error('error while sending mail', err)
        } else {
          return info
        }
    });
  } catch (error) {
    console.error('error on sending mail: ', error);
  }
};

module.exports = sendMail;
