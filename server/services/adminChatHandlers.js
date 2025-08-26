// server/socket/adminChatHandlers.js
const ChatSession = require('../models/chatSessionModel');
const ChatMessage = require('../models/chatMessageModel');
const User = require('../models/userModel');
const { logWithIcon } = require('../services/consoleIcons');

/**
 * Admin Chat Socket Event Handlers
 * Handles real-time communication between admins and users
 */
const registerAdminChatHandlers = (io, socket) => {
  
  /**
   * Admin joins a chat session
   */
  socket.on('admin:join_session', async (data) => {
    try {
      const { sessionId, adminId } = data;
      
      if (!sessionId || !adminId) {
        socket.emit('error', { message: 'Session ID and Admin ID are required' });
        return;
      }

      // Verify session exists and admin has permission
      const session = await ChatSession.findById(sessionId);
      if (!session) {
        socket.emit('error', { message: 'Chat session not found' });
        return;
      }

      // Join the session room
      socket.join(`session:${sessionId}`);
      socket.join('admins');
      
      // Store admin info in socket
      socket.adminId = adminId;
      socket.currentSession = sessionId;

      // Update admin's socket ID in database
      await User.findByIdAndUpdate(adminId, { 
        socketId: socket.id,
        currentStatus: 'online',
        lastActiveAt: new Date()
      });

      // Notify user that admin joined
      socket.to(`session:${sessionId}`).emit('admin:joined', {
        sessionId,
        admin: {
          _id: adminId,
          socketId: socket.id
        },
        joinedAt: new Date()
      });

      logWithIcon.success(`Admin ${adminId} joined session ${sessionId}`);
      
      socket.emit('admin:session_joined', {
        success: true,
        sessionId,
        message: 'Successfully joined chat session'
      });

    } catch (error) {
      logWithIcon.error('Error in admin:join_session:', error);
      socket.emit('error', { message: 'Failed to join session' });
    }
  });

  /**
   * Admin sends a message
   */
  socket.on('admin:send_message', async (data) => {
    try {
      const { sessionId, message, adminId, messageType = 'text', metadata = {} } = data;

      if (!sessionId || !message || !adminId) {
        socket.emit('error', { message: 'Missing required fields' });
        return;
      }

      // Verify session and admin
      const [session, admin] = await Promise.all([
        ChatSession.findById(sessionId),
        User.findById(adminId)
      ]);

      if (!session) {
        socket.emit('error', { message: 'Session not found' });
        return;
      }

      if (!admin || admin.role !== 1) {
        socket.emit('error', { message: 'Unauthorized' });
        return;
      }

      // Create message
      const newMessage = new ChatMessage({
        sessionId,
        message: message.trim(),
        senderType: 'agent',
        senderId: adminId,
        senderName: `${admin.firstname} ${admin.lastname}`,
        messageType,
        senderModel: 'LiveAgent',
        metadata: {
          ...metadata,
          senderAvatar: admin.photo,
          agentId: adminId
        }
      });
      await newMessage.save();

      logWithIcon.success(`Chat Message saved: ${newMessage._id}`);

      logWithIcon.info(`Updating chat session...`);
      // Update session with last message
      session.lastMessage = newMessage._id;
      session.lastMessageAt = new Date();
      if (session.status === 'waiting') {
        session.status = 'active';
        session.agent = adminId;
        session.assignedAt = new Date();
      }
      try{
        await session.save();
      }catch (error) {
        console.error('Error updating chat session:', error);
      }
      
      logWithIcon.success(`Session updated: ${sessionId}`);

      // Prepare message for broadcast
      const messageData = {
        ...newMessage.toObject(),
        senderName: `${admin.firstname} ${admin.lastname}`,
        timestamp: newMessage.createdAt,
        avatar: admin.photo
      };

      // Emit to all participants in the session
      io.to(`session:${sessionId}`).emit('message:new', messageData);

      // Update message status
      setTimeout(() => {
        socket.emit('message:status', {
          messageId: newMessage._id,
          status: 'delivered'
        });
      }, 100);

      logWithIcon.success(`Admin ${adminId} sent message in session ${sessionId}`);

    } catch (error) {
      logWithIcon.error('Error in admin:send_message:', error);
      socket.emit('error', { message: 'Failed to send message' });
    }
  });

  /**
   * Admin typing indicator
   */
  socket.on('admin:typing', async (data) => {
    try {
      const { sessionId, adminId, isTyping } = data;

      if (!sessionId || !adminId) {
        return;
      }

      // Get admin info for typing indicator
      const admin = await User.findById(adminId).select('firstname lastname');
      
      if (admin) {
        // Emit to user in the session (exclude admin)
        socket.to(`session:${sessionId}`).emit('agent:typing', {
          sessionId,
          isTyping,
          agent: {
            _id: adminId,
            name: `${admin.firstname} ${admin.lastname}`
          }
        });
      }

    } catch (error) {
      logWithIcon.error('Error in admin:typing:', error);
    }
  });

  /**
   * Admin ends session
   */
  socket.on('admin:end_session', async (data) => {
    try {
      const { sessionId, adminId, reason = 'ended_by_agent' } = data;

      if (!sessionId || !adminId) {
        socket.emit('error', { message: 'Session ID and Admin ID are required' });
        return;
      }

      const session = await ChatSession.findById(sessionId);
      if (!session) {
        socket.emit('error', { message: 'Session not found' });
        return;
      }

      // Update session
      session.status = 'ended';
      session.endedAt = new Date();
      session.endedBy = adminId;
      session.endReason = reason;
      await session.save();

      // Create system message
      const endMessage = new ChatMessage({
        sessionId,
        message: 'This chat session has been ended by our support team. Thank you for contacting us!',
        senderType: 'bot',
        senderId: 'system',
        messageType: 'system',
        metadata: {
          systemMessage: true,
          reason: 'session_ended',
          endedBy: adminId
        }
      });
      await endMessage.save();

      // Notify all participants
      io.to(`session:${sessionId}`).emit('session:ended', {
        sessionId,
        endedAt: session.endedAt,
        endedBy: adminId,
        reason
      });

      // Send the end message
      io.to(`session:${sessionId}`).emit('message:new', {
        ...endMessage.toObject(),
        timestamp: endMessage.createdAt
      });

      // Remove socket from session room
      socket.leave(`session:${sessionId}`);

      logWithIcon.success(`Admin ${adminId} ended session ${sessionId}`);
      
      socket.emit('admin:session_ended', {
        success: true,
        sessionId,
        message: 'Session ended successfully'
      });

    } catch (error) {
      logWithIcon.error('Error in admin:end_session:', error);
      socket.emit('error', { message: 'Failed to end session' });
    }
  });

  /**
   * Admin requests session transfer to another agent
   */
  socket.on('admin:transfer_session', async (data) => {
    try {
      const { sessionId, currentAdminId, targetAdminId, reason } = data;

      if (!sessionId || !currentAdminId || !targetAdminId) {
        socket.emit('error', { message: 'Missing required fields for transfer' });
        return;
      }

      const [session, targetAdmin] = await Promise.all([
        ChatSession.findById(sessionId),
        User.findById(targetAdminId)
      ]);

      if (!session) {
        socket.emit('error', { message: 'Session not found' });
        return;
      }

      if (!targetAdmin || targetAdmin.role !== 1) {
        socket.emit('error', { message: 'Target admin not found or invalid' });
        return;
      }

      // Update session
      session.agent = targetAdminId;
      session.transferredAt = new Date();
      session.transferredBy = currentAdminId;
      session.transferReason = reason;
      await session.save();

      // Create transfer message
      const transferMessage = new ChatMessage({
        sessionId,
        message: `This chat has been transferred to ${targetAdmin.firstname} ${targetAdmin.lastname}. They will assist you shortly.`,
        senderType: 'bot',
        senderId: 'system',
        messageType: 'system',
        metadata: {
          systemMessage: true,
          transferredTo: targetAdminId,
          transferredBy: currentAdminId,
          reason
        }
      });
      await transferMessage.save();

      // Notify all participants
      io.to(`session:${sessionId}`).emit('session:transferred', {
        sessionId,
        newAgent: {
          _id: targetAdminId,
          firstname: targetAdmin.firstname,
          lastname: targetAdmin.lastname,
          photo: targetAdmin.photo
        },
        transferredAt: session.transferredAt
      });

      // Send transfer message
      io.to(`session:${sessionId}`).emit('message:new', {
        ...transferMessage.toObject(),
        timestamp: transferMessage.createdAt
      });

      // Notify target admin if online
      if (targetAdmin.socketId) {
        io.to(targetAdmin.socketId).emit('notification:session_assigned', {
          sessionId,
          transferredFrom: currentAdminId,
          reason
        });
      }

      logWithIcon.success(`Session ${sessionId} transferred from ${currentAdminId} to ${targetAdminId}`);
      
      socket.emit('admin:transfer_success', {
        success: true,
        sessionId,
        message: 'Session transferred successfully'
      });

    } catch (error) {
      logWithIcon.error('Error in admin:transfer_session:', error);
      socket.emit('error', { message: 'Failed to transfer session' });
    }
  });

  /**
   * Admin sets status (online, busy, away, offline)
   */
  socket.on('admin:set_status', async (data) => {
    try {
      const { adminId, status } = data;
      const validStatuses = ['online', 'busy', 'away', 'offline'];

      if (!adminId || !validStatuses.includes(status)) {
        socket.emit('error', { message: 'Invalid status or admin ID' });
        return;
      }

      await User.findByIdAndUpdate(adminId, {
        currentStatus: status,
        lastActiveAt: new Date(),
        socketId: status === 'offline' ? null : socket.id
      });

      // Notify other admins about status change
      socket.to('admins').emit('admin:status_changed', {
        adminId,
        status,
        timestamp: new Date()
      });

      socket.emit('admin:status_updated', {
        success: true,
        status,
        message: `Status updated to ${status}`
      });

      logWithIcon.info(`Admin ${adminId} status changed to ${status}`);

    } catch (error) {
      logWithIcon.error('Error in admin:set_status:', error);
      socket.emit('error', { message: 'Failed to update status' });
    }
  });

  /**
   * Admin requests to take over a waiting session
   */
  socket.on('admin:take_session', async (data) => {
    try {
      const { sessionId, adminId } = data;

      if (!sessionId || !adminId) {
        socket.emit('error', { message: 'Session ID and Admin ID are required' });
        return;
      }

      const session = await ChatSession.findById(sessionId);
      if (!session) {
        socket.emit('error', { message: 'Session not found' });
        return;
      }

      if (session.status !== 'waiting') {
        socket.emit('error', { message: 'Session is not available for assignment' });
        return;
      }

      // Assign session to admin
      session.agent = adminId;
      session.status = 'active';
      session.assignedAt = new Date();
      await session.save();

      // Create assignment message
      const admin = await User.findById(adminId);
      const assignmentMessage = new ChatMessage({
        sessionId,
        message: `Hi! I'm ${admin.firstname} and I'll be assisting you today. How can I help?`,
        senderType: 'agent',
        senderId: adminId,
        senderName: `${admin.firstname} ${admin.lastname}`,
        messageType: 'text',
        metadata: {
          systemMessage: false,
          agentAssignment: true,
          senderAvatar: admin.photo
        }
      });
      await assignmentMessage.save();

      // Notify user
      io.to(`session:${sessionId}`).emit('session:agent_assigned', {
        sessionId,
        agent: {
          _id: adminId,
          firstname: admin.firstname,
          lastname: admin.lastname,
          photo: admin.photo
        },
        assignedAt: session.assignedAt
      });

      // Send assignment message
      io.to(`session:${sessionId}`).emit('message:new', {
        ...assignmentMessage.toObject(),
        timestamp: assignmentMessage.createdAt,
        avatar: admin.photo
      });

      // Notify other admins that session was taken
      socket.to('admins').emit('admin:session_taken', {
        sessionId,
        takenBy: adminId,
        takenAt: session.assignedAt
      });

      socket.emit('admin:session_assigned', {
        success: true,
        sessionId,
        message: 'Session assigned successfully'
      });

      logWithIcon.success(`Admin ${adminId} took session ${sessionId}`);

    } catch (error) {
      logWithIcon.error('Error in admin:take_session:', error);
      socket.emit('error', { message: 'Failed to assign session' });
    }
  });

  /**
   * Admin requests session history
   */
  socket.on('admin:get_session_history', async (data) => {
    try {
      const { sessionId, page = 1, limit = 50 } = data;

      if (!sessionId) {
        socket.emit('error', { message: 'Session ID is required' });
        return;
      }

      const skip = (page - 1) * limit;
      const messages = await ChatMessage.find({ sessionId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('senderId', 'firstname lastname photo')
        .lean();

      socket.emit('admin:session_history', {
        success: true,
        sessionId,
        messages: messages.reverse(), // Reverse to chronological order
        page,
        hasMore: messages.length === limit
      });

    } catch (error) {
      logWithIcon.error('Error in admin:get_session_history:', error);
      socket.emit('error', { message: 'Failed to fetch session history' });
    }
  });

  /**
   * Handle admin disconnect
   */
  socket.on('disconnect', async () => {
    try {
      if (socket.adminId) {
        // Update admin status to offline
        await User.findByIdAndUpdate(socket.adminId, {
          currentStatus: 'offline',
          socketId: null,
          lastActiveAt: new Date()
        });

        // Leave admin room
        socket.leave('admins');

        // If admin was in a session, notify user
        if (socket.currentSession) {
          socket.to(`session:${socket.currentSession}`).emit('admin:disconnected', {
            sessionId: socket.currentSession,
            adminId: socket.adminId,
            disconnectedAt: new Date()
          });
        }

        // Notify other admins
        socket.to('admins').emit('admin:offline', {
          adminId: socket.adminId,
          disconnectedAt: new Date()
        });

        logWithIcon.info(`Admin ${socket.adminId} disconnected`);
      }
    } catch (error) {
      logWithIcon.error('Error handling admin disconnect:', error);
    }
  });

  /**
   * Admin requests live session stats
   */
  socket.on('admin:get_live_stats', async () => {
    try {
      const [
        totalActive,
        totalWaiting,
        onlineAdmins,
        totalSessionsToday
      ] = await Promise.all([
        ChatSession.countDocuments({ status: 'active' }),
        ChatSession.countDocuments({ status: 'waiting' }),
        User.countDocuments({ 
          role: 1, 
          currentStatus: { $in: ['online', 'busy'] } 
        }),
        ChatSession.countDocuments({
          createdAt: {
            $gte: new Date(new Date().setHours(0, 0, 0, 0))
          }
        })
      ]);

      socket.emit('admin:live_stats', {
        totalActive,
        totalWaiting,
        onlineAdmins,
        totalSessionsToday,
        timestamp: new Date()
      });

    } catch (error) {
      logWithIcon.error('Error fetching live stats:', error);
      socket.emit('error', { message: 'Failed to fetch live statistics' });
    }
  });

  /**
   * Admin sends quick reply/canned response
   */
  socket.on('admin:send_quick_reply', async (data) => {
    try {
      const { sessionId, adminId, templateId, customMessage } = data;

      // You can store canned responses in database and fetch by templateId
      const cannedResponses = {
        'greeting': 'Hello! How can I assist you today?',
        'wait': 'Thank you for your patience. I\'ll be with you shortly.',
        'transfer': 'I\'m transferring you to a specialist who can better assist you.',
        'closing': 'Thank you for contacting us. Have a great day!',
        'info_needed': 'Could you please provide more information about your issue?'
      };

      const message = customMessage || cannedResponses[templateId] || 'Hello! How can I help you?';

      // Reuse the send message functionality
      socket.emit('admin:send_message', {
        sessionId,
        adminId,
        message,
        messageType: 'quick_reply',
        metadata: {
          templateId,
          isQuickReply: true
        }
      });

    } catch (error) {
      logWithIcon.error('Error in admin:send_quick_reply:', error);
      socket.emit('error', { message: 'Failed to send quick reply' });
    }
  });
};

/**
 * Handle live agent request notifications to admins
 */
const notifyAdminsOfLiveRequest = (io, requestData) => {
  try {
    const {
      sessionId,
      messageId,
      userInfo,
      message,
      ipAddress,
      requestTime,
      uniqueUrl
    } = requestData;

    const notificationPayload = {
      type: 'live_agent_request',
      sessionId,
      messageId,
      userInfo,
      message,
      ipAddress,
      requestTime: requestTime || new Date(),
      uniqueUrl,
      priority: 'high'
    };

    // Emit to all connected admins
    io.to('admins').emit('notification:live_agent_request', notificationPayload);

    logWithIcon.success(`Live agent request notification sent to admins for session ${sessionId}`);

    return {
      success: true,
      notifiedAdmins: io.sockets.adapter.rooms.get('admins')?.size || 0
    };
  } catch (error) {
    logWithIcon.error('Error notifying admins of live request:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

module.exports = {
  registerAdminChatHandlers,
  notifyAdminsOfLiveRequest
};
