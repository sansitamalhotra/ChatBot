const nodemailer = require('nodemailer');
const hbs = require('nodemailer-express-handlebars');
const path = require('path');

const sendMail = async (to, url, name, subject, template) => {
    const transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 587,
        auth: {
            user: process.env.SMPT_MAIL,
            pass: process.env.SMPT_PASSWORD,
        },
    });

    // Configure nodemailer to use custom email templates with nodemailer-express-handlebars
    const handlebarsOptions = {
        viewEngine: {
            extname: ".handlebars",
            partialsDir: path.resolve("./src/views"),
            defaultLayout: false,
        },
        viewPath: path.resolve("./src/views/"),
        extName: ".handlebars",
    };

    transporter.use("compile", hbs(handlebarsOptions));

    const mailOptions = {
        from: {
            name: "ProsoftSynergies Private Limited.",
            address: process.env.NODEMAIL_EMAIL_FROM
        },
        to: to,
        subject: subject,
        context: {
            name,
            url,
        },
    };
    return await transporter.sendMail(mailOptions);
};

module.exports = sendMail;
