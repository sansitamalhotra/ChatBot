// models/chatTemplate.js
const mongoose = require('mongoose');
const { Schema } = mongoose;

const chatTemplateSchema = new Schema({
  templateType: {
    type: String,
    enum: [
      'bot_response', 
      'agent_quick_reply', 
      'outside_hours_message',
      'greeting',
      'closing',
      'escalation',
      'transfer',
      'error',
      'form_prompt',
      'satisfaction_survey'
    ],
    required: true,
    index: true
  },
  category: {
    type: String,
    enum: [
      'search_job', 
      'partner_pspl', 
      'application_issue', 
      'greeting',
      'business_hours',
      'general',
      'technical',
      'emergency',
      'followup',
      'feedback'
    ],
    required: true,
    index: true
  },
  title: {
    type: String,
    required: true,
    maxlength: 200,
    unique: true
  },
  content: {
    type: String,
    required: true,
    maxlength: 2000,
    validate: {
      validator: function(v) {
        return v && v.trim().length > 0;
      },
      message: 'Content cannot be empty'
    }
  },
  variables: [{
    name: {
      type: String,
      required: true,
      validate: {
        validator: function(v) {
          return /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(v);
        },
        message: 'Variable name must be alphanumeric and start with letter or underscore'
      }
    },
    description: {
      type: String,
      required: true,
      maxlength: 200
    },
    defaultValue: {
      type: String,
      default: ''
    },
    required: {
      type: Boolean,
      default: false
    }
  }],
  quickReplies: [{
    text: {
      type: String,
      required: true,
      maxlength: 100
    },
    value: {
      type: String,
      required: true,
      maxlength: 100
    },
    action: {
      type: String,
      enum: ['text_response', 'option_selection', 'transfer', 'close_chat', 'custom'],
      default: 'text_response'
    }
  }],
  isActive: {
    type: Boolean,
    default: true,
    required: true,
    index: true
  },
  priority: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  businessHoursOnly: {
    type: Boolean,
    default: false,
    required: true,
    index: true
  },
  // Usage tracking
  usage: {
    timesUsed: {
      type: Number,
      default: 0,
      min: 0
    },
    lastUsed: {
      type: Date,
      default: null
    },
    averageRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    totalRatings: {
      type: Number,
      default: 0,
      min: 0
    }
  },
  // Personalization options
  personalization: {
    useUserName: {
      type: Boolean,
      default: true
    },
    useUserInfo: {
      type: Boolean,
      default: false
    },
    contextAware: {
      type: Boolean,
      default: false
    }
  },
  // Conditional display
  conditions: {
    userRole: [{
      type: String,
      enum: ['user', 'employer', 'admin', 'any'],
      default: 'any'
    }],
    sessionType: [{
      type: String,
      enum: ['bot', 'live_agent', 'transferred', 'any'],
      default: 'any'
    }],
    timeOfDay: {
      start: {
        type: String,
        validate: {
          validator: function(v) {
            return !v || /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
          },
          message: 'Time must be in HH:MM format'
        }
      },
      end: {
        type: String,
        validate: {
          validator: function(v) {
            return !v || /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
          },
          message: 'Time must be in HH:MM format'
        }
      }
    }
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
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
  // Version control
  version: {
    type: Number,
    default: 1,
    min: 1
  },
  parentTemplate: {
    type: Schema.Types.ObjectId,
    ref: 'ChatTemplate',
    default: null
  }
});

// Compound indexes for efficient querying
chatTemplateSchema.index({ templateType: 1, category: 1, isActive: 1 });
chatTemplateSchema.index({ businessHoursOnly: 1, isActive: 1 });
chatTemplateSchema.index({ priority: -1, isActive: 1 });
chatTemplateSchema.index({ 'usage.timesUsed': -1 });

// Pre-save middleware
chatTemplateSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  
  // Auto-increment version for existing templates
  if (!this.isNew && this.isModified(['content', 'variables', 'quickReplies'])) {
    this.version += 1;
  }
  
  next();
});

// Virtual for variable placeholders in content
chatTemplateSchema.virtual('placeholders').get(function() {
  const placeholderRegex = /\{(\w+)\}/g;
  const matches = [];
  let match;
  
  while ((match = placeholderRegex.exec(this.content)) !== null) {
    matches.push(match[1]);
  }
  
  return [...new Set(matches)]; // Remove duplicates
});

// Method to render template with variables
chatTemplateSchema.methods.render = function(variables = {}) {
  let renderedContent = this.content;
  
  // Replace variable placeholders
  this.variables.forEach(variable => {
    const placeholder = `{${variable.name}}`;
    const value = variables[variable.name] || variable.defaultValue || '';
    renderedContent = renderedContent.replace(new RegExp(placeholder, 'g'), value);
  });
  
  // Handle built-in variables
  const builtInVariables = {
    currentTime: new Date().toLocaleString(),
    currentDate: new Date().toLocaleDateString(),
    businessHours: '9:00 AM - 6:00 PM EST, Monday through Friday'
  };
  
  Object.entries(builtInVariables).forEach(([key, value]) => {
    const placeholder = `{${key}}`;
    renderedContent = renderedContent.replace(new RegExp(placeholder, 'g'), value);
  });
  
  return renderedContent;
};

// Method to increment usage
chatTemplateSchema.methods.incrementUsage = function() {
  this.usage.timesUsed += 1;
  this.usage.lastUsed = new Date();
  return this.save();
};

// Method to add rating
chatTemplateSchema.methods.addRating = function(rating) {
  const currentTotal = this.usage.averageRating * this.usage.totalRatings;
  this.usage.totalRatings += 1;
  this.usage.averageRating = (currentTotal + rating) / this.usage.totalRatings;
  return this.save();
};

// Method to check if template should be shown based on conditions
chatTemplateSchema.methods.shouldShow = function(context = {}) {
  const { userRole, sessionType, currentTime } = context;
  
  // Check user role condition
  if (this.conditions.userRole.length > 0 && !this.conditions.userRole.includes('any')) {
    if (!this.conditions.userRole.includes(userRole)) {
      return false;
    }
  }
  
  // Check session type condition
  if (this.conditions.sessionType.length > 0 && !this.conditions.sessionType.includes('any')) {
    if (!this.conditions.sessionType.includes(sessionType)) {
      return false;
    }
  }
  
  // Check time of day condition
  if (this.conditions.timeOfDay.start && this.conditions.timeOfDay.end) {
    const now = currentTime || new Date().toTimeString().slice(0, 5);
    if (now < this.conditions.timeOfDay.start || now > this.conditions.timeOfDay.end) {
      return false;
    }
  }
  
  return this.isActive;
};

// Static method to find templates by type and category
chatTemplateSchema.statics.findByTypeAndCategory = function(templateType, category, businessHoursOnly = null) {
  const query = {
    templateType,
    category,
    isActive: true
  };
  
  if (businessHoursOnly !== null) {
    query.businessHoursOnly = businessHoursOnly;
  }
  
  return this.find(query).sort({ priority: -1, 'usage.timesUsed': -1 });
};

// Static method to get random template
chatTemplateSchema.statics.getRandomTemplate = function(templateType, category) {
  return this.aggregate([
    {
      $match: {
        templateType,
        category,
        isActive: true
      }
    },
    { $sample: { size: 1 } }
  ]);
};

// Static method to create default templates
chatTemplateSchema.statics.createDefaults = function(createdBy) {
  const defaultTemplates = [
    {
      templateType: 'greeting',
      category: 'greeting',
      title: 'Welcome Greeting',
      content: 'Hello {firstName}! Welcome to PSPL Job Portal. How can I assist you today?',
      variables: [
        { name: 'firstName', description: 'User first name', defaultValue: 'there', required: false }
      ],
      quickReplies: [
        { text: 'Search for jobs', value: 'search_job', action: 'option_selection' },
        { text: 'Partnership info', value: 'partner_pspl', action: 'option_selection' },
        { text: 'Application help', value: 'application_issue', action: 'option_selection' },
        { text: 'Talk to agent', value: 'live_agent', action: 'option_selection' }
      ],
      createdBy
    },
    {
      templateType: 'outside_hours_message',
      category: 'business_hours',
      title: 'Outside Business Hours',
      content: "I'm sorry, but all our live agents are currently unavailable.\n\n**Our business hours are {businessHours}**\n\nCurrent time: {currentTime}\nNext available: {nextAvailable}\n\nHowever, I'm here to help! How can I assist you?",
      variables: [
        { name: 'businessHours', description: 'Business hours', defaultValue: '9:00 AM - 6:00 PM EST, Monday-Friday', required: false },
        { name: 'currentTime', description: 'Current time', defaultValue: '', required: false },
        { name: 'nextAvailable', description: 'Next available time', defaultValue: '', required: false }
      ],
      businessHoursOnly: false,
      quickReplies: [
        { text: 'Search for jobs', value: 'search_job', action: 'option_selection' },
        { text: 'Partnership info', value: 'partner_pspl', action: 'option_selection' },
        { text: 'Application help', value: 'application_issue', action: 'option_selection' },
        { text: 'Leave a message', value: 'leave_message', action: 'option_selection' }
      ],
      createdBy
    }
  ];
  
  return this.insertMany(defaultTemplates);
};

module.exports = mongoose.model('ChatTemplate', chatTemplateSchema);
