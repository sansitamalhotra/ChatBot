//server/models/chatSession.js
const mongoose = require('mongoose');
const { Schema } = mongoose;

const chatSessionSchema = new Schema({
  // FIX 1: Make userId optional for guest users
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: false, // Changed from true to false
    default: null,
    index: true
  },
  // FIX 2: Add guestUserId as proper field (moved from bottom)
  guestUserId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'GuestUser',
    required: false,
    default: null,
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
  // FIX 3: Make userInfo fields optional for flexible validation
  userInfo: {
    firstName: {
      type: String,
      required: true,
      minlength: 1, // Changed from 2 to 1
      maxlength: 50
    },
    lastName: {
      type: String,
      required: false, // Changed from true to false
      default: '',
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
      required: false, // Changed from true to false
      default: '',
      validate: {
        validator: function(v) {
          // Only validate if phone is provided
          return !v || /^\+?[\d\s\-\(\)]{10,}$/.test(v);
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
  // FIX 4: Rename to match the field being used in socket service
  createdDuringBusinessHours: {
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
  },
  // FIX 5: Add metadata field that the socket service is trying to save
  metadata: {
    type: Schema.Types.Mixed,
    default: {}
  }
});

// FIX 6: Add validation to ensure either userId or guestUserId is present
chatSessionSchema.pre('validate', function(next) {
  if (!this.userId && !this.guestUserId) {
    return next(new Error('Either userId or guestUserId must be provided'));
  }
  next();
});

// Indexes for performance optimization
chatSessionSchema.index({ userId: 1, status: 1 });
chatSessionSchema.index({ guestUserId: 1, status: 1 }); // FIX 7: Add index for guest users
chatSessionSchema.index({ agentId: 1, status: 1 });
chatSessionSchema.index({ createdAt: -1 });
chatSessionSchema.index({ status: 1, createdDuringBusinessHours: 1 }); // FIX 8: Updated field name
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

// FIX 9: Updated static method to handle both user types
chatSessionSchema.statics.findActiveUserSession = function(userId, guestUserId = null) {
  const query = {
    status: { $in: ['active', 'waiting_for_agent', 'transferred'] }
  };
  
  if (userId) {
    query.userId = userId;
  } else if (guestUserId) {
    query.guestUserId = guestUserId;
  }
  
  return this.findOne(query).populate('agentId', 'name email status');
};

// Static method to find sessions by agent
chatSessionSchema.statics.findAgentSessions = function(agentId, status = 'active') {
  return this.find({
    agentId: agentId,
    status: status
  })
  .populate('userId', 'firstname lastname email')
  .populate('guestUserId', 'firstName lastName email'); // FIX 10: Also populate guest users
};

module.exports = mongoose.model('ChatSession', chatSessionSchema);
