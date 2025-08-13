//server/middlewares/normalizeUserMiddleware.js
const { logWithIcon } = require('../services/consoleIcons');

module.exports = (req, res, next) => { 
    try
    { 
        if (!req.user) return next();
        // Normalize common id fields for convenience (because controllers expect req.user.id)
        req.user.id = req.user.id || req.user.userId || req.user._id || (req.user.userId ? req.user.userId : undefined);

        // Normalize role: keep numeric roles as numbers, convert numeric strings
        if (req.user.role && typeof req.user.role === 'string' && !isNaN(req.user.role)) {
        req.user.role = parseInt(req.user.role, 10);
        }

        // Normalize agentId (if present)
        if (req.user.agentId && typeof req.user.agentId === 'string') {
        req.user.agentId = req.user.agentId;
        }
        next();
    }
    catch (error)
    {
        logWithIcon.error('normalizeUser middleware error:', err);
        next();
    }
};
