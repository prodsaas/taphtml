const nodemailer = require("nodemailer");

const { EMAIL_USER, EMAIL_ADDRESS, EMAIL_PASSWORD } = process.env;
const isMailerEnvSet = Boolean(EMAIL_USER && EMAIL_ADDRESS && EMAIL_PASSWORD);

let transporter = null;
if (isMailerEnvSet) {
    transporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 465,
        secure: true,
        auth: {
            user: EMAIL_ADDRESS,
            pass: EMAIL_PASSWORD
        }
    });
}

const verifyMailer = async () => {
    try {
        if (!isMailerEnvSet) return;
        await transporter.verify();
        console.log("Mailer working");
    }
    catch (error) {
        throw new Error(`Mailer Error: ${error.message}`)
    }
};

const sendMail = (mailOptions) => transporter.sendMail(mailOptions);

module.exports = { sendMail, verifyMailer, isMailerEnvSet };