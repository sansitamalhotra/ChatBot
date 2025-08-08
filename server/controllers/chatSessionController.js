// controllers/chatSessionController.js
const ChatSession = require('../models/chatSessionModel');
const ChatMessage = require('../models/chatMessageModel');
const ChatMetrics = require('../models/chatMetricsModel');
const LiveAgent = require('../models/liveAgentModel');
const BusinessHours = require('../models/businessHoursModel');

class ChatSessionController {
  // Create new chat session
  static async createChatSession(req, res) {
    try {
      const { firstName, lastName, email, phone, selectedOption } = req.body;
      const userId = req.user.id;

      // Check for existing active session
      const existingSession = await ChatSession.findActiveUserSession(userId);
      if (existingSession) {
        return res.status(409).json({
          success: false,
          message: 'You already have an active chat session',
          data: existingSession
        });
      }

      // Check business hours
      const businessHours = await BusinessHours.getActive();
      const businessHoursAttempt = businessHours ? businessHours.isCurrentlyOpen() : false;

      // Create new chat session
      const chatSession = new ChatSession({
        userId,
        userInfo: { firstName, lastName, email, phone },
        selectedOption,
        businessHoursAttempt,
        status: businessHoursAttempt ? 'active' : 'outside_hours',
        sessionType: businessHoursAttempt && selectedOption === 'live_agent' ? 'live_agent' : 'bot',
        userTimezone: req.body.timezone || 'America/New_York'
      });

      await chatSession.save();

      // Create initial metrics entry
      const metrics = new ChatMetrics({
        sessionId: chatSession._id,
        userId,
        startTime: chatSession.createdAt,
        requestTime: chatSession.requestedAt,
        outsideBusinessHours: !businessHoursAttempt,
        businessHoursMetrics: {
          requestedDuringHours: businessHoursAttempt,
          servedDuringHours: businessHoursAttempt,
          outsideHoursHandling: businessHoursAttempt ? null : 'bot_only',
          timeUntilBusinessHours: businessHours && !businessHoursAttempt ? 
            this.calculateTimeUntilBusinessHours(businessHours) : 0
        },
        sessionFlow: {
          entryPoint: req.body.entryPoint || 'widget',
          selectedOptions: selectedOption ? [{ 
            option: selectedOption, 
            timestamp: new Date(), 
            responseTime: 0 
          }] : []
        }
      });

      await metrics.save();

      // Create welcome message
      const welcomeMessage = new ChatMessage({
        sessionId: chatSession._id,
        senderId: chatSession._id, // System message
        senderModel: 'System',
        senderType: 'system',
        message: this.generateWelcomeMessage(chatSession, businessHours),
        messageType: businessHoursAttempt ? 'session_start' : 'outside_hours_notice',
        metadata: {
          businessHoursMessage: !businessHoursAttempt,
          systemData: {
            businessHours: businessHours ? {
              isOpen: businessHoursAttempt,
              nextAvailable: businessHours.getNextAvailableTime(),
              workingHours: businessHours.formattedHours
            } : null
          }
        }
      });

      await welcomeMessage.save();

      res.status(201).json({
        success: true,
        message: 'Chat session created successfully',
        data: {
          session: chatSession,
          businessHours: {
            isOpen: businessHoursAttempt,
            message: businessHours?.outsideHoursMessage,
            options: businessHours?.outsideHoursOptions,
            nextAvailable: businessHours?.getNextAvailableTime()
          },
          welcomeMessage
        }
      });
    } catch (error) {
      console.error('Error creating chat session:', error);
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
