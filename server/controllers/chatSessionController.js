// server/controllers/chatSessionController.js
const ChatSession = require('../models/chatSessionModel');
const ChatMessage = require('../models/chatMessageModel');
const ChatMetrics = require('../models/chatMetricsModel');
const LiveAgent = require('../models/liveAgentModel');
const BusinessHours = require('../models/businessHoursModel');
const User = require('../models/userModel'); // FIXED: Added missing import
const GuestUser = require('../models/guestUserModel'); // FIXED: Added missing import
const ChatTemplate = require('../models/chatTemplateModel'); // FIXED: Added missing import
const templateCache = require('../services/chatTemplateCache');
const { logWithIcon } = require('../services/consoleIcons');

class ChatSessionController {
  // Create new chat session
  static async createChatSession(req, res) {
    try {
      const { sessionType = 'bot', guestData = null, metadata = {} } = req.body;
      
      const userId = req.user?.id; // Will be undefined for guest users
      const isAuthenticated = !!userId;
      
      let userInfo = {};
      let guestUserId = null;

      if (isAuthenticated) {
        // Handle authenticated user
        const user = await User.findById(userId);
        if (!user) {
          return res.status(404).json({
            success: false,
            message: 'Authenticated user not found'
          });
        }

        userInfo = {
          firstName: user.firstname || user.firstName || 'User',
          lastName: user.lastname || user.lastName || '',
          email: user.email,
          phone: user.phone || ''
        };
      } else {
        // Handle guest user - require guest data
        if (!guestData || !guestData.email || !guestData.firstName) {
          return res.status(400).json({
            success: false,
            message: 'Guest user data (email and firstName) is required for unauthenticated sessions'
          });
        }

        // Create or update guest user
        let guestUser = await GuestUser.findOne({ 
          email: guestData.email.toLowerCase() 
        });

        if (!guestUser) {
          guestUser = new GuestUser({
            firstName: guestData.firstName.trim(),
            lastName: guestData.lastName?.trim() || '',
            email: guestData.email.toLowerCase(),
            phone: guestData.phone?.trim() || ''
          });
          await guestUser.save();
          logWithIcon.success('New guest user created:', guestUser.email);
        } else {
          // Update existing guest user
          guestUser.firstName = guestData.firstName.trim();
          if (guestData.lastName) guestUser.lastName = guestData.lastName.trim();
          if (guestData.phone) guestUser.phone = guestData.phone.trim();
          guestUser.lastSeen = new Date();
          await guestUser.save();
          logWithIcon.info('Existing guest user updated:', guestUser.email);
        }

        userInfo = {
          firstName: guestUser.firstName,
          lastName: guestUser.lastName,
          email: guestUser.email,
          phone: guestUser.phone
        };
        guestUserId = guestUser._id;
      }

      // Get business hours status
      const businessHours = await BusinessHours.getActive();
      const isBusinessHours = businessHours ? businessHours.isCurrentlyOpen() : false;

      // Create chat session
      const session = new ChatSession({
        userId: isAuthenticated ? userId : null,
        guestUserId,
        sessionType,
        userInfo,
        status: 'active',
        createdDuringBusinessHours: isBusinessHours,
        metadata: {
          ...metadata,
          userAgent: req.headers['user-agent'] || '',
          ipAddress: req.ip || req.connection?.remoteAddress || 'unknown',
          isAuthenticated,
          isGuest: !isAuthenticated && !!guestUserId,
          trackingId: !isAuthenticated && guestUserId ? guestUserId.toString() : userId
        }
      });

      await session.save();

      // Create chat metrics
      const metrics = new ChatMetrics({
        sessionId: session._id,
        userId: isAuthenticated ? userId : null,
        guestUserId,
        startTime: new Date(),
        requestTime: new Date(),
        sessionMetrics: { startTime: new Date() },
        messageCount: { total: 0, userMessages: 0, agentMessages: 0, botMessages: 0 },
        outsideBusinessHours: !isBusinessHours,
        businessHoursMetrics: {
          requestedDuringHours: isBusinessHours,
          servedDuringHours: isBusinessHours
        }
      });

      await metrics.save();

      // Generate welcome message for bot sessions
      let welcomeMessage = null;
      if (sessionType === 'bot') {
        try {
          welcomeMessage = await this.createWelcomeMessage(session, userInfo, isAuthenticated);
        } catch (welcomeError) {
          logWithIcon.error('Failed to create welcome message:', welcomeError);
          // Continue without welcome message
        }
      }

      const response = {
        success: true,
        session: session.toObject(),
        metrics: metrics.toObject(),
        welcomeMessage,
        businessHours: {
          isOpen: isBusinessHours,
          info: businessHours ? businessHours.toObject() : null
        },
        userTracking: {
          isAuthenticated,
          isGuest: !isAuthenticated && !!guestUserId,
          trackingId: !isAuthenticated && guestUserId ? guestUserId.toString() : userId,
          userInfo
        }
      };

      logWithIcon.success(`Chat session created for ${isAuthenticated ? 'authenticated' : 'guest'} user`);
      
      res.status(201).json({
        success: true,
        message: 'Chat session created successfully',
        data: response
      });

    } catch (error) {
      logWithIcon.error('Error creating chat session:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create chat session',
        error: error.message
      });
    }
  }

  static async createWelcomeMessage(session, userInfo, isAuthenticated) {
    try {
      const ChatTemplate = require('../models/chatTemplateModel');
      
      // Try to get welcome template
      const templates = await ChatTemplate.find({
        templateType: 'welcome_message',
        isActive: true
      }).sort({ priority: -1 }).limit(1);

      let messageContent, quickReplies;

      if (templates.length > 0) {
        const template = templates[0];
        messageContent = template.render ? 
          template.render({ firstName: userInfo.firstName || 'there' }) :
          template.content;
        
        // Format quickReplies properly
        quickReplies = Array.isArray(template.quickReplies) ? 
          template.quickReplies.filter(reply => typeof reply === 'string') :
          ['Search Jobs', 'About PSPL', 'Contact Support'];

        // Update template usage
        await ChatTemplate.findByIdAndUpdate(template._id, {
          $inc: { 'usage.timesUsed': 1 },
          'usage.lastUsed': new Date()
        });
      } else {
        // Fallback welcome message
        messageContent = `Hello ${userInfo.firstName || 'there'}! 👋 Welcome to PSPL Support. How can I assist you today?`;
        quickReplies = ['Search for jobs', 'Partnership info', 'Application help', 'Talk to agent'];
      }

      // Create welcome message
      const welcomeMessage = new ChatMessage({
        sessionId: session._id,
        senderId: session._id, // Use session ID as system sender
        senderModel: 'System',
        senderType: 'bot',
        message: messageContent,
        messageType: 'text',
        metadata: {
          quickReplies: quickReplies,
          isWelcomeMessage: true,
          isGuestMessage: !isAuthenticated,
          noEncryption: true // Skip encryption for welcome messages
        }
      });

      await welcomeMessage.save();
      logWithIcon.success('Welcome message created successfully');
      
      return welcomeMessage.toObject();
    } catch (error) {
      logWithIcon.error('Error creating welcome message:', error);
      throw error;
    }
  }

  static async getSessionById(req, res) {
    try {
        const { sessionId } = req.params;
        const userId = req.user?.id;
        const userRole = req.user?.role || 'user';

        const session = await ChatSession.findById(sessionId)
            .populate('userId', 'firstname lastname email')
            .populate('guestUserId', 'firstName lastName email')
            .populate('agentId', 'name email');

        if (!session) {
            return res.status(404).json({
                success: false,
                message: 'Chat session not found'
            });
        }

        // Check authorization
        const hasAccess = 
            userRole === 'admin' ||
            (userRole === 'agent' && session.agentId?.toString() === req.user.agentId) ||
            (userRole === 'user' && session.userId?.toString() === userId);

        if (!hasAccess) {
            return res.status(403).json({
                success: false,
                message: 'Access denied to this chat session'
            });
        }

        res.json({
            success: true,
            data: { session }
        });

    } catch (error) {
        logWithIcon.error('Error getting session:', error);
        res.status(500).json({
            success: false,
            message: 'Error retrieving chat session',
            error: error.message
        });
    }
  }

  static async listSessions(req, res) {
    try {
        const { 
            page = 1, 
            limit = 10, 
            status, 
            sessionType,
            guestOnly = false 
        } = req.query;
        
        const userId = req.user?.id;
        const userRole = req.user?.role || 'user';

        let query = {};

        // Apply role-based filtering
        if (userRole === 'user') {
            query.userId = userId;
        } else if (userRole === 'agent') {
            query.agentId = req.user.agentId;
        }
        // Admin can see all sessions

        // Apply additional filters
        if (status) query.status = status;
        if (sessionType) query.sessionType = sessionType;
        if (guestOnly === 'true') {
            query.guestUserId = { $exists: true };
            query.userId = null;
        }

        const sessions = await ChatSession.find(query)
            .populate('userId', 'firstname lastname email')
            .populate('guestUserId', 'firstName lastName email')
            .populate('agentId', 'name email')
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await ChatSession.countDocuments(query);

        res.json({
            success: true,
            data: {
                sessions,
                pagination: {
                    currentPage: page,
                    totalPages: Math.ceil(total / limit),
                    totalSessions: total,
                    hasNext: page < Math.ceil(total / limit),
                    hasPrev: page > 1
                }
            }
        });

    } catch (error) {
        logWithIcon.error('Error listing sessions:', error);
        res.status(500).json({
            success: false,
            message: 'Error retrieving chat sessions',
            error: error.message
        });
    }
  }

  static async updateSessionStatus(req, res) {
    try {
        const { sessionId } = req.params;
        const { status, reason } = req.body;
        const userId = req.user?.id;
        const userRole = req.user?.role || 'user';

        const session = await ChatSession.findById(sessionId);
        if (!session) {
            return res.status(404).json({
                success: false,
                message: 'Chat session not found'
            });
        }

        // Check authorization
        const hasAccess = 
            userRole === 'admin' ||
            (userRole === 'agent' && session.agentId?.toString() === req.user.agentId) ||
            (userRole === 'user' && session.userId?.toString() === userId);

        if (!hasAccess) {
            return res.status(403).json({
                success: false,
                message: 'Access denied to modify this chat session'
            });
        }

        const validStatuses = ['active', 'paused', 'closed', 'transferred'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid session status'
            });
        }

        session.status = status;
        if (reason) {
            session.metadata = {
                ...session.metadata,
                statusChangeReason: reason,
                statusChangedBy: userId,
                statusChangedAt: new Date()
            };
        }

        if (status === 'closed') {
            session.endedAt = new Date();
        }

        await session.save();

        res.json({
            success: true,
            message: 'Session status updated successfully',
            data: { session }
        });

    } catch (error) {
        logWithIcon.error('Error updating session status:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating session status',
            error: error.message
        });
    }
  }
  

  // Get user's active chat session
  static async getUserActiveSession(req, res) {
    try {
      const userId = req.user.id;
      const session = await ChatSession.findActiveUserSession(userId);

      if (!session) {
        return res.status(404).json({
          success: false,
          message: 'No active chat session found'
        });
      }

      // Get recent messages
      const recentMessages = await ChatMessage.getConversationHistory(session._id, 50);

      res.json({
        success: true,
        data: {
          session,
          recentMessages
        }
      });
    } catch (error) {
      console.error('Error fetching active session:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching active session',
        error: error.message
      });
    }
  }

  // Close chat session
  static async closeChatSession(req, res) {
    try {
      const { sessionId } = req.params;
      const { reason, satisfaction } = req.body;
      const userId = req.user.id;

      const session = await ChatSession.findOne({ _id: sessionId, userId });
      if (!session) {
        return res.status(404).json({
          success: false,
          message: 'Chat session not found'
        });
      }

      // Close the session
      await session.closeSession();

      // Release agent if assigned
      if (session.agentId) {
        const agent = await LiveAgent.findById(session.agentId);
        if (agent) {
          await agent.releaseChat();
        }
      }

      // Update metrics
      const metrics = await ChatMetrics.findOne({ sessionId });
      if (metrics) {
        await metrics.finalize();
        await metrics.markResolved();
        
        if (satisfaction) {
          await metrics.addSatisfactionRating(satisfaction.score, satisfaction.feedback);
        }

        metrics.sessionFlow.exitPoint = reason || 'user_closed';
        await metrics.save();
      }

      // Create session end message
      const endMessage = new ChatMessage({
        sessionId: session._id,
        senderId: session._id,
        senderModel: 'System',
        senderType: 'system',
        message: 'Chat session has been closed. Thank you for contacting us!',
        messageType: 'session_end',
        metadata: {
          systemData: {
            reason: reason || 'user_closed',
            satisfaction: satisfaction || null
          }
        }
      });

      await endMessage.save();

      res.json({
        success: true,
        message: 'Chat session closed successfully',
        data: { sessionId, closedAt: session.closedAt }
      });
    } catch (error) {
      console.error('Error closing chat session:', error);
      res.status(500).json({
        success: false,
        message: 'Error closing chat session',
        error: error.message
      });
    }
  }

  // Request agent assignment
  static async requestAgent(req, res) {
    try {
      const { sessionId } = req.params;
      const { skills = [], department } = req.body;
      const userId = req.user.id;

      const session = await ChatSession.findOne({ _id: sessionId, userId });
      if (!session) {
        return res.status(404).json({
          success: false,
          message: 'Chat session not found'
        });
      }

      // Check business hours
      const businessHours = await BusinessHours.getActive();
      const isBusinessHours = businessHours ? businessHours.isCurrentlyOpen() : false;

      if (!isBusinessHours) {
        // Create outside hours message
        const outsideHoursMessage = new ChatMessage({
          sessionId: session._id,
          senderId: session._id,
          senderModel: 'System',
          senderType: 'system',
          message: businessHours?.outsideHoursMessage || 
            "I'm sorry, but live agents are currently unavailable outside business hours.",
          messageType: 'outside_hours_notice',
          metadata: {
            businessHoursMessage: true,
            quickReplies: businessHours?.outsideHoursOptions || []
          }
        });

        await outsideHoursMessage.save();

        return res.status(200).json({
          success: false,
          message: 'Live agents are not available outside business hours',
          data: {
            isBusinessHours: false,
            nextAvailable: businessHours?.getNextAvailableTime(),
            outsideHoursMessage: businessHours?.outsideHoursMessage,
            alternatives: businessHours?.outsideHoursOptions
          }
        });
      }

      // Find available agents
      const availableAgents = await LiveAgent.findAvailableAgents(skills, department);
      
      if (availableAgents.length === 0) {
        session.status = 'waiting_for_agent';
        await session.save();

        const waitingMessage = new ChatMessage({
          sessionId: session._id,
          senderId: session._id,
          senderModel: 'System',
          senderType: 'system',
          message: 'All our agents are currently busy. You have been added to the queue. Please wait while we connect you with the next available agent.',
          messageType: 'system_notification',
          metadata: {
            systemData: { queuePosition: await this.getQueuePosition(sessionId) }
          }
        });

        await waitingMessage.save();

        return res.json({
          success: true,
          message: 'Added to agent queue',
          data: {
            status: 'waiting_for_agent',
            queuePosition: await this.getQueuePosition(sessionId),
            estimatedWaitTime: await this.calculateEstimatedWaitTime()
          }
        });
      }

      // Assign best available agent
      const selectedAgent = availableAgents[0];
      await selectedAgent.assignChat();

      session.agentId = selectedAgent._id;
      session.sessionType = 'live_agent';
      session.status = 'active';
      session.transferredAt = new Date();
      await session.save();

      // Create agent assignment message
      const assignmentMessage = new ChatMessage({
        sessionId: session._id,
        senderId: selectedAgent._id,
        senderModel: 'LiveAgent',
        senderType: 'agent',
        message: `Hello! I'm ${selectedAgent.name} and I'll be assisting you today. How can I help you?`,
        messageType: 'transfer_notice',
        metadata: {
          systemData: {
            agentInfo: {
              name: selectedAgent.name,
              department: selectedAgent.department
            }
          }
        }
      });

      await assignmentMessage.save();

      // Update metrics
      const metrics = await ChatMetrics.findOne({ sessionId });
      if (metrics) {
        metrics.agentId = selectedAgent._id;
        metrics.waitTime = Math.floor((new Date() - session.createdAt) / 1000);
        await metrics.save();
      }

      res.json({
        success: true,
        message: 'Agent assigned successfully',
        data: {
          agent: {
            id: selectedAgent._id,
            name: selectedAgent.name,
            department: selectedAgent.department
          },
          assignmentMessage
        }
      });
    } catch (error) {
      console.error('Error requesting agent:', error);
      res.status(500).json({
        success: false,
        message: 'Error requesting agent assignment',
        error: error.message
      });
    }
  }

  // Get chat session details for agent
  static async getSessionForAgent(req, res) {
    try {
      const { sessionId } = req.params;
      const agentId = req.user.agentId || req.body.agentId;

      const session = await ChatSession.findById(sessionId)
        .populate('userId', 'firstname lastname email')
        .populate('agentId', 'name email department');

      if (!session) {
        return res.status(404).json({
          success: false,
          message: 'Chat session not found'
        });
      }

      // Verify agent access
      if (session.agentId && session.agentId._id.toString() !== agentId) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. Session assigned to different agent.'
        });
      }

      // Get conversation history
      const messages = await ChatMessage.getConversationHistory(sessionId, 100);
      
      // Get session metrics
      const metrics = await ChatMetrics.findOne({ sessionId });

      res.json({
        success: true,
        data: {
          session,
          messages,
          metrics: metrics ? {
            duration: metrics.formattedDuration,
            messageCount: metrics.messageCount,
            responseTime: metrics.responseTime
          } : null
        }
      });
    } catch (error) {
      console.error('Error fetching session for agent:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching session details',
        error: error.message
      });
    }
  }

  // Transfer chat session to another agent
  static async transferSession(req, res) {
    try {
      const { sessionId } = req.params;
      const { targetAgentId, reason, transferNote } = req.body;
      const currentAgentId = req.user.agentId;

      const session = await ChatSession.findById(sessionId);
      if (!session) {
        return res.status(404).json({
          success: false,
          message: 'Chat session not found'
        });
      }

      if (session.agentId.toString() !== currentAgentId) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. You are not assigned to this session.'
        });
      }

      const targetAgent = await LiveAgent.findById(targetAgentId);
      if (!targetAgent || !targetAgent.isAvailable) {
        return res.status(400).json({
          success: false,
          message: 'Target agent is not available'
        });
      }

      // Release current agent
      const currentAgent = await LiveAgent.findById(currentAgentId);
      if (currentAgent) {
        await currentAgent.releaseChat();
      }

      // Assign to new agent
      await targetAgent.assignChat();

      // Update session
      session.agentId = targetAgentId;
      session.status = 'transferred';
      session.transferredAt = new Date();
      await session.save();

      // Create transfer message
      const transferMessage = new ChatMessage({
        sessionId: session._id,
        senderId: currentAgentId,
        senderModel: 'LiveAgent',
        senderType: 'system',
        message: `Chat has been transferred to ${targetAgent.name}. ${transferNote || ''}`,
        messageType: 'transfer_notice',
        metadata: {
          systemData: {
            transferReason: reason,
            fromAgent: currentAgent.name,
            toAgent: targetAgent.name,
            transferNote: transferNote
          }
        }
      });

      await transferMessage.save();

      // Update metrics
      const metrics = await ChatMetrics.findOne({ sessionId });
      if (metrics) {
        await metrics.incrementTransfer();
      }

      res.json({
        success: true,
        message: 'Session transferred successfully',
        data: {
          newAgent: {
            id: targetAgent._id,
            name: targetAgent.name,
            department: targetAgent.department
          }
        }
      });
    } catch (error) {
      console.error('Error transferring session:', error);
      res.status(500).json({
        success: false,
        message: 'Error transferring session',
        error: error.message
      });
    }
  }

  // Helper methods
  static generateWelcomeMessage(session, businessHours) {
    const { firstName } = session.userInfo;
    const baseMessage = `Hello ${firstName}! Welcome to PSPL Job Portal. `;
    
    if (!session.businessHoursAttempt && businessHours) {
      return baseMessage + businessHours.outsideHoursMessage + '\n\nHow can I help you today?';
    }
    
    return baseMessage + 'How can I assist you today?';
  }

  static calculateTimeUntilBusinessHours(businessHours) {
    if (!businessHours) return 0;
    
    const moment = require('moment-timezone');
    const now = moment().tz(businessHours.timezone);
    const nextAvailable = moment(businessHours.getNextAvailableTime(), 'dddd, MMMM Do YYYY, h:mm A z');
    
    return Math.max(0, nextAvailable.diff(now, 'minutes'));
  }

  static async getQueuePosition(sessionId) {
    const waitingSessions = await ChatSession.countDocuments({
      status: 'waiting_for_agent',
      createdAt: { $lt: new Date() }
    });
    return waitingSessions + 1;
  }
  
  // Helper method to send initial bot message - FIXED
  static async sendInitialBotMessage(session, userInitialMessage = null) {
    try {
      // Import ChatMessageController to avoid circular dependency
      const ChatMessageController = require('./chatMessageController');
      
      // Try to get welcome template
      let welcomeMessage = null;
      
      try {
        const templates = await ChatTemplate.find({
          templateType: 'welcome_message',
          isActive: true
        }).sort({ priority: -1 }).limit(1);

        if (templates.length > 0) {
          const template = templates[0];
          welcomeMessage = {
            message: template.render({ 
              firstName: session.userInfo.firstName || 'there' 
            }),
            quickReplies: template.quickReplies || [],
            templateId: template._id,
            messageType: 'welcome'
          };
          
          // Update template usage
          await ChatTemplate.findByIdAndUpdate(template._id, {
            $inc: { 'usage.timesUsed': 1 },
            'usage.lastUsed': new Date()
          });
        }
      } catch (templateError) {
        logWithIcon.error('Error loading welcome template:', templateError);
      }

      // Fallback welcome message if template not found
      if (!welcomeMessage) {
        welcomeMessage = {
          message: `Hello ${session.userInfo.firstName || 'there'}! 👋 Welcome to PSPL Support. I'm here to help you with your questions. How can I assist you today?`,
          quickReplies: [
            { text: 'Search for jobs', value: 'search_job' },
            { text: 'Partnership info', value: 'partner_pspl' },
            { text: 'Application help', value: 'application_issue' },
            { text: 'Talk to agent', value: 'live_agent' }
          ],
          messageType: 'welcome'
        };
      }

      // Send the welcome message using ChatMessageController
      await ChatMessageController.sendBotMessage(session._id, welcomeMessage);
      
      logWithIcon.success('Initial bot message sent for session:', session._id);

    } catch (error) {
      logWithIcon.error('Error sending initial bot message:', error);
      // Don't throw error to avoid breaking session creation
    }
  }

  static async calculateEstimatedWaitTime() {
    // Simple estimation based on average session time
    const avgSessionTime = 15; // minutes
    const queueLength = await ChatSession.countDocuments({ status: 'waiting_for_agent' });
    const availableAgents = await LiveAgent.countDocuments({ 
      status: 'online',
      $expr: { $lt: ['$currentChats', '$maxChats'] }
    });
    
    return availableAgents > 0 ? Math.ceil((queueLength * avgSessionTime) / availableAgents) : 30;
  }
  static async getChatSessions(req, res) {
    try {
      const userId = req.user?.id;
      const { guestEmail } = req.query; // For guest users
      const { page = 1, limit = 10, status } = req.query;

      let query = {};

      if (userId) {
        // Authenticated user
        query.userId = userId;
      } else if (guestEmail) {
        // Guest user
        const guestUser = await GuestUser.findOne({ email: guestEmail.toLowerCase() });
        if (!guestUser) {
          return res.status(404).json({
            success: false,
            message: 'Guest user not found'
          });
        }
        query.guestUserId = guestUser._id;
      } else {
        return res.status(400).json({
          success: false,
          message: 'Either authentication or guest email is required'
        });
      }

      if (status) {
        query.status = status;
      }

      const sessions = await ChatSession.find(query)
        .populate('agentId', 'firstname lastname email')
        .sort({ createdAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .lean();

      const total = await ChatSession.countDocuments(query);

      res.json({
        success: true,
        data: {
          sessions,
          pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(total / limit),
            totalRecords: total
          }
        }
      });
    } catch (error) {
      logWithIcon.error('Error fetching chat sessions:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching chat sessions',
        error: error.message
      });
    }
  }

  // Get single chat session
  static async getChatSession(req, res) {
    try {
      const { sessionId } = req.params;
      const userId = req.user?.id;
      const { guestEmail } = req.query;

      const session = await ChatSession.findById(sessionId)
        .populate('agentId', 'firstname lastname email')
        .lean();

      if (!session) {
        return res.status(404).json({
          success: false,
          message: 'Chat session not found'
        });
      }

      // Verify access rights
      let hasAccess = false;
      
      if (userId) {
        // Authenticated user
        hasAccess = session.userId && session.userId.toString() === userId;
      } else if (guestEmail) {
        // Guest user
        const guestUser = await GuestUser.findOne({ email: guestEmail.toLowerCase() });
        hasAccess = guestUser && session.guestUserId && 
                   session.guestUserId.toString() === guestUser._id.toString();
      }

      if (!hasAccess && req.user?.role !== 1) { // Allow admin access
        return res.status(403).json({
          success: false,
          message: 'Access denied to this chat session'
        });
      }

      res.json({
        success: true,
        data: session
      });
    } catch (error) {
      logWithIcon.error('Error fetching chat session:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching chat session',
        error: error.message
      });
    }
  }
}

module.exports = ChatSessionController;
