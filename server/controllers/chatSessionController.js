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
  // Create new chat session - FIXED LOGIC
  static async createChatSession(req, res) {
    try {
      const { 
        sessionType = 'bot', 
        initialMessage = null, 
        metadata = {}, 
        guestEmail = null,
        firstName,
        lastName,
        email,
        phone 
      } = req.body;
      
      const userId = req.user?.id;
      const isBusinessHours = req.isBusinessHours;
      let userInfo = {};
      let guestUserId = null;

      logWithIcon.info('Creating chat session:', {
        userId: !!userId,
        guestEmail,
        email,
        firstName,
        isAuthenticated: !!userId
      });

      // FIXED: Proper authentication check - handle authenticated user FIRST
      if (userId) {
        logWithIcon.info('Processing authenticated user session');
        const user = await User.findById(userId);
        if (!user) {
          return res.status(404).json({
            success: false,
            message: 'Authenticated user not found in database'
          });
        }
        
        userInfo = {
          firstName: user.firstname || user.firstName || 'User',
          lastName: user.lastname || user.lastName || '',
          email: user.email,
          phone: user.phone || ''
        };
        logWithIcon.success('Creating session for authenticated user:', userInfo.email);
      } 
      // FIXED: Handle guest user ONLY when NOT authenticated
      else {
        logWithIcon.info('Processing guest user session');
        // Use either guestEmail or email parameter
        const guestEmailToUse = guestEmail || email;
        
        if (!guestEmailToUse || !firstName) {
          return res.status(400).json({
            success: false,
            message: 'Email and first name are required for guest users'
          });
        }

        // Validate required guest fields
        if (!firstName.trim()) {
          return res.status(400).json({
            success: false,
            message: 'First name cannot be empty'
          });
        }
        
        let guestUser = await GuestUser.findOne({ email: guestEmailToUse.toLowerCase() });
        
        if (!guestUser) {
          // Create new guest user
          guestUser = new GuestUser({
            firstName: firstName.trim(),
            lastName: lastName?.trim() || '',
            email: guestEmailToUse.toLowerCase(),
            phone: phone?.trim() || ''
          });
          await guestUser.save();
          logWithIcon.success('✅ Created new guest user:', guestUser.email);
        } else {
          // Update existing guest user with latest info
          guestUser.firstName = firstName.trim();
          if (lastName) guestUser.lastName = lastName.trim();
          if (phone) guestUser.phone = phone.trim();
          await guestUser.save();
          logWithIcon.info('Updated existing guest user:', guestUser.email);
        }
        
        userInfo = {
          firstName: guestUser.firstName,
          lastName: guestUser.lastName,
          email: guestUser.email,
          phone: guestUser.phone
        };
        guestUserId = guestUser._id;
        logWithIcon.success('Using guest user for session:', userInfo.email);
      }

      // Create session data - FIXED: Proper user type detection
      const sessionData = {
        userId: userId || null,
        guestUserId: guestUserId || null,
        sessionType,
        userInfo,
        status: 'active',
        createdDuringBusinessHours: isBusinessHours,
        metadata: {
          ...metadata,
          userAgent: req.headers?.['user-agent'] || '',
          ipAddress: req.ip || req.connection?.remoteAddress || '',
          isAuthenticated: !!userId,
          isGuest: !userId && !!guestUserId
        }
      };

      // Create the session
      const session = new ChatSession(sessionData);
      await session.save();

      // Create metrics for the session
      const sessionMetrics = new ChatMetrics({
        sessionId: session._id,
        userId: userId || null,
        guestUserId: guestUserId || null,
        sessionMetrics: {
          startTime: new Date(),
          endTime: null,
          duration: 0
        },
        messageCount: {
          total: 0,
          userMessages: 0,
          agentMessages: 0,
          botMessages: 0
        }
      });
      await sessionMetrics.save();

      // Send initial bot message if it's a bot session
      if (sessionType === 'bot') {
        await this.sendInitialBotMessage(session, initialMessage);
      }

      logWithIcon.success('✅ Chat session created successfully:', {
        sessionId: session._id,
        userType: userId ? 'authenticated' : 'guest',
        userEmail: userInfo.email,
        firstName: userInfo.firstName
      });

      res.status(201).json({
        success: true,
        message: 'Chat session created successfully',
        data: session
      });

    } catch (error) {
      logWithIcon.error('❌ Error creating chat session:', error);
      
      // Handle specific errors
      if (error.name === 'ValidationError') {
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: Object.values(error.errors).map(err => err.message)
        });
      }

      res.status(500).json({
        success: false,
        message: 'Error creating chat session',
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
}

module.exports = ChatSessionController;
