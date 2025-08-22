//server/models/chatMessage.js
const mongoose = require('mongoose');
const { Schema } = mongoose;

const chatMessageSchema = new Schema({
  sessionId: {
    type: Schema.Types.ObjectId,
    ref: 'ChatSession',
    required: true,
    index: true
  },
  senderId: {
    type: Schema.Types.ObjectId,
    required: true,
    refPath: 'senderModel'
  },
  senderModel: {
    type: String,
    required: true,
    enum: ['User', 'LiveAgent', 'System', 'GuestUser']
  },
  senderType: {
    type: String,
    enum: ['user', 'bot', 'agent', 'system'],
    required: true
  },
  message: {
    type: String,
    required: true,
    maxlength: 2000,
    validate: {
      validator: function(v) {
        return v && v.trim().length > 0;
      },
      message: 'Message cannot be empty'
    }
  },
  messageType: {
    type: String,
    enum: [
      'text', 
      'option_selection', 
      'form_data', 
      'system_notification',
      'outside_hours_notice',
      'quick_reply',
      'transfer_notice',
      'session_start',
      'session_end',
      'live_agent_request', // Add this
      'system_response',    // Add this
      'system_waiting',     // Add this
      'system_error',        // Add this   
    ],
    default: 'text',
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now,
    required: true,
    index: true
  },
  status: {
    type: String,
    enum: ['sent', 'delivered', 'read', 'failed'],
    default: 'sent',
    required: true
  },
  metadata: {
    isFormData: {
      type: Boolean,
      default: false
    },
    selectedOption: {
      type: String,
      default: null
    },
    attachments: [{
      type: String,
      validate: {
        validator: function(v) {
          // Basic URL validation for attachment links
          return /^https?:\/\/.+/.test(v);
        },
        message: 'Attachment must be a valid URL'
      }
    }],
    businessHoursMessage: {
      type: Boolean,
      default: false
    },
    quickReplies: {
      type: Schema.Types.Mixed, // Allow both array of strings and array of objects
      default: [],
      validate: {
        validator: function(value) {
          if (!value) return true;
          if (!Array.isArray(value)) return false;
          
          // Validate each item is either string or object with text/value
          return value.every(item => {
            if (typeof item === 'string') return true;
            if (item && typeof item === 'object' && (item.text || item.value)) return true;
            return false;
          });
        },
        message: 'quickReplies must be an array of strings or objects with text/value properties'
      }
    },
    formData: {
      type: Schema.Types.Mixed,
      default: null
    },
    templateId: {
      type: Schema.Types.ObjectId,
      ref: 'ChatTemplate',
      default: null
    },
    // For system messages and notifications
    systemData: {
      type: Schema.Types.Mixed,
      default: null
    }
  },
  // Message threading support
  replyTo: {
    type: Schema.Types.ObjectId,
    ref: 'ChatMessage',
    default: null
  },
  // Message editing support
  editedAt: {
    type: Date,
    default: null
  },
  originalMessage: {
    type: String,
    default: null
  }
});

// Compound indexes for efficient querying
chatMessageSchema.index({ sessionId: 1, timestamp: -1 });
chatMessageSchema.index({ sessionId: 1, senderType: 1, timestamp: -1 });
chatMessageSchema.index({ senderId: 1, timestamp: -1 });
chatMessageSchema.index({ status: 1, timestamp: -1 });
chatMessageSchema.index({ messageType: 1, timestamp: -1 });

// Pre-save middleware to update chat session
chatMessageSchema.pre('save', async function(next) {
  if (this.isNew) {
    try {
      // Update the associated chat session
      await mongoose.model('ChatSession').findByIdAndUpdate(
        this.sessionId,
        {
          $inc: { messageCount: 1 },
          $set: { lastMessageAt: this.timestamp }
        }
      );
    } catch (error) {
      console.error('Error updating chat session:', error);
    }
  }
  next();
});

// Virtual for formatted timestamp
chatMessageSchema.virtual('formattedTime').get(function() {
  return this.timestamp.toLocaleTimeString();
});

// Method to mark message as read
chatMessageSchema.methods.markAsRead = function() {
  this.status = 'read';
  return this.save();
};

// Method to edit message (for agents)
chatMessageSchema.methods.editMessage = function(newMessage) {
  this.originalMessage = this.message;
  this.message = newMessage;
  this.editedAt = new Date();
  return this.save();
};

// Static method to get conversation history
chatMessageSchema.statics.getConversationHistory = function(sessionId, limit = 50, page = 1) {
  const skip = (page - 1) * limit;
  return this.find({ sessionId })
    .sort({ timestamp: -1 })
    .limit(limit)
    .skip(skip)
    .populate('senderId', 'firstname lastname name email')
    .populate('replyTo', 'message senderType timestamp');
};

// Static method to get unread messages for an agent
chatMessageSchema.statics.getUnreadMessages = function(agentId) {
  return this.find({
    senderId: { $ne: agentId },
    senderType: 'user',
    status: { $in: ['sent', 'delivered'] }
  })
  .populate('sessionId', 'userId status')
  .sort({ timestamp: -1 });
};

// Static method to get messages by type
chatMessageSchema.statics.getMessagesByType = function(sessionId, messageType) {
  return this.find({
    sessionId,
    messageType
  }).sort({ timestamp: -1 });
};

// Static method to count messages in session
chatMessageSchema.statics.getSessionMessageStats = function(sessionId) {
  return this.aggregate([
    { $match: { sessionId: mongoose.Types.ObjectId(sessionId) } },
    {
      $group: {
        _id: '$senderType',
        count: { $sum: 1 },
        lastMessage: { $max: '$timestamp' }
      }
    }
  ]);
};

module.exports = mongoose.model('ChatMessage', chatMessageSchema);
