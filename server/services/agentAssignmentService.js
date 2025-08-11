// server/services/agentAssignmentService.js
// Intelligent Live Agent assignment (Admin Users): least-loaded, skill and department matching, simple fallback.
const LiveAgent = require('../models/liveAgentModel');
const { logWithIcon } = require('./consoleIcons');

async function selectAgent(skills = [], department = null)
{
   try {
    // Build query: available agents online with capacity
    const query = {
      isAvailable: true,
      status: { $in: ['online', 'active'] },
      $expr: { $lt: ['$currentChats', '$maxChats'] }
    };

    if (department) {
      query.department = department;
    }

    // If skills provided, prefer agents that have skills intersection
    // First try best-matching agents (matching skills)
    if (skills && skills.length > 0) {
      const bySkill = await LiveAgent.find({
        ...query,
        skills: { $in: skills }
      }).sort({ currentChats: 1, lastActiveAt: 1 }).limit(10).lean();

      if (bySkill && bySkill.length > 0) {
        // Return least loaded
        return bySkill[0];
      }
    }

    // If no skill-match, pick least-loaded agent in department or globally
    const fallback = await LiveAgent.find(query)
      .sort({ currentChats: 1, lastActiveAt: 1 })
      .limit(10)
      .lean();

    if (fallback && fallback.length > 0) {
      return fallback[0];
    }

    // No available agent
    return null;
  } catch (err) {
    logWithIcon.error('agentAssignmentService.selectAgent error:', err);
    return null;
  }

}
async function incrementAgentLoad(agentId) {
  try {
    await LiveAgent.findByIdAndUpdate(agentId, { $inc: { currentChats: 1 }, lastAssignedAt: new Date() });
  } catch (err) {
    logWithIcon.error('agentAssignmentService.incrementAgentLoad error:', err);
  }
}

async function decrementAgentLoad(agentId) {
  try {
    await LiveAgent.findByIdAndUpdate(agentId, { $inc: { currentChats: -1 } });
  } catch (err) {
    logWithIcon.error('agentAssignmentService.decrementAgentLoad error:', err);
  }
}

module.exports = {
  selectAgent,
  incrementAgentLoad,
  decrementAgentLoad
};
