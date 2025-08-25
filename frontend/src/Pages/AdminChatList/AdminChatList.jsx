//frontend/src/Pages/Admin/AdminChatList/AdminChatList.jsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from "../../Context/AuthContext";
import { useSocket } from "../../Context/SocketContext";
import API from "../../helpers/API";
import './AdminLiveChat.css';

const AdminChatList = () => {
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
      setError(err.response?.data?.message || 'Failed to load chat sessions');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Filter and search sessions
  useEffect(() => {
    let filtered = sessions;

    // Apply status filter
    if (filter !== 'all') {
      filtered = filtered.filter(session => session.status === filter);
    }

    // Apply search filter
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

  // Load sessions on mount
  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  // Handle session assignment
  const assignSession = useCallback(async (sessionId) => {
    try {
      const response = await API.post(`/api/v1/admin/chat/assign/${sessionId}`, {
        adminId: adminUser._id
      });

      if (response.data.success) {
        // Update session status locally
        setSessions(prev => 
          prev.map(session => 
            session._id === sessionId 
              ? { ...session, status: 'active', agent: adminUser }
              : session
          )
        );

        // Navigate to chat session
        window.open(`/admin/chat/session/${sessionId}`, '_blank');
      }
    } catch (error) {
      console.error('Error assigning session:', error);
      setError('Failed to assign session');
    }
  }, [adminUser]);

  // Get status badge color
  const getStatusColor = useCallback((status) => {
    switch (status) {
      case 'active':
        return '#4caf50';
      case 'waiting':
        return '#ff9800';
      case 'ended':
        return '#9e9e9e';
      default:
        return '#6c757d';
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
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center', 
        height: '100vh',
        fontFamily: 'system-ui, -apple-system, sans-serif'
      }}>
        <div style={{ 
          width: '40px', 
          height: '40px', 
          border: '4px solid #f3f3f3', 
          borderTop: '4px solid #007bff', 
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          marginBottom: '20px'
        }}></div>
        <p style={{ color: '#666', fontSize: '16px' }}>Loading chat sessions...</p>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      {/* Header */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(20px)',
        padding: '24px',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '24px'
        }}>
          <h1 style={{
            margin: 0,
            fontSize: '28px',
            fontWeight: '700',
            color: '#2d3748',
            background: 'linear-gradient(135deg, #667eea, #764ba2)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            Live Chat Management
          </h1>
          
          <button
            onClick={loadSessions}
            style={{
              padding: '12px 20px',
              background: 'linear-gradient(135deg, #667eea, #764ba2)',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.3s ease'
            }}
          >
            🔄 Refresh
          </button>
        </div>

        {/* Stats Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px',
          marginBottom: '24px'
        }}>
          {[
            { label: 'Total Sessions', value: stats.totalSessions, color: '#667eea', icon: '💬' },
            { label: 'Active Chats', value: stats.activeSessions, color: '#4caf50', icon: '🟢' },
            { label: 'Waiting for Agent', value: stats.waitingSessions, color: '#ff9800', icon: '⏳' },
            { label: 'Connection Status', value: isConnected ? 'Online' : 'Offline', color: isConnected ? '#4caf50' : '#f44336', icon: isConnected ? '📶' : '📵' }
          ].map((stat, index) => (
            <div key={index} style={{
              background: 'rgba(255, 255, 255, 0.7)',
              backdropFilter: 'blur(10px)',
              padding: '20px',
              borderRadius: '16px',
              textAlign: 'center',
              boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.3)'
            }}>
              <div style={{ fontSize: '24px', marginBottom: '8px' }}>{stat.icon}</div>
              <div style={{ fontSize: '24px', fontWeight: '700', color: stat.color, marginBottom: '4px' }}>
                {stat.value}
              </div>
              <div style={{ fontSize: '14px', color: '#718096', fontWeight: '500' }}>
                {stat.label}
              </div>
            </div>
          ))}
        </div>

        {/* Filters and Search */}
        <div style={{
          display: 'flex',
          gap: '16px',
          alignItems: 'center',
          flexWrap: 'wrap'
        }}>
          <div style={{
            display: 'flex',
            gap: '8px',
            background: 'rgba(255, 255, 255, 0.7)',
            padding: '6px',
            borderRadius: '12px',
            backdropFilter: 'blur(10px)'
          }}>
            {filterOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => setFilter(option.value)}
                style={{
                  padding: '8px 16px',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500',
                  transition: 'all 0.2s ease',
                  background: filter === option.value 
                    ? 'linear-gradient(135deg, #667eea, #764ba2)' 
                    : 'transparent',
                  color: filter === option.value ? 'white' : '#4a5568'
                }}
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
            style={{
              flex: 1,
              minWidth: '200px',
              padding: '12px 16px',
              border: '2px solid rgba(255, 255, 255, 0.3)',
              borderRadius: '12px',
              fontSize: '14px',
              background: 'rgba(255, 255, 255, 0.7)',
              backdropFilter: 'blur(10px)',
              outline: 'none',
              transition: 'all 0.3s ease'
            }}
            onFocus={(e) => e.target.style.borderColor = '#667eea'}
            onBlur={(e) => e.target.style.borderColor = 'rgba(255, 255, 255, 0.3)'}
          />
        </div>
      </div>

      {/* Sessions List */}
      <div style={{ padding: '24px' }}>
        {error && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '12px',
            padding: '16px',
            marginBottom: '24px',
            color: '#dc2626',
            textAlign: 'center'
          }}>
            ⚠️ {error}
          </div>
        )}

        {filteredSessions.length === 0 ? (
          <div style={{
            background: 'rgba(255, 255, 255, 0.7)',
            backdropFilter: 'blur(20px)',
            borderRadius: '16px',
            padding: '60px 24px',
            textAlign: 'center',
            boxShadow: '0 8px 30px rgba(0, 0, 0, 0.1)'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>💬</div>
            <h3 style={{ color: '#4a5568', marginBottom: '8px', fontSize: '20px' }}>
              No chat sessions found
            </h3>
            <p style={{ color: '#718096', margin: 0, fontSize: '16px' }}>
              {searchQuery ? 'Try adjusting your search terms' : 'Chat sessions will appear here when users start conversations'}
            </p>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gap: '16px'
          }}>
            {filteredSessions.map((session) => (
              <div
                key={session._id}
                style={{
                  background: 'rgba(255, 255, 255, 0.9)',
                  backdropFilter: 'blur(20px)',
                  borderRadius: '16px',
                  padding: '20px',
                  boxShadow: '0 8px 30px rgba(0, 0, 0, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  transition: 'all 0.3s ease',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 12px 40px rgba(0, 0, 0, 0.15)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 8px 30px rgba(0, 0, 0, 0.1)';
                }}
                onClick={() => window.open(`/admin/chat/session/${session._id}`, '_blank')}
              >
                <div style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '16px'
                }}>
                  <div style={{ position: 'relative' }}>
                    <img
                      src={getProfileImageSrc(session.userInfo?.photo, !session.userInfo?.userId)}
                      alt="User"
                      style={{
                        width: '56px',
                        height: '56px',
                        borderRadius: '50%',
                        objectFit: 'cover',
                        border: '3px solid rgba(255, 255, 255, 0.5)'
                      }}
                    />
                    <div style={{
                      position: 'absolute',
                      bottom: '2px',
                      right: '2px',
                      width: '16px',
                      height: '16px',
                      borderRadius: '50%',
                      background: getStatusColor(session.status),
                      border: '2px solid white'
                    }} />
                  </div>
                  
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      justifyContent: 'space-between',
                      marginBottom: '8px'
                    }}>
                      <div>
                        <h3 style={{
                          margin: 0,
                          fontSize: '18px',
                          fontWeight: '600',
                          color: '#2d3748',
                          marginBottom: '4px'
                        }}>
                          {session.userInfo?.firstName || 'Guest User'} {session.userInfo?.lastName || ''}
                        </h3>
                        <p style={{
                          margin: 0,
                          fontSize: '14px',
                          color: '#718096'
                        }}>
                          {session.userInfo?.email || 'No email provided'}
                        </p>
                      </div>
                      
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px'
                      }}>
                        {session.unreadCount > 0 && (
                          <span style={{
                            background: '#ef4444',
                            color: 'white',
                            fontSize: '12px',
                            fontWeight: '600',
                            padding: '4px 8px',
                            borderRadius: '12px',
                            minWidth: '20px',
                            textAlign: 'center'
                          }}>
                            {session.unreadCount}
                          </span>
                        )}
                        
                        <span style={{
                          background: `${getStatusColor(session.status)}20`,
                          color: getStatusColor(session.status),
                          fontSize: '12px',
                          fontWeight: '600',
                          padding: '6px 12px',
                          borderRadius: '20px',
                          textTransform: 'capitalize'
                        }}>
                          {session.status}
                        </span>
                        
                        <span style={{
                          fontSize: '12px',
                          color: '#a0aec0',
                          fontWeight: '500'
                        }}>
                          {formatTime(session.lastMessage?.timestamp || session.createdAt)}
                        </span>
                      </div>
                    </div>
                    
                    <div style={{
                      marginBottom: '12px'
                    }}>
                      <p style={{
                        margin: 0,
                        fontSize: '14px',
                        color: '#4a5568',
                        lineHeight: '1.5',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        <strong>
                          {session.lastMessage?.senderType === 'user' ? 'User: ' : 'Agent: '}
                        </strong>
                        {session.lastMessage?.message || 'No messages yet'}
                      </p>
                    </div>
                    
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        fontSize: '12px',
                        color: '#718096'
                      }}>
                        <span>📅 {new Date(session.createdAt).toLocaleDateString()}</span>
                        {session.agent && (
                          <span>👤 {session.agent.firstname} {session.agent.lastname}</span>
                        )}
                      </div>
                      
                      <div style={{
                        display: 'flex',
                        gap: '8px'
                      }}>
                        {session.status === 'waiting' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              assignSession(session._id);
                            }}
                            style={{
                              padding: '8px 16px',
                              background: 'linear-gradient(135deg, #10b981, #059669)',
                              color: 'white',
                              border: 'none',
                              borderRadius: '8px',
                              cursor: 'pointer',
                              fontSize: '12px',
                              fontWeight: '600',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              transition: 'all 0.2s ease'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.transform = 'translateY(-1px)';
                              e.currentTarget.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.4)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.transform = 'translateY(0)';
                              e.currentTarget.style.boxShadow = 'none';
                            }}
                          >
                            ✋ Take Session
                          </button>
                        )}
                        
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            window.open(`/admin/chat/session/${session._id}`, '_blank');
                          }}
                          style={{
                            padding: '8px 16px',
                            background: 'linear-gradient(135deg, #667eea, #764ba2)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontSize: '12px',
                            fontWeight: '600',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            transition: 'all 0.2s ease'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateY(-1px)';
                            e.currentTarget.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.4)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = 'none';
                          }}
                        >
                          💬 Open Chat
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

      {/* CSS Animations */}
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        /* Responsive Design */
        @media (max-width: 768px) {
          .stats-grid {
            grid-template-columns: repeat(2, 1fr) !important;
          }
          
          .filters-container {
            flex-direction: column !important;
            align-items: stretch !important;
          }
          
          .session-card {
            padding: 16px !important;
          }
          
          .session-header {
            flex-direction: column !important;
            align-items: flex-start !important;
            gap: 8px !important;
          }
          
          .session-actions {
            justify-content: flex-start !important;
            flex-wrap: wrap !important;
          }
        }
        
        @media (max-width: 480px) {
          .stats-grid {
            grid-template-columns: 1fr !important;
          }
          
          .user-avatar {
            width: 48px !important;
            height: 48px !important;
          }
          
          .session-meta {
            flex-direction: column !important;
            align-items: flex-start !important;
            gap: 4px !important;
          }
        }
        
        /* Scrollbar styling */
        ::-webkit-scrollbar {
          width: 8px;
        }
        
        ::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 4px;
        }
        
        ::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.3);
          border-radius: 4px;
        }
        
        ::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.5);
        }
        
        /* Focus indicators for accessibility */
        button:focus {
          outline: 2px solid #667eea;
          outline-offset: 2px;
        }
        
        input:focus {
          outline: none;
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.3);
        }
      `}</style>
    </div>
  );
};

export default AdminChatList;
