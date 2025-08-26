//frontend/src/Pages/Admin/AdminChatList/AdminChatList.jsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom'; // Add this import
import { useAuth } from "../../../Context/AuthContext"; // Fixed path
import { useSocket } from "../../../Context/SocketContext"; // Fixed path
import API from "../../../helpers/API"; // Fixed path
import './AdminLiveChat.css';

const AdminChatList = () => {
  const navigate = useNavigate(); // Add navigation hook
  const { socket, isConnected } = useSocket();
  const [auth] = useAuth();
  const adminUser = auth?.user;

  // State
  const [sessions, setSessions] = useState([]);
  const [filteredSessions, setFilteredSessions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [stats, setStats] = useState({
    totalSessions: 0,
    activeSessions: 0,
    waitingSessions: 0
  });

  // Helper function to get profile image
  const getProfileImageSrc = useCallback((userPhoto, isGuest = false) => {
    if (isGuest || !userPhoto) {
      return "https://img.freepik.com/premium-vector/account-icon-user-icon-vector-graphics_292645-552.jpg?w=300";
    }
    const isUploadPath = typeof userPhoto === "string" && userPhoto.startsWith("/uploads/userAvatars/");
    return isUploadPath ? `${process.env.REACT_APP_API_URL}${userPhoto}` : userPhoto;
  }, []);

  // Format time
  const formatTime = useCallback((timestamp) => {
    const now = Date.now();
    const diff = now - new Date(timestamp).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  }, []);

  // Load chat sessions
  const loadSessions = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await API.get('/api/v1/admin/chat/sessions');
      
      if (response.data.success) {
        const { sessions: sessionData, totalSessions, activeSessions, waitingSessions } = response.data.data;
        setSessions(sessionData || []);
        setStats({
          totalSessions: totalSessions || 0,
          activeSessions: activeSessions || 0,
          waitingSessions: waitingSessions || 0
        });
      } else {
        setError('Failed to load chat sessions');
      }
    } catch (err) {
      console.error('Error loading sessions:', err);
      if (err.response?.status === 404) {
        setError('Chat feature not available. Please contact administrator.');
      } else if (err.response?.status === 401) {
        setError('Authentication failed. Please login again.');
        // Redirect to admin dashboard
        navigate('/Admin/Dashboard');
      } else {
        setError(err.response?.data?.message || 'Failed to load chat sessions');
      }
    } finally {
      setIsLoading(false);
    }
  }, [navigate]);

  // Admin permission check and initial load
  useEffect(() => {
    if (!adminUser || (adminUser.role !== 1 && adminUser.role !== 0)) {
      navigate('/Admin/Dashboard');
      return;
    }
    loadSessions();
  }, [adminUser, loadSessions, navigate]);

  // Filter and search sessions
  useEffect(() => {
    let filtered = sessions;

    if (filter !== 'all') {
      filtered = filtered.filter(session => session.status === filter);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(session => 
        session.userInfo?.firstName?.toLowerCase().includes(query) ||
        session.userInfo?.lastName?.toLowerCase().includes(query) ||
        session.userInfo?.email?.toLowerCase().includes(query) ||
        session.lastMessage?.message?.toLowerCase().includes(query)
      );
    }

    setFilteredSessions(filtered);
  }, [sessions, filter, searchQuery]);

  // Socket event handlers
  useEffect(() => {
    if (!socket) return;

    const handleNewSession = (sessionData) => {
      setSessions(prev => [sessionData, ...prev]);
      setStats(prev => ({
        ...prev,
        totalSessions: prev.totalSessions + 1,
        waitingSessions: prev.waitingSessions + 1
      }));
    };

    const handleSessionUpdate = (updatedSession) => {
      setSessions(prev => 
        prev.map(session => 
          session._id === updatedSession._id ? updatedSession : session
        )
      );
    };

    const handleNewMessage = (message) => {
      setSessions(prev => 
        prev.map(session => {
          if (session._id === message.sessionId) {
            return {
              ...session,
              lastMessage: message,
              unreadCount: session.unreadCount + (message.senderType === 'user' ? 1 : 0)
            };
          }
          return session;
        })
      );
    };

    socket.on('admin:new_session', handleNewSession);
    socket.on('admin:session_updated', handleSessionUpdate);
    socket.on('message:new', handleNewMessage);

    return () => {
      socket.off('admin:new_session', handleNewSession);
      socket.off('admin:session_updated', handleSessionUpdate);
      socket.off('message:new', handleNewMessage);
    };
  }, [socket]);

  // Handle session assignment
  const assignSession = useCallback(async (sessionId) => {
    try {
      const response = await API.post(`/api/v1/admin/chat/assign/${sessionId}`, {
        adminId: adminUser._id
      });

      if (response.data.success) {
        setSessions(prev => 
          prev.map(session => 
            session._id === sessionId 
              ? { ...session, status: 'active', agent: adminUser }
              : session
          )
        );
        // Use navigate instead of window.open for better routing
        navigate(`/admin/chat/session/${sessionId}`);
      }
    } catch (error) {
      console.error('Error assigning session:', error);
      setError('Failed to assign session');
    }
  }, [adminUser, navigate]);

  // Handle navigation to chat session
  const navigateToChat = useCallback((sessionId) => {
    navigate(`/admin/chat/session/${sessionId}`);
  }, [navigate]);

  // Get status badge class
  const getStatusClass = useCallback((status) => {
    switch (status) {
      case 'active':
        return 'status-active';
      case 'waiting':
        return 'status-waiting';
      case 'ended':
        return 'status-ended';
      default:
        return 'status-default';
    }
  }, []);

  // Get status indicator class
  const getIndicatorClass = useCallback((status) => {
    switch (status) {
      case 'active':
        return 'indicator-active';
      case 'waiting':
        return 'indicator-waiting';
      case 'ended':
        return 'indicator-ended';
      default:
        return 'indicator-default';
    }
  }, []);

  // Filter options
  const filterOptions = [
    { value: 'all', label: 'All Sessions', count: stats.totalSessions },
    { value: 'waiting', label: 'Waiting', count: stats.waitingSessions },
    { value: 'active', label: 'Active', count: stats.activeSessions },
    { value: 'ended', label: 'Ended', count: stats.totalSessions - stats.activeSessions - stats.waitingSessions }
  ];

  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p className="loading-text">Loading chat sessions...</p>
      </div>
    );
  }

  return (
    <div className="admin-chat-list-container">
      {/* Header */}
      <div className="header-container">
        <div className="header-top">
          <h1 className="header-title">
            Live Chat Management
          </h1>
          
          <button onClick={loadSessions} className="refresh-button">
            <i className="fas fa-sync-alt"></i> Refresh
          </button>
        </div>

        {/* Stats Cards */}
        <div className="stats-grid">
          {[
            { 
              label: 'Total Sessions', 
              value: stats.totalSessions, 
              colorClass: 'stats-total', 
              icon: 'fas fa-comments' 
            },
            { 
              label: 'Active Chats', 
              value: stats.activeSessions, 
              colorClass: 'stats-active', 
              icon: 'fas fa-circle' 
            },
            { 
              label: 'Waiting for Agent', 
              value: stats.waitingSessions, 
              colorClass: 'stats-waiting', 
              icon: 'fas fa-clock' 
            },
            { 
              label: 'Connection Status', 
              value: isConnected ? 'Online' : 'Offline', 
              colorClass: isConnected ? 'stats-online' : 'stats-offline', 
              icon: isConnected ? 'fas fa-wifi' : 'fas fa-wifi-slash' 
            }
          ].map((stat, index) => (
            <div key={index} className="stats-card">
              <div className={`stats-icon ${stat.colorClass}`}>
                <i className={stat.icon}></i>
              </div>
              <div className={`stats-value ${stat.colorClass}`}>
                {stat.value}
              </div>
              <div className="stats-label">
                {stat.label}
              </div>
            </div>
          ))}
        </div>

        {/* Filters and Search */}
        <div className="filters-container">
          <div className="filter-buttons">
            {filterOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => setFilter(option.value)}
                className={`filter-button ${filter === option.value ? 'active' : ''}`}
              >
                {option.label} ({option.count})
              </button>
            ))}
          </div>
          
          <input
            type="text"
            placeholder="Search sessions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
        </div>
      </div>

      {/* Sessions List */}
      <div className="sessions-content">
        {error && (
          <div className="error-message">
            <i className="fas fa-exclamation-triangle error-icon"></i>
            {error}
          </div>
        )}

        {filteredSessions.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">
              <i className="fas fa-comments"></i>
            </div>
            <h3 className="empty-title">
              No chat sessions found
            </h3>
            <p className="empty-description">
              {searchQuery ? 'Try adjusting your search terms' : 'Chat sessions will appear here when users start conversations'}
            </p>
          </div>
        ) : (
          <div className="sessions-grid">
            {filteredSessions.map((session) => (
              <div
                key={session._id}
                className="session-card"
                onClick={() => navigateToChat(session._id)}
              >
                <div className="session-content">
                  <div className="user-avatar-container">
                    <img
                      src={getProfileImageSrc(session.userInfo?.photo, !session.userInfo?.userId)}
                      alt="User"
                      className="user-avatar"
                    />
                    <div className={`status-indicator ${getIndicatorClass(session.status)}`} />
                  </div>
                  
                  <div className="session-details">
                    <div className="session-header">
                      <div className="user-info">
                        <h3>
                          {session.userInfo?.firstName || 'Guest User'} {session.userInfo?.lastName || ''}
                        </h3>
                        <p>
                          {session.userInfo?.email || 'No email provided'}
                        </p>
                      </div>
                      
                      <div className="session-meta">
                        {session.unreadCount > 0 && (
                          <span className="unread-count">
                            {session.unreadCount}
                          </span>
                        )}
                        
                        <span className={`status-badge ${getStatusClass(session.status)}`}>
                          {session.status}
                        </span>
                        
                        <span className="timestamp">
                          {formatTime(session.lastMessage?.timestamp || session.createdAt)}
                        </span>
                      </div>
                    </div>
                    
                    <div className="last-message">
                      <p>
                        <strong>
                          {session.lastMessage?.senderType === 'user' ? 'User: ' : 'Agent: '}
                        </strong>
                        {session.lastMessage?.message || 'No messages yet'}
                      </p>
                    </div>
                    
                    <div className="session-footer">
                      <div className="session-info">
                        <span>
                          <i className="fas fa-calendar-alt"></i>
                          {new Date(session.createdAt).toLocaleDateString()}
                        </span>
                        {session.agent && (
                          <span>
                            <i className="fas fa-user"></i>
                            {session.agent.firstname} {session.agent.lastname}
                          </span>
                        )}
                      </div>
                      
                      <div className="session-actions">
                        {session.status === 'waiting' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              assignSession(session._id);
                            }}
                            className="action-button take-session-button"
                          >
                            <i className="fas fa-hand-paper"></i> Take Session
                          </button>
                        )}
                        
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigateToChat(session._id);
                          }}
                          className="action-button open-chat-button"
                        >
                          <i className="fas fa-comments"></i> Open Chat
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminChatList;
