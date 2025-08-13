//server/models/businessHours.js 
const mongoose = require('mongoose');
const { Schema } = mongoose;

const businessHoursSchema = new Schema({
  timezone: {
    type: String,
    default: 'America/New_York',
    required: true,
    validate: {
      validator: function(v) {
        // More comprehensive timezone validation using moment-timezone
        const moment = require('moment-timezone');
        return moment.tz.names().includes(v);
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
  // FIXED: Enhanced holidays schema with proper description support
  holidays: [{
    date: {
      type: Date,
      required: true,
      validate: {
        validator: function(v) {
          return v instanceof Date && !isNaN(v.getTime());
        },
        message: 'Invalid date provided for holiday'
      }
    },
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: [1, 'Holiday name cannot be empty'],
      maxlength: [100, 'Holiday name cannot exceed 100 characters']
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Holiday description cannot exceed 500 characters'],
      default: '' // FIXED: Ensure description always has a default value
    },
    recurring: {
      type: Boolean,
      default: false
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    updatedAt: {
      type: Date,
      default: Date.now
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
      required: true,
      validate: {
        validator: function(v) {
          return v instanceof Date && !isNaN(v.getTime());
        },
        message: 'Invalid date provided for special hours'
      }
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
      trim: true,
      maxlength: 200,
      default: ''
    },
    createdAt: {
      type: Date,
      default: Date.now
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
    required: false
  }
});

// Add indexes for better performance
businessHoursSchema.index({ isActive: 1 });
businessHoursSchema.index({ 'holidays.date': 1 });
businessHoursSchema.index({ 'specialHours.date': 1 });

// FIXED: Pre-save middleware with enhanced holiday description handling
businessHoursSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  
  // Validate that start time is before end time
  if (this.workingHours.start >= this.workingHours.end) {
    return next(new Error('Start time must be before end time'));
  }
  
  // FIXED: Ensure holiday descriptions are preserved and properly formatted
  if (this.holidays && this.holidays.length > 0) {
    this.holidays.forEach((holiday, index) => {
      // Ensure description field exists and is properly set
      if (holiday.description === undefined || holiday.description === null) {
        holiday.description = '';
      }
      
      // Trim description but preserve content
      if (typeof holiday.description === 'string') {
        holiday.description = holiday.description.trim();
      }
      
      // Update holiday's updatedAt timestamp
      holiday.updatedAt = new Date();
      
      console.log(`Pre-save holiday ${index}:`, {
        name: holiday.name,
        description: holiday.description,
        hasDescription: !!holiday.description
      });
    });
  }
  
  // FIXED: Ensure special hours are properly handled
  if (this.specialHours && this.specialHours.length > 0) {
    this.specialHours.forEach((special, index) => {
      if (special.reason === undefined || special.reason === null) {
        special.reason = '';
      }
      if (typeof special.reason === 'string') {
        special.reason = special.reason.trim();
      }
    });
  }
  
  next();
});

// Pre-save middleware to ensure only one active configuration
businessHoursSchema.pre('save', async function(next) {
  if (this.isActive && this.isNew) {
    try {
      // Deactivate all other configurations
      await this.constructor.updateMany(
        { _id: { $ne: this._id }, isActive: true },
        { $set: { isActive: false } }
      );
    } catch (error) {
      return next(error);
    }
  }
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
  
  return `${formatTime(start)} - ${formatTime(end)} EST`;
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
    if (!specialHour.hours || !specialHour.hours.start || !specialHour.hours.end) return false;
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
    
    if (specialHour && !specialHour.isClosed && specialHour.hours && specialHour.hours.start) {
      const [startHour, startMinute] = specialHour.hours.start.split(':');
      return checkDate.hour(parseInt(startHour))
                    .minute(parseInt(startMinute))
                    .format('dddd, MMMM Do YYYY, h:mm A z');
    }
    
    // Check regular working days
    if (this.workingDays.includes(dayName)) {
      const [startHour, startMinute] = this.workingHours.start.split(':');
      
      // If it's today and we're already past opening time, try tomorrow
      if (i === 0) {
        const now = moment().tz(this.timezone);
        const openingTime = now.clone().hour(parseInt(startHour)).minute(parseInt(startMinute));
        if (now.isAfter(openingTime)) continue;
      }
      
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
  const currentDate = now.format('YYYY-MM-DD');
  
  // Check for special hours first
  const specialHour = this.specialHours.find(sh => 
    moment(sh.date).format('YYYY-MM-DD') === currentDate
  );
  
  let endHour, endMinute;
  if (specialHour && !specialHour.isClosed && specialHour.hours && specialHour.hours.end) {
    [endHour, endMinute] = specialHour.hours.end.split(':');
  } else {
    [endHour, endMinute] = this.workingHours.end.split(':');
  }
  
  const closingTime = now.clone().hour(parseInt(endHour)).minute(parseInt(endMinute));
  const warningTime = closingTime.clone().subtract(this.settings.warningMinutesBeforeClose || 30, 'minutes');
  
  return now.isAfter(warningTime);
};

// Method to check if new chats should be allowed
businessHoursSchema.methods.allowNewChats = function() {
  if (!this.isCurrentlyOpen()) return false;
  
  const moment = require('moment-timezone');
  const now = moment().tz(this.timezone);
  const currentDate = now.format('YYYY-MM-DD');
  
  // Check for special hours first
  const specialHour = this.specialHours.find(sh => 
    moment(sh.date).format('YYYY-MM-DD') === currentDate
  );
  
  let endHour, endMinute;
  if (specialHour && !specialHour.isClosed && specialHour.hours && specialHour.hours.end) {
    [endHour, endMinute] = specialHour.hours.end.split(':');
  } else {
    [endHour, endMinute] = this.workingHours.end.split(':');
  }
  
  const closingTime = now.clone().hour(parseInt(endHour)).minute(parseInt(endMinute));
  const cutoffTime = closingTime.clone().subtract(this.settings.allowNewChatsMinutesBeforeClose || 15, 'minutes');
  
  return now.isBefore(cutoffTime);
};

// FIXED: Static method to get active business hours - Returns full Mongoose document
businessHoursSchema.statics.getActive = async function() {
  try {
    const activeConfig = await this.findOne({ isActive: true });
    if (activeConfig) {
      console.log('Found active config with holidays:', activeConfig.holidays.length);
      // Log holidays with descriptions
      activeConfig.holidays.forEach((holiday, index) => {
        console.log(`Holiday ${index} in getActive:`, {
          name: holiday.name,
          description: holiday.description,
          hasDescription: !!holiday.description
        });
      });
    }
    return activeConfig;
  } catch (error) {
    console.error('Error fetching active business hours:', error);
    return null;
  }
};

// FIXED: Static method for lean documents (better performance for read-only operations) - INCLUDES DESCRIPTIONS
businessHoursSchema.statics.getActiveLean = async function() {
  try {
    const activeConfig = await this.findOne({ isActive: true }).lean();
    if (activeConfig) {
      console.log('Found active config (lean) with holidays:', activeConfig.holidays.length);
      // Log holidays with descriptions for lean queries
      activeConfig.holidays.forEach((holiday, index) => {
        console.log(`Holiday ${index} in getActiveLean:`, {
          name: holiday.name,
          description: holiday.description,
          hasDescription: !!holiday.description
        });
      });
    }
    return activeConfig;
  } catch (error) {
    console.error('Error fetching active business hours (lean):', error);
    return null;
  }
};

// FIXED: Enhanced static method to create default business hours with sample holidays including descriptions
businessHoursSchema.statics.createDefault = async function(createdBy = null) {
  try {
    // First, deactivate any existing active configurations
    await this.updateMany({ isActive: true }, { $set: { isActive: false } });
    
    // FIXED: Enhanced default configuration with sample holidays that include descriptions
    const defaultConfig = {
      timezone: 'America/New_York',
      workingHours: { start: '09:00', end: '18:00' },
      workingDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
      holidays: [
        {
          date: new Date('2025-12-25'),
          name: 'Christmas Day',
          description: 'Christmas Day - Office closed for the Christmas holiday. We will resume normal business hours the next business day.',
          recurring: true
        },
        {
          date: new Date('2025-07-04'),
          name: 'Independence Day',
          description: 'Independence Day - Celebrating the 4th of July. All offices and services will be closed.',
          recurring: true
        },
        {
          date: new Date('2025-01-01'),
          name: 'New Year\'s Day',
          description: 'New Year\'s Day - Starting the new year with a well-deserved break. Happy New Year!',
          recurring: true
        }
      ],
      outsideHoursMessage: "I'm sorry, but our live agents are currently unavailable. Our business hours are 9:00 AM - 6:00 PM EST, Monday through Friday.",
      outsideHoursOptions: [
        'Search for jobs',
        'Partnership information', 
        'Application help',
        'Leave a message for an agent'
      ],
      specialHours: [],
      isActive: true,
      settings: {
        autoCloseChatsAfterHours: true,
        warningMinutesBeforeClose: 30,
        allowNewChatsMinutesBeforeClose: 15,
        weekendMessage: "We're currently closed for the weekend. Our business hours are Monday through Friday, 9:00 AM - 6:00 PM EST.",
        holidayMessage: "We're currently closed for the holiday. We'll be back during our regular business hours."
      }
    };
    
    if (createdBy) {
      defaultConfig.createdBy = createdBy;
    }
    
    const newConfig = await this.create(defaultConfig);
    console.log('Created default config with holidays:', newConfig.holidays.length);
    
    // Log created holidays to verify descriptions
    newConfig.holidays.forEach((holiday, index) => {
      console.log(`Created holiday ${index}:`, {
        name: holiday.name,
        description: holiday.description,
        hasDescription: !!holiday.description
      });
    });
    
    return newConfig;
  } catch (error) {
    console.error('Error creating default business hours:', error);
    throw error;
  }
};

// Static method to ensure business hours exist
businessHoursSchema.statics.ensureExists = async function() {
  try {
    const existing = await this.findOne({ isActive: true });
    if (!existing) {
      console.log('No active business hours found. Creating default configuration...');
      return await this.createDefault();
    }
    return existing;
  } catch (error) {
    console.error('Error ensuring business hours exist:', error);
    throw error;
  }
};

// FIXED: Static method to get business hours with fallback - PRESERVES DESCRIPTIONS
businessHoursSchema.statics.getActiveOrCreate = async function(createdBy = null) {
  try {
    let activeConfig = await this.getActive(); // Returns full document with descriptions
    if (!activeConfig) {
      console.log('No active business hours configuration found. Creating default...');
      activeConfig = await this.createDefault(createdBy);
    }
    
    // Log to verify descriptions are preserved
    if (activeConfig && activeConfig.holidays) {
      console.log('getActiveOrCreate - holidays with descriptions:', activeConfig.holidays.map(h => ({
        name: h.name,
        hasDescription: !!h.description,
        description: h.description
      })));
    }
    
    return activeConfig;
  } catch (error) {
    console.error('Error getting or creating business hours:', error);
    throw error;
  }
};

// FIXED: Add method to find holidays with descriptions for debugging
businessHoursSchema.methods.getHolidaysWithDescriptions = function() {
  return this.holidays.map(holiday => ({
    _id: holiday._id,
    name: holiday.name,
    date: holiday.date,
    description: holiday.description || '',
    recurring: holiday.recurring || false,
    createdAt: holiday.createdAt,
    updatedAt: holiday.updatedAt
  }));
};

// FIXED: Add static method to get all holidays with descriptions
businessHoursSchema.statics.getAllHolidaysWithDescriptions = async function() {
  try {
    const businessHours = await this.findOne({ isActive: true });
    if (!businessHours) return [];
    
    return businessHours.holidays.map(holiday => ({
      _id: holiday._id,
      name: holiday.name,
      date: holiday.date,
      description: holiday.description || '',
      recurring: holiday.recurring || false,
      createdAt: holiday.createdAt,
      updatedAt: holiday.updatedAt
    }));
  } catch (error) {
    console.error('Error getting all holidays with descriptions:', error);
    return [];
  }
};

// Add toJSON transform to ensure virtuals and descriptions are included
businessHoursSchema.set('toJSON', { 
  virtuals: true,
  transform: function(doc, ret) {
    // Ensure holidays include descriptions in JSON output
    if (ret.holidays) {
      ret.holidays = ret.holidays.map(holiday => ({
        _id: holiday._id,
        name: holiday.name,
        date: holiday.date,
        description: holiday.description || '',
        recurring: holiday.recurring || false,
        createdAt: holiday.createdAt,
        updatedAt: holiday.updatedAt
      }));
    }
    return ret;
  }
});

businessHoursSchema.set('toObject', { 
  virtuals: true,
  transform: function(doc, ret) {
    // Ensure holidays include descriptions in object output
    if (ret.holidays) {
      ret.holidays = ret.holidays.map(holiday => ({
        _id: holiday._id,
        name: holiday.name,
        date: holiday.date,
        description: holiday.description || '',
        recurring: holiday.recurring || false,
        createdAt: holiday.createdAt,
        updatedAt: holiday.updatedAt
      }));
    }
    return ret;
  }
});

module.exports = mongoose.model('BusinessHours', businessHoursSchema);
