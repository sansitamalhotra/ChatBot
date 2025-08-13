const nodemailer = require("nodemailer");

// Reusable transporter instance
const transporter = nodemailer.createTransport({
  service: "gmail",
  host: process.env.SEND_EMAIL_HOST,
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_NOTIFICATION_USER,
    pass: process.env.EMAIL_NOTIFICATION_PASS
  }
});

const sendJobNotificationEmail = async (newJob) => {
  try {
    const emailRecipients = process.env.EMAIL_RECIPIENTS.split(",");
    const mailOptions = {
      from: "Prosoft <hrpspl@prosoftsynergies.com",
      bcc: emailRecipients,
      subject: `New Job ${newJob.title} Has Been Posted`,
      html: `
        <p>A new job "${newJob.title}" has been posted.</p>
        <p><!-- View details: <a href="${process.env.FRONTEND_BASE_URL}/Job-Details/${newJob.slug}" style="display: inline-block; padding: 10px 20px; font-size: 16px; color: #fff; background-color: #007bff; text-decoration: none; border-radius: 5px; text-align: center; font-family: Trebuchet MS, sans-serif">${newJob.title}</a> --></p>
      `
    };
    await transporter.sendMail(mailOptions);
    console.log("Notification emails sent successfully.");
  } catch (error) {
    console.error("Failed to send emails:", error);
    throw error;
  }
};

module.exports = { sendJobNotificationEmail };
