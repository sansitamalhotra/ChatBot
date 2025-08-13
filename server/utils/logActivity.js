const ActivityLog = require('../models/activityLogModel');
async function logActivity(userId, sessionId, email, activityType, req, userRole, metadata = {}) {
  try {
    const ipAddress = req 
      ? (req.ip || req.headers?.['x-forwarded-for'] || '') 
      : 'unknown';
    
    const userAgent = (userRole === 1 && req) 
      ? (req.get('User-Agent') || '') 
      : '';

    await ActivityLog.create({
      userId,
      sessionId,
      email,
      activityType,
      timestamp: new Date(),
      ipAddress,
      metadata: { userAgent, ...metadata }
    });
  } catch (err) {
    console.error("Failed to log activity:", err);
  }
}
module.exports = { logActivity };
