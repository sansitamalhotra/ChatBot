// models/liveAgent.js
const mongoose = require('mongoose');
const { Schema } = mongoose;

const liveAgentSchema = new Schema({
  agentId: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    validate: {
      validator: function(v) {
        return /^AGENT_[A-Z0-9]{6}$/.test(v);
      },
      message: 'Agent ID must follow format: AGENT_XXXXXX'
    }
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
    index: true
  },
  name: {
    type: String,
    required: true,
    minlength: 2,
    maxlength: 100
  },
  email: {
    type: String,
    required: true,
    unique: true,
    validate: {
      validator: function(v) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
      },
      message: 'Please enter a valid email address'
    }
  },
  department: {
    type: String,
    enum: ['general', 'technical', 'partnerships', 'hr', 'support'],
    default: 'general',
    required: true
  },
  status: {
    type: String,
    enum: ['online', 'offline', 'busy', 'away', 'break'],
    default: 'offline',
    required: true,
    index: true
  },
  currentChats: {
    type: Number,
    default: 0,
    min: 0,
    validate: {
      validator: function(v) {
        return v <= this.maxChats;
      },
      message: 'Current chats cannot exceed maximum allowed chats'
    }
  },
  maxChats: {
    type: Number,
    default: 5,
    min: 1,
    max: 20,
    required: true
  },
  lastActive: {
    type: Date,
    default: Date.now
  },
  skills: [{
    type: String,
    enum: [
      'job_search', 
      'partnerships', 
      'technical_support', 
      'application_assistance',
      'general_inquiry',
      'billing',
      'account_management'
    ],
    validate: {
      validator: function(v) {
        return this.skills.length <= 10;
      },
      message: 'Agent cannot have more than 10 skills'
    }
  }],
  availability: {
    timezone: {
      type: String,
      default: 'America/New_York',
      required: true
    },
    workingHours: {
      start: {
        type: String,
        default: '09:00',
        required: true,
        validate: {
          validator: function(v) {
            return /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
          },
          message: 'Start time must be in HH:MM format'
        }
      },
      end: {
        type: String,
        default: '18:00',
        required: true,
        validate: {
          validator: function(v) {
            return /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
          },
          message: 'End time must be in HH:MM format'
        }
      }
    },
    workingDays: {
      type: [String],
      default: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
      required: true,
      validate: {
        validator: function(v) {
          const validDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
          return v.every(day => validDays.includes(day.toLowerCase()));
        },
        message: 'Invalid working day specified'
      }
    },
    holidaySchedule: [{
      type: Date,
      validate: {
        validator: function(v) {
          return v >= new Date();
        },
        message: 'Holiday dates must be in the future'
      }
    }],
    // Temporary unavailability (sick days, vacation, etc.)
    tempUnavailable: {
      start: Date,
      end: Date,
      reason: String
    }
  },
  // Performance metrics
  performance: {
    totalChats: {
      type: Number,
      default: 0
    },
    averageResponseTime: {
      type: Number,
      default: 0 // in seconds
    },
    averageRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    totalRatings: {
      type: Number,
      default: 0
    },
    resolutionRate: {
      type: Number,
      default: 0 // percentage
    }
  },
  // Notification preferences
  notifications: {
    email: {
      type: Boolean,
      default: true
    },
    newChatAlert: {
      type: Boolean,
      default: true
    },
    messageSound: {
      type: Boolean,
      default: true
    },
    outsideHoursNotification: {
      type: Boolean,
      default: false
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  // Agent profile settings
  avatar: {
    type: String,
    default: null
  },
  bio: {
    type: String,
    maxlength: 500
  },
  languages: [{
    type: String,
    default: ['english']
  }]
});

// Indexes for performance
liveAgentSchema.index({ status: 1, currentChats: 1 });
liveAgentSchema.index({ department: 1, status: 1 });
liveAgentSchema.index({ skills: 1, status: 1 });
liveAgentSchema.index({ agentId: 1 });
liveAgentSchema.index({ 'availability.workingDays': 1 });

// Pre-save middleware
liveAgentSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  
  // Auto-generate agentId if not provided
  if (this.isNew && !this.agentId) {
    this.agentId = 'AGENT_' + Math.random().toString(36).substr(2, 6).toUpperCase();
  }
  
  // Update lastActive when status changes to online
  if (this.isModified('status') && this.status === 'online') {
    this.lastActive = new Date();
  }
  
  next();
});

// Virtual for current availability
liveAgentSchema.virtual('isAvailable').get(function() {
  return this.status === 'online' && this.currentChats < this.maxChats;
});

// Virtual for workload percentage
liveAgentSchema.virtual('workloadPercentage').get(function() {
  return Math.round((this.currentChats / this.maxChats) * 100);
});

// Method to check if agent is working now
liveAgentSchema.methods.isWorkingNow = function() {
  const moment = require('moment-timezone');
  const now = moment().tz(this.availability.timezone);
  const currentHour = now.format('HH:mm');
  const currentDay = now.format('dddd').toLowerCase();
  
  // Check if it's a working day
  if (!this.availability.workingDays.includes(currentDay)) {
    return false;
  }
  
  // Check if it's within working hours
  const startTime = this.availability.workingHours.start;
  const endTime = this.availability.workingHours.end;
  
  return currentHour >= startTime && currentHour <= endTime;
};

// Method to check if agent is on holiday
liveAgentSchema.methods.isOnHoliday = function() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  return this.availability.holidaySchedule.some(holiday => {
    const holidayDate = new Date(holiday);
    holidayDate.setHours(0, 0, 0, 0);
    return holidayDate.getTime() === today.getTime();
  });
};

// Method to assign chat
liveAgentSchema.methods.assignChat = function() {
  if (this.currentChats >= this.maxChats) {
    throw new Error('Agent has reached maximum chat capacity');
  }
  this.currentChats += 1;
  this.performance.totalChats += 1;
  return this.save();
};

// Method to release chat
liveAgentSchema.methods.releaseChat = function() {
  if (this.currentChats > 0) {
    this.currentChats -= 1;
  }
  return this.save();
};

// Method to update performance metrics
liveAgentSchema.methods.updatePerformance = function(responseTime, rating = null) {
  // Update average response time
  const totalChats = this.performance.totalChats;
  const currentAvg = this.performance.averageResponseTime;
  this.performance.averageResponseTime = ((currentAvg * (totalChats - 1)) + responseTime) / totalChats;
  
  // Update rating if provided
  if (rating !== null) {
    const totalRatings = this.performance.totalRatings;
    const currentRating = this.performance.averageRating;
    this.performance.averageRating = ((currentRating * totalRatings) + rating) / (totalRatings + 1);
    this.performance.totalRatings += 1;
  }
  
  return this.save();
};

// Static method to find available agents
liveAgentSchema.statics.findAvailableAgents = function(skills = [], department = null) {
  const query = {
    status: 'online',
    $expr: { $lt: ['$currentChats', '$maxChats'] }
  };
  
  if (skills.length > 0) {
    query.skills = { $in: skills };
  }
  
  if (department) {
    query.department = department;
  }
  
  return this.find(query).sort({ currentChats: 1, 'performance.averageRating': -1 });
};

// Static method to get agent by agentId
liveAgentSchema.statics.findByAgentId = function(agentId) {
  return this.findOne({ agentId }).populate('userId', 'firstname lastname email');
};

// Static method to get agents by department
liveAgentSchema.statics.findByDepartment = function(department) {
  return this.find({ department }).populate('userId', 'firstname lastname email');
};

module.exports = mongoose.model('LiveAgent', liveAgentSchema);
