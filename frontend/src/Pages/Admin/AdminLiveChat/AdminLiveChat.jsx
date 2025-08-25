//frontend/src/Pages/AdminLiveChat/AdminLiveChat.jsx
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useSocket } from '../../../Context/SocketContext';
import { useAuth } from '../../../Context/AuthContext';
import API from '../../../helpers/API';

// API service for admin chat
const adminChatAPI = {
  getSession: async (sessionId) => {
    const response = await API.get(`/api/v1/admin/chat/session/${sessionId}`);
    return response.data;
  },
  endSession: async (sessionId, adminId, reason) => {
    const response = await API.post(`/api/v1/admin/chat/end/${sessionId}`, {
      adminId,
      reason
    });
    return response.data;
  }
};

const AdminLiveChat = () => {
  const { sessionId } = useParams();
  const { socket, isConnected } = useSocket();
  const [auth] = useAuth();
  const adminUser = auth?.user;

  // Chat State
  const [session, setSession] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [userTyping, setUserTyping] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('connecting');
  const [sessionActive, setSessionActive] = useState(false);
  const [userInfo, setUserInfo] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Refs
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const inputRef = useRef(null);

  // Helper function to get profile image
  const getProfileImageSrc = useCallback((userPhoto, isGuest = false) => {
    if (isGuest || !userPhoto) {
      return "https://img.freepik.com/premium-vector/account-icon-user-icon-vector-graphics_292645-552.jpg?w=300";
    }
    const isUploadPath = typeof userPhoto === "string" && userPhoto.startsWith("/uploads/userAvatars/");
    return isUploadPath ? `${process.env.REACT_APP_API_URL}${userPhoto}` : userPhoto;
  }, []);

  // Format timestamp
  const formatTime = useCallback((timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }, []);

  // Load session data
  const loadSession = useCallback(async () => {
    if (!sessionId || !adminUser) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await adminChatAPI.getSession(sessionId);
      
      if (response.success) {
        const { session: sessionData, messages: sessionMessages, userInfo: userData } = response.data;
        
        setSession(sessionData);
        setMessages(sessionMessages || []);
        setUserInfo(userData);
        setSessionActive(sessionData?.status === 'active');
        setConnectionStatus('connected');
        
        // Join the session room
        if (socket?.connected) {
          socket.emit('admin:join_session', { 
            sessionId: sessionData._id,
            adminId: adminUser._id 
          });
        }
      } else {
        setError('Failed to load chat session');
      }
    } catch (err) {
      console.error('Error loading session:', err);
      setError(err.response?.data?.message || 'Failed to load chat session');
    } finally {
      setIsLoading(false);
    }
  }, [sessionId, adminUser, socket]);

  // Socket event handlers
  useEffect(() => {
    if (!socket || !sessionId) return;

    const handleNewMessage = (message) => {
      if (message.sessionId === sessionId) {
        setMessages(prev => {
          const messageExists = prev.some(m => m._id === message._id);
          if (messageExists) return prev;
          return [...prev, message];
        });
      }
    };

    const handleUserTyping = (data) => {
      if (data.sessionId === sessionId && data.userType === 'user') {
        setUserTyping(data.isTyping);
      }
    };

    const handleSessionEnd = (data) => {
      if (data.sessionId === sessionId) {
        setSessionActive(false);
        setConnectionStatus('ended');
      }
    };

    // Socket event listeners
    socket.on('message:new', handleNewMessage);
    socket.on('user:typing', handleUserTyping);
    socket.on('session:ended', handleSessionEnd);

    return () => {
      socket.off('message:new', handleNewMessage);
      socket.off('user:typing', handleUserTyping);
      socket.off('session:ended', handleSessionEnd);
    };
  }, [socket, sessionId]);

  // Handle typing indicator
  const handleTyping = useCallback(() => {
    if (!socket || !sessionId) return;

    setIsTyping(true);
    socket.emit('admin:typing', { 
      sessionId, 
      adminId: adminUser._id, 
      isTyping: true 
    });

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      socket.emit('admin:typing', { 
        sessionId, 
        adminId: adminUser._id, 
        isTyping: false 
      });
    }, 1000);
  }, [socket, sessionId, adminUser]);

  // Send message
  const sendMessage = useCallback(async () => {
    if (!input.trim() || !socket || !sessionId) return;

    const messageText = input.trim();
    const tempMessage = {
      _id: `temp_${Date.now()}`,
      sessionId,
      message: messageText,
      senderType: 'agent',
      senderId: adminUser._id,
      senderName: `${adminUser.firstname} ${adminUser.lastname}`,
      timestamp: new Date(),
      status: 'sending'
    };

    // Add message optimistically
    setMessages(prev => [...prev, tempMessage]);
    setInput('');

    // Stop typing indicator
    setIsTyping(false);
    socket.emit('admin:typing', { 
      sessionId, 
      adminId: adminUser._id, 
      isTyping: false 
    });

    try {
      // Send via socket
      socket.emit('admin:send_message', {
        sessionId,
        message: messageText,
        adminId: adminUser._id,
        messageType: 'text'
      });

      // Focus back to input
      inputRef.current?.focus();
    } catch (error) {
      console.error('Error sending message:', error);
      // Remove the temporary message on error
      setMessages(prev => prev.filter(m => m._id !== tempMessage._id));
    }
  }, [input, socket, sessionId, adminUser]);

  // Handle input change
  const handleInputChange = useCallback((e) => {
    setInput(e.target.value);
    handleTyping();
  }, [handleTyping]);

  // Handle key press
  const handleKeyPress = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }, [sendMessage]);

  // End session
  const endSession = useCallback(async () => {
    if (!sessionId || !socket) return;

    try {
      // Send socket event
      socket.emit('admin:end_session', { 
        sessionId, 
        adminId: adminUser._id 
      });
      
      // Also call API endpoint
      await adminChatAPI.endSession(sessionId, adminUser._id, 'ended_by_agent');
      
      setSessionActive(false);
      setConnectionStatus('ended');
    } catch (error) {
      console.error('Error ending session:', error);
    }
  }, [sessionId, socket, adminUser]);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Load session on mount
  useEffect(() => {
    loadSession();
  }, [loadSession]);

  // Connection status indicator
  const connectionStatusConfig = useMemo(() => {
    switch (connectionStatus) {
      case 'connecting':
        return { icon: '🔄', text: 'Connecting...', color: '#ffa500' };
      case 'connected':
        return { icon: '🟢', text: 'Connected', color: '#4caf50' };
      case 'ended':
        return { icon: '🔴', text: 'Session Ended', color: '#f44336' };
      default:
        return { icon: '⚪', text: 'Unknown', color: '#9e9e9e' };
    }
  }, [connectionStatus]);

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
        <p style={{ color: '#666', fontSize: '16px' }}>Loading chat session...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        color: '#333'
      }}>
        <div style={{ fontSize: '48px', marginBottom: '20px' }}>⚠️</div>
        <h3 style={{ marginBottom: '10px', color: '#d32f2f' }}>Failed to Load Chat Session</h3>
        <p style={{ color: '#666', marginBottom: '20px' }}>{error}</p>
        <button 
          onClick={() => window.history.back()}
          style={{
            padding: '10px 20px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer'
          }}
        >
          Back to Chat List
        </button>
      </div>
    );
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      backgroundColor: '#f8f9fa'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '16px 24px',
        backgroundColor: 'white',
        borderBottom: '1px solid #e9ecef',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button 
            onClick={() => window.history.back()}
            style={{
              padding: '8px',
              backgroundColor: 'transparent',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '16px',
              color: '#6c757d'
            }}
          >
            ←
          </button>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <img 
              src={getProfileImageSrc(userInfo?.photo, !userInfo?.userId)}
              alt="User"
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                objectFit: 'cover'
              }}
            />
            <div>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: '#212529' }}>
                {userInfo?.firstName || userInfo?.firstname || 'Guest User'} {userInfo?.lastName || userInfo?.lastname || ''}
              </h3>
              <p style={{ margin: 0, fontSize: '14px', color: '#6c757d' }}>
                {userInfo?.email || 'No email provided'}
              </p>
            </div>
          </div>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px',
            padding: '6px 12px',
            backgroundColor: '#f8f9fa',
            borderRadius: '20px',
            fontSize: '14px'
          }}>
            <span style={{ fontSize: '12px' }}>{connectionStatusConfig.icon}</span>
            <span style={{ color: connectionStatusConfig.color, fontWeight: '500' }}>
              {connectionStatusConfig.text}
            </span>
          </div>
          
          {sessionActive && (
            <button 
              onClick={endSession}
              style={{
                padding: '8px 16px',
                backgroundColor: '#dc3545',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500'
              }}
            >
              📞 End Session
            </button>
          )}
        </div>
      </div>

      {/* Messages Area */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px'
      }}>
        {messages.length === 0 ? (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            color: '#6c757d'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>💬</div>
            <p style={{ fontSize: '16px', margin: 0 }}>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((message, index) => (
            <div 
              key={message._id || index}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12px',
                marginBottom: '16px',
                flexDirection: message.senderType === 'agent' ? 'row-reverse' : 'row'
              }}
            >
              <img 
                src={message.senderType === 'agent' 
                  ? getProfileImageSrc(adminUser?.photo)
                  : getProfileImageSrc(userInfo?.photo, !userInfo?.userId)
                }
                alt={message.senderType === 'agent' ? 'Admin' : 'User'}
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  objectFit: 'cover',
                  flexShrink: 0
                }}
              />
              <div style={{
                maxWidth: '70%',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '12px',
                  color: '#6c757d',
                  justifyContent: message.senderType === 'agent' ? 'flex-end' : 'flex-start'
                }}>
                  <span style={{ fontWeight: '500' }}>
                    {message.senderType === 'agent' 
                      ? message.senderName || `${adminUser.firstname} ${adminUser.lastname}`
                      : `${userInfo?.firstName || userInfo?.firstname || 'User'}`
                    }
                  </span>
                  <span>{formatTime(message.timestamp || message.createdAt)}</span>
                  {message.status === 'sending' && (
                    <span style={{ color: '#ffc107' }}>⏳</span>
                  )}
                </div>
                <div style={{
                  padding: '12px 16px',
                  borderRadius: '18px',
                  backgroundColor: message.senderType === 'agent' ? '#007bff' : '#f8f9fa',
                  color: message.senderType === 'agent' ? 'white' : '#212529',
                  fontSize: '14px',
                  lineHeight: '1.4',
                  wordWrap: 'break-word'
                }}>
                  {message.message}
                </div>
              </div>
            </div>
          ))
        )}
        
        {/* Typing Indicator */}
        {userTyping && (
          <div style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '12px',
            marginBottom: '16px'
          }}>
            <img 
              src={getProfileImageSrc(userInfo?.photo, !userInfo?.userId)}
              alt="User"
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                objectFit: 'cover'
              }}
            />
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '4px'
            }}>
              <span style={{
                fontSize: '12px',
                color: '#6c757d',
                fontStyle: 'italic'
              }}>
                {userInfo?.firstName || 'User'} is typing...
              </span>
              <div style={{
                padding: '12px 16px',
                borderRadius: '18px',
                backgroundColor: '#f8f9fa',
                display: 'flex',
                gap: '4px',
                alignItems: 'center'
              }}>
                <div style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: '#6c757d',
                  animation: 'bounce 1.4s ease-in-out infinite both'
                }}></div>
                <div style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: '#6c757d',
                  animation: 'bounce 1.4s ease-in-out 0.16s infinite both'
                }}></div>
                <div style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: '#6c757d',
                  animation: 'bounce 1.4s ease-in-out 0.32s infinite both'
                }}></div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div style={{
        padding: '16px 24px',
        backgroundColor: 'white',
        borderTop: '1px solid #e9ecef'
      }}>
        {sessionActive ? (
          <>
            <div style={{
              display: 'flex',
              alignItems: 'flex-end',
              gap: '12px',
              marginBottom: '8px'
            }}>
              <div style={{ flex: 1, position: 'relative' }}>
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={handleInputChange}
                  onKeyPress={handleKeyPress}
                  placeholder="Type your message..."
                  style={{
                    width: '100%',
                    minHeight: '44px',
                    maxHeight: '120px',
                    padding: '12px 16px',
                    border: '2px solid #e9ecef',
                    borderRadius: '22px',
                    fontSize: '14px',
                    fontFamily: 'inherit',
                    resize: 'none',
                    outline: 'none',
                    transition: 'border-color 0.2s ease',
                    backgroundColor: isConnected ? 'white' : '#f8f9fa'
                  }}
                  rows={1}
                  disabled={!isConnected}
                  onFocus={(e) => e.target.style.borderColor = '#007bff'}
                  onBlur={(e) => e.target.style.borderColor = '#e9ecef'}
                />
              </div>
              <button 
                onClick={sendMessage}
                disabled={!input.trim() || !isConnected}
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '50%',
                  backgroundColor: input.trim() && isConnected ? '#007bff' : '#e9ecef',
                  color: input.trim() && isConnected ? 'white' : '#6c757d',
                  border: 'none',
                  cursor: input.trim() && isConnected ? 'pointer' : 'not-allowed',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '16px',
                  transition: 'all 0.2s ease',
                  flexShrink: 0
                }}
              >
                ✈️
              </button>
            </div>
            
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontSize: '12px',
              color: '#6c757d',
              minHeight: '16px'
            }}>
              <div>
                {isTyping && (
                  <span style={{ fontStyle: 'italic' }}>You are typing...</span>
                )}
              </div>
              <div>
                {!isConnected && (
                  <span style={{ color: '#dc3545', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    📶 Connection lost. Trying to reconnect...
                  </span>
                )}
              </div>
            </div>
          </>
        ) : (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
            backgroundColor: '#f8f9fa',
            borderRadius: '8px',
            color: '#6c757d',
            fontSize: '14px',
            gap: '8px'
          }}>
            <span>ℹ️</span>
            <span>This chat session has ended. No new messages can be sent.</span>
          </div>
        )}
      </div>

      {/* CSS Animations */}
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        @keyframes bounce {
          0%, 80%, 100% {
            transform: scale(0);
          } 40% {
            transform: scale(1);
          }
        }
        
        /* Responsive Design */
        @media (max-width: 768px) {
          .admin-chat-header {
            padding: 12px 16px !important;
          }
          
          .admin-chat-messages {
            padding: 16px !important;
          }
          
          .admin-chat-input {
            padding: 12px 16px !important;
          }
          
          .user-details h3 {
            font-size: 16px !important;
          }
          
          .user-details p {
            font-size: 12px !important;
          }
        }
        
        @media (max-width: 480px) {
          .header-right {
            flex-direction: column !important;
            gap: 8px !important;
          }
          
          .connection-status {
            font-size: 12px !important;
          }
          
          .message {
            margin-bottom: 12px !important;
          }
          
          .message-content {
            max-width: 85% !important;
          }
        }
      `}</style>
    </div>
  );
};

export default AdminLiveChat;
