import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSocket } from '../../Context/SocketContext';
import { useAuth } from '../../Context/AuthContext';
import API from '../../helpers/API';
import './AdminChatSession.css';

const AdminChatSession = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const { socket } = useSocket();
  const [auth] = useAuth();
  const admin = auth?.user;

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [session, setSession] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const [userTyping, setUserTyping] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Fetch session details and messages
  useEffect(() => {
    const fetchSessionData = async () => {
      try {
        setIsLoading(true);
        const response = await API.get(`/api/v1/chat/session/${sessionId}`);
        if (response.data.success) {
          setSession(response.data.session);
          setMessages(response.data.messages || []);
        } else {
          setError('Failed to load chat session');
        }
      } catch (err) {
        setError('Error loading chat session');
        console.error('Error fetching session:', err);
      } finally {
        setIsLoading(false);
      }
    };

    if (sessionId) {
      fetchSessionData();
    }
  }, [sessionId]);

  // Socket event listeners
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (message) => {
      if (message.sessionId === sessionId) {
        setMessages(prev => [...prev, message]);
      }
    };

    const handleTypingStart = (data) => {
      if (data.sessionId === sessionId && data.userType === 'user') {
        setUserTyping(true);
      }
    };

    const handleTypingStop = (data) => {
      if (data.sessionId === sessionId && data.userType === 'user') {
        setUserTyping(false);
      }
    };

    socket.on('message:new', handleNewMessage);
    socket.on('typing:start', handleTypingStart);
    socket.on('typing:stop', handleTypingStop);

    // Join the session room
    socket.emit('admin:join_session', { sessionId });

    return () => {
      socket.off('message:new', handleNewMessage);
      socket.off('typing:start', handleTypingStart);
      socket.off('typing:stop', handleTypingStop);
      socket.emit('admin:leave_session', { sessionId });
    };
  }, [socket, sessionId]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = useCallback(() => {
    if (!input.trim() || !socket || !sessionId) return;

    const messageData = {
      sessionId,
      message: input.trim(),
      messageType: 'text',
      senderType: 'agent',
      agentId: admin?._id
    };

    socket.emit('message:send', messageData);
    setInput('');
    setIsTyping(false);
    
    // Clear typing indicator
    socket.emit('typing:stop', { sessionId, userType: 'agent' });
  }, [input, socket, sessionId, admin]);

  const handleInputChange = useCallback((e) => {
    setInput(e.target.value);
    
    if (!socket) return;

    // Handle typing indicators
    if (e.target.value.trim()) {
      setIsTyping(true);
      socket.emit('typing:start', { sessionId, userType: 'agent' });
      
      // Clear previous timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      // Set timeout to stop typing indicator
      typingTimeoutRef.current = setTimeout(() => {
        setIsTyping(false);
        socket.emit('typing:stop', { sessionId, userType: 'agent' });
      }, 1000);
    } else {
      setIsTyping(false);
      socket.emit('typing:stop', { sessionId, userType: 'agent' });
    }
  }, [socket, sessionId]);

  const handleKeyPress = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  }, [handleSendMessage]);

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  if (isLoading) {
    return (
      <div className="admin-chat-loading">
        <div className="loading-spinner"></div>
        <p>Loading chat session...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-chat-error">
        <div className="error-icon">⚠️</div>
        <h3>{error}</h3>
        <button onClick={() => navigate('/admin/dashboard')} className="back-button">
          Back to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="admin-chat-container">
      {/* Header */}
      <div className="admin-chat-header">
        <div className="header-left">
          <button onClick={() => navigate('/admin/dashboard')} className="back-button">
            ← Back
          </button>
          <div className="session-info">
            <h3>Chat with {session?.userInfo?.firstName || 'User'}</h3>
            <p>Session ID: {sessionId}</p>
          </div>
        </div>
        <div className="header-right">
          <div className={`status-indicator ${session?.isActive ? 'active' : 'inactive'}`}>
            {session?.isActive ? 'Active' : 'Ended'}
          </div>
        </div>
      </div>

      {/* Messages Container */}
      <div className="admin-chat-messages">
        {messages.map((message) => (
          <div
            key={message._id || message.id}
            className={`message-row ${message.senderType === 'agent' ? 'agent-message' : 'user-message'}`}
          >
            <div className="message-content">
              <div className="message-bubble">
                <p>{message.message}</p>
                <span className="message-time">
                  {formatTime(message.timestamp || message.createdAt)}
                </span>
              </div>
            </div>
          </div>
        ))}
        
        {/* Typing Indicators */}
        {userTyping && (
          <div className="message-row user-message">
            <div className="message-content">
              <div className="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        )}
        
        {isTyping && (
          <div className="message-row agent-message">
            <div className="message-content">
              <div className="typing-indicator agent-typing">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="admin-chat-input">
        <div className="input-container">
          <input
            type="text"
            value={input}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            disabled={!session?.isActive}
          />
          <button 
            onClick={handleSendMessage} 
            disabled={!input.trim() || !session?.isActive}
            className="send-button"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminChatSession;
