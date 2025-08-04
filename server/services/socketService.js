const mongoose = require('mongoose');
const User = require('../models/userModel');
const ActivitySession = require('../models/activitySessionModel');
const IdleTracking = require('../models/idleTrackingModel');
const ActivityLog = require('../models/activityLogModel');

const VALID_STATUSES = ['offline', 'online', 'active', 'idle', 'away'];
const VALID_ACTIVITY_TYPES = [
  'login', 'logout', 'idle_start', 'idle_end', 'auto_logout', 
  'session_start', 'session_end', 'session_resume', 'session_pause',
  'tab_hidden', 'tab_visible', 'connection_lost', 'reconnected',
  'page_focus', 'page_blur', 'mouse_activity', 'keyboard_activity',
  'manual_override', 'page_unload', 'component_unmount'
];

// Enhanced IP address extraction
const getClientIP = (socket) => {
  const forwarded = socket.handshake.headers['x-forwarded-for'];
  const real = socket.handshake.headers['x-real-ip'];
  const cfConnectingIP = socket.handshake.headers['cf-connecting-ip'];
  
  if (cfConnectingIP) return cfConnectingIP;
  if (real) return real;
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  const socketIP = socket.handshake.address;
  if (socketIP === '::1' || socketIP === '127.0.0.1') {
    return 'localhost';
  }
  if (socketIP.startsWith('::ffff:127.0.0.1')) {
    return 'localhost';
  }
  if (socketIP && socketIP.startsWith('::ffff:')) {
    return socketIP.substring(7);
  }
  
  return socketIP || 'unknown';
};

const createUserIdentifier = (user, ipAddress) => {
  const email = user.email || 'unknown@email.com';
  const cleanIP = ipAddress === 'unknown' ? 'no-ip' : ipAddress.replace(/\./g, '-');
  return `${email}@${cleanIP}`;
};

const validateStatus = (status) => {
  return VALID_STATUSES.includes(status) ? status : 'offline';
};

const validateActivityType = (activityType) => {
  return VALID_ACTIVITY_TYPES.includes(activityType) ? activityType : 'general';
};

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

const createUserInfo = (user) => {
  return {
    userId: user._id || user.userId,
    email: user.email,
    firstName: user.firstname || user.firstName,
    lastName: user.lastname || user.lastName,
    role: user.role,
    photo: user.photo
  };
};

const emitAdminStatusChange = (io, data) => {
  console.log(`📡 Emitting admin status change: ${data.status} for user ${data.userInfo?.email}`);
  
  io.emit('statusChanged', data);
  
  if (data.status === 'online' || data.status === 'active') {
    io.emit('adminOnline', data);
  } else if (data.status === 'offline') {
    io.emit('adminOffline', data);
  } else if (data.status === 'idle') {
    io.emit('adminIdle', data);
  } else if (data.status === 'away') {
    io.emit('adminAway', data);
  }
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
      userId: userId,
      email: email, 
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

const handleConnection = async (socket, io) => {
  try {
    if (!socket.user) {
      console.log('⚠️ No user data in socket');
      return;
    }

    const userId = (socket.user._id || socket.user.userId).toString();
    const ipAddress = getClientIP(socket);
    const userIdentifier = createUserIdentifier(socket.user, ipAddress);

    console.log(`🔗 Connection from ${userIdentifier}`);

    await updateUserStatus(userId, 'online', {
      lastLogin: new Date(),
      socketId: socket.id
    }, ipAddress);

     if (socket.user.role === 1) {
      const updatedSession = await ActivitySession.findOne({
        userId: new mongoose.Types.ObjectId(userId),
        sessionStatus: "active"
      }).lean();

      // Emit even if status didn't change
      emitAdminStatusChange(io, {
        userId,
        status,
        previousStatus,
        loginLatestSession: updatedSession,
        userInfo: createUserInfo(socket.user),
        userIdentifier,
        ipAddress,
        instanceId: data.instanceId,
        timestamp: now.getTime(),
        sessionId: updatedSession?._id
      });
    }
  } catch (err) {
    console.error(`❌ Error handling user activity: ${err}`);
  }
};

const handleDisconnect = async (socket, io, reason) => {
  try {
    if (!socket.user) return;

    const userId = (socket.user._id || socket.user.userId).toString();
    const ipAddress = getClientIP(socket);
    const userIdentifier = createUserIdentifier(socket.user, ipAddress);

    console.log(`🔌 Disconnect from ${userIdentifier}, reason: ${reason}`);

    await updateUserStatus(userId, 'offline', {}, ipAddress);

    if (socket.user.role === 1) {
      const session = await ActivitySession.findOne({
        userId: new mongoose.Types.ObjectId(userId),
        sessionStatus: 'active'
      });

      if (session) {
        const now = new Date();
        const sessionDuration = now - session.loginTime;

        if (session.idleStartTime) {
          const idleDuration = now - session.idleStartTime;
          session.totalIdleTime = (session.totalIdleTime || 0) + idleDuration;
          
          await IdleTracking.findOneAndUpdate(
            { 
              userId: new mongoose.Types.ObjectId(userId), 
              sessionId: session._id, 
              idleEndTime: null 
            },
            { 
              idleEndTime: now, 
              idleDuration: idleDuration,
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
    console.error('❌ Error handling disconnect:', error);
  }
};

const handleUserActivity = async (socket, io, data) => {
  if (!socket.user || (!socket.user._id && !socket.user.userId)) return;
  
  const userId = (socket.user._id || socket.user.userId).toString();
  const ipAddress = getClientIP(socket);
  const userIdentifier = createUserIdentifier(socket.user, ipAddress);
  let status = validateStatus(data.status || 'active');
  const now = data.timestamp ? new Date(data.timestamp) : new Date();

  console.log(`👤 User activity: ${status} from ${userIdentifier}`);

  try {
    const session = await ActivitySession.findOne({
      userId: new mongoose.Types.ObjectId(userId),
      sessionStatus: "active"
    });

    if (!session) {
      console.log('⚠️ No active session found for activity');
      return;
    }

    const currentUser = await User.findById(userId).select('currentStatus');
    const previousStatus = currentUser ? currentUser.currentStatus : 'offline';
    let shouldEmitStatusChange = false;
    
    console.log(`🔄 Status transition: ${previousStatus} → ${status}`);
    
    if (status === "idle") {
      if (!session.idleStartTime && (previousStatus === 'active' || previousStatus === 'online')) {
        console.log(`😴 Starting idle period for ${userIdentifier} (from ${previousStatus})`);
        session.idleStartTime = now;
        await session.save();

        const idleTracking = await IdleTracking.create({
          userId: new mongoose.Types.ObjectId(userId),
          sessionId: session._id,
          idleStartTime: now,
          metadata: { 
            instanceId: data.instanceId,
            userIdentifier,
            ipAddress,
            previousStatus
          }
        });

        await logAndEmitActivity(socket, io, {
          userId,
          activityType: 'idle_start',
          sessionId: session._id,
          timestamp: now,
          metadata: { 
            instanceId: data.instanceId,
            userIdentifier,
            idleTrackingId: idleTracking._id
          }
        });
        
        shouldEmitStatusChange = true;
      }
    } 
    else if (status === "away") {
      if (previousStatus === 'idle') {
        console.log(`🚶 User going away: ${userIdentifier}`);
        if (!session.idleStartTime) {
          session.idleStartTime = now;
        }
        await session.save();
        
        await IdleTracking.findOneAndUpdate(
          { 
            userId: new mongoose.Types.ObjectId(userId), 
            sessionId: session._id, 
            idleEndTime: null 
          },
          { 
            metadata: { 
              instanceId: data.instanceId,
              transitionedToAway: true,
              awayStartTime: now,
              userIdentifier,
              ipAddress
            }
          },
          { upsert: true }
        );

        await logAndEmitActivity(socket, io, {
          userId,
          activityType: 'session_pause',
          sessionId: session._id,
          timestamp: now,
          metadata: { 
            instanceId: data.instanceId, 
            previousStatus,
            userIdentifier
          }
        });
        
        shouldEmitStatusChange = true;
      }
    }
    else if (status === "active") {
      if (session.idleStartTime && (previousStatus === 'idle' || previousStatus === 'away')) {
        console.log(`⚡ User returning to active: ${userIdentifier} from ${previousStatus}`);
        const idleDurationMs = now - session.idleStartTime;
        
        session.totalIdleTime = (session.totalIdleTime || 0) + idleDurationMs;
        session.idleStartTime = null;
        session.totalWorkTime = now - session.loginTime - session.totalIdleTime;
        await session.save();

        const updatedIdleTracking = await IdleTracking.findOneAndUpdate(
          { 
            userId: new mongoose.Types.ObjectId(userId), 
            sessionId: session._id, 
            idleEndTime: null 
          },
          { 
            idleEndTime: now, 
            idleDuration: idleDurationMs,
            "metadata.endInstanceId": data.instanceId,
            "metadata.resumedFrom": previousStatus,
            "metadata.userIdentifier": userIdentifier
          },
          { new: true }
        );

        const activityType = previousStatus === 'away' ? 'session_resume' : 'idle_end';
        await logAndEmitActivity(socket, io, {
          userId,
          activityType,
          sessionId: session._id,
          timestamp: now,
          metadata: { 
            instanceId: data.instanceId, 
            idleDuration: idleDurationMs,
            resumedFrom: previousStatus,
            userIdentifier,
            idleTrackingId: updatedIdleTracking?._id
          }
        });
        
        shouldEmitStatusChange = true;
      } 
      else if (previousStatus === 'offline' || previousStatus === 'online') {
        shouldEmitStatusChange = true;
      }
    }
    
    if (status === "idle" && !shouldEmitStatusChange) {
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
        instanceId: data.instanceId,
        timestamp: now.getTime(),
        sessionId: session._id
      });
    }

  } catch (err) {
    console.error(`❌ Error handling user activity: ${err}`);
  }
};

const handleSpecificActivity = async (socket, io, data) => {
  if (!socket.user || (!socket.user._id && !socket.user.userId)) return;
  
  const userId = (socket.user._id || socket.user.userId).toString();
  const ipAddress = getClientIP(socket);
  const userIdentifier = createUserIdentifier(socket.user, ipAddress);
  const { activityType, timestamp, metadata = {} } = data;
  const now = timestamp ? new Date(timestamp) : new Date();

  console.log(`🎯 Specific activity: ${activityType} from ${userIdentifier}`);

  try {
    const session = await ActivitySession.findOne({
      userId: new mongoose.Types.ObjectId(userId),
      sessionStatus: 'active'
    });

    const currentUser = await User.findById(userId).select('currentStatus');
    const previousStatus = currentUser ? currentUser.currentStatus : 'offline';
    let newStatus = previousStatus;
    let shouldEmitStatusChange = false;

    switch (activityType) {
      case 'tab_hidden':
        console.log(`👁️ Tab hidden for ${userIdentifier}`);
        newStatus = 'idle';
        shouldEmitStatusChange = previousStatus !== 'idle';
        break;
        
      case 'tab_visible':
        console.log(`👁️ Tab visible for ${userIdentifier}`);
        newStatus = 'active';
        shouldEmitStatusChange = previousStatus !== 'active';
        break;
        
      case 'page_focus':
        console.log(`🎯 Page focused for ${userIdentifier}`);
        newStatus = 'active';
        shouldEmitStatusChange = previousStatus !== 'active';
        break;
        
      case 'page_blur':
        console.log(`🌫️ Page blurred for ${userIdentifier}`);
        newStatus = 'idle';
        shouldEmitStatusChange = previousStatus !== 'idle';
        break;
        
      case 'mouse_activity':
      case 'keyboard_activity':
        console.log(`⌨️🖱️ Input activity for ${userIdentifier}`);
        newStatus = 'active';
        shouldEmitStatusChange = previousStatus !== 'active';
        break;
        
      case 'session_pause':
        console.log(`⏸️ Session paused for ${userIdentifier}`);
        newStatus = 'away';
        shouldEmitStatusChange = previousStatus !== 'away';
        if (session) session.sessionStatus = 'paused';
        break;
        
      case 'session_resume':
        console.log(`▶️ Session resumed for ${userIdentifier}`);
        newStatus = 'active';
        shouldEmitStatusChange = previousStatus !== 'active';
        if (session) session.sessionStatus = 'active';
        break;
        
      case 'idle_start':
        console.log(`😴 Idle started for ${userIdentifier}`);
        newStatus = 'idle';
        shouldEmitStatusChange = previousStatus !== 'idle';
        if (session) session.idleStartTime = now;
        break;
        
      case 'idle_end':
        console.log(`⚡ Idle ended for ${userIdentifier}`);
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
      sessionId: session?._id,
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
        sessionId: session?._id
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
  
  console.log(`📋 Admin status list requested by ${userIdentifier}`);

  try {
    const adminsWithSession = await getAllAdminsWithSessions();
    socket.emit('admin:initialStatusList', adminsWithSession);
  } catch (error) {
    console.error('❌ Error handling admin status list request:', error);
    socket.emit('admin:initialStatusList', []);
  }
};

const setupSocketHandlers = (io) => {
  io.on('connection', async (socket) => {
    await handleConnection(socket, io);

    socket.on("user:activity", async (data) => {
      await handleUserActivity(socket, io, data);
    });

    socket.on("activity:specific", async (data) => {
      await handleSpecificActivity(socket, io, data);
    });

    socket.on("admin:requestStatusList", async () => {
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
