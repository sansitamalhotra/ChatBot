const mongoose = require('mongoose');
const { Schema } = mongoose;

const chatSessionSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  agentId: {
    type: Schema.Types.ObjectId,
    ref: 'LiveAgent',
    default: null,
    index: true
  },
  sessionType: {
    type: String,
    enum: ['bot', 'live_agent', 'transferred'],
    default: 'bot',
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'closed', 'waiting_for_agent', 'transferred', 'outside_hours'],
    default: 'active',
    required: true,
    index: true
  },
  userInfo: {
    firstName: {
      type: String,
      required: true,
      minlength: 2,
      maxlength: 50
    },
    lastName: {
      type: String,
      required: true,
      minlength: 2,
      maxlength: 50
    },
    email: {
      type: String,
      required: true,
      validate: {
        validator: function(v) {
          return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
        },
        message: 'Please enter a valid email address'
      }
    },
    phone: {
      type: String,
      required: true,
      validate: {
        validator: function(v) {
          return /^\+?[\d\s\-\(\)]{10,}$/.test(v);
        },
        message: 'Please enter a valid phone number'
      }
    }
  },
  selectedOption: {
    type: String,
    enum: ['search_job', 'partner_pspl', 'application_issue', 'live_agent', 'general_inquiry'],
    default: null
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  tags: [{
    type: String,
    maxlength: 30
  }],
  requestedAt: {
    type: Date,
    default: Date.now,
    required: true
  },
  businessHoursAttempt: {
    type: Boolean,
    default: false,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  closedAt: {
    type: Date,
    default: null
  },
  transferredAt: {
    type: Date,
    default: null
  },
  // Additional fields for better tracking
  lastMessageAt: {
    type: Date,
    default: Date.now
  },
  messageCount: {
    type: Number,
    default: 0
  },
  userTimezone: {
    type: String,
    default: 'America/New_York'
  }
});

// Indexes for performance optimization
chatSessionSchema.index({ userId: 1, status: 1 });
chatSessionSchema.index({ agentId: 1, status: 1 });
chatSessionSchema.index({ createdAt: -1 });
chatSessionSchema.index({ status: 1, businessHoursAttempt: 1 });
chatSessionSchema.index({ selectedOption: 1, status: 1 });

// Update the updatedAt field before saving
chatSessionSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Virtual for session duration
chatSessionSchema.virtual('sessionDuration').get(function() {
  if (this.closedAt) {
    return this.closedAt - this.createdAt;
  }
  return Date.now() - this.createdAt;
});

// Method to check if session is expired (inactive for more than 30 minutes)
chatSessionSchema.methods.isExpired = function() {
  const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
  return this.lastMessageAt < thirtyMinutesAgo && this.status === 'active';
};

// Method to close session
chatSessionSchema.methods.closeSession = function() {
  this.status = 'closed';
  this.closedAt = new Date();
  return this.save();
};

// Static method to find active sessions for a user
chatSessionSchema.statics.findActiveUserSession = function(userId) {
  return this.findOne({
    userId: userId,
    status: { $in: ['active', 'waiting_for_agent', 'transferred'] }
  }).populate('agentId', 'name email status');
};

// Static method to find sessions by agent
chatSessionSchema.statics.findAgentSessions = function(agentId, status = 'active') {
  return this.find({
    agentId: agentId,
    status: status
  }).populate('userId', 'firstname lastname email');
};

module.exports = mongoose.model('ChatSession', chatSessionSchema);
