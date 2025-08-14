// server/services/socketService.js
const mongoose = require('mongoose');
const os = require('os');
const User = require('../models/userModel');
const ActivitySession = require('../models/activitySessionModel');
const IdleTracking = require('../models/idleTrackingModel');
const ActivityLog = require('../models/activityLogModel');
const ChatSession = require('../models/chatSessionModel');
const ChatMessage = require('../models/chatMessageModel');
const LiveAgent = require('../models/liveAgentModel');
const GuestUser = require('../models/guestUserModel');
const agentAssignment = require('./agentAssignmentService');
const { logWithIcon } = require('./consoleIcons');

const SocketChatController = require('../controllers/socketChatController');
const businessHoursAdapter = require('./businessHoursAdapter');
const { join } = require('path');
const chatTemplateCache = require('./chatTemplateCache');

// Valid statuses your system supports
const VALID_STATUSES = ['offline', 'online', 'active', 'idle', 'away'];
const VALID_ACTIVITY_TYPES = [
  'login', 'logout', 'idle_start', 'idle_end', 'auto_logout',
  'session_start', 'session_end', 'session_resume', 'session_pause',
  'tab_hidden', 'tab_visible', 'connection_lost', 'reconnected',
  'page_focus', 'page_blur', 'mouse_activity', 'keyboard_activity',
  'manual_override', 'page_unload', 'component_unmount'
];

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

  // Debug log to help trace IP sources during connections - REMOVE in prod!
  // console.log('Debug client IP headers:', {
  //   'cf-connecting-ip': cfConnectingIP,
  //   'x-real-ip': real,
  //   'x-forwarded-for': forwarded,
  //   'handshake.address': socket.handshake.address,
  //   'request.connection.remoteAddress': socket.request.connection?.remoteAddress,
  //   'conn.remoteAddress': socket.conn?.remoteAddress
  // });

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

    if (socket.user.role === 1) { // If admin
      let activeSession = await ActivitySession.findOne({
        userId: toObjectId(userId),
        sessionStatus: 'active'
      }).lean();

      if (!activeSession) {
        activeSession = await ActivitySession.create({
          userId: toObjectId(userId),
          loginTime: new Date(),
          sessionStatus: 'active',
          ipAddress,
          userAgent: socket.handshake.headers['user-agent'],
          socketId: socket.id
        });
        logWithIcon.calendar(`Created new session for ${userIdentifier}`);
      }
      const now = new Date();

      // Log login activity
      await logAndEmitActivity(socket, io, {
        userId,
        activityType: 'login',
        sessionId: activeSession._id,
        timestamp: now,
        metadata: {
          userIdentifier,
          connectionType: 'initial'
        }
      });

      // Emit admin online status to clients
      emitAdminStatusChange(io, {
        userId,
        status: 'online',
        previousStatus: 'offline',
        loginLatestSession: activeSession,
        userInfo: createUserInfo(socket.user),
        userIdentifier,
        ipAddress,
        timestamp: now.getTime(),
        sessionId: activeSession._id
      });

      logWithIcon.success(`Admin connection handled for ${userIdentifier}`);
    }
  } catch (err) {
    logWithIcon.error(`Error during connection handling for user ${userId}:`, err);
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
    const { sessionType = 'bot', guestEmail, metadata = {} } = payload;
    const userId = socket.user?._id?.toString();
    const isAuthenticated = !!userId;

    let userInfo = {};
    let guestUserId = null;

    if (isAuthenticated) {
      const user = await User.findById(userId);
      if (user) {
        userInfo = {
          firstName: user.firstname,
          lastName: user.lastname,
          email: user.email,
          phone: user.phone
        };
      }
    } else if (guestEmail) {
      let guestUser = await GuestUser.findOne({ email: guestEmail });
      
      if (!guestUser) {
        guestUser = new GuestUser({
          firstName: metadata.guestFirstName || 'Guest',
          lastName: metadata.guestLastName || '',
          email: guestEmail,
          phone: metadata.guestPhone || ''
        });
        await guestUser.save();
      }
      
      userInfo = {
        firstName: guestUser.firstName,
        lastName: guestUser.lastName,
        email: guestUser.email,
        phone: guestUser.phone
      };
      guestUserId = guestUser._id;
    } else {
      throw new Error('User authentication or guest email required');
    }

    const sessionData = {
      userId: isAuthenticated ? userId : null,
      guestUserId,
      sessionType,
      userInfo,
      status: 'active',
      createdDuringBusinessHours: socket.isBusinessHours,
      metadata: {
        ...metadata,
        userAgent: socket.handshake.headers['user-agent'] || '',
        ipAddress: getClientIP(socket),
        businessHoursAtCreation: socket.businessHoursInfo
      }
    };

    const session = new ChatSession(sessionData);
    await session.save();

    // Create metrics
    const metrics = new ChatMetrics({
      sessionId: session._id,
      messageCount: { total: 0, userMessages: 0, agentMessages: 0, botMessages: 0 },
      sessionMetrics: { startTime: new Date() }
    });
    await metrics.save();

    // Send initial bot message
    if (sessionType === 'bot') {
      const botMessage = await ChatMessageController.sendInitialBotMessage(session);
      if (botMessage) {
        io.to(socket.id).emit('chat:message', {
          sessionId: session._id,
          message: botMessage
        });
      }
    }

    // Join session room
    socket.join(`session:${session._id}`);
    
    const response = {
      success: true,
      session: session.toObject(),
      metrics: metrics.toObject()
    };

    if (ack) ack(null, response);
    return response;
  } catch (error) {
    logWithIcon.error('Chat session creation error:', error);
    if (ack) ack({ error: error.message });
    return { error: error.message };
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
    // Let's Attach Business Hours details to Socket via businessHoursAdapter
    try {
      const detailed = await businessHoursAdapter.getDetailedStatus();
      socket.businessHoursInfo = detailed || null;
      socket.isBusinessHours = !!(detailed && detailed.isOpen);
    } catch (error) {
      logWithIcon.warning('Business hours adapter failed:', error.message);
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

    // ChatBot Handlers
    socket.on('session:create', async (payload, ack) => {
      try {
        const result = await SocketChatController.addChatSessionSocket({ user: socket.user, payload });
        
        if (result?.body?.data?.session) {
          const session = result.body.data.session;
          const sessionId = session._id || session.id;
          
          joinSessionRoom(socket, sessionId);
          
          if (session.sessionType === 'live_agent') {
            try {
              const selectedAgent = await agentAssignment.selectAgent(
                session.requiredSkills || [], 
                session.department || null
              );
              
              if (selectedAgent) {
                // Update session with agent
                const updatedSession = await ChatSession.findById(sessionId);
                updatedSession.agentId = selectedAgent._id;
                updatedSession.status = 'active';
                updatedSession.sessionType = 'live_agent';
                updatedSession.transferredAt = new Date();
                await updatedSession.save();

                await agentAssignment.incrementAgentLoad(selectedAgent._id);

                // Notify participants
                io.to(`agent_${selectedAgent._id}`).emit('session:assigned', { sessionId, agent: selectedAgent });
                io.to(`session_${sessionId}`).emit('agent:assigned', { sessionId, agent: selectedAgent });
              } else {
                // Queue for available agents
                io.to('agents:available').emit('session:new', { session });
              }
            } catch (err) {
              logWithIcon.error('Agent assignment error:', err);
              io.to('agents:available').emit('session:new', { session });
            }
          } else {
            // Bot session
            socket.emit('session:created', result.body.data);
          }
        }
        
        if (ack) ack(null, result);
      } catch (err) {
        logWithIcon.error('Session creation error:', err);
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

        if (socket.user.role === 1 || socket.user.role === 'agent') {
          socket.join(`session_${sessionId}`);
        } else {
          const uid = socket.user._id?.toString() || socket.user.userId?.toString() || socket.user.id?.toString();
          if (session.userId && session.userId.toString() !== uid) {
            if (ack) return ack({ error: 'Access denied to join this session' });
            return;
          }
          socket.join(`session_${sessionId}`);
        }

        if (ack) ack(null, { success: true, sessionId });
      } catch (err) {
        console.error('session:join error', err);
        if (ack) ack({ error: err.message });
      }
    });

    socket.on('message:send', async (payload, ack) => {
      try {
        socket.isBusinessHours = socket.isBusinessHours || (socket.businessHoursInfo && socket.businessHoursInfo.isOpen);
        const result = await SocketChatController.sendMessageSocket({ user: socket.user, payload });
        const body = result?.body || {};
        if (body?.data) {
          const message = body.data;
          const sessionId = payload.sessionId || message?.sessionId;
          
          if (sessionId) {
            broadcastNewMessageToSession(io, sessionId, message);
          } else if (payload.sessionId) {
            // Fallback: get last message and broadcast
            const lastMessage = await ChatMessage.findOne({ sessionId: payload.sessionId })
              .sort({ createdAt: -1 })
              .lean();
            if (lastMessage) {
              broadcastNewMessageToSession(io, payload.sessionId, lastMessage);
            }
          }
        }
        if (ack) ack(null, result);
      } catch (err) {
        console.error('message:send error', err);
        if (ack) ack({ error: err.message });
      }
    });

    socket.on('message:ack', async ({ messageId, status }, ack) => {
      try {
        if (!messageId || !['delivered', 'read'].includes(status)) {
          if (ack) return ack({ error: 'Invalid parameters' });
          return;
        }
        await ChatMessage.findByIdAndUpdate(messageId, { status });
        const message = await ChatMessage.findById(messageId).lean();
        if (message) {
          const room = `session_${message.sessionId}`;
          io.to(room).emit('message:status', { messageId, status });
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
        const result = await SocketChatController.transferSessionSocket({
          user: socket.user,
          sessionId,
          payload: { targetAgentId, reason, transferNote }
        });

        if (result && result.body && result.body.success) {
          const session = await ChatSession.findById(sessionId).lean();
          io.to(`session_${sessionId}`).emit('session:transferred', {
            sessionId,
            newAgent: result.body.data?.newAgent || null
          });

          if (result.body.data?.newAgent?.id) {
            io.to(`agent_${result.body.data.newAgent.id}`).emit('session:assigned', { sessionId });
          }
        }

        if (ack) ack(null, result);
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

        io.to(`session_${sessionId}`).emit('agent:assigned', {
          sessionId,
          agent: { id: agentId, name: socket.user.firstname || socket.user.name }
        });

        socket.join(`session_${sessionId}`);

        if (ack) ack(null, { success: true, sessionId, agentId });
      } catch (err) {
        console.error('agent:accept error', err);
        if (ack) ack({ error: err.message });
      }
    });

    socket.on('typing', ({ sessionId, isTyping }) => {
      if (!sessionId) return;
      const room = `session_${sessionId}`;
      socket.to(room).emit('typing', {
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
        const tpl = await chatTemplateCache.getById(templateId);
        if (!tpl) return ack && ack({ error: 'Template not found' });
        if (tpl.shouldShow && !tpl.shouldShow(context)) {
          return ack && ack({ error: 'Chat Template cannot be shown in this context' });
        }
        const rendered = tpl.render(variables);
        await tpl.incrementUsage();
        chatTemplateCache.clearCache();
        return ack && ack(null, { rendered, quickReplies: tpl.quickReplies || [], templateId: tpl._id });
      } catch (err) {
        console.error('template:render socket error', err);
        return ack && ack({ error: err.message });
      }
    });

    // Add chat-specific properties to socket
    socket.chatSessions = new Set();

    // ================ CHAT EVENT HANDLERS ================
    socket.on('chat:session:create', (payload, ack) =>
      handleChatSessionCreate(socket, io, payload, ack)
    );

  socket.on('chat:message:send', (payload, ack) =>
    handleChatMessageSend(socket, io, payload, ack)
    );

    socket.on('chat:session:join', (sessionId) => {
      handleJoinChatSession(socket, sessionId);
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
  setupSocketHandlers,
  validateStatus,
  updateUserStatus,
  createUserInfo,
  emitAdminStatusChange,
  logAndEmitActivity,
  getAllAdminsWithSessions,
  getClientIP,
  createUserIdentifier
};
