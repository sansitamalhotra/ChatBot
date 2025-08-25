//server/routes/adminChatRoutes.js
const express = require('express');
const router = express.Router();
const ChatSession = require('../models/chatSessionModel');
const ChatMessage = require('../models/chatMessageModel');
const User = require('../models/userModel');
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
        stats: {
          totalSessions,
          activeSessions,
          waitingSessions
        }
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
        logWithIcon.warning('Failed to fetch user info:', userErr.message);
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
 * POST /api/v1/admin/chat/assign/:sessionId
 * Assign admin to chat session
 */
router.post('/assign/:sessionId', requireLogin, isAdminOrSuperAdmin, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const adminId = req.user._id;

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
        message: 'Cannot assign to ended session'
      });
    }

    // Check if already assigned to another agent
    if (session.agentId && session.agentId.toString() !== adminId.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Session is already assigned to another agent'
      });
    }

    // Update session - use agentId field
    session.agentId = adminId;
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
            _id: req.user._id,
            firstname: req.user.firstname,
            lastname: req.user.lastname,
            photo: req.user.photo
          },
          assignedAt: session.assignedAt
        });
      }
    } catch (socketErr) {
      logWithIcon.warning('Failed to emit socket event:', socketErr.message);
    }

    logWithIcon.success(`Admin ${adminId} assigned to chat session ${sessionId}`);

    res.status(200).json({
      success: true,
      message: 'Session assigned successfully',
      data: { session }
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
        senderId: 'system',
        metadata: {
          systemMessage: true,
          reason: 'session_ended'
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

        io.to(`session:${sessionId}`).emit('message:new', closingMessage);
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
