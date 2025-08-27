//server/routes/adminChatRoutes.js
const express = require('express');
const router = express.Router();
const ChatSession = require('../models/chatSessionModel');
const ChatMessage = require('../models/chatMessageModel');
const User = require('../models/userModel');
const GuestUser = require('../models/guestUserModel');
const { requireLogin, isAdmin, isSuperAdmin, isAdminOrSuperAdmin, isRecruiter } = require('../middlewares/authMiddleware');
const { logWithIcon } = require('../services/consoleIcons');

/**
 * GET /api/v1/admin/chat/sessions
 * Get all chat sessions with pagination and filtering
 */
router.get('/sessions', requireLogin, isAdminOrSuperAdmin, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build query
    const query = {};
    
    if (status && status !== 'all') {
      query.status = status;
    }
    
    if (search) {
      query.$or = [
        { 'userInfo.firstName': { $regex: search, $options: 'i' } },
        { 'userInfo.lastName': { $regex: search, $options: 'i' } },
        { 'userInfo.email': { $regex: search, $options: 'i' } }
      ];
    }

    // Execute query with pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sortObj = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

    // First, get the basic sessions
    const sessions = await ChatSession.find(query)
      .sort(sortObj)
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    const totalSessions = await ChatSession.countDocuments(query);

    // Get additional stats
    const [activeSessions, waitingSessions] = await Promise.all([
      ChatSession.countDocuments({ status: 'active' }),
      ChatSession.countDocuments({ status: 'waiting' })
    ]);

    // Enhance sessions with additional data
    const enhancedSessions = await Promise.all(
      sessions.map(async (session) => {
        try {
          // Get unread count
          const unreadCount = await ChatMessage.countDocuments({
            sessionId: session._id,
            senderType: 'user',
            readByAgent: false
          });

          // Get last message
          const lastMessage = await ChatMessage.findOne({
            sessionId: session._id
          }).sort({ createdAt: -1 }).lean();

          // Get agent info if agentId exists
          let agentInfo = null;
          if (session.agentId) {
            try {
              agentInfo = await User.findById(session.agentId)
                .select('firstname lastname email photo')
                .lean();
            } catch (agentErr) {
              logWithIcon.warning(`Failed to fetch agent info for ${session.agentId}:`, agentErr.message);
            }
          }

          return {
            ...session,
            agent: agentInfo, // Map agentId to agent for frontend compatibility
            unreadCount: unreadCount || 0,
            lastMessage: lastMessage || null
          };
        } catch (sessionErr) {
          logWithIcon.error(`Error processing session ${session._id}:`, sessionErr.message);
          // Return session with defaults if processing fails
          return {
            ...session,
            agent: null,
            unreadCount: 0,
            lastMessage: null
          };
        }
      })
    );

    logWithIcon.success(`Admin ${req.user._id} fetched ${enhancedSessions.length} chat sessions`);

    res.status(200).json({
      success: true,
      data: {
        sessions: enhancedSessions,
        pagination: {
          current: parseInt(page),
          total: Math.ceil(totalSessions / parseInt(limit)),
          count: enhancedSessions.length,
          totalSessions
        },
        totalSessions,
        activeSessions,
        waitingSessions
      }
    });
  } catch (error) {
    logWithIcon.error('Error fetching admin chat sessions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch chat sessions',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

/**
 * GET /api/v1/admin/chat/session/:sessionId
 * Get specific chat session with messages
 */
router.get('/session/:sessionId', requireLogin, isAdminOrSuperAdmin, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { page = 1, limit = 50 } = req.query;

    // Validate sessionId
    if (!sessionId || !sessionId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid session ID format'
      });
    }

    // Find session
    const session = await ChatSession.findById(sessionId).lean();

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Chat session not found'
      });
    }

    // Get agent info if exists
    let agentInfo = null;
    if (session.agentId) {
      try {
        agentInfo = await User.findById(session.agentId)
          .select('firstname lastname email photo')
          .lean();
      } catch (agentErr) {
        logWithIcon.warning(`Failed to fetch agent info:`, agentErr.message);
      }
    }

    // Get messages with pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const messages = await ChatMessage.find({ sessionId })
      .sort({ createdAt: 1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    // Mark messages as read by admin
    try {
      await ChatMessage.updateMany(
        {
          sessionId,
          senderType: 'user',
          readByAgent: false
        },
        {
          readByAgent: true,
          readByAgentAt: new Date(),
          readByAgentId: req.user._id
        }
      );
    } catch (updateErr) {
      logWithIcon.warning('Failed to mark messages as read:', updateErr.message);
    }

    // Get user info
    let userInfo = session.userInfo || {};
    
    // Try to get registered user info first
    if (session.userId) {
      try {
        const user = await User.findById(session.userId)
          .select('firstname lastname email photo')
          .lean();
        if (user) {
          userInfo = {
            ...userInfo,
            firstName: user.firstname,
            lastName: user.lastname,
            email: user.email,
            photo: user.photo,
            userId: user._id
          };
        }
      } catch (userErr) {
        logWithIcon.warning('Failed to fetch registered user info:', userErr.message);
      }
    }
    
    // If no registered user, try guest user
    if (!userInfo.userId && session.guestUserId) {
      try {
        const guestUser = await GuestUser.findById(session.guestUserId)
          .select('firstName lastName email')
          .lean();
        if (guestUser) {
          userInfo = {
            ...userInfo,
            firstName: guestUser.firstName,
            lastName: guestUser.lastName,
            email: guestUser.email,
            guestUserId: guestUser._id
          };
        }
      } catch (guestErr) {
        logWithIcon.warning('Failed to fetch guest user info:', guestErr.message);
      }
    }

    // Prepare session with agent info
    const sessionWithAgent = {
      ...session,
      agent: agentInfo
    };

    logWithIcon.success(`Admin ${req.user._id} accessed chat session ${sessionId}`);

    res.status(200).json({
      success: true,
      data: {
        session: sessionWithAgent,
        messages,
        userInfo,
        messageCount: messages.length
      }
    });
  } catch (error) {
    logWithIcon.error('Error fetching chat session:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch chat session',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

/**
 * POST /api/v1/admin/chat/message
 * Send message in chat session - FIXED VERSION
 */
router.post('/message', requireLogin, isAdminOrSuperAdmin, async (req, res) => {
  try {
    const { sessionId, message, senderType = 'agent', senderId, senderModel } = req.body;

    // Validate required fields
    if (!sessionId || !message) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: sessionId and message are required'
      });
    }

    // Validate sessionId format
    if (!sessionId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid session ID format'
      });
    }

    // Check if session exists and is active
    const session = await ChatSession.findById(sessionId);
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Chat session not found'
      });
    }

    if (session.status === 'ended') {
      return res.status(400).json({
        success: false,
        message: 'Cannot send message to ended session'
      });
    }

    // Determine senderId and senderModel based on request
    let finalSenderId = senderId || req.user._id;
    let finalSenderModel = senderModel;

    // Auto-determine senderModel if not provided
    if (!finalSenderModel) {
      if (senderType === 'agent') {
        finalSenderModel = 'User'; // Admins are Users in your schema
      } else if (senderType === 'user') {
        // Try to determine if it's a registered user or guest
        if (session.userId) {
          finalSenderModel = 'User';
          finalSenderId = session.userId;
        } else if (session.guestUserId) {
          finalSenderModel = 'GuestUser';
          finalSenderId = session.guestUserId;
        } else {
          // Default fallback
          finalSenderModel = 'User';
        }
      } else {
        finalSenderModel = 'System'; // For bot/system messages
      }
    }

    // Validate that the sender exists
    let senderExists = false;
    try {
      if (finalSenderModel === 'User') {
        const user = await User.findById(finalSenderId);
        senderExists = !!user;
      } else if (finalSenderModel === 'GuestUser') {
        const guestUser = await GuestUser.findById(finalSenderId);
        senderExists = !!guestUser;
      } else if (finalSenderModel === 'System') {
        senderExists = true; // System messages don't need validation
      }
    } catch (validationErr) {
      logWithIcon.warning('Error validating sender:', validationErr.message);
    }

    if (!senderExists && finalSenderModel !== 'System') {
      return res.status(400).json({
        success: false,
        message: `Sender not found in ${finalSenderModel} collection`
      });
    }

    // Create the message with all required fields
    const newMessage = new ChatMessage({
      sessionId,
      message: message.trim(),
      senderType,
      senderId: finalSenderId,
      senderModel: finalSenderModel, // THIS IS THE CRITICAL FIX
      timestamp: new Date(),
      status: 'sent',
      readByAgent: senderType === 'agent' ? true : false,
      readByUser: senderType === 'user' ? true : false,
      metadata: {
        sentByAdmin: senderType === 'agent',
        adminId: senderType === 'agent' ? req.user._id : null
      }
    });

    await newMessage.save();

    // Update session with last message info
    session.lastMessage = {
      message: newMessage.message,
      timestamp: newMessage.timestamp,
      senderType: newMessage.senderType
    };
    session.lastMessageAt = newMessage.timestamp;
    session.updatedAt = new Date();
    // If this is the first admin message, mark session as active
    if (senderType === 'agent' && session.status === 'waiting') {
      session.status = 'active';
      session.agentId = req.user._id;
      session.assignedAt = new Date();
    }
    await session.save();
    // Emit socket event if socket.io is available
    try {
      if (req.app.get('io')) {
        const io = req.app.get('io');
        
        // Prepare message data for socket emission
        const messageData = {
          _id: newMessage._id,
          sessionId: newMessage.sessionId,
          message: newMessage.message,
          senderType: newMessage.senderType,
          senderId: newMessage.senderId,
          senderModel: newMessage.senderModel,
          timestamp: newMessage.timestamp,
          createdAt: newMessage.timestamp,
          readByAgent: newMessage.readByAgent,
          readByUser: newMessage.readByUser,
          metadata: newMessage.metadata
        };
        
        // Emit to session room
        io.to(`session:${sessionId}`).emit('message:new', messageData);

        // If admin message, also emit to user's personal room
        if (senderType === 'agent') {
          if (session.userId) {
            io.to(`user:${session.userId}`).emit('message:new', messageData);
          }
          if (session.guestUserId) {
            io.to(`guest:${session.guestUserId}`).emit('message:new', messageData);
          }
        }

        logWithIcon.success('Message broadcasted via socket', { sessionId, messageId: newMessage._id });
      }
      else {
        console.info("Socket.io instance not found on app");
      }
    } catch (socketErr) {
      logWithIcon.warning('Failed to emit socket event for message:', socketErr.message);
    }

    logWithIcon.success(`Message sent by ${senderType} in session ${sessionId}`);

    res.status(201).json({
      success: true,
      message: 'Message sent successfully',
      data: {
        message: {
          _id: newMessage._id,
          sessionId: newMessage.sessionId,
          message: newMessage.message,
          senderType: newMessage.senderType,
          senderId: newMessage.senderId,
          senderModel: newMessage.senderModel,
          timestamp: newMessage.timestamp,
          createdAt: newMessage.timestamp,
          readByAgent: newMessage.readByAgent,
          readByUser: newMessage.readByUser,
          metadata: newMessage.metadata
        }
      }
    });

  } catch (error) {
    logWithIcon.error('Error sending message:', error);
    
    // Handle validation errors specifically
    if (error.name === 'ValidationError') {
      const errorMessages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Message validation failed',
        error: errorMessages.join(', '),
        details: error.errors
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to send message',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

/**
 * POST /api/v1/admin/chat/assign/:sessionId
 * Assign admin to chat session
 */
router.post('/assign/:sessionId', requireLogin, isAdminOrSuperAdmin, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { adminId } = req.body;
    
    // Use adminId from request body or fall back to authenticated user
    const assigningAdminId = adminId || req.user._id;

    // Validate sessionId
    if (!sessionId || !sessionId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid session ID format'
      });
    }

    // Validate adminId format
    if (!assigningAdminId || !assigningAdminId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid admin ID format'
      });
    }

    const session = await ChatSession.findById(sessionId);
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Chat session not found'
      });
    }

    if (session.status === 'ended') {
      return res.status(400).json({
        success: false,
        message: 'Cannot assign to ended session'
      });
    }

    // Check if already assigned to another agent
    if (session.agentId && session.agentId.toString() !== assigningAdminId.toString()) {
      // Get current agent info for better error message
      const currentAgent = await User.findById(session.agentId).select('firstname lastname').lean();
      const agentName = currentAgent ? `${currentAgent.firstname} ${currentAgent.lastname}` : 'another agent';
      
      return res.status(400).json({
        success: false,
        message: `Session is already assigned to ${agentName}`
      });
    }

    // Get admin info for assignment
    const adminInfo = await User.findById(assigningAdminId).select('firstname lastname email photo').lean();
    if (!adminInfo) {
      return res.status(404).json({
        success: false,
        message: 'Admin user not found'
      });
    }

    // Update session - use agentId field
    session.agentId = assigningAdminId;
    session.status = 'active';
    session.assignedAt = new Date();
    await session.save();

    // Emit socket event to notify user if socket.io is available
    try {
      if (req.app.get('io')) {
        const io = req.app.get('io');
        io.to(`session:${sessionId}`).emit('session:agent_assigned', {
          sessionId,
          agent: {
            _id: adminInfo._id,
            firstname: adminInfo.firstname,
            lastname: adminInfo.lastname,
            photo: adminInfo.photo
          },
          assignedAt: session.assignedAt
        });
      }
    } catch (socketErr) {
      logWithIcon.warning('Failed to emit socket event:', socketErr.message);
    }

    logWithIcon.success(`Admin ${assigningAdminId} assigned to chat session ${sessionId}`);

    res.status(200).json({
      success: true,
      message: 'Session assigned successfully',
      data: { 
        session: {
          ...session.toObject(),
          agent: adminInfo
        }
      }
    });
  } catch (error) {
    logWithIcon.error('Error assigning chat session:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to assign session',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

/**
 * POST /api/v1/admin/chat/end/:sessionId
 * End chat session
 */
router.post('/end/:sessionId', requireLogin, isAdminOrSuperAdmin, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { reason = 'ended_by_agent' } = req.body;

    // Validate sessionId
    if (!sessionId || !sessionId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid session ID format'
      });
    }

    const session = await ChatSession.findById(sessionId);
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Chat session not found'
      });
    }

    if (session.status === 'ended') {
      return res.status(400).json({
        success: false,
        message: 'Session is already ended'
      });
    }

    // Update session
    session.status = 'ended';
    session.endedAt = new Date();
    session.endedBy = req.user._id;
    session.endReason = reason;
    await session.save();

    // Send closing message
    try {
      const closingMessage = new ChatMessage({
        sessionId,
        message: 'This chat session has been ended by the agent. Thank you for contacting us!',
        senderType: 'bot',
        senderId: req.user._id,
        senderModel: 'User', // Important: Set the senderModel
        messageType: 'system',
        timestamp: new Date(),
        metadata: {
          systemMessage: true,
          reason: 'session_ended',
          endedBy: req.user._id
        }
      });
      await closingMessage.save();

      // Emit socket events if available
      if (req.app.get('io')) {
        const io = req.app.get('io');
        io.to(`session:${sessionId}`).emit('session:ended', {
          sessionId,
          endedAt: session.endedAt,
          endedBy: req.user._id,
          reason
        });

        io.to(`session:${sessionId}`).emit('message:new', {
          ...closingMessage.toObject(),
          createdAt: closingMessage.timestamp
        });
      }
    } catch (messageErr) {
      logWithIcon.warning('Failed to send closing message:', messageErr.message);
    }

    logWithIcon.success(`Admin ${req.user._id} ended chat session ${sessionId}`);

    res.status(200).json({
      success: true,
      message: 'Session ended successfully',
      data: { session }
    });
  } catch (error) {
    logWithIcon.error('Error ending chat session:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to end session',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

/**
 * GET /api/v1/admin/chat/stats
 * Get chat statistics for dashboard
 */
router.get('/stats', requireLogin, isAdminOrSuperAdmin, async (req, res) => {
  try {
    const { period = '24h' } = req.query;
    
    // Calculate date range based on period
    let startDate = new Date();
    switch (period) {
      case '1h':
        startDate.setHours(startDate.getHours() - 1);
        break;
      case '24h':
        startDate.setHours(startDate.getHours() - 24);
        break;
      case '7d':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(startDate.getDate() - 30);
        break;
      default:
        startDate.setHours(startDate.getHours() - 24);
    }

    const [
      totalSessions,
      activeSessions,
      waitingSessions,
      endedSessions,
      recentSessions,
      averageResponseTime,
      totalMessages
    ] = await Promise.all([
      ChatSession.countDocuments().catch(() => 0),
      ChatSession.countDocuments({ status: 'active' }).catch(() => 0),
      ChatSession.countDocuments({ status: 'waiting' }).catch(() => 0),
      ChatSession.countDocuments({ status: 'ended' }).catch(() => 0),
      ChatSession.countDocuments({ createdAt: { $gte: startDate } }).catch(() => 0),
      ChatMessage.aggregate([
        {
          $match: {
            senderType: 'agent',
            createdAt: { $gte: startDate },
            responseTime: { $exists: true, $ne: null }
          }
        },
        {
          $group: {
            _id: null,
            avgResponseTime: { $avg: '$responseTime' }
          }
        }
      ]).catch(() => []),
      ChatMessage.countDocuments({ createdAt: { $gte: startDate } }).catch(() => 0)
    ]);

    const stats = {
      totalSessions,
      activeSessions,
      waitingSessions,
      endedSessions,
      recentSessions,
      averageResponseTime: averageResponseTime.length > 0 ? averageResponseTime[0].avgResponseTime : 0,
      totalMessages,
      period
    };

    logWithIcon.success(`Admin ${req.user._id} fetched chat statistics`);

    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    logWithIcon.error('Error fetching chat statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch statistics',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Test routes - these should be at the end
router.get("/adminRoute", requireLogin, isAdmin, (req, res) => {
  res.status(200).send({ ok: true });
});

// Super Admin Route
router.get("/isSuperAdminRoute", requireLogin, isSuperAdmin, (req, res) => {
  res.status(200).send({ ok: true });
});

// Super Admin Or Admin Route
router.get("/isAdminOrSuperAdminRoute", requireLogin, isAdminOrSuperAdmin, (req, res) => { 
  res.status(200).send({ ok: true }); 
});

// Protected Employer route Auth
router.get("/employerRoute", requireLogin, isRecruiter, (req, res) => {
    res.status(200).send({ ok: true });
});

// Protected Applicant route Auth
router.get("/applicantRoute", requireLogin, (req, res) => {
    res.status(200).send({ ok: true });
});

module.exports = router;
