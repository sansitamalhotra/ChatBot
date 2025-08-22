// server/services/agentAssignmentService.js
const User = require('../models/userModel');
const LiveAgent = require('../models/liveAgentModel');
const ChatSession = require('../models/chatSessionModel');
const { logWithIcon } = require('./consoleIcons');

class AgentAssignmentService {
  // Find an available agent (prefer admin users then LiveAgent records)
  async findAvailableAgent({ sessionId, userPreferences = {}, businessHours = null } = {}) {
    try {
      logWithIcon.agent('Finding available agent for session:', sessionId);

      // Prefer admin users who are currently online/active
      let availableAdmin = await User.findOne({
        role: 1,
        currentStatus: { $in: ['online', 'active'] },
        isActive: { $ne: false }
      }).sort({ lastActivity: -1 });

      if (availableAdmin) {
        logWithIcon.success(`Found admin user agent: ${availableAdmin.email}`);
        return {
          _id: availableAdmin._id,
          userId: availableAdmin._id,
          firstname: availableAdmin.firstname || availableAdmin.firstName,
          lastname: availableAdmin.lastname || availableAdmin.lastName,
          email: availableAdmin.email,
          photo: availableAdmin.photo,
          role: availableAdmin.role,
          status: availableAdmin.currentStatus || 'online',
          currentSessions: availableAdmin.agentStats?.activeSessions || 0,
          isUserAgent: true
        };
      }

      // Fallback: use LiveAgent collection
      logWithIcon.info('No admin users found, checking LiveAgent collection');
      const liveAgent = await LiveAgent.findOne({
        status: { $in: ['online'] },
        isActive: true,
        $expr: { $lt: ['$currentSessions', '$maxChats'] }
      }).populate('userId').sort({
        priority: -1,
        currentSessions: 1,
        lastActivity: -1
      });

      if (liveAgent) {
        logWithIcon.success(`Found LiveAgent: ${liveAgent.userId ? liveAgent.userId.email : liveAgent.email}`);
        return liveAgent;
      }

      logWithIcon.warning('No available agents found');
      return null;
    } catch (error) {
      logWithIcon.error('Error finding available agent:', error);
      return null;
    }
  }

  // Get multiple agents by priority (for UI or queue estimation)
  async getAgentsByPriority(baseQuery = {}) {
    try {
      const agents = await LiveAgent.find({
        ...baseQuery,
        isActive: true,
        currentSessions: { $lt: 5 }
      })
      .sort({
        priority: -1,
        currentSessions: 1,
        lastActivity: -1
      })
      .populate('userId', 'firstname lastname email photo role currentStatus')
      .limit(10)
      .lean();

      if (agents.length === 0) {
        const userAgents = await User.find({
          role: 1,
          currentStatus: { $in: ['online', 'active'] },
          isActive: { $ne: false }
        }).sort({ lastActivity: -1 }).limit(5).lean();

        return userAgents.map(u => ({
          _id: u._id,
          userId: u._id,
          firstname: u.firstname,
          lastname: u.lastname,
          email: u.email,
          photo: u.photo,
          role: u.role,
          status: u.currentStatus || 'online',
          currentSessions: u.agentStats?.activeSessions || 0,
          priority: 10,
          isUserAgent: true
        }));
      }

      // Filter online/active only
      return agents.filter(a => ['online', 'active'].includes(a.status));
    } catch (error) {
      logWithIcon.error('Error getting agents by priority:', error);
      return [];
    }
  }

  // Simple scoring and selection helper
  async selectBestAgent(agents = [], userPreferences = {}) {
    try {
      if (!agents || agents.length === 0) return null;
      if (agents.length === 1) return agents[0];

      const scored = agents.map(agent => {
        let score = 0;
        score += (agent.priority || 1) * 5;
        const sessionLoad = agent.currentSessions || 0;
        score += Math.max(0, 30 - (sessionLoad * 6));
        if (userPreferences.category && agent.specializations) {
          const match = agent.specializations.some(spec => spec.toLowerCase().includes(userPreferences.category.toLowerCase()));
          if (match) score += 20;
        }
        if (agent.lastActivity) {
          const hours = (Date.now() - new Date(agent.lastActivity).getTime()) / (1000 * 60 * 60);
          if (hours < 1) score += 10;
          else if (hours < 4) score += 5;
        }
        if (agent.status === 'online') score += 10;
        if (agent.status === 'available') score += 15;
        return { ...agent, selectionScore: score };
      });

      scored.sort((a, b) => b.selectionScore - a.selectionScore);
      const winner = scored[0];
      logWithIcon.agent(`Selected agent ${winner.email || winner.userId} with score ${winner.selectionScore}`);
      return winner;
    } catch (error) {
      logWithIcon.error('Error selecting best agent:', error);
      return agents[0] || null;
    }
  }

  // Update workload on LiveAgent or fallback to User record
  async updateAgentWorkload(agentId, operation = 'increment') {
    try {
      const delta = operation === 'increment' ? 1 : -1;

      const liveAgent = await LiveAgent.findOneAndUpdate(
        { $or: [{ _id: agentId }, { userId: agentId }] },
        { $inc: { currentSessions: delta }, $set: { lastActivity: new Date() } },
        { new: true }
      );

      if (liveAgent) {
        logWithIcon.agent(`Updated LiveAgent workload for ${agentId}: ${operation}`);
        return liveAgent;
      }

      // Fallback to updating User stats
      const user = await User.findByIdAndUpdate(agentId, {
        $inc: { 'agentStats.activeSessions': delta },
        $set: { lastActivity: new Date() }
      }, { new: true });

      if (user) {
        logWithIcon.agent(`Updated User workload for ${agentId}: ${operation}`);
        return user;
      }

      return null;
    } catch (error) {
      logWithIcon.error('Error updating agent workload:', error);
      return null;
    }
  }

  // Assign agent to session (centralized)
  async assignAgentToSession(sessionId, agentId) {
    try {
      // assignAgentToSession should be idempotent if agent already assigned
      const session = await ChatSession.findById(sessionId);
      if (!session) throw new Error('Session not found');

      if (session.agentId) {
        logWithIcon.warning(`Session ${sessionId} already has agent ${session.agentId}`);
        return { success: false, error: 'Already assigned' };
      }

      session.agentId = agentId;
      session.sessionType = 'live_agent';
      session.status = 'active';
      session.assignedAt = new Date();
      await session.save();

      await this.updateAgentWorkload(agentId, 'increment');

      logWithIcon.success(`Agent ${agentId} assigned to session ${sessionId}`);
      return { success: true, sessionId, agentId, assignedAt: session.assignedAt };
    } catch (error) {
      logWithIcon.error('Error assigning agent to session:', error);
      return { success: false, error: error.message };
    }
  }

  async releaseAgentFromSession(sessionId, agentId) {
    try {
      const session = await ChatSession.findById(sessionId);
      if (session && session.agentId?.toString() === agentId.toString()) {
        session.sessionType = 'completed';
        session.status = 'closed';
        session.endedAt = new Date();
        await session.save();
        await this.updateAgentWorkload(agentId, 'decrement');
        logWithIcon.success(`Agent ${agentId} released from session ${sessionId}`);
        return { success: true };
      }
      return { success: false, error: 'Agent not assigned to this session' };
    } catch (error) {
      logWithIcon.error('Error releasing agent from session:', error);
      return { success: false, error: error.message };
    }
  }

  async getAgentStats(agentId) {
    try {
      const agent = await LiveAgent.findOne({ $or: [{ _id: agentId }, { userId: agentId }] }).populate('userId');
      if (!agent) {
        const user = await User.findById(agentId);
        return {
          agentId,
          name: user ? `${user.firstname} ${user.lastname}` : 'Unknown',
          currentSessions: 0,
          totalSessions: 0,
          status: user?.currentStatus || 'offline'
        };
      }

      const totalSessions = await ChatSession.countDocuments({
        agentId: agentId,
        sessionType: { $in: ['live_agent', 'completed'] }
      });

      return {
        agentId: agent._id,
        name: `${agent.userId?.firstname || agent.name} ${agent.userId?.lastname || ''}`.trim(),
        email: agent.userId?.email || agent.email,
        currentSessions: agent.currentSessions || 0,
        totalSessions,
        status: agent.status,
        specializations: agent.specializations || [],
        priority: agent.priority || 1
      };
    } catch (error) {
      logWithIcon.error('Error getting agent stats:', error);
      return null;
    }
  }
}

const agentAssignmentService = new AgentAssignmentService();

module.exports = {
  AgentAssignmentService,
  findAvailableAgent: agentAssignmentService.findAvailableAgent.bind(agentAssignmentService),
  getAgentsByPriority: agentAssignmentService.getAgentsByPriority.bind(agentAssignmentService),
  selectBestAgent: agentAssignmentService.selectBestAgent.bind(agentAssignmentService),
  assignAgentToSession: agentAssignmentService.assignAgentToSession.bind(agentAssignmentService),
  releaseAgentFromSession: agentAssignmentService.releaseAgentFromSession.bind(agentAssignmentService),
  updateAgentWorkload: agentAssignmentService.updateAgentWorkload.bind(agentAssignmentService),
  getAgentStats: agentAssignmentService.getAgentStats.bind(agentAssignmentService)
};
