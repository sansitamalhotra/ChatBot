const nodemailer = require("nodemailer");

const sendMail = async (options) => {
  const smtpTransport = require("nodemailer-smtp-transport");
  console.log("Sending email to: ", process.env.EMAIL_NOTIFICATION_USER);
  console.log("Sending email from: ", process.env.EMAIL_NOTIFICATION_PASS);

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

  // Generate HTML content
  const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${options.subject}</title>
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 0;
          background-color: #f4f4f4;
        }
        .email-container {
          background-color: #ffffff;
          margin: 20px;
          border-radius: 10px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          overflow: hidden;
        }
        .email-header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 30px 20px;
          text-align: center;
        }
        .email-header h1 {
          margin: 0;
          font-size: 24px;
          font-weight: 600;
        }
        .email-header .icon {
          font-size: 48px;
          margin-bottom: 10px;
        }
        .email-body {
          padding: 30px 20px;
        }
        .message-content {
          background-color: #f8f9ff;
          border-left: 4px solid #667eea;
          padding: 20px;
          margin: 20px 0;
          border-radius: 0 8px 8px 0;
        }
        .user-info {
          background-color: #fff;
          border: 2px solid #e1e5e9;
          border-radius: 8px;
          padding: 15px;
          margin: 20px 0;
        }
        .user-info h3 {
          margin: 0 0 10px 0;
          color: #667eea;
          font-size: 16px;
        }
        .user-email {
          font-weight: 600;
          color: #333;
          font-size: 18px;
        }
        .timestamp {
          color: #666;
          font-size: 14px;
          margin-top: 20px;
          text-align: center;
          border-top: 1px solid #eee;
          padding-top: 15px;
        }
        .action-needed {
          background-color: #fff3cd;
          border: 1px solid #ffeaa7;
          border-radius: 6px;
          padding: 15px;
          margin: 20px 0;
          text-align: center;
        }
        .action-needed strong {
          color: #856404;
        }
        .email-footer {
          background-color: #f8f9fa;
          padding: 20px;
          text-align: center;
          color: #666;
          font-size: 14px;
          border-top: 1px solid #eee;
        }
        @media (max-width: 600px) {
          .email-container {
            margin: 10px;
          }
          .email-header, .email-body {
            padding: 20px 15px;
          }
        }
      </style>
    </head>
    <body>
      <div class="email-container">
        <div class="email-header">
          <div class="icon">🎧</div>
          <h1>Live Agent Request</h1>
        </div>
        
        <div class="email-body">
          <div class="action-needed">
            <strong>⚠️ Action Required:</strong> A customer is requesting live support
          </div>
          
          <div class="message-content">
            <p>${options.message}</p>
          </div>
          
          <div class="user-info">
            <h3>Customer Details:</h3>
            <div class="user-email">📧 ${options.email}</div>
          </div>
          
          <div class="timestamp">
            📅 Request received: ${new Date().toLocaleString()}
          </div>
        </div>
        
        <div class="email-footer">
          <p>This is an automated notification from your customer support system.</p>
          <p>Please respond to the customer promptly to maintain service quality.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  let mailOptions = {
    from: process.env.EMAIL_NOTIFICATION_USER,
    to: options.email,
    subject: options.subject,
    text: options.message,
    html: htmlContent,
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      return console.log(error.message);
    }
    console.log("success");
  });
};

module.exports = sendMail;