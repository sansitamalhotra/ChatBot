const ActivityLog = require('../models/activityLogModel');
/**
 * Logs an activity event for audit.
 * Includes userAgent only for Admin users.
 *
 * @param {String} userId
 * @param {String} sessionId
 * @param {String} activityType
 * @param {Request} req - Express request object
 * @param {Number} userRole - User role integer
 * @param {Object} metadata - Additional meta information
 */
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
