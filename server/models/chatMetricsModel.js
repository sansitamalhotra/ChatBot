// models/chatMetrics.js
const mongoose = require('mongoose');
const { Schema } = mongoose;

const chatMetricsSchema = new Schema({
  sessionId: {
    type: Schema.Types.ObjectId,
    ref: 'ChatSession',
    required: true,
    unique: true,
    index: true
  },
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
  startTime: {
    type: Date,
    required: true
  },
  endTime: {
    type: Date,
    default: null
  },
  requestTime: {
    type: Date,
    required: true
  },
  outsideBusinessHours: {
    type: Boolean,
    default: false,
    required: true,
    index: true
  },
  responseTime: {
    type: Number,
    default: 0,
    min: 0 // Average response time in seconds
  },
  messageCount: {
    total: {
      type: Number,
      default: 0,
      min: 0
    },
    userMessages: {
      type: Number,
      default: 0,
      min: 0
    },
    agentMessages: {
      type: Number,
      default: 0,
      min: 0
    },
    botMessages: {
      type: Number,
      default: 0,
      min: 0
    }
  },
  satisfactionScore: {
    type: Number,
    min: 1,
    max: 5,
    default: null,
    validate: {
      validator: function(v) {
        return v === null || (v >= 1 && v <= 5);
      },
      message: 'Satisfaction score must be between 1 and 5'
    }
  },
  satisfactionFeedback: {
    type: String,
    maxlength: 1000,
    default: null
  },
  resolved: {
    type: Boolean,
    default: false,
    index: true
  },
  escalated: {
    type: Boolean,
    default: false,
    index: true
  },
  transferCount: {
    type: Number,
    default: 0,
    min: 0
  },
  waitTime: {
    type: Number,
    default: 0,
    min: 0 // Time waiting for agent in seconds
  },
  chatDuration: {
    type: Number,
    default: 0,
    min: 0 // Total chat duration in seconds
  },
  tags: [{
    type: String,
    maxlength: 50,
    validate: {
      validator: function(v) {
        return this.tags.length <= 20;
      },
      message: 'Cannot have more than 20 tags'
    }
  }],
  // Additional performance metrics
  performance: {
    firstResponseTime: {
      type: Number,
      default: 0,
      min: 0 // Time to first agent response in seconds
    },
    averageResponseTime: {
      type: Number,
      default: 0,
      min: 0 // Average time between user message and agent response
    },
    longestResponseTime: {
      type: Number,
      default: 0,
      min: 0
    },
    shortestResponseTime: {
      type: Number,
      default: 0,
      min: 0
    },
    userEngagement: {
      type: Number,
      default: 0,
      min: 0,
      max: 100 // Percentage based on user interaction
    }
  },
  // Business hours specific metrics
  businessHoursMetrics: {
    requestedDuringHours: {
      type: Boolean,
      default: false
    },
    servedDuringHours: {
      type: Boolean,
      default: false
    },
    outsideHoursHandling: {
      type: String,
      enum: ['bot_only', 'queued', 'emergency', 'redirected'],
      default: null
    },
    timeUntilBusinessHours: {
      type: Number,
      default: 0 // Minutes until business hours when requested
    }
  },
  // Session flow tracking
  sessionFlow: {
    entryPoint: {
      type: String,
      enum: ['widget', 'direct_link', 'referral', 'api'],
      default: 'widget'
    },
    selectedOptions: [{
      option: String,
      timestamp: Date,
      responseTime: Number
    }],
    formCompletionRate: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    exitPoint: {
      type: String,
      enum: ['user_closed', 'agent_closed', 'timeout', 'error', 'transferred'],
      default: null
    }
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Compound indexes for analytics queries
chatMetricsSchema.index({ createdAt: -1, resolved: 1 });
chatMetricsSchema.index({ agentId: 1, createdAt: -1 });
chatMetricsSchema.index({ outsideBusinessHours: 1, createdAt: -1 });
chatMetricsSchema.index({ satisfactionScore: 1, createdAt: -1 });
chatMetricsSchema.index({ tags: 1, createdAt: -1 });

// Pre-save middleware
chatMetricsSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  
  // Calculate chat duration if both start and end times are available
  if (this.startTime && this.endTime) {
    this.chatDuration = Math.floor((this.endTime - this.startTime) / 1000);
  }
  
  // Calculate total messages
  this.messageCount.total = 
    this.messageCount.userMessages + 
    this.messageCount.agentMessages + 
    this.messageCount.botMessages;
  
  next();
});

// Virtual for formatted duration
chatMetricsSchema.virtual('formattedDuration').get(function() {
  if (this.chatDuration === 0) return '0 seconds';
  
  const hours = Math.floor(this.chatDuration / 3600);
  const minutes = Math.floor((this.chatDuration % 3600) / 60);
  const seconds = this.chatDuration % 60;
  
  let result = '';
  if (hours > 0) result += `${hours}h `;
  if (minutes > 0) result += `${minutes}m `;
  if (seconds > 0 || result === '') result += `${seconds}s`;
  
  return result.trim();
});

// Virtual for satisfaction rating text
chatMetricsSchema.virtual('satisfactionText').get(function() {
  if (!this.satisfactionScore) return 'Not rated';
  
  const ratings = {
    1: 'Very Poor',
    2: 'Poor',
    3: 'Average',
    4: 'Good',
    5: 'Excellent'
  };
  
  return ratings[this.satisfactionScore];
});

// Method to finalize metrics when chat ends
chatMetricsSchema.methods.finalize = function(endTime = new Date()) {
  this.endTime = endTime;
  this.chatDuration = Math.floor((endTime - this.startTime) / 1000);
  return this.save();
};

// Method to add satisfaction rating
chatMetricsSchema.methods.addSatisfactionRating = function(score, feedback = null) {
  this.satisfactionScore = score;
  if (feedback) {
    this.satisfactionFeedback = feedback;
  }
  return this.save();
};

// Method to increment transfer count
chatMetricsSchema.methods.incrementTransfer = function() {
  this.transferCount += 1;
  return this.save();
};

// Method to mark as escalated
chatMetricsSchema.methods.markEscalated = function() {
  this.escalated = true;
  return this.save();
};

// Method to mark as resolved
chatMetricsSchema.methods.markResolved = function() {
  this.resolved = true;
  return this.save();
};

// Static method to get metrics summary for date range
chatMetricsSchema.statics.getMetricsSummary = function(startDate, endDate, filters = {}) {
  const matchStage = {
    createdAt: {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    },
    ...filters
  };
  
  return this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: null,
        totalChats: { $sum: 1 },
        resolvedChats: {
          $sum: { $cond: ['$resolved', 1, 0] }
        },
        escalatedChats: {
          $sum: { $cond: ['$escalated', 1, 0] }
        },
        outsideHoursChats: {
          $sum: { $cond: ['$outsideBusinessHours', 1, 0] }
        },
        averageDuration: { $avg: '$chatDuration' },
        averageResponseTime: { $avg: '$responseTime' },
        averageWaitTime: { $avg: '$waitTime' },
        averageSatisfaction: { $avg: '$satisfactionScore' },
        totalMessages: { $sum: '$messageCount.total' },
        averageMessagesPerChat: { $avg: '$messageCount.total' }
      }
    }
  ]);
};

// Static method to get agent performance metrics
chatMetricsSchema.statics.getAgentPerformance = function(agentId, startDate, endDate) {
  return this.aggregate([
    {
      $match: {
        agentId: mongoose.Types.ObjectId(agentId),
        createdAt: {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        }
      }
    },
    {
      $group: {
        _id: '$agentId',
        totalChats: { $sum: 1 },
        resolvedChats: { $sum: { $cond: ['$resolved', 1, 0] } },
        averageResponseTime: { $avg: '$responseTime' },
        averageSatisfaction: { $avg: '$satisfactionScore' },
        totalDuration: { $sum: '$chatDuration' },
        averageDuration: { $avg: '$chatDuration' }
      }
    }
  ]);
};

// Static method to get hourly distribution
chatMetricsSchema.statics.getHourlyDistribution = function(startDate, endDate) {
  return this.aggregate([
    {
      $match: {
        createdAt: {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        }
      }
    },
    {
      $group: {
        _id: { $hour: '$createdAt' },
        count: { $sum: 1 }
      }
    },
    { $sort: { '_id': 1 } }
  ]);
};

module.exports = mongoose.model('ChatMetrics', chatMetricsSchema);
