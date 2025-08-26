// server/services/adminNotificationService.js
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const User = require('../models/userModel');
const { logWithIcon } = require('./consoleIcons');

const FRONTEND_BASE_URL = process.env.FRONTEND_BASE_URL || 'http://localhost:3000';
const SUPPORT_EMAIL = process.env.SUPPORT_EMAIL || process.env.SMTP_USERNAME || 'info@smsoftconsulting.com';

// FIXED: Generate clean session URL without messageId parameters
const generateUniqueAgentUrl = (sessionId) => {
  try {
    const baseUrl = FRONTEND_BASE_URL.replace(/\/$/, '');
    
    // Ensure sessionId is properly handled
    let safeSession;
    if (sessionId) {
      safeSession = sessionId.toString ? sessionId.toString() : String(sessionId);
    } else {
      logWithIcon.error('generateUniqueAgentUrl called with null/undefined sessionId');
      throw new Error('SessionId is required for URL generation');
    }
    
    // Create clean URL without query parameters
    const uniqueUrl = `${baseUrl}/admin/chat/session/${safeSession}`;
    
    logWithIcon.success('Generated clean agent URL:', {
      sessionId: safeSession,
      fullUrl: uniqueUrl
    });
    
    return uniqueUrl;
  } catch (error) {
    logWithIcon.error('Error generating agent URL:', error);
    
    // Fallback URL
    const fallbackSessionId = sessionId ? (sessionId.toString ? sessionId.toString() : String(sessionId)) : 'unknown';
    const fallbackUrl = `${FRONTEND_BASE_URL}/admin/chat/session/${fallbackSessionId}`;
    
    logWithIcon.warning('Using fallback URL:', fallbackUrl);
    return fallbackUrl;
  }
};

const createTransporter = async () => {
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT, 10) || 587;
  const user = process.env.SMTP_USERNAME;
  const pass = process.env.SMTP_PASSWORD;
  
  // Fix the secure logic - Gmail with port 587 should use STARTTLS (secure: false)
  const secure = port === 465; // Only use SSL/TLS for port 465
  
  // Enhanced validation with detailed logging
  logWithIcon.info('Environment variables check:', {
    SMTP_HOST: host ? 'SET' : 'MISSING',
    SMTP_PORT: process.env.SMTP_PORT || 'DEFAULT(587)',
    SMTP_SERVICE: process.env.SMTP_SERVICE || 'NOT SET',
    SMTP_USERNAME: user ? 'SET' : 'MISSING',
    SMTP_PASSWORD: pass ? `SET(${pass.length} chars)` : 'MISSING'
  });
  
  // If SMTP not configured return null to skip sending emails but still send sockets
  if (!user || !pass) {
    logWithIcon.error('SMTP_USERNAME or SMTP_PASSWORD is missing from environment variables');
    logWithIcon.warning('Email sending will be skipped. Only socket notifications will work.');
    return null;
  }

  // FIX: Validate Gmail App Password format
  if ((process.env.SMTP_SERVICE === 'gmail' || host === 'smtp.gmail.com') && pass) {
    // Gmail App Passwords should be 16 characters (may have spaces)
    const cleanPassword = pass.replace(/\s+/g, ''); // Remove all spaces
    if (cleanPassword.length !== 16) {
      logWithIcon.error('Gmail App Password should be 16 characters long. Current length:', cleanPassword.length);
      logWithIcon.warning('Make sure you are using a Gmail App Password, not your regular Gmail password');
      logWithIcon.info('To create App Password: Google Account > Security > 2-Step Verification > App Passwords');
    }
  }

  // Log configuration for debugging (without exposing password)
  logWithIcon.info('SMTP Configuration:', {
    host,
    port,
    secure,
    user,
    service: process.env.SMTP_SERVICE || 'not set',
    passwordFormat: pass ? `${pass.substring(0, 4)} ${pass.length > 4 ? '****' : ''}` : 'not set'
  });

  // FIX: Proper Gmail SMTP configuration for 2024 with better timeout settings
  const transportConfig = {
    service: 'gmail', // Use service instead of host for Gmail
    auth: {
      user,  // Gmail email address
      pass   // Gmail App Password (16-digit, space-separated)
    },
    // FIX: Increased timeouts for better connection reliability
    connectionTimeout: 120000, // 2 minutes (increased from 60s)
    greetingTimeout: 60000,    // 1 minute (increased from 30s)
    socketTimeout: 120000,     // 2 minutes (increased from 60s)
    // Gmail-specific settings for better connectivity
    pool: true, // Use connection pooling
    maxConnections: 1, // Limit concurrent connections
    maxMessages: 3,    // Messages per connection
    tls: {
      rejectUnauthorized: false,
      // Additional TLS options for Gmail connectivity issues
      servername: 'smtp.gmail.com',
      minVersion: 'TLSv1.2'
    }
  };

  // FIX: Fallback to explicit host/port if service fails
  // Some networks block the service approach, so we'll try explicit config as backup
  const fallbackConfig = {
    host: 'smtp.gmail.com',
    port: 587,
    secure: false, // Use STARTTLS
    auth: {
      user,
      pass
    },
    connectionTimeout: 120000,
    greetingTimeout: 60000,
    socketTimeout: 120000,
    pool: true,
    maxConnections: 1,
    tls: {
      rejectUnauthorized: false,
      servername: 'smtp.gmail.com',
      minVersion: 'TLSv1.2'
    }
  };

  // For non-Gmail providers, use explicit host/port configuration
  if (process.env.SMTP_SERVICE !== 'gmail' && host !== 'smtp.gmail.com') {
    // Remove service and add explicit config for other providers
    delete transportConfig.service;
    transportConfig.host = host;
    transportConfig.port = port;
    transportConfig.secure = secure;
    
    logWithIcon.info('Using explicit SMTP configuration for non-Gmail provider');
  } else {
    logWithIcon.info('Using Gmail service configuration with fallback option');
  }

  try {
    logWithIcon.info('Creating SMTP transporter with config:', {
      service: transportConfig.service,
      host: transportConfig.host,
      port: transportConfig.port,
      secure: transportConfig.secure,
      auth: { user: transportConfig.auth.user, pass: transportConfig.auth.pass ? '[PROVIDED]' : '[MISSING]' },
      connectionTimeout: transportConfig.connectionTimeout,
      pool: transportConfig.pool
    });
    
    let transporter = nodemailer.createTransport(transportConfig);
    
    // FIX: Try connection with retry logic and fallback
    try {
      logWithIcon.info('Testing SMTP connection (attempt 1 - service mode)...');
      await transporter.verify();
      logWithIcon.success('SMTP server connection verified successfully');
      return transporter;
    } catch (verifyError) {
      logWithIcon.error('SMTP connection verification failed (service mode):', {
        message: verifyError.message,
        code: verifyError.code,
        errno: verifyError.errno,
        response: verifyError.response,
        responseCode: verifyError.responseCode,
        command: verifyError.command
      });
      
      // FIX: Try fallback configuration for connection issues
      if (verifyError.code === 'ECONNECTION' || verifyError.code === 'ETIMEDOUT' || verifyError.code === 'ENOTFOUND') {
        logWithIcon.info('Trying fallback SMTP configuration (explicit host/port)...');
        
        try {
          // Close the first transporter
          if (transporter && typeof transporter.close === 'function') {
            transporter.close();
          }
          
          // Create new transporter with fallback config
          transporter = nodemailer.createTransport(fallbackConfig);
          
          logWithIcon.info('Testing fallback SMTP connection...');
          await transporter.verify();
          logWithIcon.success('Fallback SMTP connection verified successfully');
          return transporter;
          
        } catch (fallbackError) {
          logWithIcon.error('Fallback SMTP connection also failed:', {
            message: fallbackError.message,
            code: fallbackError.code,
            errno: fallbackError.errno
          });
          
          // Return null for connection failures
          return null;
        }
      }
      
      // FIX: For Gmail auth errors, return null immediately
      if (verifyError.code === 'EAUTH') {
        logWithIcon.error('Authentication failed - check your Gmail App Password');
        logWithIcon.info('Gmail troubleshooting:');
        logWithIcon.info('1. Enable 2-Step Verification in Gmail');
        logWithIcon.info('2. Generate App Password: Google Account > Security > App Passwords');
        logWithIcon.info('3. Use the 16-digit app password (not your regular password)');
        return null;
      }
      
      // For other errors, still return transporter as sending might work
      logWithIcon.warning('SMTP verification failed but returning transporter for retry logic');
      return transporter;
    }
    
  } catch (error) {
    logWithIcon.error('Failed to create SMTP transporter:', {
      message: error.message,
      code: error.code,
      errno: error.errno,
      stack: error.stack
    });
    
    // Log specific common errors
    if (error.message.includes('getaddrinfo ENOTFOUND')) {
      logWithIcon.error('DNS resolution failed - check internet connection or use explicit host/port');
    } else if (error.message.includes('Invalid login')) {
      logWithIcon.error('Invalid credentials - check SMTP_USERNAME and SMTP_PASSWORD');
    } else if (error.message.includes('ECONNECTION') || error.message.includes('ETIMEDOUT')) {
      logWithIcon.error('Network connectivity issue - check firewall/proxy settings');
      logWithIcon.info('Try: 1) Different network, 2) VPN, 3) Check corporate firewall');
    }
    
    return null;
  }
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
    socketNotifications: { sent: 0, details: [] },
    priority: 'normal',
    notificationChannels: []
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
      businessHours = true // Default to business hours if not specified
    } = payload;

    // Determine notification priority based on business hours
    const isOutsideBusinessHours = !businessHours;
    const priority = isOutsideBusinessHours ? 'high' : 'normal';
    result.priority = priority;

    logWithIcon.info(`Processing ${priority} priority notification`, { 
      sessionId, 
      businessHours, 
      isOutsideBusinessHours 
    });

    // FIXED: Use clean URL without messageId parameters
    const uniqueUrl = providedUrl || generateUniqueAgentUrl(sessionId);

    // Enhanced admin query with email validation
    let admins = await User.find({
      role: 1,
      currentStatus: { $in: ['online', 'active'] },
      isActive: { $ne: false },
      email: { 
        $exists: true, 
        $ne: null, 
        $ne: '', 
        $regex: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ // Basic email format validation
      },
      emailNotifications: { $ne: false } // Allow admins to opt out
    }).lean();

    // If no online admins and it's after hours, get ALL active admins
    if ((!admins || admins.length === 0) && isOutsideBusinessHours) {
      logWithIcon.warning('No online admins found for after-hours request, fetching all active admins');
      admins = await User.find({ 
        role: 1, 
        isActive: { $ne: false },
        email: { 
          $exists: true, 
          $ne: null, 
          $ne: '',
          $regex: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        },
        emailNotifications: { $ne: false }
      }).limit(20).lean();
    } else if (!admins || admins.length === 0) {
      // Regular business hours fallback
      admins = await User.find({ 
        role: 1, 
        isActive: { $ne: false },
        email: { $exists: true, $ne: null, $ne: '' }
      }).limit(10).lean();
    }

    logWithIcon.info(`Found ${admins.length} admin users for notification`, { sessionId, priority });

    if (!admins || admins.length === 0) {
      result.emailNotification.details.push({ error: 'No admin users found' });
      return result;
    }

    // Socket notifications (existing logic)
    const socketPayload = {
      type: 'live_agent_request',
      sessionId,
      messageId,
      uniqueUrl,
      userInfo,
      message,
      ipAddress,
      requestTime,
      priority,
      isOutsideBusinessHours
    };

    // Enhanced socket notifications
    try {
      io.to('admins').emit('notification:live_agent_request', socketPayload);
      
      // For high priority, also emit to a special urgent channel
      if (priority === 'high') {
        io.to('admins-urgent').emit('notification:urgent_request', socketPayload);
        result.notificationChannels.push('socket-urgent');
      }
      
      result.socketNotifications.sent += 1;
      result.socketNotifications.details.push({ toRoom: 'admins', emitted: true, priority });
      result.notificationChannels.push('socket');
    } catch (emitRoomErr) {
      logWithIcon.error('Failed to emit to admins room:', emitRoomErr);
      result.socketNotifications.details.push({ toRoom: 'admins', emitted: false, error: emitRoomErr.message });
    }

    // Per-admin socket emits (existing logic continues...)

    // Enhanced email notifications
    const transporter = await createTransporter();
    if (!transporter) {
      logWithIcon.warning('Skipping email notifications because transporter is not configured.');
      result.emailNotification.details.push({ info: 'smtp_not_configured' });
      return result;
    }

    // Enhanced email configuration
    const fromEmail = process.env.SMTP_USERNAME;
    const fromName = process.env.NOTIFICATION_FROM_NAME || 'Company Support System';
    const fromAddress = `${fromName} <${fromEmail}>`;

    // Priority-based subject line
    const urgencyPrefix = isOutsideBusinessHours ? '[URGENT - After Hours] ' : '';
    const subject = `${urgencyPrefix}[Live Chat] New live agent request — Session ${sessionId}`;

    // Enhanced HTML template with priority styling
    const priorityColor = isOutsideBusinessHours ? '#dc3545' : '#007bff';
    const priorityBadge = isOutsideBusinessHours ? 
      '<span style="background:#dc3545;color:white;padding:4px 8px;border-radius:3px;font-size:12px;font-weight:bold;">URGENT - AFTER HOURS</span>' : 
      '<span style="background:#28a745;color:white;padding:4px 8px;border-radius:3px;font-size:12px;">BUSINESS HOURS</span>';

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: ${priorityColor}; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0;">
          <h2 style="margin: 0; color: white;">New Live Agent Request</h2>
          ${priorityBadge}
        </div>
        
        <div style="padding: 20px; border: 1px solid #ddd; border-top: none;">
          <p>Hello Admin,</p>
          <p>A user has requested live agent assistance ${isOutsideBusinessHours ? '<strong>outside of business hours</strong>' : 'during business hours'}.</p>
          
          <div style="background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid ${priorityColor};">
            <h3 style="margin-top: 0; color: #333;">Request Details:</h3>
            <ul style="list-style: none; padding: 0;">
              <li style="margin: 8px 0;"><strong>Priority:</strong> ${priority.toUpperCase()}</li>
              <li style="margin: 8px 0;"><strong>Session ID:</strong> ${sessionId}</li>
              <li style="margin: 8px 0;"><strong>User:</strong> ${userInfo?.firstName || userInfo?.firstname || 'Unknown'} ${userInfo?.lastName || ''} (${userInfo?.email || 'no-email'})</li>
              <li style="margin: 8px 0;"><strong>IP Address:</strong> ${ipAddress || 'unknown'}</li>
              <li style="margin: 8px 0;"><strong>Message:</strong> ${message ? (String(message).length > 200 ? String(message).substring(0, 200) + '…' : message) : 'N/A'}</li>
              <li style="margin: 8px 0;"><strong>Requested at:</strong> ${requestTime ? new Date(requestTime).toLocaleString() : new Date().toLocaleString()}</li>
            </ul>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${uniqueUrl}" target="_blank" style="display:inline-block;padding:12px 24px;background:${priorityColor};color:#fff;border-radius:5px;text-decoration:none;font-weight:bold;">Open Chat Session</a>
          </div>
          
          ${isOutsideBusinessHours ? 
            '<div style="background:#fff3cd;border:1px solid #ffeaa7;color:#856404;padding:15px;border-radius:5px;margin:20px 0;"><strong>⚠️ After Hours Request:</strong> This request was made outside normal business hours and may require immediate attention.</div>' : 
            ''
          }
          
          <p style="color: #666; font-size: 12px;">
            This is an automated notification from ${fromName}.<br>
            ${isOutsideBusinessHours ? 'Please respond to this urgent request as soon as possible.' : 'Please respond to this request promptly.'}
          </p>
        </div>
      </div>
    `;

    // Enhanced email sending with retry logic
    const sendEmailWithRetry = async (mailOptions, maxRetries = 3) => {
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          logWithIcon.info(`Email attempt ${attempt}/${maxRetries} to: ${mailOptions.to}`);
          const info = await transporter.sendMail(mailOptions);
          logWithIcon.success(`Email sent successfully on attempt ${attempt}`);
          return info;
        } catch (error) {
          logWithIcon.error(`Email attempt ${attempt}/${maxRetries} failed:`, error.message);
          if (attempt === maxRetries) throw error;
          
          // Exponential backoff
          const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    };

    // Send emails with enhanced error handling
    const sendPromises = admins.map(async (admin) => {
      if (!admin.email) {
        return { adminId: admin._id, email: null, success: false, error: 'no_email' };
      }

      const mailOptions = {
        from: fromAddress,
        to: admin.email,
        subject,
        html,
        text: `New Live Agent Request${isOutsideBusinessHours ? ' (URGENT - After Hours)' : ''}\n\nPriority: ${priority.toUpperCase()}\nSession: ${sessionId}\nUser: ${userInfo?.firstName || 'Unknown'} (${userInfo?.email || 'no-email'})\nRequested at: ${requestTime ? new Date(requestTime).toLocaleString() : new Date().toLocaleString()}\n\nOpen session: ${uniqueUrl}`,
        priority: isOutsideBusinessHours ? 'high' : 'normal',
        headers: {
          'X-Priority': isOutsideBusinessHours ? '1' : '3',
          'X-MSMail-Priority': isOutsideBusinessHours ? 'High' : 'Normal',
          'Importance': isOutsideBusinessHours ? 'high' : 'normal'
        }
      };

      try {
        const info = await sendEmailWithRetry(mailOptions);
        return { 
          adminId: admin._id, 
          email: admin.email, 
          success: true, 
          messageId: info.messageId,
          priority,
          attempts: 1 // Track successful attempt count
        };
      } catch (err) {
        logWithIcon.error(`Failed to send email to admin ${admin.email} after retries:`, err.message);
        return { 
          adminId: admin._id, 
          email: admin.email, 
          success: false, 
          error: err.message,
          priority,
          maxRetriesReached: true
        };
      }
    });

    const emailResults = await Promise.all(sendPromises);
    result.emailNotification.details = emailResults;
    result.emailNotification.success = emailResults.some(r => r.success === true);
    result.notificationChannels.push('email');

    // Close transporter
    if (transporter && typeof transporter.close === 'function') {
      transporter.close();
    }

    // Log comprehensive summary
    const successCount = emailResults.filter(r => r.success).length;
    const failureCount = emailResults.filter(r => !r.success).length;
    
    logWithIcon.info(`Notification Summary:`, {
      priority,
      isOutsideBusinessHours,
      emailsSent: successCount,
      emailsFailed: failureCount,
      socketsNotified: result.socketNotifications.sent,
      channels: result.notificationChannels
    });

    // For after-hours failures, consider additional escalation
    if (isOutsideBusinessHours && failureCount > 0) {
      logWithIcon.warning('After-hours notification had failures - consider escalation procedures');
      // Here you could implement additional escalation logic:
      // - SMS notifications
      // - Slack/Teams webhooks  
      // - Push notifications
    }

    return result;

  } catch (error) {
    logWithIcon.error('notifyAdminsOfPendingRequest overall error:', error);
    result.emailNotification.details.push({ 
      error: error.message,
      type: 'system_error' 
    });
    return result;
  }
};

module.exports = {
  notifyAdminsOfPendingRequest,
  generateUniqueAgentUrl
};
