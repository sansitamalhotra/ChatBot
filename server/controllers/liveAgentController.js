//server/controllers/liveAgentController.js
const LiveAgent = require('../models/liveAgentModel');
const ChatSession = require('../models/chatSessionModel');
const ChatMessage = require('../models/chatMessageModel');
const ChatNotification = require('../models/chatNotificationModel');
const User = require('../models/userModel'); // Assuming this exists

class LiveAgentController {
  // Create new live agent
  static async createAgent(req, res) {
    try {
      const {
        userId,
        name,
        email,
        department,
        skills,
        maxChats,
        availability,
        notifications,
        bio,
        languages
      } = req.body;

      // Check if user exists
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Check if agent already exists for this user
      const existingAgent = await LiveAgent.findOne({ userId });
      if (existingAgent) {
        return res.status(409).json({
          success: false,
          message: 'Agent profile already exists for this user'
        });
      }

      const agent = new LiveAgent({
        userId,
        name: name || `${user.firstname} ${user.lastname}`,
        email: email || user.email,
        department: department || 'general',
        skills: skills || ['general_inquiry'],
        maxChats: maxChats || 5,
        availability: availability || {},
        notifications: notifications || {},
        bio,
        languages: languages || ['english']
      });

      await agent.save();

      res.status(201).json({
        success: true,
        message: 'Live agent created successfully',
        data: agent
      });
    } catch (error) {
      console.error('Error creating live agent:', error);
      res.status(500).json({
        success: false,
        message: 'Error creating live agent',
        error: error.message
      });
    }
  }

  // Get logged-in admin agent (role '1')
static async getLoggedInAdminAgent(req, res) {
  try {
    const adminAgent = await LiveAgent.findOne({
      status: { $in: ['online', 'away'] }
    })
    .populate('userId', 'firstname lastname email role')
    .sort({ lastActive: -1 })
    .limit(1);

    if (!adminAgent || !adminAgent.userId || adminAgent.userId.role !== '1') {
      return res.status(404).json({
        success: false,
        message: 'No admin agent currently available'
      });
    }

    const adminInfo = {
      id: adminAgent._id,
      name: `${adminAgent.userId.firstname} ${adminAgent.userId.lastname}`.trim() || adminAgent.name,
      email: adminAgent.userId.email,
      status: adminAgent.status,
      department: adminAgent.department,
      lastActive: adminAgent.lastActive
    };

    res.json({
      success: true,
      data: adminInfo
    });
  } catch (error) {
    console.error('Error fetching admin agent:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching admin agent information',
      error: error.message
    });
  }
}

  // Get agent profile
  static async getAgent(req, res) {
    try {
      const { agentId } = req.params;
      const requestingUserId = req.user.id;

      const agent = await LiveAgent.findById(agentId).populate('userId', 'firstname lastname email');
      
      if (!agent) {
        return res.status(404).json({
          success: false,
          message: 'Agent not found'
        });
      }

      // Check if user has access to view this agent
      if (agent.userId._id.toString() !== requestingUserId && req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      res.json({
        success: true,
        data: agent
      });
    } catch (error) {
      console.error('Error fetching agent:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching agent profile',
        error: error.message
      });
    }
  }

  // Update agent profile
  static async updateAgent(req, res) {
    try {
      const { agentId } = req.params;
      const updateData = req.body;
      const requestingUserId = req.user.id;

      const agent = await LiveAgent.findById(agentId);
      if (!agent) {
        return res.status(404).json({
          success: false,
          message: 'Agent not found'
        });
      }

      // Check if user has permission to update this agent
      if (agent.userId.toString() !== requestingUserId && req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      // Prevent certain fields from being updated directly
      delete updateData.agentId;
      delete updateData.userId;
      delete updateData.performance;
      delete updateData.currentChats;

      const updatedAgent = await LiveAgent.findByIdAndUpdate(
        agentId,
        { ...updateData, updatedAt: new Date() },
        { new: true, runValidators: true }
      );

      res.json({
        success: true,
        message: 'Agent profile updated successfully',
        data: updatedAgent
      });
    } catch (error) {
      console.error('Error updating agent:', error);
      res.status(500).json({
        success: false,
        message: 'Error updating agent profile',
        error: error.message
      });
    }
  }

  // Update agent status
  static async updateAgentStatus(req, res) {
    try {
      const { agentId } = req.params;
      const { status } = req.body;
      const requestingUserId = req.user.id;

      const agent = await LiveAgent.findById(agentId);
      if (!agent) {
        return res.status(404).json({
          success: false,
          message: 'Agent not found'
        });
      }

      // Verify agent ownership
      if (agent.userId.toString() !== requestingUserId) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      const oldStatus = agent.status;
      agent.status = status;
      
      if (status === 'online') {
        agent.lastActive = new Date();
      }

      await agent.save();

      // If going offline, handle active chats
      if (oldStatus === 'online' && status === 'offline') {
        await this.handleAgentGoingOffline(agentId);
      }

      res.json({
        success: true,
        message: 'Agent status updated successfully',
        data: {
          agentId,
          status: agent.status,
          lastActive: agent.lastActive
        }
      });
    } catch (error) {
      console.error('Error updating agent status:', error);
      res.status(500).json({
        success: false,
        message: 'Error updating agent status',
        error: error.message
      });
    }
  }

  // Get available agents
  static async getAvailableAgents(req, res) {
    try {
      const { skills, department, limit = 10 } = req.query;
      
      const skillsArray = skills ? skills.split(',') : [];
      const agents = await LiveAgent.findAvailableAgents(skillsArray, department)
        .limit(parseInt(limit))
        .populate('userId', 'firstname lastname email');

      res.json({
        success: true,
        data: {
          agents,
          total: agents.length,
          filters: {
            skills: skillsArray,
            department
          }
        }
      });
    } catch (error) {
      console.error('Error fetching available agents:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching available agents',
        error: error.message
      });
    }
  }

  // Get agent's active chats
  static async getAgentChats(req, res) {
    try {
      const { agentId } = req.params;
      const { status = 'active', limit = 20 } = req.query;
      const requestingUserId = req.user.id;

      const agent = await LiveAgent.findById(agentId);
      if (!agent) {
        return res.status(404).json({
          success: false,
          message: 'Agent not found'
        });
      }

      // Verify agent ownership
      if (agent.userId.toString() !== requestingUserId && req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      const sessions = await ChatSession.findAgentSessions(agentId, status)
        .limit(parseInt(limit))
        .sort({ lastMessageAt: -1 });

      // Get unread message counts for each session
      const sessionsWithUnread = await Promise.all(
        sessions.map(async (session) => {
          const unreadCount = await ChatMessage.countDocuments({
            sessionId: session._id,
            senderType: 'user',
            status: { $in: ['sent', 'delivered'] }
          });
          
          return {
            ...session.toObject(),
            unreadCount
          };
        })
      );

      res.json({
        success: true,
        data: {
          sessions: sessionsWithUnread,
          total: sessionsWithUnread.length,
          agentInfo: {
            name: agent.name,
            status: agent.status,
            currentChats: agent.currentChats,
            maxChats: agent.maxChats
          }
        }
      });
    } catch (error) {
      console.error('Error fetching agent chats:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching agent chats',
        error: error.message
      });
    }
  }

  // Get agent performance metrics
  static async getAgentPerformance(req, res) {
    try {
      const { agentId } = req.params;
      const { startDate, endDate } = req.query;
      const requestingUserId = req.user.id;

      const agent = await LiveAgent.findById(agentId);
      if (!agent) {
        return res.status(404).json({
          success: false,
          message: 'Agent not found'
        });
      }

      // Verify access
      if (agent.userId.toString() !== requestingUserId && req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      // Calculate date range (default to last 30 days)
      const end = endDate ? new Date(endDate) : new Date();
      const start = startDate ? new Date(startDate) : new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);

      // Get detailed performance metrics
      const ChatMetrics = require('../models/chatMetricsModel');
      const performanceData = await ChatMetrics.getAgentPerformance(agentId, start, end);

      const performance = {
        ...agent.performance,
        periodMetrics: performanceData[0] || {},
        workingHours: agent.availability,
        isWorkingNow: agent.isWorkingNow(),
        isOnHoliday: agent.isOnHoliday()
      };

      res.json({
        success: true,
        data: {
          agentInfo: {
            name: agent.name,
            department: agent.department,
            status: agent.status
          },
          performance,
          dateRange: { start, end }
        }
      });
    } catch (error) {
      console.error('Error fetching agent performance:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching agent performance',
        error: error.message
      });
    }
  }

  // Get agent dashboard data
  static async getAgentDashboard(req, res) {
    try {
      const { agentId } = req.params;
      const requestingUserId = req.user.id;

      const agent = await LiveAgent.findById(agentId);
      if (!agent) {
        return res.status(404).json({
          success: false,
          message: 'Agent not found'
        });
      }

      // Verify agent ownership
      if (agent.userId.toString() !== requestingUserId) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      // Get active sessions
      const activeSessions = await ChatSession.findAgentSessions(agentId, 'active');
      
      // Get pending notifications
      const pendingNotifications = await ChatNotification.findAgentNotifications(agentId, 'pending', 10);
      
      // Get waiting sessions (queue)
      const waitingSessions = await ChatSession.find({
        status: 'waiting_for_agent',
        sessionType: 'live_agent'
      })
      .populate('userId', 'firstname lastname')
      .sort({ createdAt: 1 })
      .limit(10);

      // Calculate today's stats
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const ChatMetrics = require('../models/chatMetricsModel');
      const todayStats = await ChatMetrics.aggregate([
        {
          $match: {
            agentId: agent._id,
            createdAt: { $gte: today, $lt: tomorrow }
          }
        },
        {
          $group: {
            _id: null,
            totalChats: { $sum: 1 },
            averageRating: { $avg: '$satisfactionScore' },
            resolvedChats: { $sum: { $cond: ['$resolved', 1, 0] } }
          }
        }
      ]);

      const dashboardData = {
        agentInfo: {
          name: agent.name,
          status: agent.status,
          department: agent.department,
          currentChats: agent.currentChats,
          maxChats: agent.maxChats,
          workloadPercentage: agent.workloadPercentage,
          isWorkingNow: agent.isWorkingNow(),
          lastActive: agent.lastActive
        },
        activeSessions: activeSessions.map(session => ({
          ...session.toObject(),
          waitTime: Math.floor((new Date() - session.createdAt) / 60000) // minutes
        })),
        notifications: pendingNotifications,
        queue: waitingSessions.map(session => ({
          ...session.toObject(),
          waitTime: Math.floor((new Date() - session.createdAt) / 60000) // minutes
        })),
        todayStats: todayStats[0] || {
          totalChats: 0,
          averageRating: 0,
          resolvedChats: 0
        },
        performance: {
          totalChats: agent.performance.totalChats,
          averageResponseTime: agent.performance.averageResponseTime,
          averageRating: agent.performance.averageRating,
          resolutionRate: agent.performance.resolutionRate
        }
      };

      res.json({
        success: true,
        data: dashboardData
      });
    } catch (error) {
      console.error('Error fetching agent dashboard:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching agent dashboard data',
        error: error.message
      });
    }
  }

  // Accept chat from queue
  static async acceptChat(req, res) {
    try {
      const { agentId } = req.params;
      const { sessionId } = req.body;
      const requestingUserId = req.user.id;

      const agent = await LiveAgent.findById(agentId);
      if (!agent) {
        return res.status(404).json({
          success: false,
          message: 'Agent not found'
        });
      }

      // Verify agent ownership
      if (agent.userId.toString() !== requestingUserId) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      // Check agent availability
      if (agent.currentChats >= agent.maxChats || agent.status !== 'online') {
        return res.status(400).json({
          success: false,
          message: 'Agent not available to accept new chats'
        });
      }

      const session = await ChatSession.findById(sessionId);
      if (!session) {
        return res.status(404).json({
          success: false,
          message: 'Chat session not found'
        });
      }

      if (session.status !== 'waiting_for_agent') {
        return res.status(400).json({
          success: false,
          message: 'Session is not waiting for agent assignment'
        });
      }

      // Assign agent to session
      await agent.assignChat();
      
      session.agentId = agentId;
      session.status = 'active';
      session.sessionType = 'live_agent';
      session.transferredAt = new Date();
      await session.save();

      // Create assignment message
      const assignmentMessage = new ChatMessage({
        sessionId: session._id,
        senderId: agentId,
        senderModel: 'LiveAgent',
        senderType: 'agent',
        message: `Hello ${session.userInfo.firstName}! I'm ${agent.name} and I'll be helping you today. How can I assist you?`,
        messageType: 'transfer_notice',
        metadata: {
          systemData: {
            agentInfo: {
              name: agent.name,
              department: agent.department
            }
          }
        }
      });

      await assignmentMessage.save();

      // Update metrics
      const ChatMetrics = require('../models/chatMetricsModel');
      await ChatMetrics.updateOne(
        { sessionId },
        {
          agentId,
          waitTime: Math.floor((new Date() - session.createdAt) / 1000)
        }
      );

      res.json({
        success: true,
        message: 'Chat accepted successfully',
        data: {
          session: session.toObject(),
          assignmentMessage
        }
      });
    } catch (error) {
      console.error('Error accepting chat:', error);
      res.status(500).json({
        success: false,
        message: 'Error accepting chat',
        error: error.message
      });
    }
  }

  // Get agents by department
  static async getAgentsByDepartment(req, res) {
    try {
      const { department } = req.params;
      const { includeOffline = false } = req.query;

      const query = { department };
      if (!includeOffline) {
        query.status = { $ne: 'offline' };
      }

      const agents = await LiveAgent.find(query)
        .populate('userId', 'firstname lastname email')
        .sort({ status: 1, currentChats: 1 });

      const departmentStats = {
        total: agents.length,
        online: agents.filter(a => a.status === 'online').length,
        busy: agents.filter(a => a.status === 'busy').length,
        away: agents.filter(a => a.status === 'away').length,
        offline: agents.filter(a => a.status === 'offline').length,
        totalCurrentChats: agents.reduce((sum, a) => sum + a.currentChats, 0),
        totalCapacity: agents.reduce((sum, a) => sum + a.maxChats, 0)
      };

      res.json({
        success: true,
        data: {
          agents,
          stats: departmentStats,
          department
        }
      });
    } catch (error) {
      console.error('Error fetching agents by department:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching agents by department',
        error: error.message
      });
    }
  }

  // Update agent availability/schedule
  static async updateAgentAvailability(req, res) {
    try {
      const { agentId } = req.params;
      const { workingHours, workingDays, holidaySchedule, tempUnavailable } = req.body;
      const requestingUserId = req.user.id;

      const agent = await LiveAgent.findById(agentId);
      if (!agent) {
        return res.status(404).json({
          success: false,
          message: 'Agent not found'
        });
      }

      // Verify agent ownership
      if (agent.userId.toString() !== requestingUserId && req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      // Update availability
      if (workingHours) agent.availability.workingHours = workingHours;
      if (workingDays) agent.availability.workingDays = workingDays;
      if (holidaySchedule) agent.availability.holidaySchedule = holidaySchedule;
      if (tempUnavailable !== undefined) agent.availability.tempUnavailable = tempUnavailable;

      await agent.save();

      res.json({
        success: true,
        message: 'Agent availability updated successfully',
        data: agent.availability
      });
    } catch (error) {
      console.error('Error updating agent availability:', error);
      res.status(500).json({
        success: false,
        message: 'Error updating agent availability',
        error: error.message
      });
    }
  }

  // Get agent notifications
  static async getAgentNotifications(req, res) {
    try {
      const { agentId } = req.params;
      const { status, limit = 50 } = req.query;
      const requestingUserId = req.user.id;

      const agent = await LiveAgent.findById(agentId);
      if (!agent) {
        return res.status(404).json({
          success: false,
          message: 'Agent not found'
        });
      }

      // Verify agent ownership
      if (agent.userId.toString() !== requestingUserId) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      const notifications = await ChatNotification.findAgentNotifications(
        agentId, 
        status, 
        parseInt(limit)
      );

      res.json({
        success: true,
        data: {
          notifications,
          total: notifications.length
        }
      });
    } catch (error) {
      console.error('Error fetching agent notifications:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching agent notifications',
        error: error.message
      });
    }
  }

  // Acknowledge notification
  static async acknowledgeNotification(req, res) {
    try {
      const { agentId, notificationId } = req.params;
      const requestingUserId = req.user.id;

      const agent = await LiveAgent.findById(agentId);
      if (!agent) {
        return res.status(404).json({
          success: false,
          message: 'Agent not found'
        });
      }

      // Verify agent ownership
      if (agent.userId.toString() !== requestingUserId) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      const notification = await ChatNotification.findById(notificationId);
      if (!notification) {
        return res.status(404).json({
          success: false,
          message: 'Notification not found'
        });
      }

      if (notification.agentId.toString() !== agentId) {
        return res.status(403).json({
          success: false,
          message: 'Notification does not belong to this agent'
        });
      }

      await notification.acknowledge(agentId);

      res.json({
        success: true,
        message: 'Notification acknowledged successfully',
        data: notification
      });
    } catch (error) {
      console.error('Error acknowledging notification:', error);
      res.status(500).json({
        success: false,
        message: 'Error acknowledging notification',
        error: error.message
      });
    }
  }

  // Helper method - Handle agent going offline
  static async handleAgentGoingOffline(agentId) {
    try {
      // Find all active sessions for this agent
      const activeSessions = await ChatSession.findAgentSessions(agentId, 'active');
      
      for (const session of activeSessions) {
        // Create offline message
        const offlineMessage = new ChatMessage({
          sessionId: session._id,
          senderId: agentId,
          senderModel: 'System',
          senderType: 'system',
          message: 'The agent has gone offline. Your session will be transferred to another available agent or you can continue with our chatbot.',
          messageType: 'system_notification',
          metadata: {
            systemData: {
              reason: 'agent_offline',
              timestamp: new Date()
            }
          }
        });

        await offlineMessage.save();

        // Try to find another available agent
        const availableAgents = await LiveAgent.findAvailableAgents([], session.selectedOption);
        
        if (availableAgents.length > 0) {
          // Transfer to another agent
          const newAgent = availableAgents[0];
          await newAgent.assignChat();
          
          session.agentId = newAgent._id;
          session.transferredAt = new Date();
          await session.save();

          // Create transfer message
          const transferMessage = new ChatMessage({
            sessionId: session._id,
            senderId: newAgent._id,
            senderModel: 'LiveAgent',
            senderType: 'agent',
            message: `Hello! I'm ${newAgent.name} and I'll be continuing to assist you.`,
            messageType: 'transfer_notice'
          });

          await transferMessage.save();
        } else {
          // No agents available, convert to bot session
          session.sessionType = 'bot';
          session.agentId = null;
          await session.save();

          const botMessage = new ChatMessage({
            sessionId: session._id,
            senderId: session._id,
            senderModel: 'System',
            senderType: 'bot',
            message: 'No agents are currently available. I\'ll continue to help you as best I can, or you can wait for the next available agent.',
            messageType: 'transfer_notice'
          });

          await botMessage.save();
        }
      }

      // Reset agent's current chat count
      await LiveAgent.findByIdAndUpdate(agentId, { currentChats: 0 });
    } catch (error) {
      console.error('Error handling agent going offline:', error);
    }
  }
}

module.exports = LiveAgentController;
