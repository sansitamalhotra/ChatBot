//server/services/liveAgentEmailService.js
const nodemailer = require('nodemailer');

const sendLiveAgentNotification = async (message, chatLink) => {
    try {
        // Create the transporter
        const transporter = nodemailer.createTransport({
            service: "gmail",
            host: process.env.SEND_EMAIL_HOST,
            port: 587,
            auth: {
                user: process.env.EMAIL_NOTIFICATION_USER,
                pass: process.env.EMAIL_NOTIFICATION_PASS 
            },
        });


        const mailOptions = {            
            from: "ProsoftSynergies Private Limited <hrpspl@prosoftsynergies.com>",
            to: process.env.EMAIL_RECIPIENTS.split(","),
            subject: 'Live Agent Request Notification',
            text: `A User has Requested to talk to a Live Support Agent.`,
            html: `
                <p>Kindly click on the link below to Connect with the User who's waiting for Your Response.<br />Message: \n\n${message}
                <br /><br/><a href="${chatLink}" style="display: inline-block; padding: 10px 20px; font-size: 16px; color: #fff; background-color: #007bff; text-decoration: none; border-radius: 5px; text-align: center; font-family: Trebuchet MS, sans-serif">Chat With User Now!</a></p>
                `
        };

        // Send the email
        const info = await transporter.sendMail(mailOptions);
        console.log('Email sent successfully:', info.messageId);

        return {
            success: true,
            message: 'Email sent successfully',
        };
    } catch (error) {
        console.error('Error sending email:', error.message);
        return {
            success: false,
            message: 'Failed to send email',
        };
    }
};

module.exports = sendLiveAgentNotification;
