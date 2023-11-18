const getTransport = require("./config/email-config");

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

    return await transporter.sendMail(mailOptions, (err, info) => {
        if(err) return console.error('error while sending mail', err)
    });
  } catch (error) {
    console.error('error on sending mail: ', error);
  }
};

module.exports = sendMail;
