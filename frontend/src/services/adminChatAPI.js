//frontend/src/services/adminChatAPI.js
import API from '../helpers/API';


export const adminChatAPI = {
  // Get all chat sessions
  getSessions: async (params = {}) => {
    const response = await API.get('/api/v1/admin/chat/sessions', { params });
    return response.data;
  },

  // Get specific session with messages
  getSession: async (sessionId, params = {}) => {
    const response = await API.get(`/api/v1/admin/chat/session/${sessionId}`, { params });
    return response.data;
  },

  // Assign session to admin
  assignSession: async (sessionId, adminId) => {
    const response = await API.post(`/api/v1/admin/chat/assign/${sessionId}`, { adminId });
    return response.data;
  },

  // End session
  endSession: async (sessionId, adminId, reason) => {
    const response = await API.post(`/api/v1/admin/chat/end/${sessionId}`, { 
      adminId, 
      reason 
    });
    return response.data;
  },

  // Get chat statistics
  getStats: async (period = '24h') => {
    const response = await API.get('/api/v1/admin/chat/stats', { 
      params: { period } 
    });
    return response.data;
  }
};

export default adminChatAPI;
