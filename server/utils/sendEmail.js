const nodemailer = require("nodemailer");

const sendMail = async (options) => {

    const nodemailer = require("nodemailer");

    const smtpTransport = require("nodemailer-smtp-transport");

    let transporter = nodemailer.createTransport(
    smtpTransport({
        service: "gmail",
        host: "smtp.gmail.com",
        port: 587,
        secure: false,
        auth: {
            user: process.env.EMAIL_NOTIFICATION_USER,
            pass: process.env.EMAIL_NOTIFICATION_PASS,
        },
    })
    );

    let mailOptions = {
    from: "kenny.offor@gmail.com",
    to: options.email,
    subject: options.subject,
    text: options.message,
    };

    transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
        return console.log(error.message);
    }
    console.log("success");
    });
}

module.exports = sendMail;
