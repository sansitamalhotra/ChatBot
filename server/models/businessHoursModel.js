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
  const now = moment().tz(this.timezone);
  const currentTime = now.format('HH:mm');
  const currentDay = now.format('dddd').toLowerCase();
  const currentDate = now.format('YYYY-MM-DD');
  
  // Check if it's a holiday
  const isHoliday = this.holidays.some(holiday => {
    if (holiday.recurring) {
      const holidayDate = moment(holiday.date);
      return now.format('MM-DD') === holidayDate.format('MM-DD');
    }
    return moment(holiday.date).format('YYYY-MM-DD') === currentDate;
  });
  
  if (isHoliday) return false;
  
  // Check for special hours
  const specialHour = this.specialHours.find(sh => 
    moment(sh.date).format('YYYY-MM-DD') === currentDate
  );
  
  if (specialHour) {
    if (specialHour.isClosed) return false;
    return currentTime >= specialHour.hours.start && currentTime <= specialHour.hours.end;
  }
  
  // Check regular business hours
  if (!this.workingDays.includes(currentDay)) return false;
  
  return currentTime >= this.workingHours.start && currentTime <= this.workingHours.end;
};

// Method to get next available time
businessHoursSchema.methods.getNextAvailableTime = function() {
  const moment = require('moment-timezone');
  let nextTime = moment().tz(this.timezone);
  
  // Look ahead up to 14 days
  for (let i = 0; i < 14; i++) {
    const checkDate = nextTime.clone().add(i, 'days');
    const dayName = checkDate.format('dddd').toLowerCase();
    const dateStr = checkDate.format('YYYY-MM-DD');
    
    // Check if it's a holiday
    const isHoliday = this.holidays.some(holiday => {
      if (holiday.recurring) {
        const holidayDate = moment(holiday.date);
        return checkDate.format('MM-DD') === holidayDate.format('MM-DD');
      }
      return moment(holiday.date).format('YYYY-MM-DD') === dateStr;
    });
    
    if (isHoliday) continue;
    
    // Check for special hours
    const specialHour = this.specialHours.find(sh => 
      moment(sh.date).format('YYYY-MM-DD') === dateStr
    );
    
    if (specialHour && !specialHour.isClosed) {
      return checkDate.hour(parseInt(specialHour.hours.start.split(':')[0]))
                    .minute(parseInt(specialHour.hours.start.split(':')[1]))
                    .format('dddd, MMMM Do YYYY, h:mm A z');
    }
    
    // Check regular working days
    if (this.workingDays.includes(dayName)) {
      const [startHour, startMinute] = this.workingHours.start.split(':');
      return checkDate.hour(parseInt(startHour))
                    .minute(parseInt(startMinute))
                    .format('dddd, MMMM Do YYYY, h:mm A z');
    }
  }
  
  return 'Unknown - Please contact support';
};

// Method to check if we're close to closing time
businessHoursSchema.methods.isNearClosing = function() {
  if (!this.isCurrentlyOpen()) return false;
  
  const moment = require('moment-timezone');
  const now = moment().tz(this.timezone);
  const [endHour, endMinute] = this.workingHours.end.split(':');
  const closingTime = now.clone().hour(parseInt(endHour)).minute(parseInt(endMinute));
  const warningTime = closingTime.clone().subtract(this.settings.warningMinutesBeforeClose, 'minutes');
  
  return now.isAfter(warningTime);
};

// Static method to get active business hours
businessHoursSchema.statics.getActive = function() {
  return this.findOne({ isActive: true });
};

// Static method to create default business hours
businessHoursSchema.statics.createDefault = function(createdBy) {
  return this.create({
    timezone: 'America/New_York',
    workingHours: { start: '09:00', end: '18:00' },
    workingDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
    outsideHoursMessage: "I'm sorry, but our live agents are currently unavailable. Our business hours are 9:00 AM - 6:00 PM EST, Monday through Friday.",
    outsideHoursOptions: [
      'Search for jobs',
      'Partnership information', 
      'Application help',
      'Leave a message for an agent'
    ],
    createdBy
  });
};

module.exports = mongoose.model('BusinessHours', businessHoursSchema);
