// server/services/socketService.js

const mongoose = require('mongoose');
const User = require('../models/userModel');
const ActivitySession = require('../models/activitySessionModel');
const IdleTracking = require('../models/idleTrackingModel');
const ActivityLog = require('../models/activityLogModel');
const os = require('os');
const { logWithIcon } = require('./consoleIcons');

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
  console.log('Debug client IP headers:', {
    'cf-connecting-ip': cfConnectingIP,
    'x-real-ip': real,
    'x-forwarded-for': forwarded,
    'handshake.address': socket.handshake.address,
    'request.connection.remoteAddress': socket.request.connection?.remoteAddress,
    'conn.remoteAddress': socket.conn?.remoteAddress
  });

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
  const cleanIP = ipAddress === 'unknown' ? 'no-ip' : ipAddress.replace(/\./g, '-');
  return `${email}@${cleanIP}`;
};

const validateStatus = (status) => VALID_STATUSES.includes(status) ? status : 'offline';
const validateActivityType = (activityType) => VALID_ACTIVITY_TYPES.includes(activityType) ? activityType : 'general';

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
    console.log(`✅ Updated user ${userId} status to ${status} from IP ${ipAddress}`);
  } catch (error) {
    console.error(`❌ Error updating user status:`, error);
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
  console.log(`📡 Emitting admin status change: ${data.status} for user ${data.userInfo?.email}`);
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

    console.log(`📝 Logging activity: ${activityType} for ${userIdentifier}`);

    const user = await User.findById(userId).select('email');
    const email = user?.email || 'unknown@email.com';

    const activityLog = new ActivityLog({
      userId,
      email,
      sessionId: sessionId ? new mongoose.Types.ObjectId(sessionId) : null,
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
    console.error('❌ Error logging activity:', error);
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
    console.error('❌ Error getting admins with sessions:', error);
    return [];
  }
};

// Handle new socket connection logic
const handleConnection = async (socket, io) => {
  let userId, ipAddress, userIdentifier;

  try {
    if (!socket.user) {
      console.warn('⚠️ No user data attached to socket on connection');
      return;
    }

    userId = socket.user._id.toString();
    ipAddress = getClientIP(socket);
    userIdentifier = createUserIdentifier(socket.user, ipAddress);

    console.log(`🔗 User connected: ${userIdentifier}`);

    // Set user status online & update last login
    await updateUserStatus(userId, 'online', { lastLogin: new Date(), socketId: socket.id }, ipAddress);

    if (socket.user.role === 1) { // If admin
      let activeSession = await ActivitySession.findOne({
        userId: mongoose.Types.ObjectId(userId),
        sessionStatus: 'active'
      }).lean();

      if (!activeSession) {
        activeSession = await ActivitySession.create({
          userId: mongoose.Types.ObjectId(userId),
          loginTime: new Date(),
          sessionStatus: 'active',
          ipAddress,
          userAgent: socket.handshake.headers['user-agent'],
          socketId: socket.id
        });
        console.log(`📅 Created new session for ${userIdentifier}`);
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

      console.log(`✅ Admin connection handled for ${userIdentifier}`);
    }
  } catch (err) {
    console.error(`❌ Error during connection handling for user ${userId}:`, err);
  }
};

// Handle disconnect event
const handleDisconnect = async (socket, io, reason) => {
  try {
    if (!socket.user) return;

    const userId = socket.user._id.toString();
    const ipAddress = getClientIP(socket);
    const userIdentifier = createUserIdentifier(socket.user, ipAddress);

    console.log(`🔌 User disconnect: ${userIdentifier}, reason: ${reason}`);

    await updateUserStatus(userId, 'offline', {}, ipAddress);

    if (socket.user.role === 1) {
      const session = await ActivitySession.findOne({
        userId: mongoose.Types.ObjectId(userId),
        sessionStatus: 'active'
      });

      if (session) {
        const now = new Date();
        const sessionDuration = now - session.loginTime;

        if (session.idleStartTime) {
          const idleDuration = now - session.idleStartTime;
          session.totalIdleTime = (session.totalIdleTime || 0) + idleDuration;

          await IdleTracking.findOneAndUpdate(
            { userId: mongoose.Types.ObjectId(userId), sessionId: session._id, idleEndTime: null },
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
    console.error('❌ Error during disconnect handling:', error);
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
      userId: mongoose.Types.ObjectId(userId),
      sessionStatus: 'active'
    });

    if (!session) {
      console.warn('⚠️ No active session found for activity');
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
          userId: mongoose.Types.ObjectId(userId),
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
          { userId: mongoose.Types.ObjectId(userId), sessionId: session._id, idleEndTime: null },
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
          { userId: mongoose.Types.ObjectId(userId), sessionId: session._id, idleEndTime: null },
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
    console.error(`❌ Error processing user activity: ${err}`);
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
      userId: mongoose.Types.ObjectId(userId),
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
    console.error('❌ Error handling specific activity:', error);
  }
};

const handleAdminRequestStatusList = async (socket) => {
  if (!socket.user || socket.user.role !== 1) return;

  const ipAddress = getClientIP(socket);
  const userIdentifier = createUserIdentifier(socket.user, ipAddress);

  try {
    const adminsWithSession = await getAllAdminsWithSessions();
    socket.emit('admin:initialStatusList', adminsWithSession);
  } catch (error) {
    console.error('❌ Error sending admin status list:', error);
    socket.emit('admin:initialStatusList', []);
  }
};

const setupSocketHandlers = (io) => {
  io.on('connection', async (socket) => {
    await handleConnection(socket, io);

    socket.on('user:activity', async (data) => {
      await handleUserActivity(socket, io, data);
    });

    socket.on('activity:specific', async (data) => {
      await handleSpecificActivity(socket, io, data);
    });

    socket.on('admin:requestStatusList', async () => {
      await handleAdminRequestStatusList(socket);
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
