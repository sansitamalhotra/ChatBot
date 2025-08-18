const nodemailer = require("nodemailer");
const path = require("path");
const dotenv = require("dotenv");
const fs = require("fs");
const ejs = require("ejs");

dotenv.config();

const sendMail = async (to, url, name, subject, template) => {
  // Updated transporter configuration
  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_NOTIFICATION_USER,
      pass: process.env.EMAIL_NOTIFICATION_PASS
    },
    tls: {
      rejectUnauthorized: false
    },
    connectionTimeout: 60000,
    greetingTimeout: 30000,
    socketTimeout: 60000
  });

  // Verify transporter configuration
  try {
    await transporter.verify();
    console.log('SMTP server is ready to take our messages');
  } catch (error) {
    console.error('SMTP verification failed:', error);
    throw error;
  }

  // Read the email template
  const templatePath = path.resolve(__dirname, "views", `${template}.ejs`);
  const templateContent = fs.readFileSync(templatePath, "utf-8");

  // Render the email template with EJS
  const html = ejs.render(templateContent, { name, url });

  const mailOptions = {
    from: {
      name: "ThinkBeyond Private Limited.",
      address: process.env.EMAIL_NOTIFICATION_USER // Use the same email as auth user
    },
    to: to,
    subject: subject,
    html: html
  };

  return await transporter.sendMail(mailOptions);
};

module.exports = sendMail;
