//frontend/src/Pages/Admin/AdminLiveChat/AdminLiveChat.jsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from "../../../Context/AuthContext";
import { useSocket } from "../../../Context/SocketContext";
import API from "../../../helpers/API";
import './AdminLiveChat.css';

const AdminLiveChat = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const { socket, isConnected } = useSocket();
  const [auth] = useAuth();
  const adminUser = auth?.user;
  const messagesEndRef = useRef(null);

  // State
  const [session, setSession] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState(null);
  const [userInfo, setUserInfo] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('connecting');

  // Scroll to bottom of messages
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  // Load session data and messages
  const loadSessionData = useCallback(async () => {
    if (!sessionId) return;
    
    setIsLoading(true);
    setError(null);

    try {
      const response = await API.get(`/api/v1/admin/chat/session/${sessionId}`);
      
      if (response.data.success) {
        const { session, messages, userInfo } = response.data.data;
        setSession(session);
        setMessages(messages || []);
        setUserInfo(userInfo || session.userInfo);
        setConnectionStatus('connected');
      } else {
        setError('Failed to load chat session');
      }
    } catch (err) {
      console.error('Error loading session:', err);
      if (err.response?.status === 404) {
        setError('Chat session not found');
      } else if (err.response?.status === 403) {
        setError('Access denied to this chat session');
      } else {
        setError(err.response?.data?.message || 'Failed to load chat session');
      }
    } finally {
      setIsLoading(false);
    }
  }, [sessionId]);

  // Admin permission check and session load
  useEffect(() => {
    if (!adminUser || (adminUser.role !== 1 && adminUser.role !== 0)) {
      navigate('/Admin/Dashboard');
      return;
    }

    if (!sessionId) {
      setError('No session ID provided');
      return;
    }

    loadSessionData();
  }, [adminUser, sessionId, loadSessionData, navigate]);

  // Auto-assign session on load if not already assigned
  useEffect(() => {
    const autoAssignSession = async () => {
      if (session && session.status === 'waiting' && (!session.agentId || session.agentId !== adminUser._id)) {
        try {
          await API.post(`/api/v1/admin/chat/assign/${sessionId}`, {
            adminId: adminUser._id
          });
          
          // Reload session data to get updated info
          loadSessionData();
        } catch (error) {
          console.error('Error auto-assigning session:', error);
        }
      }
    };

    if (session && adminUser) {
      autoAssignSession();
    }
  }, [session, adminUser, sessionId, loadSessionData]);

  // Socket event handlers
  useEffect(() => {
    if (!socket || !sessionId) return;

    // Join the session room
    socket.emit('admin:join_session', { sessionId, adminId: adminUser._id });

    const handleNewMessage = (message) => {
      if (message.sessionId === sessionId) {
        setMessages(prev => [...prev, message]);
        scrollToBottom();
      }
    };

    const handleSessionUpdate = (updatedSession) => {
      if (updatedSession._id === sessionId) {
        setSession(updatedSession);
      }
    };

    const handleUserTyping = (data) => {
      if (data.sessionId === sessionId) {
        setIsTyping(data.isTyping);
      }
    };

    socket.on('message:new', handleNewMessage);
    socket.on('session:updated', handleSessionUpdate);
    socket.on('user:typing', handleUserTyping);

    return () => {
      socket.off('message:new', handleNewMessage);
      socket.off('session:updated', handleSessionUpdate);
      socket.off('user:typing', handleUserTyping);
      
      // Leave the session room
      socket.emit('admin:leave_session', { sessionId, adminId: adminUser._id });
    };
  }, [socket, sessionId, adminUser, scrollToBottom]);

  // Auto-scroll when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Send message - FIXED VERSION
  const sendMessage = useCallback(async (e) => {
    e.preventDefault();
    
    if (!newMessage.trim() || isSending) return;

    const messageText = newMessage.trim();
    setNewMessage('');
    setIsSending(true);

    try {
      // Determine sender model based on admin user type
      const senderModel = 'User'; // Since admin is a User in your schema
      
      const response = await API.post('/api/v1/admin/chat/message', {
        sessionId,
        message: messageText,
        senderType: 'agent',
        senderId: adminUser._id,
        senderModel: senderModel // ADD THIS REQUIRED FIELD
      });

      if (response.data.success) {
        // Message will be added via socket event
        console.log('Message sent successfully');
      } else {
        throw new Error(response.data.message || 'Failed to send message');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to send message';
      setError(errorMessage);
      // Restore message text
      setNewMessage(messageText);
    } finally {
      setIsSending(false);
    }
  }, [newMessage, isSending, sessionId, adminUser]);

  // End session
  const endSession = useCallback(async () => {
    if (!window.confirm('Are you sure you want to end this chat session?')) return;

    try {
      const response = await API.post(`/api/v1/admin/chat/end/${sessionId}`, {
        reason: 'ended_by_agent'
      });

      if (response.data.success) {
        setSession(prev => ({ ...prev, status: 'ended' }));
      }
    } catch (error) {
      console.error('Error ending session:', error);
      setError('Failed to end session');
    }
  }, [sessionId]);

  // Get profile image
  const getProfileImageSrc = useCallback((userPhoto, isGuest = false) => {
    if (isGuest || !userPhoto) {
      return "https://img.freepik.com/premium-vector/account-icon-user-icon-vector-graphics_292645-552.jpg?w=300";
    }
    const isUploadPath = typeof userPhoto === "string" && userPhoto.startsWith("/uploads/userAvatars/");
    return isUploadPath ? `${process.env.REACT_APP_API_URL}${userPhoto}` : userPhoto;
  }, []);

  // Format timestamp - FIXED VERSION
  const formatMessageTime = useCallback((timestamp) => {
    try {
      const date = new Date(timestamp);
      // Check if date is valid
      if (isNaN(date.getTime())) {
        console.warn('Invalid date:', timestamp);
        return 'Invalid time';
      }
      return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      console.error('Error formatting time:', error);
      return 'Invalid time';
    }
  }, []);

  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p className="loading-text">Loading chat session...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <div className="error-content">
          <i className="fas fa-exclamation-triangle error-icon"></i>
          <h3>Error Loading Chat</h3>
          <p>{error}</p>
          <button 
            onClick={() => {
              setError(null);
              loadSessionData();
            }}
            className="btn btn-secondary mr-2"
          >
            Retry
          </button>
          <button 
            onClick={() => navigate('/Admin/Chat-List')}
            className="btn btn-primary"
          >
            Back to Chat List
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-live-chat-container">
      {/* Header */}
      <div className="chat-header">
        <div className="chat-header-left">
          <button 
            onClick={() => navigate('/Admin/Chat-List')}
            className="back-button"
          >
            <i className="fas fa-arrow-left"></i>
          </button>
          
          <div className="user-avatar">
            <img
              src={getProfileImageSrc(userInfo?.photo, !userInfo?.userId)}
              alt="User"
              className="avatar-img"
            />
            <div className={`status-indicator ${session?.status === 'active' ? 'online' : 'offline'}`} />
          </div>
          
          <div className="user-details">
            <h3 className="user-name">
              {userInfo?.firstName || userInfo?.firstname || 'Guest User'} {userInfo?.lastName || userInfo?.lastname || ''}
            </h3>
            <p className="user-status">
              {userInfo?.email || 'No email provided'}
            </p>
          </div>
        </div>
        
        <div className="chat-header-right">
          <div className="connection-status">
            <i className={`fas ${isConnected ? 'fa-wifi' : 'fa-wifi-slash'}`}></i>
            <span>{isConnected ? 'Connected' : 'Disconnected'}</span>
          </div>
          
          <div className="session-info">
            <span className={`status-badge status-${session?.status}`}>
              {session?.status}
            </span>
            <span className="session-id">#{sessionId.slice(-6)}</span>
          </div>
          
          {session?.status !== 'ended' && (
            <button 
              onClick={endSession}
              className="end-session-button"
            >
              <i className="fas fa-times"></i>
              End Chat
            </button>
          )}
        </div>
      </div>

      {/* Messages Area */}
      <div className="chat-messages">
        <div className="messages-list">
          {messages.map((message) => (
            <div
              key={message._id}
              className={`message ${message.senderType === 'agent' ? 'message-sent' : 'message-received'}`}
            >
              <div className="message-content">
                <div className="message-text">
                  {message.message}
                </div>
                <div className="message-time">
                  {formatMessageTime(message.createdAt || message.timestamp)}
                </div>
              </div>
            </div>
          ))}
          
          {isTyping && (
            <div className="message message-received typing-indicator">
              <div className="message-content">
                <div className="typing-dots">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Message Input */}
      <div className="chat-input-container">
        {session?.status === 'ended' ? (
          <div className="session-ended-notice">
            <i className="fas fa-info-circle"></i>
            This chat session has ended
          </div>
        ) : (
          <form onSubmit={sendMessage} className="chat-input-form">
            <div className="input-group">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type your message..."
                className="message-input"
                disabled={isSending || !isConnected}
              />
              <button
                type="submit"
                disabled={!newMessage.trim() || isSending || !isConnected}
                className="send-button"
              >
                {isSending ? (
                  <i className="fas fa-spinner fa-spin"></i>
                ) : (
                  <i className="fas fa-paper-plane"></i>
                )}
              </button>
            </div>
            
            <div className="input-status">
              {!isConnected && (
                <span className="connection-warning">
                  <i className="fas fa-exclamation-triangle"></i>
                  Connection lost - messages may not be delivered
                </span>
              )}
              {error && (
                <span className="error-warning">
                  <i className="fas fa-exclamation-circle"></i>
                  {error}
                  <button 
                    onClick={() => setError(null)} 
                    className="error-dismiss"
                    type="button"
                  >
                    ×
                  </button>
                </span>
              )}
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default AdminLiveChat;
