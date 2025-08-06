// models/chatNotification.js
const mongoose = require('mongoose');
const { Schema } = mongoose;

const chatNotificationSchema = new Schema({
  sessionId: {
    type: Schema.Types.ObjectId,
    ref: 'ChatSession',
    required: true,
    index: true
  },
  agentId: {
    type: Schema.Types.ObjectId,
    ref: 'LiveAgent',
    required: true,
    index: true
  },
  notificationType: {
    type: String,
    enum: [
      'new_chat', 
      'message_received', 
      'chat_transferred',
      'outside_hours_request',
      'chat_escalated',
      'agent_assigned',
      'chat_timeout',
      'satisfaction_received',
      'urgent_message',
      'system_alert'
    ],
    required: true,
    index: true
  },
  status: {
    type: String,
    enum: ['pending', 'sent', 'delivered', 'acknowledged', 'expired', 'failed'],
    default: 'pending',
    required: true,
    index: true
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium',
    index: true
  },
  // Email notification tracking
  emailSent: {
    type: Boolean,
    default: false
  },
  emailSentAt: {
    type: Date,
    default: null
  },
  emailDelivered: {
    type: Boolean,
    default: false
  },
  emailOpened: {
    type: Boolean,
    default: false
  },
  // Push notification tracking
  pushSent: {
    type: Boolean,
    default: false
  },
  pushSentAt: {
    type: Date,
    default: null
  },
  pushDelivered: {
    type: Boolean,
    default: false
  },
  // In-app notification tracking
  inAppSent: {
    type: Boolean,
    default: false
  },
  inAppSentAt: {
    type: Date,
    default: null
  },
  acknowledgedAt: {
    type: Date,
    default: null
  },
  acknowledgedBy: {
    type: Schema.Types.ObjectId,
    ref: 'LiveAgent',
    default: null
  },
  // Notification content
  title: {
    type: String,
    required: true,
    maxlength: 200
  },
  message: {
    type: String,
    required: true,
    maxlength: 1000
  },
  actionUrl: {
    type: String,
    validate: {
      validator: function(v) {
        return !v || /^https?:\/\/.+/.test(v);
      },
      message: 'Action URL must be a valid HTTP/HTTPS URL'
    }
  },
  // Notification metadata
  metadata: {
    userInfo: {
      userId: {
        type: Schema.Types.ObjectId,
        ref: 'User'
      },
      name: String,
      email: String,
      phone: String
    },
    chatInfo: {
      selectedOption: String,
      tags: [String],
      priority: String,
      messageCount: Number
    },
    urgency: {
      type: String,
      enum: ['low', 'normal', 'high', 'critical'],
      default: 'normal'
    },
    department: {
      type: String,
      enum: ['general', 'technical', 'partnerships', 'hr', 'support'],
      default: 'general'
    },
    requestedOutsideHours: {
      type: Boolean,
      default: false
    },
    requestTime: {
      type: Date,
      required: true
    },
    // Additional context data
    context: {
      type: Schema.Types.Mixed,
      default: {}
    }
  },
  // Delivery attempts tracking
  deliveryAttempts: {
    email: {
      attempts: {
        type: Number,
        default: 0
      },
      lastAttempt: Date,
      errors: [String]
    },
    push: {
      attempts: {
        type: Number,
        default: 0
      },
      lastAttempt: Date,
      errors: [String]
    },
    inApp: {
      attempts: {
        type: Number,
        default: 0
      },
      lastAttempt: Date,
      errors: [String]
    }
  },
  // Retry configuration
  retryConfig: {
    maxRetries: {
      type: Number,
      default: 3,
      min: 0,
      max: 10
    },
    retryInterval: {
      type: Number,
      default: 300, // 5 minutes in seconds
      min: 60,
      max: 3600
    },
    nextRetryAt: Date
  },
  createdAt: {
    type: Date,
    default: Date.now,
    required: true
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  expiresAt: {
    type: Date,
    required: true,
    index: { expireAfterSeconds: 0 }
  },
  // Notification channels
  channels: {
    email: {
      enabled: {
        type: Boolean,
        default: true
      },
      template: String,
      subject: String
    },
    push: {
      enabled: {
        type: Boolean,
        default: false
      },
      sound: String,
      badge: Number
    },
    inApp: {
      enabled: {
        type: Boolean,
        default: true
      },
      persistent: {
        type: Boolean,
        default: false
      }
    },
    sms: {
      enabled: {
        type: Boolean,
        default: false
      },
      phoneNumber: String
    }
  }
});

// Compound indexes for efficient querying
chatNotificationSchema.index({ agentId: 1, status: 1, createdAt: -1 });
chatNotificationSchema.index({ notificationType: 1, status: 1 });
chatNotificationSchema.index({ priority: 1, status: 1, createdAt: -1 });
chatNotificationSchema.index({ 'metadata.requestedOutsideHours': 1, status: 1 });
chatNotificationSchema.index({ expiresAt: 1 });

// Pre-save middleware
chatNotificationSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  
  // Set expiration time if not set (24 hours from creation)
  if (this.isNew && !this.expiresAt) {
    this.expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
  }
  
  // Update next retry time if needed
  if (this.status === 'failed' && this.shouldRetry()) {
    this.retryConfig.nextRetryAt = new Date(
      Date.now() + (this.retryConfig.retryInterval * 1000)
    );
  }
  
  next();
});

// Virtual for total delivery attempts
chatNotificationSchema.virtual('totalAttempts').get(function() {
  return this.deliveryAttempts.email.attempts + 
         this.deliveryAttempts.push.attempts + 
         this.deliveryAttempts.inApp.attempts;
});

// Virtual for delivery success rate
chatNotificationSchema.virtual('deliveryRate').get(function() {
  const successful = [this.emailDelivered, this.pushDelivered, this.inAppSent].filter(Boolean).length;
  const enabled = [this.channels.email.enabled, this.channels.push.enabled, this.channels.inApp.enabled].filter(Boolean).length;
  return enabled > 0 ? (successful / enabled) * 100 : 0;
});

// Method to check if notification should be retried
chatNotificationSchema.methods.shouldRetry = function() {
  return this.totalAttempts < this.retryConfig.maxRetries && 
         this.status === 'failed' && 
         new Date() < this.expiresAt;
};

// Method to mark as acknowledged
chatNotificationSchema.methods.acknowledge = function(agentId) {
  this.status = 'acknowledged';
  this.acknowledgedAt = new Date();
  this.acknowledgedBy = agentId;
  return this.save();
};

// Method to mark email as sent
chatNotificationSchema.methods.markEmailSent = function() {
  this.emailSent = true;
  this.emailSentAt = new Date();
  this.deliveryAttempts.email.attempts += 1;
  this.deliveryAttempts.email.lastAttempt = new Date();
  
  if (this.status === 'pending') {
    this.status = 'sent';
  }
  
  return this.save();
};

// Method to mark email as delivered
chatNotificationSchema.methods.markEmailDelivered = function() {
  this.emailDelivered = true;
  this.status = 'delivered';
  return this.save();
};

// Method to record delivery failure
chatNotificationSchema.methods.recordFailure = function(channel, error) {
  this.deliveryAttempts[channel].attempts += 1;
  this.deliveryAttempts[channel].lastAttempt = new Date();
  this.deliveryAttempts[channel].errors.push(error);
  
  if (!this.shouldRetry()) {
    this.status = 'expired';
  } else {
    this.status = 'failed';
  }
  
  return this.save();
};

// Static method to find pending notifications
chatNotificationSchema.statics.findPending = function(limit = 100) {
  return this.find({
    status: 'pending',
    expiresAt: { $gt: new Date() }
  })
  .limit(limit)
  .sort({ priority: -1, createdAt: 1 })
  .populate('agentId', 'name email notifications')
  .populate('sessionId', 'userId userInfo selectedOption');
};

// Static method to find notifications for retry
chatNotificationSchema.statics.findForRetry = function() {
  return this.find({
    status: 'failed',
    'retryConfig.nextRetryAt': { $lte: new Date() },
    expiresAt: { $gt: new Date() }
  })
  .populate('agentId', 'name email notifications');
};

// Static method to find agent notifications
chatNotificationSchema.statics.findAgentNotifications = function(agentId, status = null, limit = 50) {
  const query = { agentId };
  if (status) {
    query.status = status;
  }
  
  return this.find(query)
    .limit(limit)
    .sort({ createdAt: -1 })
    .populate('sessionId', 'userInfo selectedOption status');
};

// Static method to create notification
chatNotificationSchema.statics.createNotification = function(data) {
  const notification = new this({
    sessionId: data.sessionId,
    agentId: data.agentId,
    notificationType: data.type,
    priority: data.priority || 'medium',
    title: data.title,
    message: data.message,
    actionUrl: data.actionUrl,
    metadata: data.metadata || {},
    channels: data.channels || {}
  });
  
  return notification.save();
};

// Static method to cleanup expired notifications
chatNotificationSchema.statics.cleanupExpired = function() {
  return this.deleteMany({
    $or: [
      { status: 'expired' },
      { expiresAt: { $lt: new Date() } },
      { 
        status: 'acknowledged',
        acknowledgedAt: { $lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } // 7 days old
      }
    ]
  });
};

// Static method to get notification statistics
chatNotificationSchema.statics.getStats = function(agentId, startDate, endDate) {
  const matchStage = {
    createdAt: {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    }
  };
  
  if (agentId) {
    matchStage.agentId = mongoose.Types.ObjectId(agentId);
  }
  
  return this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        averageDeliveryTime: {
          $avg: {
            $subtract: ['$acknowledgedAt', '$createdAt']
          }
        }
      }
    }
  ]);
};

module.exports = mongoose.model('ChatNotification', chatNotificationSchema);
