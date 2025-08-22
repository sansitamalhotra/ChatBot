// //server/services/adminNotificationService.js
// const nodemailer = require('nodemailer');
// const User = require('../models/userModel');
// const { logWithIcon } = require('./consoleIcons');


// const FRONTEND_BASE_URL = process.env.FRONTEND_BASE_URL || 'http://localhost:3000';
// //const FRONTEND_BASE_URL = process.env.FRONTEND_BASE_URL || 'http://localhost:3000';
// const SUPPORT_EMAIL = process.env.SUPPORT_EMAIL || process.env.SMPT_USERNAME || 'support@prosoftsynergies.com';

// const generateUniqueAgentUrl = (sessionId, messageId) => {
//   try {
//     const baseUrl = FRONTEND_BASE_URL.replace(/\/$/, '');
//     const timestamp = Date.now();
//     const token = crypto.randomBytes(20).toString('hex');
//     const safeSession = encodeURIComponent(sessionId?.toString ? sessionId.toString() : String(sessionId));
//     const safeMessage = encodeURIComponent(messageId?.toString ? messageId.toString() : String(messageId));
//     const uniqueUrl = `${baseUrl}/admin/chat/session/${safeSession}?messageId=${safeMessage}&t=${timestamp}&token=${token}`;
//     logWithIcon.success('Generated unique agent URL:', uniqueUrl);
//     return uniqueUrl;
//   } catch (error) {
//     logWithIcon.error('Error generating unique agent URL:', error);
//     // Fallback simpler URL
//     return `${FRONTEND_BASE_URL}/admin/chat/session/${sessionId}`;
//   }
// };

// const createTransporter = () => {
//   const host = process.env.SMTP_HOST;
//   const port = parseInt(process.env.SMTP_PORT, 10) || 587;
//   const user = process.env.SMPT_USERNAME;
//   const pass = process.env.SMTP_PASSWORD;
//   const secure = (process.env.SMTP_SECURE === 'true') || port === 465;

//   const transporter = nodemailer.createTransport({
//     host,
//     port,
//     secure,
//     auth: user && pass ? { user, pass } : undefined,
//     connectionTimeout: parseInt(process.env.SMTP_CONNECTION_TIMEOUT, 10) || 30_000,
//     greetingTimeout: parseInt(process.env.SMTP_GREETING_TIMEOUT, 10) || 30_000,
//     tls: {
//       rejectUnauthorized: false
//     }
//   });

//   return transporter;
// };


// class AdminNotificationService {
    
//   // Initialize Nodemailer transporter
//   async initializeTransporter() {
//     try {
//       // Fixed configuration based on working function
//       const config = {
//         host: 'smtp.gmail.com',
//         port: 587,
//         secure: false, // Changed from dynamic to false for port 587
//         auth: {
//           user: process.env.EMAIL_NOTIFICATION_USER,
//           pass: process.env.EMAIL_NOTIFICATION_PASS
//         },
//         tls: {
//           rejectUnauthorized: false
//           // Removed problematic 'ciphers: SSLv3'
//         },
//         connectionTimeout: 60000, // Increased from 10000 to 60000
//         greetingTimeout: 30000,    // Increased from 5000 to 30000
//         socketTimeout: 60000       // Increased from 10000 to 60000
//       };
      
//       this.transporter = nodemailer.createTransporter(config);
      
//       // Enhanced connection verification with retry logic
//       let retries = 3;
//       while (retries > 0) {
//         try {
//           await this.transporter.verify();
//           this.transporterVerified = true;
//           logWithIcon.success('SMTP server connection verified successfully');
//           break;
//         } catch (verifyError) {
//           retries--;
//           logWithIcon.warning(`SMTP verification failed. ${retries} attempts remaining:`, verifyError);
          
//           if (retries === 0) {
//             throw new Error(`SMTP connection failed after multiple attempts: ${verifyError.message}`);
//           }
          
//           // Wait before retrying (increased wait time)
//           await new Promise(resolve => setTimeout(resolve, 5000));
//         }
//       }

//     } catch (error) {
//       logWithIcon.error('Failed to initialize email transporter:', error);
//       this.transporter = null;
//       this.transporterVerified = false;
//       throw error; // Re-throw to handle at caller level
//     }
//   }

//    // Email sending with retry logic
//   async sendMailWithRetry(mailOptions, retries = 3) {
//     for (let attempt = 1; attempt <= retries; attempt++) {
//       try {
//         if (!this.transporter || !this.transporterVerified) {
//           await this.initializeTransporter();
//         }
        
//         const info = await this.transporter.sendMail(mailOptions);
//         return { success: true, info };
//       } catch (error) {
//         logWithIcon.error(`Email send attempt ${attempt} failed:`, error);
        
//         if (attempt === retries) {
//           return { success: false, error };
//         }
        
//         // Wait before retrying (exponential backoff)
//         await new Promise(resolve => setTimeout(resolve, 2000 * attempt));
//       }
//     }
//   }

//   // Get all admin users for notification
//   async getNotifiableAdmins() {
//     try {
//       const admins = await User.find({
//         role: 1, // Admin role
//         email: { $exists: true, $ne: null },
//         isActive: { $ne: false }
//       }).select('_id firstname lastname email phone currentStatus');

//       return admins.filter(admin => admin.email && admin.email.includes('@'));
//     } catch (error) {
//       logWithIcon.error('Error fetching admin users:', error);
//       return [];
//     }
//   }

//   // Generate HTML email template for agent request
//   generateAgentRequestEmailHTML({ userInfo, sessionId, messageId, uniqueUrl, message, requestTime, ipAddress }) {
//     const userDisplayName = userInfo.isGuest
//       ? `${userInfo.firstName || 'Guest'} ${userInfo.lastName || 'User'}`
//       : `${userInfo.firstname || userInfo.firstName || 'User'} ${userInfo.lastname || userInfo.lastName || ''}`;

//     const userType = userInfo.isGuest ? 'Guest User' : 'Registered User';
//     const userEmail = userInfo.email || 'Not provided';
//     const formattedTime = new Date(requestTime).toLocaleString();

//     return `
// <!DOCTYPE html>
// <html lang="en">
// <head>
//   <meta charset="UTF-8">
//   <meta name="viewport" content="width=device-width, initial-scale=1.0">
//   <title>Live Agent Request - PSPL Support</title>
//   <style>
//     body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5; }
//     .container { max-width: 600px; margin: 0 auto; background-color: white; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); overflow: hidden; }
//     .header { background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); color: white; padding: 30px; text-align: center; }
//     .header h1 { margin: 0; font-size: 24px; font-weight: 600; }
//     .header .subtitle { margin: 10px 0 0; opacity: 0.9; font-size: 14px; }
//     .content { padding: 30px; }
//     .alert-box { background: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 15px; margin-bottom: 25px; display: flex; align-items: center; }
//     .alert-icon { color: #f59e0b; font-size: 20px; margin-right: 10px; }
//     .user-info { background: #f8fafc; border-radius: 8px; padding: 20px; margin: 20px 0; }
//     .info-row { display: flex; justify-content: space-between; margin: 10px 0; }
//     .info-label { font-weight: 600; color: #374151; }
//     .info-value { color: #6b7280; }
//     .message-box { background: #e5f3ff; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0; border-radius: 0 8px 8px 0; }
//     .message-text { font-style: italic; color: #1e40af; font-size: 15px; line-height: 1.5; }
//     .cta-button { display: inline-block; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; text-decoration: none; padding: 15px 30px; border-radius: 8px; font-weight: 600; font-size: 16px; margin: 20px 0; text-align: center; box-shadow: 0 4px 6px rgba(16, 185, 129, 0.25); }
//     .cta-button:hover { background: linear-gradient(135deg, #059669 0%, #047857 100%); }
//     .footer { background: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb; }
//     .footer-text { color: #6b7280; font-size: 12px; line-height: 1.5; }
//     .session-id { font-family: 'Courier New', monospace; background: #f3f4f6; padding: 2px 6px; border-radius: 4px; font-size: 12px; }
//   </style>
// </head>
// <body>
//   <div class="container">
//     <div class="header">
//       <h1>🚨 Live Agent Request</h1>
//       <div class="subtitle">A customer is waiting for assistance</div>
//     </div>
    
//     <div class="content">
//       <div class="alert-box">
//         <span class="alert-icon">⏰</span>
//         <div>
//           <strong>Immediate attention required!</strong><br>
//           A customer has requested to speak with a live agent and is currently waiting for response.
//         </div>
//       </div>

//       <div class="user-info">
//         <h3 style="margin-top: 0; color: #1f2937;">Customer Information</h3>
//         <div class="info-row">
//           <span class="info-label">Name:</span>
//           <span class="info-value">${userDisplayName}</span>
//         </div>
//         <div class="info-row">
//           <span class="info-label">Type:</span>
//           <span class="info-value">${userType}</span>
//         </div>
//         <div class="info-row">
//           <span class="info-label">Email:</span>
//           <span class="info-value">${userEmail}</span>
//         </div>
//         <div class="info-row">
//           <span class="info-label">Request Time:</span>
//           <span class="info-value">${formattedTime}</span>
//         </div>
//         <div class="info-row">
//           <span class="info-label">IP Address:</span>
//           <span class="info-value">${ipAddress || 'Unknown'}</span>
//         </div>
//         <div class="info-row">
//           <span class="info-label">Session ID:</span>
//           <span class="info-value session-id">${sessionId}</span>
//         </div>
//       </div>

//       ${message ? `
//       <div class="message-box">
//         <h4 style="margin-top: 0; color: #1e40af;">Customer Message:</h4>
//         <div class="message-text">"${message}"</div>
//       </div>
//       ` : ''}

//       <div style="text-align: center; margin: 30px 0;">
//         <a href="${uniqueUrl}" class="cta-button">
//           💬 Connect to Chat Session
//         </a>
//       </div>

//       <div style="background: #f0f9ff; border: 1px solid #7dd3fc; border-radius: 8px; padding: 15px; margin: 20px 0;">
//         <h4 style="margin-top: 0; color: #0369a1;">Quick Actions:</h4>
//         <p style="margin-bottom: 0; color: #0c4a6e; font-size: 14px;">
//           Click the button above to access the chat session directly. You'll be able to see the conversation history and respond to the customer immediately.
//         </p>
//       </div>
//     </div>

//     <div class="footer">
//       <div class="footer-text">
//         This notification was sent by PSPL Support System<br>
//         Response time affects customer satisfaction - please respond promptly<br>
//         <strong>Session:</strong> ${sessionId} | <strong>Message:</strong> ${messageId}
//       </div>
//     </div>
//   </div>
// </body>
// </html>`;
//   }

//   // Send notification to all admins
//   async notifyAdminsOfAgentRequest(notificationData) {
//     try {
//       // Initialize transporter if not ready
//       if (!this.transporter || !this.transporterVerified) {
//         await this.initializeTransporter();
//       }

//       const admins = await this.getNotifiableAdmins();
//       if (admins.length === 0) {
//         logWithIcon.warning('No admin users found for notification');
//         return { success: false, error: 'No admin recipients found' };
//       }

//       const { userInfo, sessionId, messageId, uniqueUrl, message, requestTime, ipAddress } = notificationData;
      
//       // Generate email content
//       const emailSubject = `🚨 Live Agent Request - ${userInfo.firstName || 'User '} waiting for assistance`;
//       const emailHTML = this.generateAgentRequestEmailHTML(notificationData);

//       const emailResults = [];
//       let successfulSends = 0;

//       for (const admin of admins) {
//         try {
//           const mailOptions = {
//             from: {
//               name: 'PSPL Support System',
//               address: process.env.EMAIL_NOTIFICATION_USER
//             },
//             to: admin.email,
//             subject: emailSubject,
//             html: emailHTML,
//             priority: 'high',
//             headers: {
//               'X-Priority': '1',
//               'X-MSMail-Priority': 'High',
//               'Importance': 'high'
//             }
//           };

//           const result = await this.sendMailWithRetry(mailOptions);
          
//           if (result.success) {
//             successfulSends++;
//             logWithIcon.success(`Admin notification sent to ${admin.email}: ${result.info.messageId}`);
            
//             emailResults.push({
//               adminId: admin._id,
//               email: admin.email,
//               success: true,
//               messageId: result.info.messageId
//             });
//           } else {
//             throw result.error;
//           }
//         } catch (error) {
//           logWithIcon.error(`Failed to send notification to ${admin.email}:`, error);
//           emailResults.push({
//             adminId: admin._id,
//             email: admin.email,
//             success: false,
//             error: error.message
//           });
//         }
//       }

//       logWithIcon.broadcast(`Agent request notifications sent: ${successfulSends} successful, ${admins.length - successfulSends} failed`);

//       return {
//         success: successfulSends > 0,
//         totalSent: successfulSends,
//         totalFailed: admins.length - successfulSends,
//         results: emailResults,
//         sessionId,
//         messageId
//       };

//     } catch (error) {
//       logWithIcon.error('Error sending admin notifications:', error);
//       return {
//         success: false,
//         error: error.message,
//         sessionId: notificationData.sessionId,
//         messageId: notificationData.messageId
//       };
//     }
//   }

//   // Test email configuration
//   async testEmailConfiguration() {
//     try {
//       if (!this.transporter || !this.transporterVerified) {
//         await this.initializeTransporter();
//       }

//       const testEmail = {
//         from: {
//           name: 'PSPL Support System',
//           address: process.env.EMAIL_NOTIFICATION_USER // Use same as auth user
//         },
//         to: process.env.ADMIN_TEST_EMAIL || process.env.EMAIL_NOTIFICATION_USER, // Changed from SMTP_USER
//         subject: 'PSPL Support - Email Test',
//         html: `
//           <h2>Email Configuration Test</h2>
//           <p>This is a test email to verify the PSPL support notification system.</p>
//           <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
//           <p>If you received this email, the notification system is working correctly.</p>
//         `
//       };

//       const info = await this.transporter.sendMail(testEmail);
//       return { success: true, messageId: info.messageId };
      
//     } catch (error) {
//       return { success: false, error: error.message };
//     }
//   }
// }


// // Create singleton instance
// const adminNotificationService = new AdminNotificationService();

// // Function to be called from socket service
// const notifyAdminsOfPendingRequest = async (io, notificationData) => {
//   try {
//     // Send email notifications
//     const emailResult = await adminNotificationService.notifyAdminsOfAgentRequest(notificationData);
    
//     // Also emit real-time socket notification to online admins
//     io.to('admin:users').emit('admin:agent_request', {
//       type: 'live_agent_request',
//       sessionId: notificationData.sessionId,
//       messageId: notificationData.messageId,
//       uniqueUrl: notificationData.uniqueUrl,
//       userInfo: notificationData.userInfo,
//       message: notificationData.message,
//       requestTime: notificationData.requestTime,
//       ipAddress: notificationData.ipAddress,
//       priority: 'high',
//       emailNotificationResult: emailResult
//     });

//     logWithIcon.broadcast(`Admin notifications sent for session ${notificationData.sessionId}: Email=${emailResult.success ? 'Success' : 'Failed'}, Socket=Broadcasted`);
    
//     return {
//       emailNotification: emailResult,
//       socketNotification: { success: true, broadcasted: true },
//       sessionId: notificationData.sessionId,
//       messageId: notificationData.messageId
//     };

//   } catch (error) {
//     logWithIcon.error('Error in notifyAdminsOfPendingRequest:', error);
//     return {
//       emailNotification: { success: false, error: error.message },
//       socketNotification: { success: false, error: error.message },
//       sessionId: notificationData.sessionId,
//       messageId: notificationData.messageId
//     };
//   }
// };

// module.exports = {
//   AdminNotificationService,
//   adminNotificationService,
//   notifyAdminsOfPendingRequest,
//   generateUniqueAgentUrl
// };


// server/services/adminNotificationService.js
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const User = require('../models/userModel');
const { logWithIcon } = require('./consoleIcons');

const FRONTEND_BASE_URL = process.env.FRONTEND_BASE_URL || 'http://localhost:3000';
//const FRONTEND_BASE_URL = process.env.FRONTEND_BASE_URL || 'http://localhost:3000';
const SUPPORT_EMAIL = process.env.SUPPORT_EMAIL || process.env.SMPT_USERNAME || 'support@prosoftsynergies.com';

const generateUniqueAgentUrl = (sessionId, messageId) => {
  try {
    const baseUrl = FRONTEND_BASE_URL.replace(/\/$/, '');
    const timestamp = Date.now();
    const token = crypto.randomBytes(20).toString('hex');
    const safeSession = encodeURIComponent(sessionId?.toString ? sessionId.toString() : String(sessionId));
    const safeMessage = encodeURIComponent(messageId?.toString ? messageId.toString() : String(messageId));
    const uniqueUrl = `${baseUrl}/admin/chat/session/${safeSession}?messageId=${safeMessage}&t=${timestamp}&token=${token}`;
    logWithIcon.success('Generated unique agent URL:', uniqueUrl);
    return uniqueUrl;
  } catch (error) {
    logWithIcon.error('Error generating unique agent URL:', error);
    return `${FRONTEND_BASE_URL}/admin/chat/session/${sessionId}`;
  }
};

const createTransporter = () => {
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT, 10) || 587;
  const user = process.env.SMPT_USERNAME;
  const pass = process.env.SMTP_PASSWORD;
  const secure = (process.env.SMTP_SECURE === 'false') || port === 465;

  // If SMTP not configured return null to skip sending emails but still send sockets
  if (!host || !user || !pass) {
    logWithIcon.warning('SMTP not fully configured (SMTP_HOST/SMTP_USER/SMTP_PASS required). Email sending will be skipped.');
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
    connectionTimeout: parseInt(process.env.SMTP_CONNECTION_TIMEOUT || '30000', 10),
    greetingTimeout: parseInt(process.env.SMTP_GREETING_TIMEOUT || '30000', 10),
    tls: { rejectUnauthorized: false }
  });
};

/**
 * Notify admins of a pending live-agent request.
 * - io: socket.io server instance (required)
 * - payload:
 *    sessionId, messageId, uniqueUrl (optional), userInfo, session, ipAddress, requestTime, message, businessHours
 *
 * Returns detailed result object:
 * {
 *   emailNotification: { success: boolean, details: [...] },
 *   socketNotifications: { sent: number, details: [...] }
 * }
 */
const notifyAdminsOfPendingRequest = async (io, payload = {}) => {
  const result = {
    emailNotification: { success: false, details: [] },
    socketNotifications: { sent: 0, details: [] }
  };

  try {
    if (!io) {
      throw new Error('socket.io instance (io) is required to notify admins');
    }

    const {
      sessionId,
      messageId,
      uniqueUrl: providedUrl,
      userInfo,
      session,
      ipAddress,
      requestTime,
      message,
      businessHours
    } = payload;

    const uniqueUrl = providedUrl || generateUniqueAgentUrl(sessionId, messageId);

    // Prefer admin users who are online/active
    let admins = await User.find({
      role: 1,
      currentStatus: { $in: ['online', 'active'] },
      isActive: { $ne: false }
    }).lean();

    // If none online, fallback to any admin
    if (!admins || admins.length === 0) {
      admins = await User.find({ role: 1, isActive: { $ne: false } }).limit(10).lean();
    }

    logWithIcon.info(`notifyAdminsOfPendingRequest found ${admins.length} admin users`, { sessionId });

    if (!admins || admins.length === 0) {
      result.emailNotification.details.push({ error: 'No admin users found' });
      return result;
    }

    // Build payload for socket notify
    const socketPayload = {
      type: 'live_agent_request',
      sessionId,
      messageId,
      uniqueUrl,
      userInfo,
      message,
      ipAddress,
      requestTime
    };

    // Emit to the admins room so every connected admin socket receives it immediately
    try {
      io.to('admins').emit('notification:live_agent_request', socketPayload);
      logWithIcon.success('Emitted live agent notification to admins room', { sessionId });
      result.socketNotifications.sent += 1; // at least one emit attempt
      result.socketNotifications.details.push({ toRoom: 'admins', emitted: true });
    } catch (emitRoomErr) {
      logWithIcon.error('Failed to emit to admins room:', emitRoomErr);
      result.socketNotifications.details.push({ toRoom: 'admins', emitted: false, error: emitRoomErr.message });
    }

    // Also add per-admin socket emits if socketId present for visibility
    for (const admin of admins) {
      try {
        if (admin.socketId) {
          io.to(admin.socketId).emit('notification:live_agent_request', socketPayload);
          result.socketNotifications.sent += 1;
          result.socketNotifications.details.push({ adminId: admin._id, socketId: admin.socketId, delivered: true });
        } else {
          result.socketNotifications.details.push({ adminId: admin._id, socketId: null, delivered: false });
        }
      } catch (emitErr) {
        logWithIcon.error('Per-admin socket emit error for adminId ' + admin._id, emitErr);
        result.socketNotifications.details.push({ adminId: admin._id, socketId: admin.socketId || null, delivered: false, error: emitErr.message });
      }
    }

    // Prepare email - only if SMTP configured
    const transporter = createTransporter();
    if (!transporter) {
      logWithIcon.warning('Skipping email notifications because transporter is not configured (missing env vars).');
      result.emailNotification.details.push({ info: 'smtp_not_configured' });
      result.emailNotification.success = false;
      return result;
    }

    const subject = `[Live Chat] New live agent request — Session ${sessionId}`;
    const html = `
      <p>Hello Admin,</p>
      <p>A user has requested a live agent.</p>
      <ul>
        <li><strong>Session:</strong> ${sessionId}</li>
        <li><strong>Message ID:</strong> ${messageId}</li>
        <li><strong>User:</strong> ${userInfo?.firstName || userInfo?.firstname || 'Unknown'} ${userInfo?.lastName || ''} (${userInfo?.email || 'no-email'})</li>
        <li><strong>IP:</strong> ${ipAddress || 'unknown'}</li>
        <li><strong>Message:</strong> ${message ? (String(message).length > 200 ? String(message).substring(0, 200) + '…' : message) : 'N/A'}</li>
        <li><strong>Business Hours:</strong> ${businessHours ? JSON.stringify(businessHours) : 'unknown'}</li>
        <li><strong>Requested at:</strong> ${requestTime ? new Date(requestTime).toLocaleString() : new Date().toLocaleString()}</li>
      </ul>
      <p><a href="${uniqueUrl}" target="_blank" style="display:inline-block;padding:10px 14px;background:#007bff;color:#fff;border-radius:4px;text-decoration:none;">Open Chat Session</a></p>
      <p>— System</p>
    `;

    // Send email to each admin in parallel with detailed error logging
    const sendPromises = admins.map(async (admin) => {
      if (!admin.email) {
        logWithIcon.warning('Skipping admin without email:', admin._id);
        return { adminId: admin._id, email: null, success: false, error: 'no_email' };
      }
      const mailOptions = { from: SUPPORT_EMAIL, to: admin.email, subject, html };
      try {
        const info = await transporter.sendMail(mailOptions);
        logWithIcon.success(`Email sent to admin ${admin.email}`, { messageId: info.messageId, adminId: admin._id });
        return { adminId: admin._id, email: admin.email, success: true, messageId: info.messageId };
      } catch (err) {
        logWithIcon.error(`Error sending email to admin ${admin.email}:`, err);
        return { adminId: admin._id, email: admin.email, success: false, error: err.message || String(err) };
      }
    });

    const emailResults = await Promise.all(sendPromises);

    // Close transporter if possible (prevents hanging connections)
    try { if (transporter && typeof transporter.close === 'function') transporter.close(); } catch (closeErr) { logWithIcon.warning('transporter.close() failed:', closeErr); }

    result.emailNotification.details = emailResults;
    result.emailNotification.success = emailResults.some(r => r.success === true);

    return result;
  } catch (error) {
    logWithIcon.error('notifyAdminsOfPendingRequest overall error:', error);
    return result;
  }
};

module.exports = {
  notifyAdminsOfPendingRequest,
  generateUniqueAgentUrl
};
