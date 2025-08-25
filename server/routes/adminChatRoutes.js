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
router.get('/sessions', requireLogin, isAdmin, async (req, res) => {
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

    const [sessions, totalSessions] = await Promise.all([
      ChatSession.find(query)
        .sort(sortObj)
        .skip(skip)
        .limit(parseInt(limit))
        .populate('agentId', 'firstname lastname email photo') // Fixed: use agentId instead of agent
        .populate('lastMessage')
        .lean(),
      ChatSession.countDocuments(query)
    ]);

    // Get additional stats
    const [activeSessions, waitingSessions] = await Promise.all([
      ChatSession.countDocuments({ status: 'active' }),
      ChatSession.countDocuments({ status: 'waiting' })
    ]);

    // Enhance sessions with unread count
    const enhancedSessions = await Promise.all(
      sessions.map(async (session) => {
        const unreadCount = await ChatMessage.countDocuments({
          sessionId: session._id,
          senderType: 'user',
          readByAgent: false
        });

        const lastMessage = await ChatMessage.findOne({
          sessionId: session._id
        }).sort({ createdAt: -1 }).lean();

        return {
          ...session,
          agent: session.agentId, // Map agentId to agent for frontend compatibility
          unreadCount,
          lastMessage
        };
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
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * GET /api/v1/admin/chat/session/:sessionId
 * Get specific chat session with messages
 */
router.get('/session/:sessionId', requireLogin, isAdmin, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { page = 1, limit = 50 } = req.query;

    // Find session
    const session = await ChatSession.findById(sessionId)
      .populate('agentId', 'firstname lastname email photo') // Fixed: use agentId
      .lean();

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Chat session not found'
      });
    }

    // Get messages with pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const messages = await ChatMessage.find({ sessionId })
      .sort({ createdAt: 1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    // Mark messages as read by admin
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

    // Get user info
    let userInfo = session.userInfo || {};
    if (session.userId) {
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
    }

    // Map agentId to agent for frontend compatibility
    const sessionWithAgent = {
      ...session,
      agent: session.agentId
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
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * POST /api/v1/admin/chat/assign/:sessionId
 * Assign admin to chat session
 */
router.post('/assign/:sessionId', requireLogin, isAdmin, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const adminId = req.user._id;

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

    // Fixed: use agentId instead of agent
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

    // Emit socket event to notify user
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
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * POST /api/v1/admin/chat/end/:sessionId
 * End chat session
 */
router.post('/end/:sessionId', requireLogin, isAdmin, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { reason = 'ended_by_agent' } = req.body;

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

    // Emit socket event
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
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * GET /api/v1/admin/chat/stats
 * Get chat statistics for dashboard
 */
router.get('/stats', requireLogin, isAdmin, async (req, res) => {
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
      ChatSession.countDocuments(),
      ChatSession.countDocuments({ status: 'active' }),
      ChatSession.countDocuments({ status: 'waiting' }),
      ChatSession.countDocuments({ status: 'ended' }),
      ChatSession.countDocuments({ createdAt: { $gte: startDate } }),
      ChatMessage.aggregate([
        {
          $match: {
            senderType: 'agent',
            createdAt: { $gte: startDate }
          }
        },
        {
          $group: {
            _id: null,
            avgResponseTime: { $avg: '$responseTime' }
          }
        }
      ]),
      ChatMessage.countDocuments({ createdAt: { $gte: startDate } })
    ]);

    const stats = {
      totalSessions,
      activeSessions,
      waitingSessions,
      endedSessions,
      recentSessions,
      averageResponseTime: averageResponseTime[0]?.avgResponseTime || 0,
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
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
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
