//frontend/src/services/adminChatApi.js
import API from '../helpers/API';
export const adminChatAPI = {
  // Get all chat sessions
  getSessions: async (params = {}) => {
    try {
      const response = await API.get('/api/v1/admin/chat/sessions', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching sessions:', error);
      throw new Error(
        error.response?.data?.message || 
        error.message || 
        'Failed to fetch chat sessions'
      );
    }
  },

  // Get specific session with messages
  getSession: async (sessionId, params = {}) => {
    try {
      if (!sessionId) {
        throw new Error('Session ID is required');
      }
      
      const response = await API.get(`/api/v1/admin/chat/session/${sessionId}`, { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching session:', error);
      throw new Error(
        error.response?.data?.message || 
        error.message || 
        'Failed to fetch chat session'
      );
    }
  },

  // Assign session to admin
  assignSession: async (sessionId, adminId = null) => {
    try {
      if (!sessionId) {
        throw new Error('Session ID is required');
      }
      
      // The adminId will be taken from the authenticated user in the backend
      const response = await API.post(`/api/v1/admin/chat/assign/${sessionId}`, { 
        adminId 
      });
      return response.data;
    } catch (error) {
      console.error('Error assigning session:', error);
      throw new Error(
        error.response?.data?.message || 
        error.message || 
        'Failed to assign session'
      );
    }
  },

  // End session
  endSession: async (sessionId, reason = 'ended_by_agent') => {
    try {
      if (!sessionId) {
        throw new Error('Session ID is required');
      }
      
      const response = await API.post(`/api/v1/admin/chat/end/${sessionId}`, { 
        reason 
      });
      return response.data;
    } catch (error) {
      console.error('Error ending session:', error);
      throw new Error(
        error.response?.data?.message || 
        error.message || 
        'Failed to end session'
      );
    }
  },

  // Get chat statistics
  getStats: async (period = '24h') => {
    try {
      const response = await API.get('/api/v1/admin/chat/stats', { 
        params: { period } 
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching stats:', error);
      throw new Error(
        error.response?.data?.message || 
        error.message || 
        'Failed to fetch chat statistics'
      );
    }
  },

  // Send message in chat session
  sendMessage: async (sessionId, messageData) => {
    try {
      if (!sessionId) {
        throw new Error('Session ID is required');
      }
      
      if (!messageData || !messageData.message) {
        throw new Error('Message data is required');
      }
      
      const response = await API.post(`/api/v1/admin/chat/session/${sessionId}/message`, messageData);
      return response.data;
    } catch (error) {
      console.error('Error sending message:', error);
      throw new Error(
        error.response?.data?.message || 
        error.message || 
        'Failed to send message'
      );
    }
  },

  // Mark messages as read
  markMessagesAsRead: async (sessionId, messageIds = []) => {
    try {
      if (!sessionId) {
        throw new Error('Session ID is required');
      }
      
      const response = await API.post(`/api/v1/admin/chat/session/${sessionId}/read`, { 
        messageIds 
      });
      return response.data;
    } catch (error) {
      console.error('Error marking messages as read:', error);
      throw new Error(
        error.response?.data?.message || 
        error.message || 
        'Failed to mark messages as read'
      );
    }
  },

  // Transfer session to another agent
  transferSession: async (sessionId, targetAgentId, reason = 'agent_transfer') => {
    try {
      if (!sessionId || !targetAgentId) {
        throw new Error('Session ID and target agent ID are required');
      }
      
      const response = await API.post(`/api/v1/admin/chat/transfer/${sessionId}`, { 
        targetAgentId,
        reason 
      });
      return response.data;
    } catch (error) {
      console.error('Error transferring session:', error);
      throw new Error(
        error.response?.data?.message || 
        error.message || 
        'Failed to transfer session'
      );
    }
  }
};

export default adminChatAPI;
