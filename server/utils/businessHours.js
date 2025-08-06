// utils/businessHours.js
const moment = require('moment-timezone');
const BusinessHours = require('../models/businessHoursModel');
const logWithIcon = require('../services/consoleIcons');

class BusinessHoursUtil {
  constructor() {
    this.cachedConfig = null;
    this.cacheExpiry = null;
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes cache
  }

  // Get cached or fresh business hours configuration
  async getBusinessHoursConfig() {
    const now = new Date();
    
    if (this.cachedConfig && this.cacheExpiry && now < this.cacheExpiry) {
      return this.cachedConfig;
    }

    try {
      this.cachedConfig = await BusinessHours.getActive();
      this.cacheExpiry = new Date(now.getTime() + this.cacheTimeout);
      return this.cachedConfig;
    } catch (error) {
      logWithIcon.error('Error fetching business hours config:', error);
      // Return default config if database fails
      return this.getDefaultConfig();
    }
  }

  // Default configuration fallback
  getDefaultConfig() {
    return {
      timezone: 'America/New_York',
      workingHours: { start: '09:00', end: '18:00' },
      workingDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
      holidays: [],
      specialHours: [],
      settings: {
        warningMinutesBeforeClose: 30,
        allowNewChatsMinutesBeforeClose: 15
      }
    };
  }

  // Check if current time is within business hours
  async isWithinBusinessHours() {
    const config = await this.getBusinessHoursConfig();
    if (!config) return false;

    const now = moment().tz(config.timezone);
    const currentTime = now.format('HH:mm');
    const currentDay = now.format('dddd').toLowerCase();
    const currentDate = now.format('YYYY-MM-DD');

    // Check if it's a holiday
    const isHoliday = config.holidays.some(holiday => {
      if (holiday.recurring) {
        const holidayDate = moment(holiday.date);
        return now.format('MM-DD') === holidayDate.format('MM-DD');
      }
      return moment(holiday.date).format('YYYY-MM-DD') === currentDate;
    });

    if (isHoliday) return false;

    // Check for special hours
    const specialHour = config.specialHours.find(sh => 
      moment(sh.date).format('YYYY-MM-DD') === currentDate
    );

    if (specialHour) {
      if (specialHour.isClosed) return false;
      return currentTime >= specialHour.hours.start && currentTime <= specialHour.hours.end;
    }

    // Check regular business hours
    if (!config.workingDays.includes(currentDay)) return false;

    return currentTime >= config.workingHours.start && currentTime <= config.workingHours.end;
  }

  // Get next business hour
  async getNextBusinessHour() {
    const config = await this.getBusinessHoursConfig();
    if (!config) return 'Contact support for assistance';

    let nextTime = moment().tz(config.timezone);

    // Look ahead up to 14 days
    for (let i = 0; i < 14; i++) {
      const checkDate = nextTime.clone().add(i, 'days');
      const dayName = checkDate.format('dddd').toLowerCase();
      const dateStr = checkDate.format('YYYY-MM-DD');

      // Check if it's a holiday
      const isHoliday = config.holidays.some(holiday => {
        if (holiday.recurring) {
          const holidayDate = moment(holiday.date);
          return checkDate.format('MM-DD') === holidayDate.format('MM-DD');
        }
        return moment(holiday.date).format('YYYY-MM-DD') === dateStr;
      });

      if (isHoliday) continue;

      // Check for special hours
      const specialHour = config.specialHours.find(sh => 
        moment(sh.date).format('YYYY-MM-DD') === dateStr
      );

      if (specialHour && !specialHour.isClosed) {
        const [startHour, startMinute] = specialHour.hours.start.split(':');
        return checkDate.hour(parseInt(startHour))
                      .minute(parseInt(startMinute))
                      .format('dddd, MMMM Do YYYY, h:mm A z');
      }

      // Check regular working days
      if (config.workingDays.includes(dayName)) {
        const [startHour, startMinute] = config.workingHours.start.split(':');
        
        // If it's today and we're already past opening time, try tomorrow
        if (i === 0) {
          const now = moment().tz(config.timezone);
          const openingTime = now.clone().hour(parseInt(startHour)).minute(parseInt(startMinute));
          if (now.isAfter(openingTime)) continue;
        }
        
        return checkDate.hour(parseInt(startHour))
                      .minute(parseInt(startMinute))
                      .format('dddd, MMMM Do YYYY, h:mm A z');
      }
    }

    return 'Please contact support for assistance';
  }

  // Get current EST time formatted
  getCurrentESTTime() {
    return moment().tz('America/New_York').format('h:mm A z on dddd, MMMM Do YYYY');
  }

  // Check if we're close to closing time
  async isNearClosing() {
    const config = await this.getBusinessHoursConfig();
    if (!config || !await this.isWithinBusinessHours()) return false;

    const now = moment().tz(config.timezone);
    const [endHour, endMinute] = config.workingHours.end.split(':');
    const closingTime = now.clone().hour(parseInt(endHour)).minute(parseInt(endMinute));
    const warningTime = closingTime.clone().subtract(config.settings.warningMinutesBeforeClose || 30, 'minutes');

    return now.isAfter(warningTime);
  }

  // Check if new chats should be allowed
  async allowNewChats() {
    const config = await this.getBusinessHoursConfig();
    if (!config || !await this.isWithinBusinessHours()) return false;

    const now = moment().tz(config.timezone);
    const [endHour, endMinute] = config.workingHours.end.split(':');
    const closingTime = now.clone().hour(parseInt(endHour)).minute(parseInt(endMinute));
    const cutoffTime = closingTime.clone().subtract(config.settings.allowNewChatsMinutesBeforeClose || 15, 'minutes');

    return now.isBefore(cutoffTime);
  }

  // Get minutes until closing
  async getMinutesUntilClosing() {
    const config = await this.getBusinessHoursConfig();
    if (!config || !await this.isWithinBusinessHours()) return 0;

    const now = moment().tz(config.timezone);
    const [endHour, endMinute] = config.workingHours.end.split(':');
    const closingTime = now.clone().hour(parseInt(endHour)).minute(parseInt(endMinute));

    return closingTime.diff(now, 'minutes');
  }

  // Get outside hours message with personalization
  async getOutsideHoursMessage(userInfo = {}) {
    const config = await this.getBusinessHoursConfig();
    if (!config) return "We're currently unavailable. Please try again later.";

    const currentTime = this.getCurrentESTTime();
    const nextAvailable = await this.getNextBusinessHour();
    const firstName = userInfo.firstName || 'there';

    // Get appropriate message based on time
    const now = moment().tz(config.timezone);
    const dayName = now.format('dddd').toLowerCase();
    let message = config.outsideHoursMessage;

    // Use weekend message if it's weekend
    if (!config.workingDays.includes(dayName) && config.settings.weekendMessage) {
      message = config.settings.weekendMessage;
    }

    // Use holiday message if it's a holiday
    const currentDate = now.format('YYYY-MM-DD');
    const isHoliday = config.holidays.some(holiday => {
      if (holiday.recurring) {
        const holidayDate = moment(holiday.date);
        return now.format('MM-DD') === holidayDate.format('MM-DD');
      }
      return moment(holiday.date).format('YYYY-MM-DD') === currentDate;
    });

    if (isHoliday && config.settings.holidayMessage) {
      message = config.settings.holidayMessage;
    }

    // Replace variables in message
    return message
      .replace(/{firstName}/g, firstName)
      .replace(/{currentTime}/g, currentTime)
      .replace(/{nextAvailable}/g, nextAvailable)
      .replace(/{businessHours}/g, this.getFormattedBusinessHours(config));
  }

  // Get formatted business hours string
  getFormattedBusinessHours(config) {
    const formatTime = (time) => {
      const [hours, minutes] = time.split(':');
      const hour = parseInt(hours);
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const displayHour = hour % 12 || 12;
      return `${displayHour}:${minutes} ${ampm}`;
    };

    const start = formatTime(config.workingHours.start);
    const end = formatTime(config.workingHours.end);
    const days = config.workingDays.map(day => 
      day.charAt(0).toUpperCase() + day.slice(1)
    ).join(', ');

    return `${start} - ${end} EST, ${days}`;
  }

  // Clear cache (useful for testing or when config changes)
  clearCache() {
    this.cachedConfig = null;
    this.cacheExpiry = null;
  }

  // Validate business hours configuration
  validateConfig(config) {
    const errors = [];

    if (!config.timezone) {
      errors.push('Timezone is required');
    }

    if (!config.workingHours.start || !config.workingHours.end) {
      errors.push('Working hours start and end times are required');
    }

    if (config.workingHours.start >= config.workingHours.end) {
      errors.push('Start time must be before end time');
    }

    if (!config.workingDays || config.workingDays.length === 0) {
      errors.push('At least one working day must be specified');
    }

    return errors;
  }

  // Check if a specific date/time is within business hours
  async isDateTimeWithinBusinessHours(dateTime) {
    const config = await this.getBusinessHoursConfig();
    if (!config) return false;

    const checkTime = moment(dateTime).tz(config.timezone);
    const currentTime = checkTime.format('HH:mm');
    const currentDay = checkTime.format('dddd').toLowerCase();
    const currentDate = checkTime.format('YYYY-MM-DD');

    // Check if it's a holiday
    const isHoliday = config.holidays.some(holiday => {
      if (holiday.recurring) {
        const holidayDate = moment(holiday.date);
        return checkTime.format('MM-DD') === holidayDate.format('MM-DD');
      }
      return moment(holiday.date).format('YYYY-MM-DD') === currentDate;
    });

    if (isHoliday) return false;

    // Check for special hours
    const specialHour = config.specialHours.find(sh => 
      moment(sh.date).format('YYYY-MM-DD') === currentDate
    );

    if (specialHour) {
      if (specialHour.isClosed) return false;
      return currentTime >= specialHour.hours.start && currentTime <= specialHour.hours.end;
    }

    // Check regular business hours
    if (!config.workingDays.includes(currentDay)) return false;

    return currentTime >= config.workingHours.start && currentTime <= config.workingHours.end;
  }
}

// Create singleton instance
const businessHoursUtil = new BusinessHoursUtil();

module.exports = {
  businessHoursUtil,
  isWithinBusinessHours: () => businessHoursUtil.isWithinBusinessHours(),
  getNextBusinessHour: () => businessHoursUtil.getNextBusinessHour(),
  getCurrentESTTime: () => businessHoursUtil.getCurrentESTTime(),
  getOutsideHoursMessage: (userInfo) => businessHoursUtil.getOutsideHoursMessage(userInfo),
  isNearClosing: () => businessHoursUtil.isNearClosing(),
  allowNewChats: () => businessHoursUtil.allowNewChats()
};
