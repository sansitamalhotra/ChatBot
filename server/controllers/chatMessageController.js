//server/controllers/chatMessageController.js
const ChatMessage = require('../models/chatMessageModel');
const ChatSession = require('../models/chatSessionModel');
const ChatMetrics = require('../models/chatMetricsModel');
const ChatTemplate = require('../models/chatTemplateModel');
const LiveAgent = require('../models/liveAgentModel');
const BusinessHours = require('../models/businessHoursModel');
const encryptionService = require('../services/encryptionService');
const { formatQuickReplies } = require('../services/socketService');

const {
    logWithIcon
} = require('../services/consoleIcons');
class ChatMessageController {    
    // Send message in chat session
    static async sendBotMessage(sessionId, messageData) {
        try {
            const session = await ChatSession.findById(sessionId);
            if (!session) {
                throw new Error('Session not found');
            }
            
            const content = messageData.message || '';
            
            // Handle encryption based on metadata flag
            let encrypted, encryptedFlag;
            if (messageData.metadata?.noEncryption) {
                encrypted = content;
                encryptedFlag = false;
                logWithIcon.info('Skipping encryption for bot message');
            } else {
                const encryptResult = encryptionService.encrypt(content);
                encrypted = encryptResult.encrypted;
                encryptedFlag = encryptResult.encryptedFlag;
            }
            
            // FIXED: Use the formatQuickReplies function from socketService
            let quickReplies = [];
            if (messageData.quickReplies) {
                quickReplies = formatQuickReplies(messageData.quickReplies);
                logWithIcon.success(`Processed quickReplies: ${quickReplies.length} items`);
            }
            
            // Create safe metadata object
            const safeMetadata = {
                ...(messageData.metadata || {}),
                quickReplies: quickReplies, // Always an array of strings
                templateId: messageData.templateId || null,
                encrypted: !!encryptedFlag,
                botGenerated: true,
                timestamp: new Date().toISOString()
            };
            
            // Remove any problematic fields
            delete safeMetadata.noEncryption;
            
            const botMessage = new ChatMessage({
                sessionId,
                senderId: sessionId, // Use session as system id
                senderModel: 'System',
                senderType: 'bot',
                message: encrypted,
                messageType: messageData.messageType || 'text',
                metadata: safeMetadata
            });
            
            await botMessage.save();
            
            // Update session
            session.lastMessageAt = new Date();
            await session.save();
            
            // Update metrics
            await this.updateMessageMetrics(sessionId, 'bot');
            
            // Prepare message for broadcasting (decrypt if needed)
            const outMessage = botMessage.toObject();
            if (encryptedFlag) {
                outMessage.message = encryptionService.decrypt(outMessage.message);
            }
            
            logWithIcon.success('Bot message created successfully with validated quickReplies');
            return outMessage;
            
        } catch (error) {
            logWithIcon.error('Error sending bot message:', {
                error: error.message,
                stack: error.stack,
                sessionId,
                messageDataType: typeof messageData,
                quickRepliesType: typeof messageData?.quickReplies,
                quickRepliesValue: messageData?.quickReplies
            });
            throw error;
        }
    }

    static async sendMessage(req, res) {
        try {
            const {
                sessionId,
                message,
                messageType = 'text',
                metadata = {}
            } = req.body;
            const userId = req.user.id;
            const userRole = req.user.role || 'user';
            // Validate session
            const session = await ChatSession.findById(sessionId);
            if (!session) {
                return res.status(404).json({
                    success: false,
                    message: 'Chat Session NOT FOUND!'
                });
            }
            // Check user authorization
            if (userRole === 'user' && session.userId.toString() !== userId) {
                return res.status(403).json({
                    success: false,
                    message: 'Access Denied to this Chat Session'
                });
            }
            if (userRole === 'agent' && session.agentId?.toString() !== req.user.agentId) {
                return res.status(403).json({
                    success: false,
                    message: 'You are not Assigned to this Chat Session'
                });
            }
            // Determine sender details
            const senderInfo = this.determineSenderInfo(userRole, req.user);
            // Sanitize/Truncate Messages if Necessary
            const trimmed = typeof message === 'string' ? message.trim() : String(message || '');
            // FIX 5: Handle encryption based on metadata flag
            let encrypted, encryptedFlag;
            if (metadata.noEncryption) {
                encrypted = trimmed;
                encryptedFlag = false;
                logWithIcon.info('Skipping encryption for user message');
            } else {
                const encryptResult = encryptionService.encrypt(trimmed);
                encrypted = encryptResult.encrypted;
                encryptedFlag = encryptResult.encryptedFlag;
            }
            // FIX 6: Process metadata with proper quickReplies handling
            const processedMetadata = {
                ...metadata
            };
            // Handle quickReplies if present in metadata
            if (processedMetadata.quickReplies) {
                if (typeof processedMetadata.quickReplies === 'string') {
                    try {
                        // Try to parse as JSON first
                        const parsed = JSON.parse(processedMetadata.quickReplies);
                        if (Array.isArray(parsed)) {
                            processedMetadata.quickReplies = parsed.map(item => {
                                if (typeof item === 'string') return item;
                                if (item && item.text) return item.text;
                                return String(item);
                            }).filter(Boolean);
                        } else {
                            processedMetadata.quickReplies = [];
                        }
                    } catch (parseError) {
                        logWithIcon.warning('Failed to parse quickReplies in user metadata, clearing');
                        processedMetadata.quickReplies = [];
                    }
                } else if (!Array.isArray(processedMetadata.quickReplies)) {
                    logWithIcon.warning('quickReplies in metadata is not array or string, clearing');
                    processedMetadata.quickReplies = [];
                }
            }
            // Add standard metadata
            processedMetadata.businessHoursMessage = !req.isBusinessHours;
            processedMetadata.encrypted = !!encryptedFlag;
            // Create message
            const chatMessage = new ChatMessage({
                sessionId,
                senderId: senderInfo.senderId,
                senderModel: senderInfo.senderModel,
                senderType: senderInfo.senderType,
                message: encrypted,
                messageType,
                metadata: processedMetadata
            });
            await chatMessage.save();
            // Update session last message time
            session.lastMessageAt = new Date();
            await session.save();
            // Update metrics
            await this.updateMessageMetrics(sessionId, senderInfo.senderType);
            // Handle bot response if needed
            if (senderInfo.senderType === 'user' && session.sessionType === 'bot') {
                const botResponse = await this.generateBotResponse(session, trimmed, messageType);
                if (botResponse) {
                    // Send bot response after a brief delay to simulate typing
                    setTimeout(async () => {
                        try {
                            await this.sendBotMessage(sessionId, botResponse);
                        } catch (botError) {
                            logWithIcon.error('Error sending bot response:', botError);
                        }
                    }, 800);
                }
            }
            // Populate sender information for response
            await chatMessage.populate('senderId', 'firstname lastname name email');
            // Decrypt Message for outgoing payload
            const outgoing = chatMessage.toObject();
            if (encryptedFlag && outgoing.message) {
                outgoing.message = encryptionService.decrypt(outgoing.message);
            }
            res.status(201).json({
                success: true,
                message: 'Message sent successfully',
                data: outgoing
            });
        } catch (error) {
            logWithIcon.error('Error sending message:', error);
            res.status(500).json({
                success: false,
                message: 'Error sending message',
                error: error.message
            });
        }
    };
    // Get conversation history with Pagination
    static async sendBotMessage(sessionId, messageData) {
        try {
            const session = await ChatSession.findById(sessionId);
            if (!session) {
                throw new Error('Session not found');
            }
            const content = messageData.message || '';
            
            // Ensure quickReplies is properly formatted
            let quickReplies = formatQuickReplies(messageData.quickReplies);

            const { encrypted, encryptedFlag } = encryptionService.encrypt(content);
            
            const botMessage = new ChatMessage({
                sessionId,
                senderId: sessionId, // Use session as system id
                senderModel: 'System',
                senderType: 'bot',
                message: encrypted,
                messageType: messageData.messageType || 'text',
                metadata: {
                    ...messageData.metadata,
                    quickReplies, // Use the properly formatted array
                    templateId: messageData.templateId || null,
                    encrypted: !!encryptedFlag
                }
            });
            await botMessage.save();
            
            // Update session
            session.lastMessageAt = new Date();
            await session.save();
            
            // Update metrics
            await this.updateMessageMetrics(sessionId, 'bot');
            
            // Prepare message for broadcasting (decrypted)
            const outMessage = botMessage.toObject();
            if (encryptedFlag) {
                outMessage.message = encryptionService.decrypt(outMessage.message);
            }
            logWithIcon.success('Bot message created successfully with validated quickReplies');
            return outMessage;
        } catch (error) {
            logWithIcon.error('Error sending bot message:', error);
            throw error;
        }
    }

    // send bot message (internal): store encrypted and return decrypted for broadcast if needed
    static async sendBotMessage(sessionId, messageData) {
        try {
            const session = await ChatSession.findById(sessionId);
            if (!session) {
                throw new Error('Session not found');
            }
            const content = messageData.message || '';
            const {
                encrypted,
                encryptedFlag
            } = encryptionService.encrypt(content);
            // FIX: Ensure quickReplies is properly formatted as an array
            let quickReplies = [];
            if (messageData.quickReplies) {
                if (Array.isArray(messageData.quickReplies)) {
                    quickReplies = messageData.quickReplies;
                } else if (typeof messageData.quickReplies === 'string') {
                    try {
                        quickReplies = JSON.parse(messageData.quickReplies);
                    } catch (parseError) {
                        logWithIcon.error('Failed to parse quickReplies:', parseError);
                        quickReplies = [];
                    }
                }
            }
            const botMessage = new ChatMessage({
                sessionId,
                senderId: sessionId, // Use session as system id
                senderModel: 'System',
                senderType: 'bot',
                message: encrypted,
                messageType: messageData.messageType || 'text',
                metadata: {
                    ...messageData.metadata,
                    quickReplies: quickReplies, // FIX: Use the properly formatted array
                    templateId: messageData.templateId || null,
                    encrypted: !!encryptedFlag
                }
            });
            await botMessage.save();
            // Update session
            session.lastMessageAt = new Date();
            await session.save();
            // Update metrics
            await this.updateMessageMetrics(sessionId, 'bot');
            // Prepare message for broadcasting (decrypted)
            const out = botMessage.toObject();
            out.message = encryptionService.decrypt(out.message);
            return out;
        } catch (error) {
            logWithIcon.error('Error sending bot message:', error);
            throw error;
        }
    }
    // Mark messages as read
    static async markAsRead(req, res) {
        try {
            const {
                sessionId
            } = req.params;
            const {
                messageIds
            } = req.body;
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
            const query = messageIds && messageIds.length > 0 ? {
                _id: {
                    $in: messageIds
                },
                sessionId
            } : {
                sessionId,
                senderType: {
                    $ne: 'user'
                }
            };
            const result = await ChatMessage.updateMany({
                ...query,
                status: {
                    $in: ['sent', 'delivered']
                }
            }, {
                status: 'read'
            });
            res.json({
                success: true,
                message: 'Messages marked as read',
                data: {
                    updatedCount: result.modifiedCount
                }
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
            const {
                sessionId
            } = req.params;
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
            let query = {
                sessionId,
                status: {
                    $in: ['sent', 'delivered']
                }
            };
            if (userRole === 'user') {
                if (session.userId.toString() !== userId) {
                    return res.status(403).json({
                        success: false,
                        message: 'Access denied to this chat session'
                    });
                }
                query.senderType = {
                    $ne: 'user'
                };
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
                data: {
                    unreadCount
                }
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
            const {
                sessionId
            } = req.params;
            const {
                query,
                messageType,
                senderType,
                startDate,
                endDate,
                limit = 20
            } = req.query;
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
            const searchCriteria = {
                sessionId
            };
            if (query) {
                searchCriteria.$text = {
                    $search: query
                };
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
                .sort({
                    timestamp: -1
                })
                .populate('senderId', 'firstname lastname name email')
                .lean();
            // Decrypt Messages Before Returning
            const decryptedMessages = messages.map(m => {
                if (m.message && m.metadata?.encrypted) {
                    try {
                        m.message = encryptionService.decrypt(m.message);
                    } catch (error) {
                        logWithIcon.error('Decrypt Message Error: ', error);
                    }
                }
                return m;
            });
            res.json({
                success: true,
                data: {
                    messages: decryptedMessages,
                    total: decryptedMessages.length,
                    searchCriteria: {
                        query,
                        messageType,
                        senderType,
                        dateRange: {
                            startDate,
                            endDate
                        }
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
            const {
                sessionId
            } = req.params;
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
                data: {
                    stats
                }
            });
        } catch (error) {
            logWithIcon.error('Error getting message stats:', error);
            res.status(500).json({
                success: false,
                message: 'Error getting message statistics',
                error: error.message
            });
        }
    }
    // Helper method to decrypt message objects
    static decryptMessageObject(messageObj) {
        if (messageObj.message && messageObj.metadata?.encrypted) {
            try {
                messageObj.message = encryptionService.decrypt(messageObj.message);
            } catch (error) {
                logWithIcon.error('Decrypt Message Error: ', error);
            }
        }
        return messageObj;
    }
    // Helper method to decrypt array of messages
    static decryptMessages(messages) {
        return messages.map(m => this.decryptMessageObject(m));
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
            const metrics = await ChatMetrics.findOne({
                sessionId
            });
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
            logWithIcon.error('Error updating message metrics:', error);
        }
    }

    static async generateBotResponse(session, userMessage, messageType) {
        try {
            const businessHours = await BusinessHours.getActive();
            const isBusinessHours = businessHours ? businessHours.isCurrentlyOpen() : false;
            const isGuest = !session.userId && session.guestUserId;

            logWithIcon.info('Generating bot response:', {
                messageType,
                userMessage: userMessage.substring(0, 50),
                isBusinessHours,
                sessionType: session.sessionType,
                isGuest
            });

            // Handle guest form completion
            if (isGuest && messageType === 'guest_form_complete') {
                return this.handleGuestFormCompletion(session);
            }

            // Handle option selection
            if (messageType === 'option_selection') {
                return await this.handleOptionSelection(session, userMessage, isBusinessHours);
            }

            // Handle form data
            if (messageType === 'form_data') {
                return await this.handleFormData(session, userMessage);
            }

            // Try templates first
            try {
                const templates = await ChatTemplate.find({
                    templateType: 'bot_response',
                    category: 'general',
                    isActive: true
                }).sort({ priority: -1 }).limit(1);

                if (templates && templates.length > 0) {
                    const tpl = templates[0];
                    await ChatTemplate.findByIdAndUpdate(tpl._id, {
                        $inc: { 'usage.timesUsed': 1 },
                        'usage.lastUsed': new Date()
                    });

                    const rendered = tpl.render ? tpl.render({
                        firstName: session.userInfo.firstName
                    }) : tpl.content;

                    const templateQuickReplies = formatQuickReplies(tpl.quickReplies);

                    return {
                        message: rendered,
                        messageType: 'text',
                        quickReplies: templateQuickReplies,
                        templateId: tpl._id,
                        metadata: { noEncryption: true }
                    };
                }
            } catch (err) {
                logWithIcon.error('Template selection error:', err);
            }

            // Generate contextual response as fallback
            return await this.generateContextualResponse(session, userMessage, isBusinessHours);

        } catch (error) {
            logWithIcon.error('Error generating bot response:', error);
            return {
                message: "I'm sorry, I'm having trouble processing your request right now. Please try again or contact support.",
                messageType: 'text',
                quickReplies: ['Try again', 'Contact support'],
                metadata: { errorFallback: true, noEncryption: true }
            };
        }
    }

    static handleGuestFormCompletion(session) {
        try {
            return {
                message: `Thank you for providing your details, ${session.userInfo.firstName}! How can I assist you today?`,
                messageType: 'text',
                quickReplies: ['Search Jobs', 'Partnership Info', 'Talk to Agent'],
                metadata: { 
                    noEncryption: true,
                    guestFormComplete: true 
                }
            };
        } catch (error) {
            logWithIcon.error('Error handling guest form completion:', error);
            return {
                message: "Thank you for your information! How can I help you today?",
                messageType: 'text',
                quickReplies: ['Search Jobs', 'Get Help', 'Contact Support'],
                metadata: { errorFallback: true, noEncryption: true }
            };
        }
    }

    static async handleOptionSelection(session, selectedOption, isBusinessHours) {
        try {
            // Default responses with properly formatted quickReplies
            const defaultResponses = {
                search_job: {
                    message: "I'd be happy to help you search for jobs! You can browse our job listings on the main portal. What type of position are you looking for?",
                    quickReplies: ['View all jobs', 'IT positions', 'Management roles']
                },
                partner_pspl: {
                    message: "Great! I can provide information about partnering with PSPL. What specific aspect of partnership are you interested in?",
                    quickReplies: ['Business partnership', 'Technology partnership', 'Contact sales team']
                },
                application_issue: {
                    message: "I'm here to help with your application. Can you describe the specific issue you're experiencing?",
                    quickReplies: ['Login problems', 'Upload resume', 'Application status']
                },
                general_inquiry: {
                    message: "I'm here to help! What would you like to know about PSPL?",
                    quickReplies: ['About PSPL', 'Our services', 'Contact information']
                },
                live_agent: {
                    message: isBusinessHours ? 
                        "I'll connect you with a live agent. Please hold on for a moment." :
                        "I'd love to connect you with a live agent, but they're currently unavailable outside business hours. I'm here to help in the meantime!",
                    quickReplies: isBusinessHours ? 
                        ['Wait for agent', 'Continue with bot'] :
                        ['Search Jobs', 'Leave Message', 'Continue with bot']
                }
            };
            
            const response = defaultResponses[selectedOption] || {
                message: "How can I assist you with that?",
                quickReplies: ['Search Jobs', 'Partnership Info', 'Talk to Agent']
            };
            
            return {
                message: response.message,
                messageType: 'text',
                quickReplies: response.quickReplies || [], // Always an array
                metadata: { noEncryption: true }
            };
            
        } catch (error) {
            logWithIcon.error('Error in handleOptionSelection:', error);
            return {
                message: "I'm having trouble processing that option. Please try again or contact support.",
                messageType: 'text',
                quickReplies: ['Try again', 'Main menu'],
                metadata: { errorFallback: true, noEncryption: true }
            };
        }
    }
    
    static async handleFormData(session, formData) {
        try {
            logWithIcon.info('Processing form data for session:', session._id);
            return {
                message: `Thank you for providing your information, ${session.userInfo.firstName}! I have all the details I need. How else can I help you today?`,
                messageType: 'text',
                quickReplies: [{
                        text: 'Search for jobs',
                        value: 'search_job'
                    },
                    {
                        text: 'Partnership info',
                        value: 'partner_pspl'
                    },
                    {
                        text: 'Speak to an agent',
                        value: 'live_agent'
                    }
                ]
            };
        } catch (error) {
            logWithIcon.error('Error in handleFormData:', error);
            return {
                message: "Thank you for your information. How can I help you today?",
                messageType: 'text'
            };
        }
    }
    static async generateContextualResponse(session, userMessage, isBusinessHours) {
        try {
            // Simple keyword-based responses (can be enhanced with NLP)
            const message = userMessage.toLowerCase();
            if (message.includes('job') || message.includes('position') || message.includes('career') || message.includes('work')) {
                return {
                    message: "I can help you find job opportunities! You can search our job portal or tell me what type of position you're looking for.",
                    messageType: 'text',
                    quickReplies: [{
                            text: 'Browse Jobs',
                            value: 'search_job'
                        },
                        {
                            text: 'Upload Resume',
                            value: 'upload_resume'
                        },
                        {
                            text: 'Job alerts',
                            value: 'job_alerts'
                        }
                    ]
                };
            }
            if (message.includes('partner') || message.includes('partnership') || message.includes('collaborate')) {
                return {
                    message: "I can provide information about partnership opportunities with PSPL. What would you like to know?",
                    messageType: 'text',
                    quickReplies: [{
                            text: 'Partnership Info',
                            value: 'partner_pspl'
                        },
                        {
                            text: 'Contact Sales',
                            value: 'contact_sales'
                        },
                        {
                            text: 'Business solutions',
                            value: 'business_solutions'
                        }
                    ]
                };
            }
            if (message.includes('agent') || message.includes('human') || message.includes('representative') || message.includes('person')) {
                if (!isBusinessHours) {
                    return {
                        message: "I'd love to connect you with a live agent, but they're currently unavailable outside business hours. I'm here to help in the meantime!",
                        messageType: 'outside_hours_notice',
                        quickReplies: [{
                                text: 'Search Jobs',
                                value: 'search_job'
                            },
                            {
                                text: 'Leave Message',
                                value: 'leave_message'
                            },
                            {
                                text: 'Continue with bot',
                                value: 'continue_bot'
                            }
                        ]
                    };
                }
                return {
                    message: "I can connect you with a live agent. Would you like me to do that now?",
                    messageType: 'text',
                    quickReplies: [{
                            text: 'Yes, connect me',
                            value: 'live_agent'
                        },
                        {
                            text: 'Maybe later',
                            value: 'continue_bot'
                        },
                        {
                            text: 'More info first',
                            value: 'more_info'
                        }
                    ]
                };
            }
            if (message.includes('help') || message.includes('support') || message.includes('assist')) {
                return {
                    message: "I'm here to help! Here are some ways I can assist you today:",
                    messageType: 'text',
                    quickReplies: [{
                            text: 'Find Jobs',
                            value: 'search_job'
                        },
                        {
                            text: 'Partnership Info',
                            value: 'partner_pspl'
                        },
                        {
                            text: 'Application Help',
                            value: 'application_issue'
                        },
                        {
                            text: 'Talk to Agent',
                            value: 'live_agent'
                        }
                    ]
                };
            }
            if (message.includes('hello') || message.includes('hi') || message.includes('hey')) {
                return {
                    message: `Hello ${session.userInfo.firstName}! Great to hear from you. How can I help you today?`,
                    messageType: 'text',
                    quickReplies: [{
                            text: 'Search Jobs',
                            value: 'search_job'
                        },
                        {
                            text: 'Learn About PSPL',
                            value: 'about_pspl'
                        },
                        {
                            text: 'Get Help',
                            value: 'general_inquiry'
                        }
                    ]
                };
            }
            // Default response for unrecognized messages
            return {
                message: "I understand you're asking about that. Let me help you find what you need. Here are some options:",
                messageType: 'text',
                quickReplies: [{
                        text: 'Search Jobs',
                        value: 'search_job'
                    },
                    {
                        text: 'Partnership Info',
                        value: 'partner_pspl'
                    },
                    {
                        text: 'Application Help',
                        value: 'application_issue'
                    },
                    {
                        text: 'Talk to Agent',
                        value: 'live_agent'
                    }
                ]
            };
        } catch (error) {
            logWithIcon.error('Error in generateContextualResponse:', error);
            return {
                message: "I'm here to help! What would you like to know about PSPL?",
                messageType: 'text',
                quickReplies: [{
                        text: 'Search Jobs',
                        value: 'search_job'
                    },
                    {
                        text: 'Partnership Info',
                        value: 'partner_pspl'
                    },
                    {
                        text: 'Talk to Agent',
                        value: 'live_agent'
                    }
                ]
            };
        }
    }
}
module.exports = ChatMessageController;
