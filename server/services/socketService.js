//server/services/socketService.js
const mongoose = require('mongoose');
const os = require('os');
const dotenv = require("dotenv");
const User = require('../models/userModel');
const ActivitySession = require('../models/activitySessionModel');
const IdleTracking = require('../models/idleTrackingModel');
const ActivityLog = require('../models/activityLogModel');
const ChatSession = require('../models/chatSessionModel');
const ChatMessage = require('../models/chatMessageModel');
const LiveAgent = require('../models/liveAgentModel');
const GuestUser = require('../models/guestUserModel');
const ChatTemplate = require('../models/chatTemplateModel');
const agentAssignment = require('./agentAssignmentService');
const { logWithIcon } = require('./consoleIcons');
const ChatMessageController = require('../controllers/chatMessageController');
const SocketChatController = require('../controllers/socketChatController');
const ChatSessionController = require('../controllers/chatSessionController');
const businessHoursAdapter = require('./businessHoursAdapter');
const { join } = require('path');
const chatTemplateCache = require('./chatTemplateCache');


dotenv.config();
// Valid statuses your system supports
const VALID_STATUSES = ['offline', 'online', 'active', 'idle', 'away'];
const VALID_ACTIVITY_TYPES = [
  'login', 'logout', 'idle_start', 'idle_end', 'auto_logout',
  'session_start', 'session_end', 'session_resume', 'session_pause',
  'tab_hidden', 'tab_visible', 'connection_lost', 'reconnected',
  'page_focus', 'page_blur', 'mouse_activity', 'keyboard_activity',
  'manual_override', 'page_unload', 'component_unmount'
];

const generateUniqueMessageId = () => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 15);
  const extra = Math.random().toString(36).substring(2, 8);
  return `msg_${timestamp}_${random}_${extra}`;
};

const sessionMessageTracking = new Map();

const addMessageToSession = (sessionId, messageId) => {
  if (!sessionMessageTracking.has(sessionId)) {
    sessionMessageTracking.set(sessionId, new Set());
  }
  sessionMessageTracking.get(sessionId).add(messageId);
};

const hasMessage = (sessionId, messageId) => {
  return sessionMessageTracking.has(sessionId) && 
         sessionMessageTracking.get(sessionId).has(messageId);
};

// Get Client IP helper with multiple fallbacks and proxy-awareness
const getClientIP = (socket) => {
  const forwarded = socket.handshake.headers['x-forwarded-for'];
  const real = socket.handshake.headers['x-real-ip'];
  const cfConnectingIP = socket.handshake.headers['cf-connecting-ip'];

  const isPrivateOrLocalIP = (ip) => {
    if (!ip) return true;
    const cleanIP = ip.startsWith('::ffff:') ? ip.substring(7) : ip;
    if (cleanIP === '127.0.0.1' || cleanIP === '::1' || cleanIP === 'localhost') return true;
    const privateRanges = [
      /^10\./,
      /^172\.(1[6-9]|2[0-9]|3[01])\./,
      /^192\.168\./,
      /^169\.254\./,
      /^fc00:/,
      /^fe80:/
    ];
    return privateRanges.some(range => range.test(cleanIP));
  };

  const getServerPublicIP = () => {
    const interfaces = os.networkInterfaces();
    for (const iface in interfaces) {
      for (const addr of interfaces[iface]) {
        if (!addr.internal && addr.family === 'IPv4' && !isPrivateOrLocalIP(addr.address)) {
          return addr.address;
        }
      }
    }
    return null;
  };
  if (process.env.NODE_ENV === 'development') {
    console.log('Debug client IP headers:', {
      'cf-connecting-ip': cfConnectingIP,
      'x-real-ip': real,
      'x-forwarded-for': forwarded,
      'handshake.address': socket.handshake.address,
      'request.connection.remoteAddress': socket.request.connection?.remoteAddress,
      'conn.remoteAddress': socket.conn?.remoteAddress
    });
  }

  // Priority: cf-connecting-ip (Cloudflare)
  if (cfConnectingIP && !isPrivateOrLocalIP(cfConnectingIP)) return cfConnectingIP;
  // Then x-real-ip
  if (real && !isPrivateOrLocalIP(real)) return real;

  // Then x-forwarded-for header (may contain multiple IPs)
  if (forwarded) {
    const ips = forwarded.split(',').map(ip => ip.trim());
    const publicIP = ips.find(ip => !isPrivateOrLocalIP(ip));
    if (publicIP) return publicIP;
  }

  // Then socket handshake address, request connection, or socket connection address
  let socketIP = socket.handshake.address || socket.request.connection?.remoteAddress || socket.conn?.remoteAddress;
  if (socketIP && socketIP.startsWith('::ffff:')) socketIP = socketIP.substring(7);
  if (socketIP && !isPrivateOrLocalIP(socketIP)) return socketIP;

  // Fallback: Server's public IP (development/testing)
  const serverIP = getServerPublicIP();
  if (serverIP) {
    logWithIcon.success(`[IP Debug] Using server public IP as fallback: ${serverIP}`);
    return serverIP;
  }
  // Last-resort return: any available IP or 'unknown'
  return cfConnectingIP || real || (forwarded ? forwarded.split(',')[0].trim() : null) || socketIP || 'unknown';
};

const createUserIdentifier = (user, ipAddress) => {
  const email = user.email || 'unknown@email.com';
  const cleanIP = ipAddress === 'unknown' ? 'no-ip' : ipAddress.replace(/\./g, '-').replace(/:/g, '-');
  return `${email}@${cleanIP}`;
};

const validateStatus = (status) => VALID_STATUSES.includes(status) ? status : 'offline';
const validateActivityType = (activityType) => VALID_ACTIVITY_TYPES.includes(activityType) ? activityType : 'general';

// Helper function to safely convert to ObjectId
const toObjectId = (id) => {
  if (!id) return null;
  if (mongoose.Types.ObjectId.isValid(id)) {
    return new mongoose.Types.ObjectId(id);
  }
  return null;
};

// Update user document status
const updateUserStatus = async (userId, status, additionalData = {}, ipAddress = 'unknown') => {
  try {
    const updateData = {
      currentStatus: validateStatus(status),
      lastActivity: new Date(),
      lastKnownIP: ipAddress,
      ...additionalData
    };
    await User.findByIdAndUpdate(userId, updateData);
    logWithIcon.success(`Updated user ${userId} status to ${status} from IP ${ipAddress}`);
  } catch (error) {
    logWithIcon.error(`Error updating user status:`, error);
  }
};

const createUserInfo = (user) => ({
  userId: user._id || user.userId,
  email: user.email,
  firstName: user.firstname || user.firstName,
  lastName: user.lastname || user.lastName,
  role: user.role,
  photo: user.photo
});

// Emit status changes and activity events to all clients
const emitAdminStatusChange = (io, data) => {
  logWithIcon.broadcast(`Emitting admin status change: ${data.status} for user ${data.userInfo?.email}`);
  io.emit('statusChanged', data);
  if (data.status === 'online' || data.status === 'active') io.emit('adminOnline', data);
  else if (data.status === 'offline') io.emit('adminOffline', data);
  else if (data.status === 'idle') io.emit('adminIdle', data);
  else if (data.status === 'away') io.emit('adminAway', data);
};

const logAndEmitActivity = async (socket, io, data) => {
  try {
    const {
      userId,
      activityType,
      sessionId,
      timestamp = new Date(),
      metadata = {},
      emitToAdmins = true
    } = data;

    const ipAddress = getClientIP(socket);
    const userIdentifier = createUserIdentifier(socket.user, ipAddress);

    logWithIcon.logging(`Logging activity: ${activityType} for ${userIdentifier}`);

    const user = await User.findById(userId).select('email');
    const email = user?.email || 'unknown@email.com';

    const activityLog = new ActivityLog({
      userId,
      email,
      sessionId: sessionId ? toObjectId(sessionId) : null,
      activityType: validateActivityType(activityType),
      timestamp,
      ipAddress,
      metadata: {
        userAgent: socket.handshake.headers['user-agent'],
        ip: ipAddress,
        userIdentifier,
        socketId: socket.id,
        ...metadata
      }
    });

    await activityLog.save();

    if (emitToAdmins) {
      const emitData = {
        userId,
        activityType,
        timestamp: timestamp.getTime(),
        userInfo: createUserInfo(socket.user),
        userIdentifier,
        ipAddress,
        metadata: {
          ...metadata,
          socketId: socket.id
        }
      };

      io.emit('activityLogged', emitData);
      io.emit(`activity:${activityType}`, emitData);
    }
  } catch (error) {
    logWithIcon.error('Error logging activity:', error);
  }
};

// Get all admins with their session and status info for initial frontend sync
const getAllAdminsWithSessions = async () => {
  try {
    const admins = await User.find({ role: 1 }).lean();
    const adminsWithSessions = [];

    for (const admin of admins) {
      const activeSession = await ActivitySession.findOne({
        userId: admin._id,
        sessionStatus: 'active'
      }).lean();

      const latestActivity = await ActivityLog.findOne({
        userId: admin._id
      }).sort({ timestamp: -1 }).lean();

      adminsWithSessions.push({
        ...admin,
        loginLatestSession: activeSession,
        currentStatus: validateStatus(admin.currentStatus),
        lastActivity: admin.lastActivity || admin.updatedAt,
        lastKnownIP: admin.lastKnownIP || 'unknown',
        latestActivity
      });
    }

    return adminsWithSessions;
  } catch (error) {
    logWithIcon.error('Error getting admins with sessions:', error);
    return [];
  }
};

// Handle new socket connection logic
const handleConnection = async (socket, io) => {
  let userId, ipAddress, userIdentifier;

  try {
    if (!socket.user) {
      logWithIcon.warning('No user data attached to socket on connection');
      return;
    }

    userId = socket.user._id.toString();
    ipAddress = getClientIP(socket);
    userIdentifier = createUserIdentifier(socket.user, ipAddress);

    logWithIcon.connection(`User connected: ${userIdentifier}`);

    // Set user status online & update last login
    await updateUserStatus(userId, 'online', { lastLogin: new Date(), socketId: socket.id }, ipAddress);

    // FIX: Enhanced admin session handling (role === 1)
    if (socket.user.role === 1) {
      logWithIcon.info(`Processing admin connection for ${userIdentifier}`);
      
      try {
        // Step 1: Check for existing active session
        let activeSession = await ActivitySession.findOne({
          userId: toObjectId(userId),
          sessionStatus: 'active'
        });

        if (activeSession) {
          logWithIcon.info(`Found existing active session for admin ${userIdentifier}`);
          
          // Update existing session
          activeSession.socketId = socket.id;
          activeSession.lastActivity = new Date();
          activeSession.ipAddress = ipAddress;
          activeSession.userAgent = socket.handshake.headers['user-agent'] || 'Unknown';
          
          try {
            await activeSession.save();
            logWithIcon.success(`Updated existing session for admin ${userIdentifier}`);
          } catch (updateError) {
            logWithIcon.error('Error updating existing admin session:', updateError);
            // Continue with existing session even if update fails
          }
        } else {
          logWithIcon.info(`Creating new session for admin ${userIdentifier}`);
          
          // Step 2: Create new session with comprehensive error handling
          const sessionData = {
            userId: toObjectId(userId),
            loginTime: new Date(),
            sessionStatus: 'active',
            ipAddress: ipAddress,
            userAgent: socket.handshake.headers['user-agent'] || 'Unknown Browser',
            socketId: socket.id,
            // Add additional fields that might be required
            totalIdleTime: 0,
            totalWorkTime: 0,
            metadata: {
              userIdentifier,
              connectionType: 'new_connection',
              browserInfo: socket.handshake.headers['user-agent'] || 'Unknown'
            }
          };

          try {
            activeSession = new ActivitySession(sessionData);
            await activeSession.save();
            logWithIcon.success(`Successfully created NEW session for admin ${userIdentifier}`);
          } catch (createError) {
            logWithIcon.error('Detailed session creation error:', {
              error: createError.message,
              code: createError.code,
              name: createError.name,
              sessionData: JSON.stringify(sessionData, null, 2),
              userId: userId,
              userIdentifier: userIdentifier
            });
            
            // Check if it's a validation error
            if (createError.name === 'ValidationError') {
              logWithIcon.error('Validation errors:', createError.errors);
              
              // Try to fix common validation issues
              const fixedSessionData = {
                userId: toObjectId(userId),
                loginTime: new Date(),
                sessionStatus: 'active',
                ipAddress: ipAddress || 'unknown',
                userAgent: (socket.handshake.headers['user-agent'] || 'Unknown Browser').substring(0, 500), // Limit length
                socketId: socket.id
              };
              
              try {
                activeSession = new ActivitySession(fixedSessionData);
                await activeSession.save();
                logWithIcon.success(`Created session with fixed data for admin ${userIdentifier}`);
              } catch (retryError) {
                logWithIcon.error('Retry session creation also failed:', retryError);
                return; // Exit if we can't create session at all
              }
            } else {
              logWithIcon.error('Non-validation error creating session:', createError);
              return; // Exit for other types of errors
            }
          }
        }

        // Step 3: Log activity only after successful session handling
        if (activeSession && activeSession._id) {
          const now = new Date();
          
          try {
            await logAndEmitActivity(socket, io, {
              userId,
              activityType: 'login',
              sessionId: activeSession._id,
              timestamp: now,
              metadata: {
                userIdentifier,
                connectionType: activeSession.loginTime.getTime() === now.getTime() ? 'new_session' : 'reconnection',
                sessionCreated: !activeSession.loginTime || activeSession.loginTime.getTime() === now.getTime()
              }
            });
          } catch (activityError) {
            logWithIcon.error('Error logging admin activity:', activityError);
            // Continue even if activity logging fails
          }

          // Step 4: Emit status change only after everything is set up
          try {
            emitAdminStatusChange(io, {
              userId,
              status: 'online',
              previousStatus: 'offline',
              loginLatestSession: activeSession.toObject ? activeSession.toObject() : activeSession,
              userInfo: createUserInfo(socket.user),
              userIdentifier,
              ipAddress,
              timestamp: now.getTime(),
              sessionId: activeSession._id
            });
            
            logWithIcon.success(`Admin connection fully processed for ${userIdentifier}`);
          } catch (emitError) {
            logWithIcon.error('Error emitting admin status change:', emitError);
            // Continue even if emit fails
          }
        } else {
          logWithIcon.error('No valid session available after creation attempts');
        }

      } catch (adminError) {
        logWithIcon.error('Critical error in admin session handling:', {
          error: adminError.message,
          stack: adminError.stack,
          userId: userId,
          userIdentifier: userIdentifier
        });
      }
    } else {
      // Non-admin user connection (existing logic)
      logWithIcon.info(`Regular user connected: ${userIdentifier}`);
    }
  } catch (err) {
    logWithIcon.error(`Critical error during connection handling:`, {
      error: err.message,
      stack: err.stack,
      userId: userId || 'unknown',
      socketId: socket.id,
      hasUser: !!socket.user
    });
  }
};

const debugActivitySessionModel = async () => {
  try {
    // Check if the model is properly loaded
    logWithIcon.info('ActivitySession model debug:', {
      modelExists: !!ActivitySession,
      modelName: ActivitySession?.modelName,
      collection: ActivitySession?.collection?.name
    });
    
    // Try to get the schema
    if (ActivitySession.schema) {
      const requiredFields = [];
      const optionalFields = [];
      
      ActivitySession.schema.eachPath((pathname, schematype) => {
        if (schematype.isRequired) {
          requiredFields.push(pathname);
        } else {
          optionalFields.push(pathname);
        }
      });
      
      logWithIcon.info('ActivitySession schema info:', {
        requiredFields,
        totalFields: Object.keys(ActivitySession.schema.paths).length
      });
    }
  } catch (debugError) {
    logWithIcon.error('Error debugging ActivitySession model:', debugError);
  }
};

const createActivitySessionSafely = async (sessionData) => {
  try {
    // Validate required fields based on common MongoDB session schemas
    const safeSessionData = {
      userId: sessionData.userId,
      loginTime: sessionData.loginTime || new Date(),
      sessionStatus: sessionData.sessionStatus || 'active',
      ipAddress: (sessionData.ipAddress || 'unknown').substring(0, 45), // Limit IP length
      userAgent: (sessionData.userAgent || 'Unknown').substring(0, 500), // Limit UA length
      socketId: sessionData.socketId,
      totalIdleTime: sessionData.totalIdleTime || 0,
      totalWorkTime: sessionData.totalWorkTime || 0
    };
    
    // Remove undefined values
    Object.keys(safeSessionData).forEach(key => {
      if (safeSessionData[key] === undefined) {
        delete safeSessionData[key];
      }
    });
    
    logWithIcon.info('Creating session with safe data:', safeSessionData);
    
    const session = new ActivitySession(safeSessionData);
    await session.save();
    
    return session;
  } catch (error) {
    logWithIcon.error('Safe session creation failed:', error);
    throw error;
  }
};

// Handle disconnect event
const handleDisconnect = async (socket, io, reason) => {
  try {
    if (!socket.user) return;

    const userId = socket.user._id.toString();
    const ipAddress = getClientIP(socket);
    const userIdentifier = createUserIdentifier(socket.user, ipAddress);

    logWithIcon.disconnect(`User disconnect: ${userIdentifier}, reason: ${reason}`);

    await updateUserStatus(userId, 'offline', {}, ipAddress);

    if (socket.user.role === 1) {
      const session = await ActivitySession.findOne({
        userId: toObjectId(userId),
        sessionStatus: 'active'
      });

      if (session) {
        const now = new Date();
        const sessionDuration = now - session.loginTime;

        if (session.idleStartTime) {
          const idleDuration = now - session.idleStartTime;
          session.totalIdleTime = (session.totalIdleTime || 0) + idleDuration;

          await IdleTracking.findOneAndUpdate(
            { userId: toObjectId(userId), sessionId: session._id, idleEndTime: null },
            {
              idleEndTime: now,
              idleDuration,
              "metadata.disconnectReason": reason,
              "metadata.userIdentifier": userIdentifier
            }
          );
        }

        session.logoutTime = now;
        session.sessionStatus = 'ended';
        session.totalWorkTime = sessionDuration - (session.totalIdleTime || 0);
        await session.save();

        await logAndEmitActivity(socket, io, {
          userId,
          activityType: 'logout',
          sessionId: session._id,
          timestamp: now,
          metadata: {
            reason,
            sessionDuration,
            totalIdleTime: session.totalIdleTime || 0,
            userIdentifier
          }
        });

        emitAdminStatusChange(io, {
          userId,
          status: 'offline',
          userInfo: createUserInfo(socket.user),
          userIdentifier,
          ipAddress,
          timestamp: now.getTime(),
          activityType: 'logout',
          sessionId: session._id
        });
      }
    }
  } catch (error) {
    logWithIcon.error('Error during disconnect handling:', error);
  }
};

// Handle generic user activity updates
const handleUserActivity = async (socket, io, data) => {
  if (!socket.user || (!socket.user._id && !socket.user.userId)) return;

  const userId = (socket.user._id || socket.user.userId).toString();
  const ipAddress = getClientIP(socket);
  const userIdentifier = createUserIdentifier(socket.user, ipAddress);
  let status = validateStatus(data.status || 'active');
  const now = data.timestamp ? new Date(data.timestamp) : new Date();

  try {
    const session = await ActivitySession.findOne({
      userId: toObjectId(userId),
      sessionStatus: 'active'
    });

    if (!session) {
      logWithIcon.warning('No active session found for activity');
      return;
    }

    const currentUser = await User.findById(userId).select('currentStatus');
    const previousStatus = currentUser ? currentUser.currentStatus : 'offline';
    let shouldEmitStatusChange = false;

    // Detect status transitions and update sessions, idle tracking accordingly
    if (status === 'idle') {
      if (!session.idleStartTime && ['active', 'online'].includes(previousStatus)) {
        session.idleStartTime = now;
        await session.save();

        await IdleTracking.create({
          userId: toObjectId(userId),
          sessionId: session._id,
          idleStartTime: now,
          metadata: {
            userIdentifier,
            ipAddress,
            previousStatus
          }
        });

        shouldEmitStatusChange = true;
      }
    } else if (status === 'away') {
      if (previousStatus === 'idle') {
        if (!session.idleStartTime) {
          session.idleStartTime = now;
        }
        await session.save();

        await IdleTracking.findOneAndUpdate(
          { userId: toObjectId(userId), sessionId: session._id, idleEndTime: null },
          {
            metadata: {
              transitionedToAway: true,
              awayStartTime: now,
              userIdentifier,
              ipAddress
            }
          },
          { upsert: true }
        );

        shouldEmitStatusChange = true;
      }
    } else if (status === 'active') {
      if (session.idleStartTime && ['idle', 'away'].includes(previousStatus)) {
        const idleDurationMs = now - session.idleStartTime;
        session.totalIdleTime = (session.totalIdleTime || 0) + idleDurationMs;
        session.idleStartTime = null;
        session.totalWorkTime = now - session.loginTime - session.totalIdleTime;
        await session.save();

        await IdleTracking.findOneAndUpdate(
          { userId: toObjectId(userId), sessionId: session._id, idleEndTime: null },
          {
            idleEndTime: now,
            idleDuration: idleDurationMs,
            "metadata.resumedFrom": previousStatus,
            "metadata.userIdentifier": userIdentifier
          },
          { new: true }
        );

        shouldEmitStatusChange = true;
      } else if (['offline', 'online'].includes(previousStatus)) {
        shouldEmitStatusChange = true;
      }
    }

    if (status === 'idle' && !shouldEmitStatusChange) {
      shouldEmitStatusChange = previousStatus !== 'idle';
    }

    await updateUserStatus(userId, status, { lastActivity: now }, ipAddress);

    if (socket.user.role === 1 && shouldEmitStatusChange) {
      const updatedSession = await ActivitySession.findById(session._id).lean();

      emitAdminStatusChange(io, {
        userId,
        status,
        previousStatus,
        loginLatestSession: updatedSession,
        userInfo: createUserInfo(socket.user),
        userIdentifier,
        ipAddress,
        timestamp: now.getTime(),
        sessionId: session._id
      });
    }

    // Log each activity event regardless of whether status changed
    await logAndEmitActivity(socket, io, {
      userId,
      activityType: `status_update_${status}`,
      sessionId: session._id,
      timestamp: now,
      metadata: {
        previousStatus,
        newStatus: status,
        userIdentifier
      }
    });
  } catch (err) {
    logWithIcon.error(`Error processing user activity: ${err}`);
  }
};

// Similar handler for specific activity event types (tab visibility, mouse, keyboard etc.)
const handleSpecificActivity = async (socket, io, data) => {
  if (!socket.user || (!socket.user._id && !socket.user.userId)) return;

  const userId = (socket.user._id || socket.user.userId).toString();
  const ipAddress = getClientIP(socket);
  const userIdentifier = createUserIdentifier(socket.user, ipAddress);
  const { activityType, timestamp, metadata = {} } = data;
  const now = timestamp ? new Date(timestamp) : new Date();

  try {
    const session = await ActivitySession.findOne({
      userId: toObjectId(userId),
      sessionStatus: 'active'
    });

    const currentUser = await User.findById(userId).select('currentStatus');
    const previousStatus = currentUser ? currentUser.currentStatus : 'offline';
    let newStatus = previousStatus;
    let shouldEmitStatusChange = false;

    switch (activityType) {
      case 'tab_hidden':
        newStatus = 'idle';
        shouldEmitStatusChange = previousStatus !== 'idle';
        break;

      case 'tab_visible':
      case 'page_focus':
      case 'mouse_activity':
      case 'keyboard_activity':
        newStatus = 'active';
        shouldEmitStatusChange = previousStatus !== 'active';
        break;

      case 'page_blur':
        newStatus = 'idle';
        shouldEmitStatusChange = previousStatus !== 'idle';
        break;

      case 'session_pause':
        newStatus = 'away';
        shouldEmitStatusChange = previousStatus !== 'away';
        if (session) session.sessionStatus = 'paused';
        break;

      case 'session_resume':
        newStatus = 'active';
        shouldEmitStatusChange = previousStatus !== 'active';
        if (session) session.sessionStatus = 'active';
        break;

      case 'idle_start':
        newStatus = 'idle';
        shouldEmitStatusChange = previousStatus !== 'idle';
        if (session) session.idleStartTime = now;
        break;

      case 'idle_end':
        newStatus = 'active';
        shouldEmitStatusChange = previousStatus !== 'active';
        if (session && session.idleStartTime) {
          const idleDuration = now - session.idleStartTime;
          session.totalIdleTime = (session.totalIdleTime || 0) + idleDuration;
          session.idleStartTime = null;
        }
        break;
    }

    if (session && shouldEmitStatusChange) {
      await session.save();
    }

    if (shouldEmitStatusChange) {
      await updateUserStatus(userId, newStatus, {}, ipAddress);
    }

    await logAndEmitActivity(socket, io, {
      userId,
      activityType,
      sessionId: session ? session._id : null,
      timestamp: now,
      metadata: {
        ...metadata,
        previousStatus,
        newStatus,
        userIdentifier
      }
    });

    if (socket.user.role === 1 && shouldEmitStatusChange) {
      const updatedSession = session ? await ActivitySession.findById(session._id).lean() : null;

      emitAdminStatusChange(io, {
        userId,
        status: newStatus,
        previousStatus,
        loginLatestSession: updatedSession,
        userInfo: createUserInfo(socket.user),
        userIdentifier,
        ipAddress,
        timestamp: now.getTime(),
        activityType,
        sessionId: session ? session._id : null
      });
    }
  } catch (error) {
    logWithIcon.error('Error handling specific activity:', error);
  }
};


// =================== CHAT FUNCTIONALITY STARTS HERE..... =================
const handleChatSessionCreate = async (socket, io, payload, ack) => {
  try {
    const { 
      sessionType = 'bot', 
      guestEmail, 
      firstName,
      lastName,
      email,
      phone,
      metadata = {} 
    } = payload;
    
    const userId = socket.user?._id?.toString();
    const isAuthenticated = !!userId;

    let userInfo = {};
    let guestUserId = null;

    // Handle user info
    if (isAuthenticated) {
      const user = await User.findById(userId);
      if (!user) {
        const error = 'Authenticated user not found in database';
        if (ack) ack({ error });
        return { error };
      }
      
      userInfo = {
        firstName: user.firstname || user.firstName || 'User',
        lastName: user.lastname || user.lastName || '',
        email: user.email,
        phone: user.phone || ''
      };
    } else {
      const guestEmailToUse = guestEmail || email;
      
      if (!guestEmailToUse || !firstName) {
        const error = 'Email and first name are required for guest users';
        if (ack) ack({ error });
        return { error };
      }

      let guestUser = await GuestUser.findOne({ email: guestEmailToUse.toLowerCase() });
      
      if (!guestUser) {
        guestUser = new GuestUser({
          firstName: firstName.trim(),
          lastName: lastName?.trim() || '',
          email: guestEmailToUse.toLowerCase(),
          phone: phone?.trim() || ''
        });
        await guestUser.save();
      } else {
        guestUser.firstName = firstName.trim();
        if (lastName) guestUser.lastName = lastName.trim();
        if (phone) guestUser.phone = phone.trim();
        if (guestUser.schema.paths.lastSeen) {
          guestUser.lastSeen = new Date();
        }
        await guestUser.save();
      }
      
      userInfo = {
        firstName: guestUser.firstName,
        lastName: guestUser.lastName,
        email: guestUser.email,
        phone: guestUser.phone
      };
      guestUserId = guestUser._id;
    }

    // Create session
    const session = new ChatSession({
      userId: isAuthenticated ? userId : null,
      guestUserId,
      sessionType,
      userInfo,
      status: 'active',
      createdDuringBusinessHours: socket.isBusinessHours || false,
      metadata: {
        ...metadata,
        userAgent: socket.handshake.headers['user-agent'] || '',
        ipAddress: getClientIP(socket),
        isAuthenticated,
        isGuest: !isAuthenticated && !!guestUserId,
        trackingId: !isAuthenticated && guestUserId ? guestUserId.toString() : userId
      }
    });

    await session.save();

    // Create metrics
    const ChatMetrics = require('../models/chatMetricsModel');
    const now = new Date();
    const metrics = new ChatMetrics({
      sessionId: session._id,
      userId: isAuthenticated ? userId : null,
      guestUserId,
      startTime: now,
      requestTime: now,
      sessionMetrics: { startTime: now },
      messageCount: { total: 0, userMessages: 0, agentMessages: 0, botMessages: 0 },
      outsideBusinessHours: !socket.isBusinessHours,
      businessHoursMetrics: {
        requestedDuringHours: socket.isBusinessHours || false,
        servedDuringHours: socket.isBusinessHours || false
      }
    });
    await metrics.save();

    // Create welcome message ONCE
    let welcomeMessage = null;
    if (sessionType === 'bot') {
      welcomeMessage = await createWelcomeMessage(session, userInfo, isAuthenticated);
    }

    // Join session room
    socket.join(`session:${session._id}`);
    
    const response = {
      success: true,
      session: session.toObject(),
      metrics: metrics.toObject(),
      welcomeMessage,
      businessHours: socket.businessHoursInfo,
      userTracking: {
        isAuthenticated,
        isGuest: !isAuthenticated && !!guestUserId,
        trackingId: !isAuthenticated && guestUserId ? guestUserId.toString() : userId,
        userInfo
      }
    };

    logWithIcon.success('Chat session created successfully');
    if (ack) ack(null, { body: { data: response } });
    return { body: { data: response } };
    
  } catch (error) {
    logWithIcon.error('Chat session creation error:', error);
    const errorMessage = error?.message || 'Failed to create chat session';
    if (ack) ack({ error: errorMessage });
    return { error: errorMessage };
  }
};

const formatQuickReplies = (quickReplies) => {
  if (!quickReplies) return [];
  
  // If already an array, validate and clean it
  if (Array.isArray(quickReplies)) {
    return quickReplies.map(reply => {
      if (typeof reply === 'string') {
        return reply.trim();
      } else if (reply && typeof reply === 'object') {
        // Extract text from object format {text: "...", value: "..."}
        return reply.text || reply.value || String(reply);
      }
      return String(reply || '').trim();
    }).filter(item => item && item.length > 0); // Remove empty values
  }
  
  // If it's a string, try to parse it
  if (typeof quickReplies === 'string') {
    const str = quickReplies.trim();
    
    // Check if it looks like a JSON array or object
    if (str.startsWith('[') || str.startsWith('{')) {
      try {
        const parsed = JSON.parse(str);
        if (Array.isArray(parsed)) {
          return formatQuickReplies(parsed); // Recursive call
        } else if (parsed && typeof parsed === 'object') {
          // Single object, extract text/value
          return [parsed.text || parsed.value || String(parsed)].filter(Boolean);
        }
      } catch (parseError) {
        console.warn('Failed to parse quickReplies JSON:', parseError.message);
        
        // Try regex extraction as fallback
        const textMatches = str.match(/(?:text|value):\s*['"]([^'"]+)['"]/g);
        if (textMatches) {
          return textMatches.map(match => {
            const extracted = match.match(/['"]([^'"]+)['"]/);
            return extracted ? extracted[1] : '';
          }).filter(Boolean);
        }
      }
    }
    
    // Fallback: split by comma
    return str.split(',').map(s => s.trim()).filter(Boolean);
  }
  
  // Last resort: empty array
  console.warn('Unknown quickReplies format:', typeof quickReplies, quickReplies);
  return [];
};
   
const createWelcomeMessage = async (session, userInfo, isAuthenticated) => {
  const sessionId = session._id.toString();
  
  // Check if welcome message already exists
  const existingWelcome = await ChatMessage.findOne({
    sessionId: session._id,
    senderType: 'bot',
    'metadata.isWelcomeMessage': true
  });
  
  if (existingWelcome) {
    logWithIcon.warning(`Welcome message already exists for session ${sessionId}`);
    return existingWelcome.toObject();
  }

  try {
    const uniqueId = generateUniqueMessageId();
    
    // Try to get template first
    const templates = await ChatTemplate.find({
      templateType: 'welcome_message',
      isActive: true
    }).sort({ priority: -1 }).limit(1);

    if (templates.length > 0) {
      const template = templates[0];
      const rendered = template.render({ 
        firstName: userInfo.firstName || 'there' 
      });
      
      // FIXED: Use the improved formatQuickReplies function
      let templateQuickReplies = [];
      try {
        templateQuickReplies = formatQuickReplies(template.quickReplies);
        logWithIcon.success(`Formatted ${templateQuickReplies.length} quickReplies from template`);
      } catch (quickReplyError) {
        logWithIcon.error('Error formatting template quickReplies:', quickReplyError);
        templateQuickReplies = ['Search Jobs', 'About PSPL', 'Contact Support'];
      }
      
      const welcomeMessage = new ChatMessage({
        sessionId: session._id,
        senderId: session._id,
        senderModel: 'System',
        senderType: 'bot',
        message: rendered,
        messageType: 'text',
        metadata: {
          id: uniqueId,
          quickReplies: templateQuickReplies, // Now guaranteed to be string[]
          templateId: template._id,
          isGuestMessage: !isAuthenticated,
          isWelcomeMessage: true,
          noEncryption: true
        }
      });
      
      await welcomeMessage.save();
      
      // Update template usage
      await ChatTemplate.findByIdAndUpdate(template._id, {
        $inc: { 'usage.timesUsed': 1 },
        'usage.lastUsed': new Date()
      });
      
      logWithIcon.success('Template welcome message created successfully');
      
      // Track this message
      addMessageToSession(sessionId, uniqueId);
      
      return welcomeMessage.toObject();
    } else {
      // Fallback welcome message
      const fallbackQuickReplies = [
        'Search for jobs',
        'Partnership info', 
        'Application help',
        'Talk to agent'
      ];
      
      const welcomeMessage = new ChatMessage({
        sessionId: session._id,
        senderId: session._id,
        senderModel: 'System',
        senderType: 'bot',
        message: `Hello ${userInfo.firstName || 'there'}! 👋 Welcome to PSPL Support. How can I assist you today?`,
        messageType: 'text',
        metadata: {
          id: uniqueId,
          quickReplies: fallbackQuickReplies, // Simple string array
          isGuestMessage: !isAuthenticated,
          isWelcomeMessage: true,
          noEncryption: true
        }
      });
      
      await welcomeMessage.save();
      addMessageToSession(sessionId, uniqueId);
      
      logWithIcon.success('Fallback welcome message created successfully');
      return welcomeMessage.toObject();
    }
    
  } catch (error) {
    logWithIcon.error('Error creating welcome message:', error);
    
    // Ultimate fallback
    try {
      const minimalId = generateUniqueMessageId();
      const minimalMessage = new ChatMessage({
        sessionId: session._id,
        senderId: session._id,
        senderModel: 'System',
        senderType: 'bot',
        message: `Hello! Welcome to PSPL Support.`,
        messageType: 'text',
        metadata: {
          id: minimalId,
          quickReplies: [], // Empty array to avoid validation issues
          isWelcomeMessage: true,
          errorFallback: true,
          noEncryption: true
        }
      });
      
      await minimalMessage.save();
      addMessageToSession(sessionId, minimalId);
      
      logWithIcon.warning('Created minimal fallback welcome message');
      return minimalMessage.toObject();
    } catch (fallbackError) {
      logWithIcon.error('Even fallback welcome message failed:', fallbackError);
      return null;
    }
  }
};

const handleMessageSend = async (socket, io, payload, ack) => {
  try {
    const { sessionId, message, messageType = 'text', metadata = {} } = payload;
    const userId = socket.user?._id?.toString() || socket.user.guestId;
    
    // Validate and format quickReplies if present in metadata
    if (metadata.quickReplies) {
      metadata.quickReplies = formatQuickReplies(metadata.quickReplies);
    }
    
    // Validate the complete message data before saving
    const messageData = {
      sessionId,
      senderId: userId,
      message,
      messageType,
      metadata
    };
    
    const validationErrors = validateChatMessageData(messageData);
    if (validationErrors.length > 0) {
      console.error('Message validation failed:', validationErrors);
      if (ack) return ack({ error: validationErrors.join('; ') });
      return;
    }
    
    // ... rest of your existing message handling code
    
  } catch (error) {
    console.error('Error in handleMessageSend:', error);
    if (ack) ack({ error: error.message });
  }
};

const validateChatMessageData = (messageData) => {
     const errors = [];
     if (!messageData.sessionId) errors.push('sessionId is required');
     if (!messageData.senderId) errors.push('senderId is required');
     if (!messageData.message) errors.push('message is required');
     
     if (messageData.metadata && messageData.metadata.quickReplies) {
       const quickReplies = messageData.metadata.quickReplies;
       if (!Array.isArray(quickReplies)) {
         errors.push('metadata.quickReplies must be an array');
       } else {
         for (let i = 0; i < quickReplies.length; i++) {
           if (typeof quickReplies[i] !== 'string') {
             errors.push(`metadata.quickReplies[${i}] must be a string`);
           }
         }
       }
     }
     return errors;
   };

const setupSocketHandlersFixed = (io) => {

  io.on('connection', async (socket) => {
    // Attach Business Hours details to Socket
    try {
      const detailed = await businessHoursAdapter.getDetailedStatus();
      socket.businessHoursInfo = detailed || null;
      socket.isBusinessHours = !!(detailed && detailed.isOpen);
    } catch (error) {
      logWithIcon.error('Error fetching business hours:', error);
      socket.businessHoursInfo = null;
      socket.isBusinessHours = false;
    }
    
    await handleConnection(socket, io);

    // Activity Handlers (existing code remains the same)
    socket.on('user:activity', async (data) => {
      await handleUserActivity(socket, io, data);
    });

    socket.on('activity:specific', async (data) => {
      await handleSpecificActivity(socket, io, data);
    });

    socket.on('admin:requestStatusList', async () => {
      await handleAdminRequestStatusList(socket);
    });

    // FIX 9: Updated Chat Handlers
    socket.on('session:create', async (payload, ack) => {
      await handleChatSessionCreate(socket, io, payload, ack);
    });

    socket.on('message:send', async (payload, ack) => {
      await handleMessageSend(socket, io, payload, ack);
    });

    // Rest of the socket handlers remain the same...
    socket.on('session:join', async ({ sessionId }, ack) => {
      try {
        const session = await ChatSession.findById(sessionId).lean();
        if (!session) {
          if (ack) return ack({ error: 'Session not found' });
          return;
        }

        socket.join(`session:${sessionId}`);
        if (ack) ack(null, { success: true, sessionId });
      } catch (err) {
        console.error('session:join error', err);
        if (ack) ack({ error: err.message });
      }
    });

    socket.on('disconnect', async (reason) => {
      await handleDisconnect(socket, io, reason);
    });    
  });
};

const generateSafeBotResponse = (message, sessionType) => {
  logWithIcon.info('Generating safe bot response without encryption');
  
  try {
    const lowerMessage = message.toLowerCase();
    let response = "I understand you need assistance. How can I help you today?";
    let quickReplies = ['Talk to agent', 'Search jobs', 'Partnership info', 'More help'];
    
    // Contextual responses based on message content
    if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('hey')) {
      response = "Hello! Welcome to PSPL Support. I'm here to help you with any questions.";
      quickReplies = ['Search Jobs', 'About PSPL', 'Contact Support', 'Partnership Info'];
    } else if (lowerMessage.includes('job') || lowerMessage.includes('work') || lowerMessage.includes('career')) {
      response = "I can help you find job opportunities with PSPL. Would you like me to show you current openings?";
      quickReplies = ['View Current Jobs', 'Application Process', 'Job Requirements', 'Talk to HR'];
    } else if (lowerMessage.includes('partner') || lowerMessage.includes('collaboration')) {
      response = "I can provide information about partnership opportunities with PSPL. What type of partnership interests you?";
      quickReplies = ['Business Partnership', 'Technology Partnership', 'Strategic Alliance', 'Contact Partnership Team'];
    } else if (lowerMessage.includes('agent') || lowerMessage.includes('human') || lowerMessage.includes('person')) {
      response = "I'll connect you with one of our live agents. Please wait a moment while I find an available representative.";
      quickReplies = ['Wait for Agent', 'Leave Message', 'Call Instead', 'Continue with Bot'];
    } else if (lowerMessage.includes('help') || lowerMessage.includes('support')) {
      response = "I'm here to help! I can assist with job searches, partnership information, or connect you with our team.";
      quickReplies = ['Search Jobs', 'Partnership Info', 'Contact Support', 'About PSPL'];
    }
    
    // FIXED: Ensure quickReplies is properly formatted as array of strings
    const formattedQuickReplies = formatQuickReplies(quickReplies);
    
    return {
      message: response,
      messageType: 'text',
      metadata: {
        quickReplies: formattedQuickReplies, // Always an array of strings
        botGenerated: true,
        timestamp: new Date().toISOString(),
        responseType: 'contextual',
        noEncryption: true
      }
    };
  } catch (error) {
    logWithIcon.error('Error in generateSafeBotResponse:', error);
    
    // Ultra-safe fallback with minimal metadata
    return {
      message: "I'm sorry, I encountered an issue. How can I assist you?",
      messageType: 'text',
      metadata: {
        quickReplies: ['Talk to agent', 'Try again', 'Get help'], // Simple string array
        botGenerated: true,
        timestamp: new Date().toISOString(),
        errorFallback: true,
        noEncryption: true
      }
    };
  }
};

const handleChatMessageSend = async (socket, io, payload, ack) => {
  try {
    const { sessionId, message, messageType = 'text', metadata = {} } = payload;
    const userId = socket.user?._id?.toString();
    const userRole = socket.user?.role || 'user';

    // Validate session
    const session = await ChatSession.findById(sessionId);
    if (!session) throw new Error('Chat session not found');

    // Check authorization
    if (userRole === 'user' && session.userId?.toString() !== userId) {
      throw new Error('Unauthorized access to this chat session');
    }

    // Determine sender information
    let senderId, senderModel;
    if (userId) {
      senderId = userId;
      senderModel = 'User';
    } else {
      // This is a guest user
      if (!session.guestUserId) {
        throw new Error('Guest user not found for this session');
      }
      senderId = session.guestUserId;
      senderModel = 'GuestUser';
    }

    // Create message
    const chatMessage = new ChatMessage({
      sessionId,
      senderId,
      senderModel,
      senderType: 'user',
      message: message,
      messageType,
      metadata: {
        ...metadata,
        businessHoursMessage: !socket.isBusinessHours
      }
    });

    await chatMessage.save();

    // Update session
    session.lastMessageAt = new Date();
    await session.save();

    // Broadcast to session room
    io.to(`session:${sessionId}`).emit('chat:message', chatMessage.toObject());

    // Generate bot response if needed
    if (session.sessionType === 'bot') {
      const botResponse = await ChatMessage.generateBotResponse(
        session, 
        message, 
        messageType
      );
      
      if (botResponse) {
        setTimeout(async () => {
          const botMessage = await ChatMessage.sendBotMessage(
            sessionId,
            botResponse
          );
          io.to(`session:${sessionId}`).emit('chat:message', botMessage);
        }, 800);
      }
    }

    if (ack) ack(null, { success: true });
  } catch (error) {
    logWithIcon.error('Error sending chat message:', error);
    if (ack) ack({ error: error.message });
  }
};

const handleJoinChatSession = (socket, sessionId) => {
  socket.join(`session:${sessionId}`);
  logWithIcon.chat(`Socket ${socket.id} joined chat session ${sessionId}`);
};
// =================== CHAT FUNCTIONALITY ENDS HERE..... ===================

const handleAdminRequestStatusList = async (socket) => {
  if (!socket.user || socket.user.role !== 1) return;

  const ipAddress = getClientIP(socket);
  const userIdentifier = createUserIdentifier(socket.user, ipAddress);

  try {
    const adminsWithSession = await getAllAdminsWithSessions();
    socket.emit('admin:initialStatusList', adminsWithSession);
  } catch (error) {
    logWithIcon.error('Error sending admin status list:', error);
    socket.emit('admin:initialStatusList', []);
  }
};

//ChatBot Helpers
const joinSessionRoom = (socket, sessionId) => { 
  const room = `session_${sessionId}`;
  socket.join(room);
  return room;
};

const broadcastNewMessageToSession = (io, sessionId, message) => { 
  const room = `session_${sessionId}`;
  io.to(room).emit('message:new', message);
};

const setupSocketHandlers = (io) => {

  io.on('connection', async (socket) => {
    // FIXED: Attach Business Hours details to Socket
    try {
      const detailed = await businessHoursAdapter.getDetailedStatus();
      socket.businessHoursInfo = detailed || null;
      socket.isBusinessHours = !!(detailed && detailed.isOpen);
    } catch (error) {
      logWithIcon.error('Error fetching business hours:', error);
      socket.businessHoursInfo = null;
      socket.isBusinessHours = false;
    }
    
    await handleConnection(socket, io);

    // Activity Handlers
    socket.on('user:activity', async (data) => {
      await handleUserActivity(socket, io, data);
    });

    socket.on('activity:specific', async (data) => {
      await handleSpecificActivity(socket, io, data);
    });

    socket.on('admin:requestStatusList', async () => {
      await handleAdminRequestStatusList(socket);
    });

    // FIXED: ChatBot Handlers
    socket.on('session:create', async (payload, ack) => {
      try {
        console.log('session:create received:', payload);
        const result = await handleChatSessionCreate(socket, io, payload, ack);
        
        if (result && result.body && result.body.data && result.body.data.session) {
          const sessionId = result.body.data.session._id;
          const session = result.body.data.session;
          
          // Emit session created event
          socket.emit('session:created', result.body.data);
          
          logWithIcon.success('Session created and event emitted:', sessionId);
        }
      } catch (err) {
        console.error('session:create error', err);
        if (ack) ack({ error: err.message });
      }
    });

    socket.on('session:join', async ({ sessionId }, ack) => {
      try {
        const session = await ChatSession.findById(sessionId).lean();
        if (!session) {
          if (ack) return ack({ error: 'Session not found' });
          return;
        }

        // Check authorization
        if (socket.user.role === 1 || socket.user.role === 'agent') {
          socket.join(`session:${sessionId}`);
        } else {
          const uid = socket.user._id?.toString() || socket.user.userId?.toString();
          if (session.userId && session.userId.toString() !== uid) {
            if (ack) return ack({ error: 'Access denied to join this session' });
            return;
          }
          socket.join(`session:${sessionId}`);
        }

        if (ack) ack(null, { success: true, sessionId });
      } catch (err) {
        console.error('session:join error', err);
        if (ack) ack({ error: err.message });
      }
    });

    socket.on('message:send', async (payload, ack) => {
      try {
        const { sessionId, message, messageType = 'text', metadata = {} } = payload;
        const userId = socket.user?._id?.toString();
        
        // Validate session
        const session = await ChatSession.findById(sessionId);
        if (!session) {
          if (ack) return ack({ error: 'Chat session not found' });
          return;
        }

        // Create message
        const ChatMessage = require('../models/chatMessageModel');

        console.log('Creating chat message...');
        const chatMessage = new ChatMessage({
          sessionId,
          senderId: userId || session.guestUserId,
          senderModel: userId ? 'User' : 'GuestUser',
          senderType: 'user',
          message: message,
          messageType,
          metadata: {
            ...metadata,
            businessHoursMessage: !socket.isBusinessHours
          }
        });
        
        
        try {
          const newChatMessage = await chatMessage.save();
        } catch (error) {
          console.error('Error saving chat message:', error);
        }

        console.log('Chat message saved');

        // Update session
        session.lastMessageAt = new Date();
        await session.save();

        // Broadcast to session room
        io.to(`session:${sessionId}`).emit('message:new', chatMessage.toObject());

        // Generate bot response if needed
        if (session.sessionType === 'bot') {
          const botResponse = await ChatMessageController.generateBotResponse(
            session, 
            message, 
            messageType
          );
          
          if (botResponse) {
            setTimeout(async () => {
              const botMessage = await ChatMessageController.sendBotMessage(
                sessionId,
                botResponse
              );
              io.to(`session:${sessionId}`).emit('message:new', botMessage);
            }, 800);
          }
        }

        if (ack) ack(null, { success: true, data: chatMessage.toObject() });
      } catch (error) {
        logWithIcon.error('Error sending chat message:', error);
        if (ack) ack({ error: error.message });
      }
    });

    socket.on('message:ack', async ({ messageId, status }, ack) => {
      try {
        if (!messageId || !['delivered', 'read'].includes(status)) {
          if (ack) return ack({ error: 'Invalid parameters' });
          return;
        }
        
        const ChatMessage = require('../models/chatMessageModel');
        await ChatMessage.findByIdAndUpdate(messageId, { status });
        const message = await ChatMessage.findById(messageId).lean();
        
        if (message) {
          io.to(`session:${message.sessionId}`).emit('message:status', { messageId, status });
        }
        
        if (ack) ack(null, { success: true });
      } catch (err) {
        console.error('message:ack error', err);
        if (ack) ack({ error: err.message });
      }
    });

    socket.on('session:transfer', async (payload, ack) => {
      try {
        const { sessionId, targetAgentId, reason, transferNote } = payload;
        
        // Implementation would use ChatSessionController.transferSession
        // For now, just acknowledge
        if (ack) ack(null, { success: true });
      } catch (err) {
        console.error('session:transfer error', err);
        if (ack) ack({ error: err.message });
      }
    });

    socket.on('agent:accept', async ({ sessionId }, ack) => {
      try {
        const agentId = socket.user.agentId || socket.user._id;
        const session = await ChatSession.findById(sessionId);
        
        if (!session) {
          if (ack) return ack({ error: 'Session not found' });
          return;
        }
        
        if (session.agentId && session.agentId.toString() !== agentId.toString()) {
          if (ack) return ack({ error: 'Session already assigned' });
          return;
        }

        session.agentId = agentId;
        session.sessionType = 'live_agent';
        session.status = 'active';
        session.transferredAt = new Date();
        await session.save();

        io.to(`session:${sessionId}`).emit('agent:assigned', {
          sessionId,
          agent: { id: agentId, name: socket.user.firstname || socket.user.name }
        });

        socket.join(`session:${sessionId}`);

        if (ack) ack(null, { success: true, sessionId, agentId });
      } catch (err) {
        console.error('agent:accept error', err);
        if (ack) ack({ error: err.message });
      }
    });

    socket.on('typing', ({ sessionId, isTyping }) => {
      if (!sessionId) return;
      socket.to(`session:${sessionId}`).emit('typing', {
        sessionId,
        user: {
          id: socket.user.id || socket.user._id,
          name: socket.user.firstname || socket.user.name,
          role: socket.user.role
        },
        isTyping
      });
    });

    socket.on('template:render', async ({ templateId, variables = {}, context = {} }, ack) => {
      try {
        if (!templateId) return ack && ack({ error: 'templateId required' });
        
        const tpl = await ChatTemplate.findById(templateId);
        if (!tpl) return ack && ack({ error: 'Template not found' });
        
        const rendered = tpl.render ? tpl.render(variables) : tpl.content;
        
        // Update usage if method exists
        if (tpl.incrementUsage) {
          await tpl.incrementUsage();
        } else {
          await ChatTemplate.findByIdAndUpdate(templateId, {
            $inc: { 'usage.timesUsed': 1 },
            'usage.lastUsed': new Date()
          });
        }
        
        return ack && ack(null, { 
          rendered, 
          quickReplies: tpl.quickReplies || [], 
          templateId: tpl._id 
        });
      } catch (err) {
        console.error('template:render socket error', err);
        return ack && ack({ error: err.message });
      }
    });

    // Add chat-specific properties to socket
    socket.chatSessions = new Set();

    socket.on('chat:session:join', (sessionId) => {
      socket.join(`session:${sessionId}`);
      socket.chatSessions.add(sessionId);
      logWithIcon.chat(`Socket ${socket.id} joined chat session ${sessionId}`);
    });

    socket.on('chat:typing', (sessionId) => {
      socket.to(`session:${sessionId}`).emit('chat:typing', {
        userId: socket.user?._id,
        name: socket.user?.firstname || 'Guest'
      });
    });

    socket.on('disconnect', async (reason) => {
      await handleDisconnect(socket, io, reason);
    });
  });
};
module.exports = {
  handleConnection,
  debugActivitySessionModel,
  createActivitySessionSafely,
  setupSocketHandlers,
  validateStatus,
  updateUserStatus,
  createUserInfo,
  emitAdminStatusChange,
  logAndEmitActivity,
  getAllAdminsWithSessions,
  getClientIP,
  createUserIdentifier, 
  formatQuickReplies,
  generateSafeBotResponse,
  createWelcomeMessage,
  handleMessageSend
};
