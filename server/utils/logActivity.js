const ActivityLog = require('../models/activityLogModel');
async function logActivity(userId, sessionId, activityType, req, userRole, metadata = {}) {
  try {
    const userAgent = (userRole === 1) ? (req.get('User-Agent') || '') : '';
    await ActivityLog.create({
      userId,
      sessionId,
      activityType,
      timestamp: new Date(),
      ipAddress: req.ip || req.headers['x-forwarded-for'] || '',
      metadata: { userAgent, ...metadata }
    });
  } catch (err) {
    console.error("Failed to log activity:", err);
  }
}
module.exports = { logActivity };
