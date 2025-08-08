//server/controllers/chatMessageController.js
const ChatMessage = require('../models/chatMessageModel');
const ChatSession = require('../models/chatSessionModel');
const ChatMetrics = require('../models/chatMetricsModel');
const ChatTemplate = require('../models/chatTemplateModel');
const LiveAgent = require('../models/liveAgentModel');
const BusinessHours = require('../models/businessHoursModel');

class ChatMessageController {
  // Send message in chat session
  static async sendMessage(req, res) {
    try {
      const { sessionId, message, messageType = 'text', metadata = {} } = req.body;
      const userId = req.user.id;
      const userRole = req.user.role || 'user';

      // Validate session
      const session = await ChatSession.findById(sessionId);
      if (!session) {
        return res.status(404).json({
          success: false,
          message: 'Chat session not found'
        });
      }

      // Check user authorization
      if (userRole === 'user' && session.userId.toString() !== userId) {
        return res.status(403).json({
          success: false,
          message: 'Access denied to this chat session'
        });
      }

      if (userRole === 'agent' && session.agentId?.toString() !== req.user.agentId) {
        return res.status(403).json({
          success: false,
          message: 'You are not assigned to this chat session'
        });
      }

      // Determine sender details
      const senderInfo = this.determineSenderInfo(userRole, req.user);

      // Create message
      const chatMessage = new ChatMessage({
        sessionId,
        senderId: senderInfo.senderId,
        senderModel: senderInfo.senderModel,
        senderType: senderInfo.senderType,
        message: message.trim(),
        messageType,
        metadata: {
          ...metadata,
          businessHoursMessage: !req.isBusinessHours
        }
      });

      await chatMessage.save();

      // Update session last message time
      session.lastMessageAt = new Date();
      await session.save();

      // Update metrics
      await this.updateMessageMetrics(sessionId, senderInfo.senderType);

      // Handle bot response if needed
      if (senderInfo.senderType === 'user' && session.sessionType === 'bot') {
        const botResponse = await this.generateBotResponse(session, message, messageType);
        if (botResponse) {
          // Send bot response after a brief delay to simulate typing
          setTimeout(async () => {
            await this.sendBotMessage(sessionId, botResponse);
          }, 1000);
        }
      }

      // Populate sender information for response
      await chatMessage.populate('senderId', 'firstname lastname name email');

      res.status(201).json({
        success: true,
        message: 'Message sent successfully',
        data: chatMessage
      });
    } catch (error) {
      console.error('Error sending message:', error);
      res.status(500).json({
        success: false,
        message: 'Error sending message',
        error: error.message
      });
    }
  }

  // Get conversation history
  static async getConversationHistory(req, res) {
    try {
      const { sessionId } = req.params;
      const { limit = 50, page = 1 } = req.query;
      const userId = req.user.id;
      const userRole = req.user.role || 'user';

      // Validate session access
      const session = await ChatSession.findById(sessionId);
      if (!session) {
        return res.status(404).json({
          success: false,
          message: 'Chat session not found'
        });
      }

      // Check authorization
      if (userRole === 'user' && session.userId.toString() !== userId) {
        return res.status(403).json({
          success: false,
          message: 'Access denied to this chat session'
        });
      }

      if (userRole === 'agent' && session.agentId?.toString() !== req.user.agentId) {
        return res.status(403).json({
          success: false,
          message: 'You are not assigned to this chat session'
        });
      }

      const messages = await ChatMessage.getConversationHistory(sessionId, parseInt(limit), parseInt(page));

      // Mark messages as read if user is reading them
      if (userRole === 'user') {
        await ChatMessage.updateMany(
          { 
            sessionId, 
            senderType: { $ne: 'user' }, 
            status: { $in: ['sent', 'delivered'] }
          },
          { status: 'read' }
        );
      }

      res.json({
        success: true,
        data: {
          messages,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: await ChatMessage.countDocuments({ sessionId })
          }
        }
      });
    } catch (error) {
      console.error('Error fetching conversation history:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching conversation history',
        error: error.message
      });
    }
  }

  // Send bot message (internal method accessible via API for testing)
  static async sendBotMessage(sessionId, messageData) {
    try {
      const session = await ChatSession.findById(sessionId);
      if (!session) {
        throw new Error('Session not found');
      }

      const botMessage = new ChatMessage({
        sessionId,
        senderId: sessionId, // Use session ID as bot identifier
        senderModel: 'System',
        senderType: 'bot',
        message: messageData.message,
        messageType: messageData.messageType || 'text',
        metadata: {
          ...messageData.metadata,
          quickReplies: messageData.quickReplies || [],
          templateId: messageData.templateId || null
        }
      });

      await botMessage.save();
      
      // Update session
      session.lastMessageAt = new Date();
      await session.save();

      // Update metrics
      await this.updateMessageMetrics(sessionId, 'bot');

      return botMessage;
    } catch (error) {
      console.error('Error sending bot message:', error);
      throw error;
    }
  }

  // Mark messages as read
  static async markAsRead(req, res) {
    try {
      const { sessionId } = req.params;
      const { messageIds } = req.body;
      const userId = req.user.id;

      // Validate session access
      const session = await ChatSession.findById(sessionId);
      if (!session) {
        return res.status(404).json({
          success: false,
          message: 'Chat session not found'
        });
      }

      if (session.userId.toString() !== userId) {
        return res.status(403).json({
          success: false,
          message: 'Access denied to this chat session'
        });
      }

      const query = messageIds && messageIds.length > 0 
        ? { _id: { $in: messageIds }, sessionId }
        : { sessionId, senderType: { $ne: 'user' } };

      const result = await ChatMessage.updateMany(
        { ...query, status: { $in: ['sent', 'delivered'] } },
        { status: 'read' }
      );

      res.json({
        success: true,
        message: 'Messages marked as read',
        data: { updatedCount: result.modifiedCount }
      });
    } catch (error) {
      console.error('Error marking messages as read:', error);
      res.status(500).json({
        success: false,
        message: 'Error marking messages as read',
        error: error.message
      });
    }
  }

  // Get unread message count
  static async getUnreadCount(req, res) {
    try {
      const { sessionId } = req.params;
      const userId = req.user.id;
      const userRole = req.user.role || 'user';

      // Validate session access
      const session = await ChatSession.findById(sessionId);
      if (!session) {
        return res.status(404).json({
          success: false,
          message: 'Chat session not found'
        });
      }

      let query = { sessionId, status: { $in: ['sent', 'delivered'] } };

      if (userRole === 'user') {
        if (session.userId.toString() !== userId) {
          return res.status(403).json({
            success: false,
            message: 'Access denied to this chat session'
          });
        }
        query.senderType = { $ne: 'user' };
      } else if (userRole === 'agent') {
        if (session.agentId?.toString() !== req.user.agentId) {
          return res.status(403).json({
            success: false,
            message: 'You are not assigned to this chat session'
          });
        }
        query.senderType = 'user';
      }

      const unreadCount = await ChatMessage.countDocuments(query);

      res.json({
        success: true,
        data: { unreadCount }
      });
    } catch (error) {
      console.error('Error getting unread count:', error);
      res.status(500).json({
        success: false,
        message: 'Error getting unread count',
        error: error.message
      });
    }
  }

  // Search messages in session
  static async searchMessages(req, res) {
    try {
      const { sessionId } = req.params;
      const { query, messageType, senderType, startDate, endDate, limit = 20 } = req.query;
      const userId = req.user.id;
      const userRole = req.user.role || 'user';

      // Validate session access
      const session = await ChatSession.findById(sessionId);
      if (!session) {
        return res.status(404).json({
          success: false,
          message: 'Chat session not found'
        });
      }

      // Check authorization
      if (userRole === 'user' && session.userId.toString() !== userId) {
        return res.status(403).json({
          success: false,
          message: 'Access denied to this chat session'
        });
      }

      // Build search criteria
      const searchCriteria = { sessionId };

      if (query) {
        searchCriteria.$text = { $search: query };
      }

      if (messageType) {
        searchCriteria.messageType = messageType;
      }

      if (senderType) {
        searchCriteria.senderType = senderType;
      }

      if (startDate || endDate) {
        searchCriteria.timestamp = {};
        if (startDate) searchCriteria.timestamp.$gte = new Date(startDate);
        if (endDate) searchCriteria.timestamp.$lte = new Date(endDate);
      }

      const messages = await ChatMessage.find(searchCriteria)
        .limit(parseInt(limit))
        .sort({ timestamp: -1 })
        .populate('senderId', 'firstname lastname name email');

      res.json({
        success: true,
        data: {
          messages,
          total: messages.length,
          searchCriteria: {
            query,
            messageType,
            senderType,
            dateRange: { startDate, endDate }
          }
        }
      });
    } catch (error) {
      console.error('Error searching messages:', error);
      res.status(500).json({
        success: false,
        message: 'Error searching messages',
        error: error.message
      });
    }
  }

  // Get message statistics for session
  static async getMessageStats(req, res) {
    try {
      const { sessionId } = req.params;
      const userId = req.user.id;
      const userRole = req.user.role || 'user';

      // Validate session access
      const session = await ChatSession.findById(sessionId);
      if (!session) {
        return res.status(404).json({
          success: false,
          message: 'Chat session not found'
        });
      }

      // Check authorization (allow agents to see stats)
      if (userRole === 'user' && session.userId.toString() !== userId) {
        return res.status(403).json({
          success: false,
          message: 'Access denied to this chat session'
        });
      }

      const stats = await ChatMessage.getSessionMessageStats(sessionId);

      res.json({
        success: true,
        data: { stats }
      });
    } catch (error) {
      console.error('Error getting message stats:', error);
      res.status(500).json({
        success: false,
        message: 'Error getting message statistics',
        error: error.message
      });
    }
  }

  // Helper methods
  static determineSenderInfo(userRole, user) {
    if (userRole === 'agent') {
      return {
        senderId: user.agentId || user.id,
        senderModel: 'LiveAgent',
        senderType: 'agent'
      };
    } else {
      return {
        senderId: user.id,
        senderModel: 'User',
        senderType: 'user'
      };
    }
  }

  static async updateMessageMetrics(sessionId, senderType) {
    try {
      const metrics = await ChatMetrics.findOne({ sessionId });
      if (metrics) {
        metrics.messageCount.total += 1;
        
        switch (senderType) {
          case 'user':
            metrics.messageCount.userMessages += 1;
            break;
          case 'agent':
            metrics.messageCount.agentMessages += 1;
            break;
          case 'bot':
            metrics.messageCount.botMessages += 1;
            break;
        }
        
        await metrics.save();
      }
    } catch (error) {
      console.error('Error updating message metrics:', error);
    }
  }

  static async generateBotResponse(session, userMessage, messageType) {
    try {
      const businessHours = await BusinessHours.getActive();
      const isBusinessHours = businessHours ? businessHours.isCurrentlyOpen() : false;

      // Handle different message types
      if (messageType === 'option_selection') {
        return await this.handleOptionSelection(session, userMessage, isBusinessHours);
      }

      if (messageType === 'form_data') {
        return await this.handleFormData(session, userMessage);
      }

      // Generate contextual response
      return await this.generateContextualResponse(session, userMessage, isBusinessHours);
    } catch (error) {
      console.error('Error generating bot response:', error);
      return {
        message: "I'm sorry, I'm having trouble processing your request right now. Please try again or contact support.",
        messageType: 'text'
      };
    }
  }

  static async handleOptionSelection(session, selectedOption, isBusinessHours) {
    const templates = await ChatTemplate.findByTypeAndCategory('bot_response', selectedOption);
    
    if (selectedOption === 'live_agent' && !isBusinessHours) {
      const template = await ChatTemplate.findOne({
        templateType: 'outside_hours_message',
        category: 'business_hours',
        isActive: true
      });

      if (template) {
        const businessHours = await BusinessHours.getActive();
        return {
          message: template.render({
            firstName: session.userInfo.firstName,
            nextAvailable: businessHours?.getNextAvailableTime()
          }),
          messageType: 'outside_hours_notice',
          quickReplies: template.quickReplies,
          templateId: template._id
        };
      }
    }

    if (templates.length > 0) {
      const template = templates[0];
      await template.incrementUsage();
      
      return {
        message: template.render({ firstName: session.userInfo.firstName }),
        messageType: 'text',
        quickReplies: template.quickReplies,
        templateId: template._id
      };
    }

    // Default responses by option
    const defaultResponses = {
      search_job: "I'd be happy to help you search for jobs! You can browse our job listings on the main portal. What type of position are you looking for?",
      partner_pspl: "Great! I can provide information about partnering with PSPL. What specific aspect of partnership are you interested in?",
      application_issue: "I'm here to help with your application. Can you describe the specific issue you're experiencing?",
      general_inquiry: "I'm here to help! What would you like to know about PSPL?"
    };

    return {
      message: defaultResponses[selectedOption] || "How can I assist you with that?",
      messageType: 'text'
    };
  }

  static async handleFormData(session, formData) {
    // Process form submission
    return {
      message: `Thank you for providing your information, ${session.userInfo.firstName}! I have all the details I need. How else can I help you today?`,
      messageType: 'text',
      quickReplies: [
        { text: 'Search for jobs', value: 'search_job' },
        { text: 'Partnership info', value: 'partner_pspl' },
        { text: 'Speak to an agent', value: 'live_agent' }
      ]
    };
  }

  static async generateContextualResponse(session, userMessage, isBusinessHours) {
    // Simple keyword-based responses (can be enhanced with NLP)
    const message = userMessage.toLowerCase();
    
    if (message.includes('job') || message.includes('position') || message.includes('career')) {
      return {
        message: "I can help you find job opportunities! You can search our job portal or tell me what type of position you're looking for.",
        messageType: 'text',
        quickReplies: [
          { text: 'Browse Jobs', value: 'search_job' },
          { text: 'Upload Resume', value: 'upload_resume' }
        ]
      };
    }

    if (message.includes('partner') || message.includes('partnership')) {
      return {
        message: "I can provide information about partnership opportunities with PSPL. What would you like to know?",
        messageType: 'text',
        quickReplies: [
          { text: 'Partnership Info', value: 'partner_pspl' },
          { text: 'Contact Sales', value: 'contact_sales' }
        ]
      };
    }

    if (message.includes('agent') || message.includes('human') || message.includes('representative')) {
      if (!isBusinessHours) {
        return {
          message: "I'd love to connect you with a live agent, but they're currently unavailable outside business hours. I'm here to help in the meantime!",
          messageType: 'outside_hours_notice',
          quickReplies: [
            { text: 'Search Jobs', value: 'search_job' },
            { text: 'Leave Message', value: 'leave_message' }
          ]
        };
      }
      
      return {
        message: "I can connect you with a live agent. Would you like me to do that now?",
        messageType: 'text',
        quickReplies: [
          { text: 'Yes, connect me', value: 'live_agent' },
          { text: 'Maybe later', value: 'continue_bot' }
        ]
      };
    }

    // Default response
    return {
      message: "I understand you're asking about that. Let me help you find what you need. Here are some options:",
      messageType: 'text',
      quickReplies: [
        { text: 'Search Jobs', value: 'search_job' },
        { text: 'Partnership Info', value: 'partner_pspl' },
        { text: 'Application Help', value: 'application_issue' },
        { text: 'Talk to Agent', value: 'live_agent' }
      ]
    };
  }
}

module.exports = ChatMessageController;
