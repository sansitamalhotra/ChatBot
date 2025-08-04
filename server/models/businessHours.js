// models/businessHours.js
const mongoose = require('mongoose');
const { Schema } = mongoose;

const businessHoursSchema = new Schema({
  timezone: {
    type: String,
    default: 'America/New_York',
    required: true,
    validate: {
      validator: function(v) {
        // Basic timezone validation - you might want to use a more comprehensive list
        const validTimezones = [
          'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles',
          'Europe/London', 'Europe/Paris', 'Asia/Tokyo', 'Asia/Shanghai'
        ];
        return validTimezones.includes(v);
      },
      message: 'Invalid timezone specified'
    }
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
        message: 'Start time must be in HH:MM format (24-hour)'
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
        message: 'End time must be in HH:MM format (24-hour)'
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
        return v.length > 0 && v.every(day => validDays.includes(day.toLowerCase()));
      },
      message: 'Must specify at least one valid working day'
    }
  },
  holidays: [{
    date: {
      type: Date,
      required: true
    },
    name: {
      type: String,
      required: true,
      maxlength: 100
    },
    description: {
      type: String,
      maxlength: 500
    },
    recurring: {
      type: Boolean,
      default: false
    }
  }],
  outsideHoursMessage: {
    type: String,
    default: "I'm sorry, but our live agents are currently unavailable. Our business hours are 9:00 AM - 6:00 PM EST, Monday through Friday.",
    required: true,
    maxlength: 1000
  },
  outsideHoursOptions: [{
    type: String,
    maxlength: 100
  }],
  // Special hours for specific dates (overrides)
  specialHours: [{
    date: {
      type: Date,
      required: true
    },
    hours: {
      start: {
        type: String,
        validate: {
          validator: function(v) {
            return !v || /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
          },
          message: 'Start time must be in HH:MM format'
        }
      },
      end: {
        type: String,
        validate: {
          validator: function(v) {
            return !v || /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
          },
          message: 'End time must be in HH:MM format'
        }
      }
    },
    isClosed: {
      type: Boolean,
      default: false
    },
    reason: {
      type: String,
      maxlength: 200
    }
  }],
  isActive: {
    type: Boolean,
    default: true,
    required: true
  },
  // Configuration settings
  settings: {
    autoCloseChatsAfterHours: {
      type: Boolean,
      default: true
    },
    warningMinutesBeforeClose: {
      type: Number,
      default: 30,
      min: 5,
      max: 120
    },
    allowNewChatsMinutesBeforeClose: {
      type: Number,
      default: 15,
      min: 0,
      max: 60
    },
    weekendMessage: {
      type: String,
      default: "We're currently closed for the weekend. Our business hours are Monday through Friday, 9:00 AM - 6:00 PM EST."
    },
    holidayMessage: {
      type: String,
      default: "We're currently closed for the holiday. We'll be back during our regular business hours."
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
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
});

// Ensure only one active business hours configuration
businessHoursSchema.index({ isActive: 1 }, { unique: true, partialFilterExpression: { isActive: true } });

// Pre-save middleware
businessHoursSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  
  // Validate that start time is before end time
  if (this.workingHours.start >= this.workingHours.end) {
    return next(new Error('Start time must be before end time'));
  }
  
  // Clean up expired special hours and holidays
  const now = new Date();
  this.specialHours = this.specialHours.filter(sh => new Date(sh.date) >= now);
  this.holidays = this.holidays.filter(h => h.recurring || new Date(h.date) >= now);
  
  next();
});

// Virtual for formatted working hours
businessHoursSchema.virtual('formattedHours').get(function() {
  const start = this.workingHours.start;
  const end = this.workingHours.end;
  
  // Convert 24-hour to 12-hour format
  const formatTime = (time) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };
  
  return `${formatTime(start)} - ${formatTime(end)}`;
});

// Method to check if current time is within business hours
businessHoursSchema.methods.isCurrentlyOpen = function() {
  const moment = require('moment-timezone');
  
  // Get current time in the business timezone
  const now = moment().tz(this.timezone);
  const currentDate = now.format('YYYY-MM-DD');
  const currentTime = now.format('HH:mm');
  const currentDay = now.format('dddd').toLowerCase();
  
  // Check if today is a holiday
  const isHoliday = this.holidays.some(holiday => {
    if (holiday.recurring) {
      // For recurring holidays, check month and day
      const holidayDate = moment(holiday.date);
      return now.month() === holidayDate.month() && now.date() === holidayDate.date();
    } else {
      // For non-recurring holidays, check exact date
      return moment(holiday.date).format('YYYY-MM-DD') === currentDate;
    }
  });
  
  if (isHoliday) {
    return false;
  }
  
  // Check for special hours for today
  const todaySpecialHours = this.specialHours.find(sh => 
    moment(sh.date).format('YYYY-MM-DD') === currentDate
  );
  
  if (todaySpecialHours) {
    if (todaySpecialHours.isClosed) {
      return false;
    }
    // Use special hours instead of regular hours
    return currentTime >= todaySpecialHours.hours.start && 
           currentTime <= todaySpecialHours.hours.end;
  }
  
  // Check if today is a working day
  if (!this.workingDays.includes(currentDay)) {
    return false;
  }
  
  // Check if current time is within working hours
  return currentTime >= this.workingHours.start && currentTime <= this.workingHours.end;
};

// Method to get appropriate message for current status
businessHoursSchema.methods.getCurrentStatusMessage = function() {
  if (this.isCurrentlyOpen()) {
    return null; // No message needed when open
  }
  
  const moment = require('moment-timezone');
  const now = moment().tz(this.timezone);
  const currentDate = now.format('YYYY-MM-DD');
  const currentDay = now.format('dddd').toLowerCase();
  
  // Check if it's a holiday
  const todayHoliday = this.holidays.find(holiday => {
    if (holiday.recurring) {
      const holidayDate = moment(holiday.date);
      return now.month() === holidayDate.month() && now.date() === holidayDate.date();
    } else {
      return moment(holiday.date).format('YYYY-MM-DD') === currentDate;
    }
  });
  
  if (todayHoliday) {
    return this.settings.holidayMessage;
  }
  
  // Check for special hours
  const todaySpecialHours = this.specialHours.find(sh => 
    moment(sh.date).format('YYYY-MM-DD') === currentDate
  );
  
  if (todaySpecialHours && todaySpecialHours.isClosed) {
    return todaySpecialHours.reason || this.outsideHoursMessage;
  }
  
  // Check if it's weekend
  if (!this.workingDays.includes(currentDay)) {
    return this.settings.weekendMessage;
  }
  
  // Default outside hours message
  return this.outsideHoursMessage;
};

// Method to check if new chats should be allowed
businessHoursSchema.methods.shouldAllowNewChats = function() {
  if (!this.isCurrentlyOpen()) {
    return false;
  }
  
  const moment = require('moment-timezone');
  const now = moment().tz(this.timezone);
  const currentTime = now.format('HH:mm');
  
  // Calculate time until close
  const endTime = moment(this.workingHours.end, 'HH:mm');
  const currentMoment = moment(currentTime, 'HH:mm');
  const minutesUntilClose = endTime.diff(currentMoment, 'minutes');
  
  return minutesUntilClose > this.settings.allowNewChatsMinutesBeforeClose;
};

// Method to check if warning should be shown
businessHoursSchema.methods.shouldShowCloseWarning = function() {
  if (!this.isCurrentlyOpen()) {
    return false;
  }
  
  const moment = require('moment-timezone');
  const now = moment().tz(this.timezone);
  const currentTime = now.format('HH:mm');
  
  // Calculate time until close
  const endTime = moment(this.workingHours.end, 'HH:mm');
  const currentMoment = moment(currentTime, 'HH:mm');
  const minutesUntilClose = endTime.diff(currentMoment, 'minutes');
  
  return minutesUntilClose <= this.settings.warningMinutesBeforeClose && minutesUntilClose > 0;
};

// Static method to get active business hours configuration
businessHoursSchema.statics.getActive = function() {
  return this.findOne({ isActive: true });
};

// Export the model
module.exports = mongoose.model('BusinessHours', businessHoursSchema);
