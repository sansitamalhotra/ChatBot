// server/utils/timeUtils.js
const moment = require('moment-timezone');

exports.isBusinessHours = () => {
  const now = moment().tz('America/New_York'); // EST/EDT timezone
  const day = now.day(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  const hour = now.hour();
  
  // Check if weekday (Mon-Fri) and between 9AM-6PM
  return day >= 1 && day <= 5 && hour >= 9 && hour < 18;
};
