// utils/businessHours.js - FIXED VERSION
const moment = require('moment-timezone');
const BusinessHours = require('../models/businessHoursModel');

class BusinessHoursUtil {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.cache.clear();
  }

  /**
   * Get cached data or fetch fresh - FIXED to return full Mongoose document
   */
  async getCachedBusinessHours() {
    const cacheKey = 'active_business_hours';
    const cached = this.cache.get(cacheKey);
    
    if (cached && (Date.now() - cached.timestamp < this.cacheTimeout)) {
      return cached.data;
    }

    // FIXED: Use findOne directly instead of getActive() to ensure we get a full document
    const businessHours = await BusinessHours.findOne({ isActive: true });
    this.cache.set(cacheKey, {
      data: businessHours,
      timestamp: Date.now()
    });

    return businessHours;
  }

  /**
   * Get cached lean document for read-only operations (better performance)
   */
  async getCachedBusinessHoursLean() {
    const cacheKey = 'active_business_hours_lean';
    const cached = this.cache.get(cacheKey);
    
    if (cached && (Date.now() - cached.timestamp < this.cacheTimeout)) {
      return cached.data;
    }

    const businessHours = await BusinessHours.findOne({ isActive: true }).lean();
    this.cache.set(cacheKey, {
      data: businessHours,
      timestamp: Date.now()
    });

    return businessHours;
  }

  /**
   * Get current EST time
   */
  getCurrentESTTime() {
    return moment().tz('America/New_York').format('YYYY-MM-DD HH:mm:ss z');
  }

  /**
   * Check if current time is within business hours
   */
  async isWithinBusinessHours() {
    try {
      const businessHours = await this.getCachedBusinessHours();
      if (!businessHours) return false;
      return businessHours.isCurrentlyOpen();
    } catch (error) {
      console.error('Error checking business hours:', error);
      return false;
    }
  }

  /**
   * Get next business hour
   */
  async getNextBusinessHour() {
    try {
      const businessHours = await this.getCachedBusinessHours();
      if (!businessHours) return 'Unknown - Please contact support';
      return businessHours.getNextAvailableTime();
    } catch (error) {
      console.error('Error getting next business hour:', error);
      return 'Unknown - Please contact support';
    }
  }

  /**
   * Check if we're near closing time
   */
  async isNearClosing() {
    try {
      const businessHours = await this.getCachedBusinessHours();
      if (!businessHours) return false;
      return businessHours.isNearClosing();
    } catch (error) {
      console.error('Error checking near closing:', error);
      return false;
    }
  }

  /**
   * Check if new chats are allowed
   */
  async allowNewChats() {
    try {
      const businessHours = await this.getCachedBusinessHours();
      if (!businessHours) return true; // Default to allow if no config
      return businessHours.allowNewChats();
    } catch (error) {
      console.error('Error checking allow new chats:', error);
      return true;
    }
  }

  /**
   * Get minutes until closing - OPTIMIZED to use lean document
   */
  async getMinutesUntilClosing() {
    try {
      // Use lean document for read-only operation
      const businessHours = await this.getCachedBusinessHoursLean();
      if (!businessHours) return 0;

      // Check if currently open using lean document logic
      const now = moment().tz(businessHours.timezone);
      const currentTime = now.format('HH:mm');
      const currentDay = now.format('dddd').toLowerCase();
      const currentDate = now.format('YYYY-MM-DD');
      
      // Check if it's a holiday
      const isHoliday = businessHours.holidays.some(holiday => {
        if (holiday.recurring) {
          const holidayDate = moment(holiday.date);
          return now.format('MM-DD') === holidayDate.format('MM-DD');
        }
        return moment(holiday.date).format('YYYY-MM-DD') === currentDate;
      });
      
      if (isHoliday) return 0;
      
      // Check for special hours
      const specialHour = businessHours.specialHours.find(sh => 
        moment(sh.date).format('YYYY-MM-DD') === currentDate
      );
      
      let endHour, endMinute;
      if (specialHour && !specialHour.isClosed && specialHour.hours && specialHour.hours.end) {
        [endHour, endMinute] = specialHour.hours.end.split(':');
      } else if (businessHours.workingDays.includes(currentDay)) {
        [endHour, endMinute] = businessHours.workingHours.end.split(':');
      } else {
        return 0; // Not a working day
      }
      
      // Check if currently within hours
      const isWithinHours = specialHour ? 
        (currentTime >= specialHour.hours.start && currentTime <= specialHour.hours.end) :
        (currentTime >= businessHours.workingHours.start && currentTime <= businessHours.workingHours.end);
        
      if (!isWithinHours) return 0;
      
      const closingTime = now.clone().hour(parseInt(endHour)).minute(parseInt(endMinute));
      return Math.max(0, closingTime.diff(now, 'minutes'));
    } catch (error) {
      console.error('Error getting minutes until closing:', error);
      return 0;
    }
  }

  /**
   * Check if a specific date/time is within business hours - OPTIMIZED to use lean document
   */
  async isDateTimeWithinBusinessHours(dateTime) {
    try {
      // Use lean document for read-only operation
      const businessHours = await this.getCachedBusinessHoursLean();
      if (!businessHours) return false;

      const checkTime = moment(dateTime).tz(businessHours.timezone);
      const currentTime = checkTime.format('HH:mm');
      const currentDay = checkTime.format('dddd').toLowerCase();
      const currentDate = checkTime.format('YYYY-MM-DD');
      
      // Check if it's a holiday
      const isHoliday = businessHours.holidays.some(holiday => {
        if (holiday.recurring) {
          const holidayDate = moment(holiday.date);
          return checkTime.format('MM-DD') === holidayDate.format('MM-DD');
        }
        return moment(holiday.date).format('YYYY-MM-DD') === currentDate;
      });
      
      if (isHoliday) return false;
      
      // Check for special hours
      const specialHour = businessHours.specialHours.find(sh => 
        moment(sh.date).format('YYYY-MM-DD') === currentDate
      );
      
      if (specialHour) {
        if (specialHour.isClosed) return false;
        if (!specialHour.hours || !specialHour.hours.start || !specialHour.hours.end) return false;
        return currentTime >= specialHour.hours.start && currentTime <= specialHour.hours.end;
      }
      
      // Check regular business hours
      if (!businessHours.workingDays.includes(currentDay)) return false;
      
      return currentTime >= businessHours.workingHours.start && currentTime <= businessHours.workingHours.end;
    } catch (error) {
      console.error('Error checking specific date time:', error);
      return false;
    }
  }

  /**
   * Get formatted business hours
   */
  getFormattedBusinessHours(businessHours) {
    if (!businessHours) return 'Not configured';
    
    const formatTime = (time) => {
      const [hours, minutes] = time.split(':');
      const hour = parseInt(hours);
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const displayHour = hour % 12 || 12;
      return `${displayHour}:${minutes} ${ampm}`;
    };

    return {
      start: formatTime(businessHours.workingHours.start),
      end: formatTime(businessHours.workingHours.end),
      formatted: `${formatTime(businessHours.workingHours.start)} - ${formatTime(businessHours.workingHours.end)} ${businessHours.timezone}`
    };
  }

  /**
   * Get outside hours message with user context - OPTIMIZED to use lean document
   */
  async getOutsideHoursMessage(user = {}) {
    try {
      // Use lean document for read-only operation
      const businessHours = await this.getCachedBusinessHoursLean();
      if (!businessHours) return 'We are currently unavailable.';

      const now = moment().tz(businessHours.timezone);
      
      // Check if it's a holiday
      const isHoliday = businessHours.holidays.some(holiday => {
        if (holiday.recurring) {
          const holidayDate = moment(holiday.date);
          return now.format('MM-DD') === holidayDate.format('MM-DD');
        }
        return moment(holiday.date).format('YYYY-MM-DD') === now.format('YYYY-MM-DD');
      });

      if (isHoliday) {
        return businessHours.settings?.holidayMessage || "We're currently closed for the holiday. We'll be back during our regular business hours.";
      }

      // Check if it's weekend
      if (now.day() === 0 || now.day() === 6) {
        return businessHours.settings?.weekendMessage || "We're currently closed for the weekend. Our business hours are Monday through Friday.";
      }

      return businessHours.outsideHoursMessage;
    } catch (error) {
      console.error('Error getting outside hours message:', error);
      return 'We are currently unavailable.';
    }
  }

  /**
   * Validate business hours configuration
   */
  validateConfig(config) {
    const errors = [];

    // Check required fields
    if (!config.timezone) {
      errors.push('Timezone is required');
    }

    if (!config.workingHours || !config.workingHours.start || !config.workingHours.end) {
      errors.push('Working hours start and end times are required');
    }

    if (!config.workingDays || !Array.isArray(config.workingDays) || config.workingDays.length === 0) {
      errors.push('At least one working day must be specified');
    }

    // Validate time format
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (config.workingHours) {
      if (config.workingHours.start && !timeRegex.test(config.workingHours.start)) {
        errors.push('Start time must be in HH:MM format');
      }

      if (config.workingHours.end && !timeRegex.test(config.workingHours.end)) {
        errors.push('End time must be in HH:MM format');
      }

      // Check if start time is before end time
      if (config.workingHours.start && config.workingHours.end) {
        if (config.workingHours.start >= config.workingHours.end) {
          errors.push('Start time must be before end time');
        }
      }
    }

    // Validate working days
    const validDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    if (config.workingDays && Array.isArray(config.workingDays)) {
      const invalidDays = config.workingDays.filter(day => !validDays.includes(day.toLowerCase()));
      if (invalidDays.length > 0) {
        errors.push(`Invalid working days: ${invalidDays.join(', ')}`);
      }
    }

    // Validate timezone
    if (config.timezone) {
      try {
        moment().tz(config.timezone);
      } catch (error) {
        errors.push('Invalid timezone specified');
      }
    }

    return errors;
  }

  /**
   * Get business hours status with detailed information
   */
  async getDetailedStatus() {
    try {
      const businessHours = await this.getCachedBusinessHoursLean();
      
      if (!businessHours) {
        return {
          isOpen: false,
          isConfigured: false,
          message: 'Business hours not configured',
          nextAvailable: null,
          currentTime: this.getCurrentESTTime(),
          timezone: 'America/New_York'
        };
      }

      const isOpen = await this.isWithinBusinessHours();
      const isNearClosing = await this.isNearClosing();
      const allowNewChats = await this.allowNewChats();
      const nextAvailable = !isOpen ? await this.getNextBusinessHour() : null;
      const minutesUntilClosing = isOpen ? await this.getMinutesUntilClosing() : 0;

      return {
        isOpen,
        isNearClosing,
        allowNewChats,
        minutesUntilClosing,
        nextAvailable,
        currentTime: this.getCurrentESTTime(),
        timezone: businessHours.timezone,
        workingHours: this.getFormattedBusinessHours(businessHours),
        isConfigured: true
      };
    } catch (error) {
      console.error('Error getting detailed status:', error);
      return {
        isOpen: false,
        isConfigured: false,
        message: 'Error checking business hours',
        currentTime: this.getCurrentESTTime()
      };
    }
  }
}

// Create a singleton instance
const businessHoursUtil = new BusinessHoursUtil();

// Middleware function for Express routes - FIXED
const businessHoursMiddleware = async (req, res, next) => {
  try {
    // Use findOne directly to get full document
    const businessHours = await BusinessHours.findOne({ isActive: true });
    
    req.businessHours = businessHours;
    req.businessHoursStatus = await businessHoursUtil.getDetailedStatus();
    req.isBusinessHours = req.businessHoursStatus.isOpen;
    req.canStartChat = { 
      allowed: req.businessHoursStatus.allowNewChats, 
      reason: req.businessHoursStatus.isOpen ? 'within_hours' : 'outside_hours' 
    };
    
    next();
  } catch (error) {
    console.error('Business hours middleware error:', error);
    req.businessHours = null;
    req.businessHoursStatus = { isOpen: false, isConfigured: false };
    req.isBusinessHours = false;
    req.canStartChat = { allowed: true, reason: 'no_restrictions' };
    
    next();
  }
};

module.exports = {
  businessHoursUtil,
  businessHoursMiddleware
};
