// server/services/socketService.js
const mongoose = require('mongoose');
const os = require('os');
const dotenv = require('dotenv');
dotenv.config();

const crypto = require('crypto');
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
const { findAvailableAgent } = require('./agentAssignmentService');
const { logWithIcon } = require('./consoleIcons');
const ChatMessageController = require('../controllers/chatMessageController');
const businessHoursAdapter = require('./businessHoursAdapter');
const chatTemplateCache = require('./chatTemplateCache');
const { notifyAdminsOfPendingRequest, generateUniqueAgentUrl } = require('./adminNotificationService');

const VALID_STATUSES = ['offline', 'online', 'active', 'idle', 'away'];
const VALID_ACTIVITY_TYPES = [
  'login', 'logout', 'idle_start', 'idle_end', 'auto_logout',
  'session_start', 'session_end', 'session_resume', 'session_pause',
  'tab_hidden', 'tab_visible', 'connection_lost', 'reconnected',
  'page_focus', 'page_blur', 'mouse_activity', 'keyboard_activity',
  'manual_override', 'page_unload', 'component_unmount'
];

// Utility: generate a unique message id
const generateUniqueMessageId = () => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 15);
  const extra = Math.random().toString(36).substring(2, 8);
  return `msg_${timestamp}_${random}_${extra}`;
};

// In-memory tracking for created messages per session (avoid duplicates)
const sessionMessageTracking = new Map();
const addMessageToSession = (sessionId, messageId) => {
  if (!sessionMessageTracking.has(sessionId)) sessionMessageTracking.set(sessionId, new Set());
  sessionMessageTracking.get(sessionId).add(messageId);
};
const hasMessage = (sessionId, messageId) => sessionMessageTracking.has(sessionId) && sessionMessageTracking.get(sessionId).has(messageId);

// IP extraction helper
const getClientIP = (socket) => {
  try {
    const forwarded = socket.handshake.headers['x-forwarded-for'];
    const real = socket.handshake.headers['x-real-ip'];
    const cfConnectingIP = socket.handshake.headers['cf-connecting-ip'];

    const isPrivateOrLocalIP = (ip) => {
      if (!ip) return true;
      const clean = ip.startsWith('::ffff:') ? ip.substring(7) : ip;
      if (['127.0.0.1', '::1', 'localhost'].includes(clean)) return true;
      const privateRanges = [/^10\./, /^172\.(1[6-9]|2[0-9]|3[01])\./, /^192\.168\./, /^169\.254\./, /^fc00:/, /^fe80:/];
      return privateRanges.some(re => re.test(clean));
    };

    const getServerPublicIP = () => {
      const interfaces = os.networkInterfaces();
      for (const nic of Object.values(interfaces)) {
        for (const addr of nic) {
          if (!addr.internal && addr.family === 'IPv4' && !isPrivateOrLocalIP(addr.address)) {
            return addr.address;
          }
        }
      }
      return null;
    };

    if (process.env.NODE_ENV === 'development') {
      console.debug('IP headers:', {
        'cf-connecting-ip': cfConnectingIP,
        'x-real-ip': real,
        'x-forwarded-for': forwarded,
        handshakeAddress: socket.handshake.address,
        requestRemote: socket.request.connection?.remoteAddress,
        connRemote: socket.conn?.remoteAddress
      });
    }

    if (cfConnectingIP && !isPrivateOrLocalIP(cfConnectingIP)) return cfConnectingIP;
    if (real && !isPrivateOrLocalIP(real)) return real;
    if (forwarded) {
      const ips = forwarded.split(',').map(s => s.trim());
      const publicIP = ips.find(ip => !isPrivateOrLocalIP(ip));
      if (publicIP) return publicIP;
    }
    let socketIP = socket.handshake.address || socket.request.connection?.remoteAddress || socket.conn?.remoteAddress;
    if (socketIP && socketIP.startsWith('::ffff:')) socketIP = socketIP.substring(7);
    if (socketIP && !isPrivateOrLocalIP(socketIP)) return socketIP;

    const serverIP = getServerPublicIP();
    if (serverIP) {
      logWithIcon.success(`Using server public IP fallback: ${serverIP}`);
      return serverIP;
    }
    return cfConnectingIP || real || (forwarded ? forwarded.split(',')[0].trim() : null) || socketIP || 'unknown';
  } catch (err) {
    logWithIcon.error('getClientIP error:', err);
    return 'unknown';
  }
};

// Create a compact user identifier
const createUserIdentifier = (user, ipAddress) => {
  const email = user?.email || 'unknown@email.com';
  const cleanIP = (ipAddress || 'unknown').replace(/\./g, '-').replace(/:/g, '-');
  return `${email}@${cleanIP}`;
};

const validateStatus = (status) => VALID_STATUSES.includes(status) ? status : 'offline';
const validateActivityType = (t) => VALID_ACTIVITY_TYPES.includes(t) ? t : 'general';

const toObjectId = (id) => {
  if (!id) return null;
  if (mongoose.Types.ObjectId.isValid(id)) return new mongoose.Types.ObjectId(id);
  return null;
};

// Normalize user info
const getUserInfo = (user) => {
  if (!user) return null;
  if (user.isGuest) {
    return {
      _id: null,
      userId: null,
      firstname: user.firstname || 'Guest',
      lastname: user.lastname || 'User',
      email: user.email || null,
      role: 'guest',
      photo: user.photo || null,
      isGuest: true
    };
  }
  return {
    _id: user._id,
    userId: user._id,
    firstname: user.firstname,
    lastname: user.lastname,
    email: user.email,
    role: user.role,
    photo: user.photo,
    isGuest: false
  };
};

// Update user's status in DB
const updateUserStatus = async (userId, status, additionalData = {}, ipAddress = 'unknown', socketId = null) => {
  try {
    if (!userId) {
      logWithIcon.warning('updateUserStatus: no userId');
      return null;
    }
    const update = {
      currentStatus: validateStatus(status),
      lastActivity: new Date(),
      lastKnownIP: ipAddress,
      ...additionalData
    };
    if (socketId !== undefined && socketId !== null) update.socketId = socketId;
    if (status === 'online' || status === 'active') update.status = 'login';
    else if (status === 'offline') update.status = 'logout';
    const updated = await User.findByIdAndUpdate(userId, update, { new: true, runValidators: true });
    if (updated) logWithIcon.success(`Updated user ${updated.email} status to ${status}`);
    else logWithIcon.warning(`updateUserStatus: user ${userId} not found`);
    return updated;
  } catch (err) {
    logWithIcon.error('updateUserStatus error:', err);
    throw err;
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

// Emit admin status change events to frontends
const emitAdminStatusChange = (io, data) => {
  try {
    logWithIcon.broadcast(`Emitting admin status change: ${data.status} for ${data.userInfo?.email}`);
    io.emit('statusChanged', data);
    if (data.status === 'online' || data.status === 'active') io.emit('adminOnline', data);
    else if (data.status === 'offline') io.emit('adminOffline', data);
    else if (data.status === 'idle') io.emit('adminIdle', data);
    else if (data.status === 'away') io.emit('adminAway', data);
  } catch (err) {
    logWithIcon.error('emitAdminStatusChange error:', err);
  }
};

// Log activity into ActivityLog model and emit events
const logAndEmitActivity = async (socket, io, data) => {
  try {
    const { userId, activityType, sessionId, timestamp = new Date(), metadata = {}, emitToAdmins = true } = data;
    const ipAddress = getClientIP(socket);
    const userIdentifier = createUserIdentifier(socket.user, ipAddress);

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
        metadata: { ...metadata, socketId: socket.id }
      };
      io.emit('activityLogged', emitData);
      io.emit(`activity:${activityType}`, emitData);
    }
  } catch (err) {
    logWithIcon.error('logAndEmitActivity error:', err);
  }
};

// Get list of admins with session info
const getAllAdminsWithSessions = async () => {
  try {
    const admins = await User.find({ role: 1 }).lean();
    const result = [];
    for (const admin of admins) {
      const activeSession = await ActivitySession.findOne({ userId: admin._id, sessionStatus: 'active' }).lean();
      const latestActivity = await ActivityLog.findOne({ userId: admin._id }).sort({ timestamp: -1 }).lean();
      result.push({
        ...admin,
        loginLatestSession: activeSession,
        currentStatus: validateStatus(admin.currentStatus),
        lastActivity: admin.lastActivity || admin.updatedAt,
        lastKnownIP: admin.lastKnownIP || 'unknown',
        latestActivity
      });
    }
    return result;
  } catch (err) {
    logWithIcon.error('getAllAdminsWithSessions error:', err);
    return [];
  }
};

// debug helper for ActivitySession model
const debugActivitySessionModel = async () => {
  try {
    logWithIcon.info('ActivitySession model debug:', {
      modelExists: !!ActivitySession,
      modelName: ActivitySession?.modelName,
      collection: ActivitySession?.collection?.name
    });

    if (ActivitySession && ActivitySession.schema) {
      const requiredFields = [];
      const optionalFields = [];
      ActivitySession.schema.eachPath((pathname, schematype) => {
        if (schematype.isRequired) requiredFields.push(pathname);
        else optionalFields.push(pathname);
      });
      logWithIcon.info('ActivitySession schema info:', { requiredFields, totalFields: Object.keys(ActivitySession.schema.paths).length });
    }
  } catch (err) {
    logWithIcon.error('debugActivitySessionModel error:', err);
  }
};

// Handle new socket connection
const handleConnection = async (socket, io) => {
  let userId = null;
  try {
    if (!socket.user) {
      logWithIcon.warning('Socket connected without user');
      return;
    }
    const ipAddress = getClientIP(socket);

    // Guest users
    if (socket.user.isGuest) {
      const userIdentifier = `guest@${ipAddress.replace(/\./g, '-').replace(/:/g, '-')}`;
      logWithIcon.guest(`Guest connected: ${userIdentifier}`);
      io.emit('guest:connected', { userIdentifier, ipAddress, timestamp: Date.now(), socketId: socket.id });
      return;
    }

    // Authenticated users
    userId = socket.user._id.toString();
    const userIdentifier = createUserIdentifier(socket.user, ipAddress);
    logWithIcon.connection(`Authenticated user connected: ${userIdentifier}`);

    // Update user to online and store socketId
    await updateUserStatus(userId, 'online', { lastLogin: new Date(), socketId: socket.id }, ipAddress, socket.id);

    // Admins (role === 1)
    if (socket.user.role === 1) {
      logWithIcon.info(`Processing admin connection: ${userIdentifier}`);
      try {
        let activeSession = await ActivitySession.findOne({ userId: toObjectId(userId), sessionStatus: 'active' });
        if (activeSession) {
          activeSession.socketId = socket.id;
          activeSession.lastActivity = new Date();
          activeSession.ipAddress = ipAddress;
          activeSession.userAgent = socket.handshake.headers['user-agent'] || 'Unknown';
          try { await activeSession.save(); } catch (err) { logWithIcon.error('save activeSession error', err); }
        } else {
          const sessionData = {
            userId: toObjectId(userId),
            loginTime: new Date(),
            sessionStatus: 'active',
            ipAddress,
            userAgent: socket.handshake.headers['user-agent'] || 'Unknown',
            socketId: socket.id,
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
            await User.findByIdAndUpdate(userId, { currentSessionId: activeSession._id });
          } catch (createErr) {
            logWithIcon.error('create admin session error:', createErr);
          }
        }

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
                connectionType: 'new_session'
              }
            });
          } catch (activityErr) { logWithIcon.error('log activity error', activityErr); }

          try {
            emitAdminStatusChange(io, {
              userId,
              status: 'online',
              previousStatus: 'offline',
              loginLatestSession: activeSession.toObject ? activeSession.toObject() : activeSession,
              userInfo: getUserInfo(socket.user),
              userIdentifier,
              ipAddress,
              timestamp: now.getTime(),
              sessionId: activeSession._id
            });
          } catch (emitErr) { logWithIcon.error('emit admin status error', emitErr); }
        }
        socket.join('admins');
        socket.join(`admin:${userId}`);
        logWithIcon.info(`Admin ${userId} socket joined admin rooms`);
      } catch (err) {
        logWithIcon.error('admin connection handling error:', err);
      }
    } else {
      // Regular authenticated user
      io.emit('user:connected', {
        userId,
        userInfo: getUserInfo(socket.user),
        userIdentifier: createUserIdentifier(socket.user, ipAddress),
        ipAddress,
        timestamp: Date.now(),
        socketId: socket.id
      });
    }
  } catch (err) {
    logWithIcon.error('handleConnection critical error:', { error: err.message, stack: err.stack, userId });
  }
};

// Safe create activity session helper
const createActivitySessionSafely = async (sessionData) => {
  try {
    const safe = {
      userId: sessionData.userId,
      loginTime: sessionData.loginTime || new Date(),
      sessionStatus: sessionData.sessionStatus || 'active',
      ipAddress: (sessionData.ipAddress || 'unknown').substring(0, 45),
      userAgent: (sessionData.userAgent || 'Unknown').substring(0, 500),
      socketId: sessionData.socketId,
      totalIdleTime: sessionData.totalIdleTime || 0,
      totalWorkTime: sessionData.totalWorkTime || 0
    };
    Object.keys(safe).forEach(k => safe[k] === undefined && delete safe[k]);
    const session = new ActivitySession(safe);
    await session.save();
    return session;
  } catch (err) {
    logWithIcon.error('createActivitySessionSafely error:', err);
    throw err;
  }
};

// Disconnect handling
const handleDisconnect = async (socket, io, reason) => {
  try {
    if (!socket.user) return;
    const ipAddress = getClientIP(socket);
    if (socket.user.isGuest) {
      const userIdentifier = `guest@${ipAddress.replace(/\./g, '-').replace(/:/g, '-')}`;
      logWithIcon.disconnect(`Guest disconnect: ${userIdentifier}, reason: ${reason}`);
      io.emit('guest:disconnected', { userIdentifier, ipAddress, reason, timestamp: Date.now(), socketId: socket.id });
      return;
    }
    const userId = socket.user._id.toString();
    const userIdentifier = createUserIdentifier(socket.user, ipAddress);
    logWithIcon.disconnect(`User disconnect: ${userIdentifier}, reason: ${reason}`);

    await updateUserStatus(userId, 'offline', { socketId: null }, ipAddress);

    if (socket.user.role === 1) {
      const session = await ActivitySession.findOne({ userId: toObjectId(userId), sessionStatus: 'active' });
      if (session) {
        const now = new Date();
        const sessionDuration = now - session.loginTime;
        if (session.idleStartTime) {
          const idleDuration = now - session.idleStartTime;
          session.totalIdleTime = (session.totalIdleTime || 0) + idleDuration;
          await IdleTracking.findOneAndUpdate(
            { userId: toObjectId(userId), sessionId: session._id, idleEndTime: null },
            { idleEndTime: now, idleDuration, "metadata.disconnectReason": reason, "metadata.userIdentifier": userIdentifier }
          );
        }
        session.logoutTime = now;
        session.sessionStatus = 'ended';
        session.totalWorkTime = sessionDuration - (session.totalIdleTime || 0);
        await session.save();
        await User.findByIdAndUpdate(userId, { $inc: { totalWorkTime: session.totalWorkTime }, currentSessionId: null });
        await logAndEmitActivity(socket, io, {
          userId,
          activityType: 'logout',
          sessionId: session._id,
          timestamp: now,
          metadata: { reason, sessionDuration, totalIdleTime: session.totalIdleTime || 0, userIdentifier }
        });
        emitAdminStatusChange(io, {
          userId,
          status: 'offline',
          userInfo: getUserInfo(socket.user),
          userIdentifier,
          ipAddress,
          timestamp: now.getTime(),
          activityType: 'logout',
          sessionId: session._id
        });
      }
    } else {
      io.emit('user:disconnected', {
        userId,
        userInfo: getUserInfo(socket.user),
        userIdentifier,
        ipAddress,
        reason,
        timestamp: Date.now()
      });
    }
  } catch (err) {
    logWithIcon.error('handleDisconnect error:', err);
  }
};

// User activity update
const handleUserActivity = async (socket, io, data) => {
  try {
    if (!socket.user || (!socket.user._id && !socket.user.userId)) return;
    const userId = (socket.user._id || socket.user.userId).toString();
    const ipAddress = getClientIP(socket);
    const userIdentifier = createUserIdentifier(socket.user, ipAddress);
    let status = validateStatus(data.status || 'active');
    const now = data.timestamp ? new Date(data.timestamp) : new Date();

    const session = await ActivitySession.findOne({ userId: toObjectId(userId), sessionStatus: 'active' });
    if (!session) {
      logWithIcon.warning('No active ActivitySession for user activity');
      return;
    }
    const currentUser = await User.findById(userId).select('currentStatus');
    const previousStatus = currentUser ? currentUser.currentStatus : 'offline';
    let shouldEmitStatusChange = false;

    if (status === 'idle') {
      if (!session.idleStartTime && ['active', 'online'].includes(previousStatus)) {
        session.idleStartTime = now;
        await session.save();
        await IdleTracking.create({ userId: toObjectId(userId), sessionId: session._id, idleStartTime: now, metadata: { userIdentifier, ipAddress, previousStatus } });
        shouldEmitStatusChange = true;
      }
    } else if (status === 'away') {
      if (previousStatus === 'idle') {
        if (!session.idleStartTime) session.idleStartTime = now;
        await session.save();
        await IdleTracking.findOneAndUpdate(
          { userId: toObjectId(userId), sessionId: session._id, idleEndTime: null },
          { metadata: { transitionedToAway: true, awayStartTime: now, userIdentifier, ipAddress } },
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
          { idleEndTime: now, idleDuration: idleDurationMs, "metadata.resumedFrom": previousStatus, "metadata.userIdentifier": userIdentifier },
          { new: true }
        );
        shouldEmitStatusChange = true;
      } else if (['offline', 'online'].includes(previousStatus)) {
        shouldEmitStatusChange = true;
      }
    }

    if (status === 'idle' && !shouldEmitStatusChange) shouldEmitStatusChange = previousStatus !== 'idle';

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

    await logAndEmitActivity(socket, io, {
      userId,
      activityType: `status_update_${status}`,
      sessionId: session._id,
      timestamp: now,
      metadata: { previousStatus, newStatus: status, userIdentifier }
    });
  } catch (err) {
    logWithIcon.error('handleUserActivity error:', err);
  }
};

// Specific activity events (tab visibility, mouse, keyboard)
const handleSpecificActivity = async (socket, io, data) => {
  try {
    if (!socket.user || (!socket.user._id && !socket.user.userId)) return;
    const userId = (socket.user._id || socket.user.userId).toString();
    const ipAddress = getClientIP(socket);
    const userIdentifier = createUserIdentifier(socket.user, ipAddress);
    const { activityType, timestamp, metadata = {} } = data;
    const now = timestamp ? new Date(timestamp) : new Date();

    const session = await ActivitySession.findOne({ userId: toObjectId(userId), sessionStatus: 'active' });
    const currentUser = await User.findById(userId).select('currentStatus');
    const previousStatus = currentUser ? currentUser.currentStatus : 'offline';
    let newStatus = previousStatus;
    let shouldEmitStatusChange = false;

    switch (activityType) {
      case 'tab_hidden':
        newStatus = 'idle'; shouldEmitStatusChange = previousStatus !== 'idle'; break;
      case 'tab_visible':
      case 'page_focus':
      case 'mouse_activity':
      case 'keyboard_activity':
        newStatus = 'active'; shouldEmitStatusChange = previousStatus !== 'active'; break;
      case 'page_blur':
        newStatus = 'idle'; shouldEmitStatusChange = previousStatus !== 'idle'; break;
      case 'session_pause':
        newStatus = 'away'; shouldEmitStatusChange = previousStatus !== 'away'; if (session) session.sessionStatus = 'paused'; break;
      case 'session_resume':
        newStatus = 'active'; shouldEmitStatusChange = previousStatus !== 'active'; if (session) session.sessionStatus = 'active'; break;
      case 'idle_start':
        newStatus = 'idle'; shouldEmitStatusChange = previousStatus !== 'idle'; if (session) session.idleStartTime = now; break;
      case 'idle_end':
        newStatus = 'active'; shouldEmitStatusChange = previousStatus !== 'active';
        if (session && session.idleStartTime) {
          const idleDuration = now - session.idleStartTime;
          session.totalIdleTime = (session.totalIdleTime || 0) + idleDuration;
          session.idleStartTime = null;
        }
        break;
    }

    if (session && shouldEmitStatusChange) await session.save();
    if (shouldEmitStatusChange) await updateUserStatus(userId, newStatus, {}, ipAddress);

    await logAndEmitActivity(socket, io, {
      userId,
      activityType,
      sessionId: session ? session._id : null,
      timestamp: now,
      metadata: { ...metadata, previousStatus, newStatus, userIdentifier }
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
  } catch (err) {
    logWithIcon.error('handleSpecificActivity error:', err);
  }
}

// =================== CHAT FUNCTIONALITY ===================

// Format quick replies (robust)
const formatQuickReplies = (quickReplies) => {
  if (!quickReplies) return [];
  if (Array.isArray(quickReplies)) {
    return quickReplies.map(r => {
      if (typeof r === 'string') return r.trim();
      if (r && typeof r === 'object') return r.text || r.value || String(r);
      return String(r || '').trim();
    }).filter(Boolean);
  }
  if (typeof quickReplies === 'string') {
    const str = quickReplies.trim();
    if (str.startsWith('[') || str.startsWith('{')) {
      try {
        const parsed = JSON.parse(str);
        if (Array.isArray(parsed)) return formatQuickReplies(parsed);
        if (parsed && typeof parsed === 'object') return [parsed.text || parsed.value || String(parsed)].filter(Boolean);
      } catch (err) {
        logWithIcon.warning('formatQuickReplies JSON parse failed:', err.message);
        const matches = str.match(/(?:text|value):\s*['"]([^'"]+)['"]/g);
        if (matches) return matches.map(m => { const ex = m.match(/['"]([^'"]+)['"]/); return ex ? ex[1] : ''; }).filter(Boolean);
      }
    }
    return str.split(',').map(s => s.trim()).filter(Boolean);
  }
  logWithIcon.warning('formatQuickReplies unknown type:', typeof quickReplies);
  return [];
};

// Create welcome message (template fallback handling)
const createWelcomeMessage = async (session, userInfo, isAuthenticated) => {
  try {
    const sessionId = session._id.toString();
    const existing = await ChatMessage.findOne({ sessionId: session._id, senderType: 'bot', 'metadata.isWelcomeMessage': true });
    if (existing) {
      logWithIcon.warning(`Welcome already exists for session ${sessionId}`);
      return existing.toObject();
    }

    const uniqueId = generateUniqueMessageId();

    const templates = await ChatTemplate.find({ templateType: 'welcome_message', isActive: true }).sort({ priority: -1 }).limit(1);
    if (templates && templates.length > 0) {
      const tpl = templates[0];
      const rendered = tpl.render ? tpl.render({ firstName: userInfo.firstName || 'there' }) : tpl.content || `Hello ${userInfo.firstName || 'there'}!`;
      const quickReplies = formatQuickReplies(tpl.quickReplies);

      const msg = new ChatMessage({
        sessionId: session._id,
        senderId: session._id,
        senderModel: 'System',
        senderType: 'bot',
        message: rendered,
        messageType: 'text',
        metadata: {
          id: uniqueId,
          quickReplies,
          templateId: tpl._id,
          isGuestMessage: !isAuthenticated,
          isWelcomeMessage: true,
          noEncryption: true
        }
      });
      await msg.save();
      await ChatTemplate.findByIdAndUpdate(tpl._id, { $inc: { 'usage.timesUsed': 1 }, 'usage.lastUsed': new Date() });
      addMessageToSession(sessionId, uniqueId);
      logWithIcon.success('Template welcome created');
      return msg.toObject();
    } else {
      const fallbackQuickReplies = ['Search for jobs', 'Partnership info', 'Application help', 'Talk to agent'];
      const msg = new ChatMessage({
        sessionId: session._id,
        senderId: session._id,
        senderModel: 'System',
        senderType: 'bot',
        message: `Hello ${userInfo.firstName || 'there'}! 👋 Welcome to PSPL Support. How can I assist you today?`,
        messageType: 'text',
        metadata: {
          id: uniqueId,
          quickReplies: fallbackQuickReplies,
          isGuestMessage: !isAuthenticated,
          isWelcomeMessage: true,
          noEncryption: true
        }
      });
      await msg.save();
      addMessageToSession(sessionId, uniqueId);
      logWithIcon.success('Fallback welcome created');
      return msg.toObject();
    }
  } catch (err) {
    logWithIcon.error('createWelcomeMessage error:', err);
    try {
      const fallbackMsg = new ChatMessage({
        sessionId: session._id,
        senderId: session._id,
        senderModel: 'System',
        senderType: 'bot',
        message: `Hello! Welcome to PSPL Support.`,
        messageType: 'text',
        metadata: { id: generateUniqueMessageId(), quickReplies: [], isWelcomeMessage: true, noEncryption: true }
      });
      await fallbackMsg.save();
      return fallbackMsg.toObject();
    } catch (inner) {
      logWithIcon.error('fallback createWelcomeMessage failed:', inner);
      return null;
    }
  }
};

// Create chat session
const handleChatSessionCreate = async (socket, io, payload, ack) => {
  try {
    const { sessionType = 'bot', guestEmail, firstName, lastName, email, phone, metadata = {} } = payload;
    const userId = socket.user?._id?.toString();
    const isAuthenticated = !!userId;
    let userInfo = {}, guestUserId = null;

    if (isAuthenticated) {
      const user = await User.findById(userId);
      if (!user) { if (ack) ack({ error: 'Authenticated user not found' }); return { error: 'Authenticated user not found' }; }
      userInfo = { firstName: user.firstname || 'User', lastName: user.lastname || '', email: user.email, phone: user.phone || '' };
    } else {
      const guestEmailToUse = guestEmail || email;
      if (!guestEmailToUse || !firstName) { if (ack) ack({ error: 'Email and firstName required for guests' }); return { error: 'Email and firstName required' }; }
      let guestUser = await GuestUser.findOne({ email: guestEmailToUse.toLowerCase() });
      if (!guestUser) {
        guestUser = new GuestUser({ firstName: firstName.trim(), lastName: lastName?.trim() || '', email: guestEmailToUse.toLowerCase(), phone: phone?.trim() || '' });
        await guestUser.save();
      } else {
        guestUser.firstName = firstName.trim();
        if (lastName) guestUser.lastName = lastName.trim();
        if (phone) guestUser.phone = phone.trim();
        if (guestUser.schema?.paths?.lastSeen) guestUser.lastSeen = new Date();
        await guestUser.save();
      }
      userInfo = { firstName: guestUser.firstName, lastName: guestUser.lastName, email: guestUser.email, phone: guestUser.phone };
      guestUserId = guestUser._id;
    }

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
      businessHoursMetrics: { requestedDuringHours: socket.isBusinessHours || false, servedDuringHours: socket.isBusinessHours || false }
    });
    await metrics.save();

    let welcomeMessage = null;
    if (sessionType === 'bot') welcomeMessage = await createWelcomeMessage(session, userInfo, isAuthenticated);

    socket.join(`session:${session._id}`);
    const response = { success: true, session: session.toObject(), metrics: metrics.toObject(), welcomeMessage, businessHours: socket.businessHoursInfo, userTracking: { isAuthenticated, isGuest: !isAuthenticated && !!guestUserId, trackingId: !isAuthenticated && guestUserId ? guestUserId.toString() : userId, userInfo } };
    logWithIcon.success('Chat session created successfully');
    if (ack) ack(null, { body: { data: response } });
    return { body: { data: response } };
  } catch (err) {
    logWithIcon.error('handleChatSessionCreate error:', err);
    if (ack) ack({ error: err.message || 'Chat session creation failed' });
    return { error: err.message || 'Chat session creation failed' };
  }
};

// Handle message send from client (detect live agent requests)
const handleMessageSend = async (socket, io, payload, ack) => {
  try {
    const { sessionId, message, messageType = 'text', metadata = {} } = payload;
    const userId = socket.user?._id?.toString();
    const userRole = socket.user?.role || 'user';

    const session = await ChatSession.findById(sessionId);
    if (!session) throw new Error('Chat session not found');

    if (userRole === 'user' && session.userId?.toString() !== userId) {
      // Allow if guest and guestUserId matches
      if (!session.guestUserId || session.guestUserId.toString() !== (socket.user?._id?.toString())) {
        throw new Error('Unauthorized access to this chat session');
      }
    }

    const isLiveAgentRequest =
      messageType === 'live_agent_request' ||
      metadata.isLiveAgentRequest ||
      metadata.requestType === 'agent_connection' ||
      (typeof message === 'string' && (
        message.toLowerCase().includes('talk to agent') ||
        message.toLowerCase().includes('live agent') ||
        message.toLowerCase().includes('speak to someone') ||
        message.toLowerCase().includes('human support') ||
        message.toLowerCase().includes('connect me to agent') ||
        message.toLowerCase().includes('real person') ||
        /\b(agent|human|person|representative|support staff)\b/i.test(message)
      ));

    // Determine sender
    let senderId, senderModel;
    if (userId) { senderId = userId; senderModel = 'User'; }
    else { if (!session.guestUserId) throw new Error('Guest user not found for this session'); senderId = session.guestUserId; senderModel = 'GuestUser'; }

    const validMessageType = isLiveAgentRequest ? 'live_agent_request' : (['text', 'option_selection', 'form_data'].includes(messageType) ? messageType : 'text');

    const chatMessage = new ChatMessage({
      sessionId,
      senderId,
      senderModel,
      senderType: 'user',
      message: message,
      messageType: validMessageType,
      metadata: { ...metadata, isLiveAgentRequest, businessHoursMessage: !socket.isBusinessHours, detectedAgentRequest: isLiveAgentRequest, originalMessageType: messageType }
    });
    await chatMessage.save();

    session.lastMessageAt = new Date();
    if (isLiveAgentRequest) { session.agentRequested = true; session.agentRequestedAt = new Date(); }
    await session.save();

    io.to(`session:${sessionId}`).emit('message:new', chatMessage.toObject());

    if (isLiveAgentRequest) {
      await handleLiveAgentRequest(socket, io, {
        sessionId,
        userId,
        session,
        message: chatMessage,
        userInfo: getUserInfo(socket.user),
        ipAddress: getClientIP(socket)
      });
    } else {
      // Bot flow for non-agent requests
      if (session.sessionType === 'bot') {
        try {
          const botResponse = await ChatMessageController.generateBotResponse(session, message, validMessageType);
          if (botResponse) {
            setTimeout(async () => {
              try {
                const botMessage = await ChatMessageController.sendBotMessage(sessionId, botResponse);
                io.to(`session:${sessionId}`).emit('message:new', botMessage);
              } catch (err) {
                logWithIcon.error('send bot message error:', err);
                const errorMsg = new ChatMessage({ sessionId, senderId: sessionId, senderModel: 'System', senderType: 'bot', message: "I'm having trouble processing your request. Please try again.", messageType: 'system_notification', metadata: { id: generateUniqueMessageId(), isError: true, systemResponse: true, noEncryption: true } });
                await errorMsg.save(); io.to(`session:${sessionId}`).emit('message:new', errorMsg.toObject());
              }
            }, 800);
          }
        } catch (err) {
          logWithIcon.error('generateBotResponse error:', err);
        }
      }
    }

    if (ack) ack(null, { success: true, isLiveAgentRequest });
  } catch (err) {
    logWithIcon.error('handleMessageSend error:', err);
    if (ack) ack({ error: err.message || 'Error sending message' });
  }
};

// assignAgentToSessionComplete - finalize assignment and notify
const assignAgentToSessionComplete = async (io, sessionId, agent, session) => {
  try {
    const agentId = agent._id || agent.userId || agent.id;
    session.agentId = agentId;
    session.sessionType = 'live_agent';
    session.status = 'active_with_agent';
    session.assignedAt = new Date();
    await session.save();

    const agentName = agent.firstname || agent.name || 'Support Agent';
    const agentPhoto = agent.photo || agent.userId?.photo || 'https://img.freepik.com/premium-vector/account-icon-user-icon-vector-graphics_292645-552.jpg?w=300';

    const assignmentMessage = new ChatMessage({
      sessionId,
      senderId: agentId,
      senderModel: 'User',
      senderType: 'agent',
      message: `Hello! I'm ${agentName}, and I'll be assisting you today. I can see your previous conversation. How can I help you?`,
      messageType: 'agent_assignment',
      metadata: { id: generateUniqueMessageId(), agentInfo: { id: agentId, name: agentName, photo: agentPhoto }, systemResponse: true, isAgentAssignment: true, quickReplies: [], noEncryption: true }
    });
    await assignmentMessage.save();

    io.to(`session:${sessionId}`).emit('agent:assigned', { sessionId, agent: { id: agentId, name: agentName, photo: agentPhoto, assignedAt: session.assignedAt }, session: session.toObject() });
    io.to(`session:${sessionId}`).emit('message:new', assignmentMessage.toObject());
    io.to(`agent:${agentId}`).emit('agent:session_assigned', { agentId, sessionId, userInfo: session.userInfo, assignedAt: session.assignedAt, sessionUrl: generateUniqueAgentUrl(sessionId, assignmentMessage._id) });

    logWithIcon.success(`Assigned agent ${agentName} (${agentId}) to session ${sessionId}`);
    return { success: true, agentId, agentName, sessionId };
  } catch (err) {
    logWithIcon.error('assignAgentToSessionComplete error:', err);
    return { success: false, error: err.message || String(err) };
  }
};

// Check agent connection after timeout
const checkAgentConnectionTimeout = async (io, sessionId) => {
  try {
    const session = await ChatSession.findById(sessionId);
    if (!session) return;
    if (session.status === 'waiting_for_agent' && !session.agentId) {
      const timeoutMessage = new ChatMessage({
        sessionId,
        senderId: sessionId,
        senderModel: 'System',
        senderType: 'bot',
        message: `⏰ I apologize for the wait. Our agents are experiencing higher than usual volume. You can:\n\n• Continue waiting (someone will be with you soon)\n• Leave a message for callback\n• Email us directly at support@prosoftsynergies.com\n• Call us at +1 (555) 123-4567`,
        messageType: 'timeout_message',
        metadata: { id: generateUniqueMessageId(), isTimeoutMessage: true, systemResponse: true, quickReplies: ['Continue Waiting', 'Leave Message', 'Get Contact Info', 'End Chat'], noEncryption: true }
      });
      await timeoutMessage.save();
      io.to(`session:${sessionId}`).emit('message:new', timeoutMessage.toObject());
      logWithIcon.warning(`Agent connection timeout for session ${sessionId}`);
    }
  } catch (err) {
    logWithIcon.error('checkAgentConnectionTimeout error:', err);
  }
};

// Robust handleLiveAgentRequest
const handleLiveAgentRequest = async (socket, io, params = {}) => {
  const startTs = new Date();
  const nowLabel = () => (new Date()).toISOString();

  // small helper to log both with your logger and console for immediate visibility
  const logError = (prefix, err) => {
    try {
      const message = err && err.message ? err.message : String(err);
      const stack = err && err.stack ? err.stack : null;
      logWithIcon.error(prefix, message);
      if (stack) console.error(prefix, stack);
      else console.error(prefix, message);
    } catch (logErr) {
      console.error('logger failed:', logErr);
    }
  };

  try {
    // Defensive parameter extraction
    const { sessionId, userId, session, message, userInfo, ipAddress } = params || {};

    console.log(`[handleLiveAgentRequest] start ${nowLabel()}`, { sessionId, userId, hasSessionObj: !!session, hasMessageObj: !!message });

    if (!io) {
      const err = new Error('handleLiveAgentRequest requires io (socket.io server)');
      logError('handleLiveAgentRequest PARAM ERROR:', err);
      return { success: false, error: err.message };
    }

    if (!sessionId) {
      const err = new Error('handleLiveAgentRequest requires sessionId');
      logError('handleLiveAgentRequest PARAM ERROR:', err);
      return { success: false, error: err.message };
    }

    if (!message) {
      const err = new Error('handleLiveAgentRequest requires message object');
      logError('handleLiveAgentRequest PARAM ERROR:', err);
      // still try to mark session waiting even if message absent below
    }

    // Ensure we have messageId safe fallback
    let messageId;
    try {
      messageId = (message && (message._id || message.id)) ? (message._id || message.id).toString() : generateUniqueMessageId();
    } catch (idErr) {
      messageId = generateUniqueMessageId();
      logError('Failed reading message._id, generated fallback messageId:', idErr);
    }

    // 1) Generate unique URL (guarded)
    let uniqueUrl = null;
    try {
      uniqueUrl = generateUniqueAgentUrl(sessionId, messageId);
      console.log('[handleLiveAgentRequest] generated uniqueUrl', uniqueUrl);
    } catch (urlErr) {
      logError('generateUniqueAgentUrl failed:', urlErr);
      try {
        uniqueUrl = `${process.env.FRONTEND_BASE_URL || 'http://localhost:3000'}/admin/chat/session/${encodeURIComponent(sessionId)}?messageId=${encodeURIComponent(messageId)}`;
        console.warn('[handleLiveAgentRequest] using fallback uniqueUrl', uniqueUrl);
      } catch (fallbackErr) {
        logError('Failed to construct fallback uniqueUrl:', fallbackErr);
        uniqueUrl = null;
      }
    }

    // 2) Update session to waiting_for_agent (guarded)
    let updatedSession = null;
    try {
      updatedSession = await ChatSession.findByIdAndUpdate(
        sessionId,
        {
          $set: {
            sessionType: 'pending_agent',
            status: 'waiting_for_agent',
            agentRequestedAt: new Date(),
            uniqueAgentUrl: uniqueUrl,
            'metadata.agentRequestDetails': {
              requestedAt: new Date(),
              requestMessage: (message && message.message) ? message.message : '',
              requesterId: userId || null,
              requesterInfo: userInfo || null,
              ipAddress: ipAddress || getClientIP(socket) || 'unknown'
            }
          }
        },
        { new: true, runValidators: false }
      );

      if (!updatedSession) {
        // If update returned null (rare), attempt to fetch session
        try {
          updatedSession = await ChatSession.findById(sessionId);
        } catch (readErr) {
          logError('Could not read ChatSession after update returned null:', readErr);
        }
      }

      console.log('[handleLiveAgentRequest] session updated to waiting_for_agent', !!updatedSession);
    } catch (sessErr) {
      logError('ChatSession.findByIdAndUpdate failed:', sessErr);
      // fall back to passed session param if available
      updatedSession = session || updatedSession || null;
    }

    // 3) send immediate system message to user (guarded)
    try {
      const connectingMsg = new ChatMessage({
        sessionId,
        senderId: sessionId,
        senderModel: 'System',
        senderType: 'bot',
        message: "🔄 Thank you — connecting you with a live agent. Please hold on a moment.",
        messageType: 'system_response',
        metadata: { id: generateUniqueMessageId(), isAgentConnecting: true, noEncryption: true }
      });
      await connectingMsg.save();
      io.to(`session:${sessionId}`).emit('message:new', connectingMsg.toObject());
      console.log('[handleLiveAgentRequest] sent connecting system message to session');
    } catch (feedbackErr) {
      logError('Failed to send connecting message to session:', feedbackErr);
    }

    // 4) attempt to find an available agent (guarded)
    let availableAgent = null;
    try {
      if (typeof findAvailableAgent === 'function') {
        availableAgent = await findAvailableAgent({
          sessionId,
          userPreferences: updatedSession?.metadata?.preferences || {},
          businessHours: socket?.businessHoursInfo || null
        });
        console.log('[handleLiveAgentRequest] findAvailableAgent result:', !!availableAgent);
      } else {
        console.warn('[handleLiveAgentRequest] findAvailableAgent not defined or not a function');
      }
    } catch (findErr) {
      logError('findAvailableAgent threw error:', findErr);
      availableAgent = null;
    }

    // 5) if agent found, attempt assign (guarded)
    if (availableAgent) {
      try {
        if (typeof assignAgentToSessionComplete === 'function') {
          const assignRes = await assignAgentToSessionComplete(io, sessionId, availableAgent, updatedSession || session);
          console.log('[handleLiveAgentRequest] assignAgentToSessionComplete result:', assignRes);
          if (assignRes && assignRes.success) {
            return { success: true, autoAssigned: true, agentId: assignRes.agentId || null };
          } else {
            console.warn('[handleLiveAgentRequest] assignAgentToSessionComplete did not succeed:', assignRes);
          }
        } else {
          console.warn('[handleLiveAgentRequest] assignAgentToSessionComplete not defined');
        }
      } catch (assignErr) {
        logError('assignAgentToSessionComplete threw error:', assignErr);
      }
    }

    // 6) fallback: notify admins (email + socket) with full logging
    try {
      if (typeof notifyAdminsOfPendingRequest === 'function') {
        const notifyPayload = {
          sessionId,
          messageId,
          uniqueUrl,
          userInfo,
          session: (updatedSession && typeof updatedSession.toObject === 'function') ? updatedSession.toObject() : (updatedSession || session),
          ipAddress: ipAddress || getClientIP(socket),
          requestTime: new Date(),
          message: (message && (message.message || message.text)) ? (message.message || message.text) : '',
          businessHours: socket.businessHoursInfo || null
        };

        console.log('[handleLiveAgentRequest] calling notifyAdminsOfPendingRequest', { sessionId, messageId });
        const notifyResult = await notifyAdminsOfPendingRequest(io, notifyPayload).catch(err => { throw err; });

        console.log('[handleLiveAgentRequest] notifyAdminsOfPendingRequest completed', {
          emailSuccess: notifyResult?.emailNotification?.success,
          emailDetailsCount: notifyResult?.emailNotification?.details?.length || 0,
          socketSentCount: notifyResult?.socketNotifications?.sent || 0
        });

        // send waiting message to user referencing notify result
        try {
          const waitingMsg = new ChatMessage({
            sessionId,
            senderId: sessionId,
            senderModel: 'System',
            senderType: 'bot',
            message: `⏳ We have notified our team. Please stay connected—someone will join shortly.`,
            messageType: 'system_waiting',
            metadata: { id: generateUniqueMessageId(), adminNotified: !!notifyResult?.emailNotification?.success, noEncryption: true }
          });
          await waitingMsg.save();
          io.to(`session:${sessionId}`).emit('message:new', waitingMsg.toObject());
        } catch (wmErr) {
          logError('Failed to send waiting message after notifyAdminsOfPendingRequest:', wmErr);
        }

        // schedule timeout check (guarded)
        try {
          const timeoutMs = parseInt(process.env.AGENT_WAIT_TIMEOUT_MS || '300000', 10);
          setTimeout(async () => {
            try {
              await checkAgentConnectionTimeout(io, sessionId);
            } catch (tErr) {
              logError('checkAgentConnectionTimeout failed:', tErr);
            }
          }, isNaN(timeoutMs) ? 300000 : timeoutMs);
        } catch (schedErr) {
          logError('Failed to schedule agent connection timeout:', schedErr);
        }

        return { success: true, autoAssigned: false, notifyResult };
      } else {
        const err = new Error('notifyAdminsOfPendingRequest function is not available');
        logError('handleLiveAgentRequest dependency missing:', err);
        // still inform user
        try {
          const fallbackMsg = new ChatMessage({
            sessionId,
            senderId: sessionId,
            senderModel: 'System',
            senderType: 'bot',
            message: "I couldn't notify our agents due to a server issue. Please try again later or contact support.",
            messageType: 'system_error',
            metadata: { id: generateUniqueMessageId(), isError: true, noEncryption: true }
          });
          await fallbackMsg.save();
          io.to(`session:${sessionId}`).emit('message:new', fallbackMsg.toObject());
        } catch (errEmit) {
          logError('Failed to emit fallback error message to session:', errEmit);
        }
        return { success: false, error: err.message };
      }
    } catch (notifyErr) {
      logError('notifyAdminsOfPendingRequest threw error:', notifyErr);

      // Emit admin-visible error event for immediate debugging (admins room)
      try {
        io.to('admins').emit('server:error', {
          at: nowLabel(),
          source: 'handleLiveAgentRequest',
          sessionId,
          message: notifyErr.message,
          stack: notifyErr.stack
        });
      } catch (emitErr) {
        logError('Failed to emit server:error to admins room:', emitErr);
      }

      // Send a clear error system message to the session so you can copy the trace
      try {
        const errMsg = new ChatMessage({
          sessionId,
          senderId: sessionId,
          senderModel: 'System',
          senderType: 'bot',
          message: "I apologize — there was an error connecting you to an agent. The server logged details and the team has been notified.",
          messageType: 'system_error',
          metadata: { id: generateUniqueMessageId(), isError: true, noEncryption: true }
        });
        await errMsg.save();
        io.to(`session:${sessionId}`).emit('message:new', errMsg.toObject());
      } catch (emitErr) {
        logError('Failed to send error message to session after notify error:', emitErr);
      }

      return { success: false, error: notifyErr.message, stack: notifyErr.stack };
    }
  } catch (topErr) {
    // This outermost catch should capture any unforeseen error and log full stack
    try { logWithIcon.error('handleLiveAgentRequest top-level error: ' + (topErr && topErr.message ? topErr.message : String(topErr))); } catch (e) { console.error('logger failed:', e); }
    try { console.error('handleLiveAgentRequest top-level stack:', topErr.stack); } catch (e) { /* ignore */ }

    // Try to emit the error into session so you can copy stack
    try {
      const sessionId = (params && params.sessionId) || null;
      if (sessionId && io) {
        const errMsg = new ChatMessage({
          sessionId,
          senderId: sessionId,
          senderModel: 'System',
          senderType: 'bot',
          message: "A critical error occurred while trying to connect you to an agent. The team has been notified.",
          messageType: 'system_error',
          metadata: { id: generateUniqueMessageId(), isError: true, serverError: true, noEncryption: true }
        });
        await errMsg.save();
        io.to(`session:${sessionId}`).emit('message:new', errMsg.toObject());
      }
    } catch (emitErr) {
      logError('Failed to emit final error message to session:', emitErr);
    }

    // Re-throw or return a structured failure (we return, so caller won't crash)
    return { success: false, error: topErr.message || 'unknown error', stack: topErr.stack || null };
  }
};

// Agent accepts session via socket (alternative path)
const handleAgentAcceptSession = async (socket, io, { sessionId }, ack) => {
  try {
    const agentId = socket.user._id || socket.user.agentId;
    const session = await ChatSession.findById(sessionId);
    if (!session) { if (ack) return ack({ error: 'Session not found' }); return; }
    if (session.agentId && session.agentId.toString() !== agentId.toString()) { if (ack) return ack({ error: 'Already assigned to another agent' }); return; }
    if (session.status !== 'waiting_for_agent') { if (ack) return ack({ error: 'Session is not waiting for agent assignment' }); return; }

    const result = await assignAgentToSessionComplete(io, sessionId, socket.user, session);
    if (result.success) {
      socket.join(`session:${sessionId}`);
      if (ack) ack(null, { success: true, sessionId, agentId, message: 'Assigned' });
    } else {
      if (ack) ack({ error: result.error || 'Assignment failed' });
    }
  } catch (err) {
    logWithIcon.error('handleAgentAcceptSession error:', err);
    if (ack) ack({ error: err.message || 'Error accepting session' });
  }
};

// Agent rejects session (reassign logic)
const handleAgentReject = async (socket, io, { sessionId, reason }, ack) => {
  try {
    logWithIcon.agent(`Agent ${socket.user._id} rejected session ${sessionId}: ${reason}`);
    const session = await ChatSession.findById(sessionId);
    if (session && session.status === 'waiting_for_agent') {
      const anotherAgent = await findAvailableAgent({ sessionId, excludeAgentId: socket.user._id, businessHours: socket.businessHoursInfo });
      if (anotherAgent) {
        await assignAgentToSessionComplete(io, sessionId, anotherAgent, session);
      }
    }
    if (ack) ack(null, { success: true });
  } catch (err) {
    logWithIcon.error('handleAgentReject error:', err);
    if (ack) ack({ error: err.message || 'Error rejecting session' });
  }
};

// Session transfer to a specific agent
const handleSessionTransferToAgent = async (socket, io, payload, ack) => {
  try {
    const { sessionId, targetAgentId, reason, transferNote } = payload;
    const session = await ChatSession.findById(sessionId);
    if (!session) return ack && ack({ error: 'Session not found' });

    if (session.agentId) {
      const { releaseAgentFromSession } = require('./agentAssignmentService');
      await releaseAgentFromSession(sessionId, session.agentId);
    }

    const assignmentResult = await agentAssignment.assignAgentToSession(sessionId, targetAgentId);
    if (assignmentResult.success) {
      const transferMessage = new ChatMessage({
        sessionId,
        senderId: targetAgentId,
        senderModel: 'User',
        senderType: 'agent',
        message: `Hello! I'm taking over this conversation from my colleague. ${transferNote ? `Note: ${transferNote}` : ''} How can I continue to help you?`,
        messageType: 'agent_transfer',
        metadata: { id: generateUniqueMessageId(), isTransfer: true, reason, transferNote, previousAgentId: session.agentId, systemResponse: true, noEncryption: true }
      });
      await transferMessage.save();
      io.to(`session:${sessionId}`).emit('message:new', transferMessage.toObject());
    }
    if (ack) ack(null, assignmentResult);
  } catch (err) {
    logWithIcon.error('handleSessionTransferToAgent error:', err);
    if (ack) ack({ error: err.message || 'Error transferring session' });
  }
};

// session:join helper (auth checks applied in socket handlers)
const handleJoinSession = async (socket, io, { sessionId }, ack) => {
  try {
    const session = await ChatSession.findById(sessionId).lean();
    if (!session) return ack && ack({ error: 'Session not found' });

    // admin or agent can join; regular user must be owner
    if (socket.user.role === 1 || socket.user.role === 'agent') {
      socket.join(`session:${sessionId}`);
    } else {
      const uid = socket.user._id?.toString() || socket.user.userId?.toString();
      if (session.userId && session.userId.toString() !== uid) return ack && ack({ error: 'Access denied to join this session' });
      socket.join(`session:${sessionId}`);
    }
    if (ack) ack(null, { success: true, sessionId });
  } catch (err) {
    logWithIcon.error('handleJoinSession error:', err);
    if (ack) ack({ error: err.message || 'Error joining session' });
  }
};

// Setup socket handlers (single consolidated function)
const setupSocketHandlers = (io) => {

  io.on('connection', async (socket) => {
    // Attach business hours info
    try {
      const detailed = await businessHoursAdapter.getDetailedStatus();
      socket.businessHoursInfo = detailed || null;
      socket.isBusinessHours = !!(detailed && detailed.isOpen);
    } catch (err) {
      logWithIcon.error('businessHoursAdapter.getDetailedStatus error:', err);
      socket.businessHoursInfo = null;
      socket.isBusinessHours = false;
    }

    // handle incoming connection
    await handleConnection(socket, io);

    // Activity events
    socket.on('user:activity', async (data) => { await handleUserActivity(socket, io, data); });
    socket.on('activity:specific', async (data) => { await handleSpecificActivity(socket, io, data); });

    // Chat events
    socket.on('session:create', async (payload, ack) => { await handleChatSessionCreate(socket, io, payload, ack); });
    socket.on('session:join', async (payload, ack) => { await handleJoinSession(socket, io, payload, ack); });
    socket.on('message:send', async (payload, ack) => { await handleMessageSend(socket, io, payload, ack); });

    // Agent events
    socket.on('agent:accept', async (payload, ack) => { await handleAgentAcceptSession(socket, io, payload, ack); });
    socket.on('agent:reject', async (payload, ack) => { await handleAgentReject(socket, io, payload, ack); });

    // Admin requests
    socket.on('admin:requestStatusList', async () => {
      try {
        if (socket.user && socket.user.role === 1) {
          const admins = await getAllAdminsWithSessions();
          socket.emit('admin:initialStatusList', admins);
        }
      } catch (err) {
        logWithIcon.error('admin:requestStatusList error:', err);
        socket.emit('admin:initialStatusList', []);
      }
    });

    socket.on('typing', ({ sessionId, isTyping }) => {
      if (!sessionId) return;
      socket.to(`session:${sessionId}`).emit('typing', { sessionId, user: { id: socket.user._id || socket.user.id, name: socket.user.firstname || socket.user.name, role: socket.user.role }, isTyping });
    });

    socket.on('disconnect', async (reason) => { await handleDisconnect(socket, io, reason); });
  });
};

module.exports = {
  setupSocketHandlers,
  handleConnection,
  debugActivitySessionModel,
  createActivitySessionSafely,
  handleDisconnect,
  handleUserActivity,
  handleSpecificActivity,
  handleChatSessionCreate,
  formatQuickReplies,
  createWelcomeMessage,
  handleLiveAgentRequest,
  assignAgentToSessionComplete,
  handleAgentAcceptSession,
  checkAgentConnectionTimeout,
  handleMessageSend,
  handleAgentReject,
  handleSessionTransferToAgent,
  handleJoinSession,
  getAllAdminsWithSessions,
  emitAdminStatusChange,
  logAndEmitActivity,
  updateUserStatus,
  getClientIP,
  createUserInfo,
  generateUniqueMessageId
};
