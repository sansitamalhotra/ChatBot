import React, { useEffect, useRef, useState, useMemo, useCallback } from "react";
import { Link } from "react-router-dom";
import API from "../../helpers/API";
import { useSocket } from "../../Context/SocketContext";
import { useAuth } from "../../Context/AuthContext";
import { logWithIcon } from "../../utils/consoleIcons";
import "./ChatBotIcon.css";
import beepUrl from "./ping";
import FavIconLogo from "./FaviIcon-Logo.png";
import Modal from 'react-modal';

Modal.setAppElement('#root');

// Use environment variable or fallback to default
const STORAGE_USER_KEY = process.env.REACT_APP_CHAT_STORAGE_USER_KEY || "chat_widget_userinfo_v1";
const STORAGE_MESSAGES_PREFIX = process.env.REACT_APP_CHAT_STORAGE_MESSAGES_PREFIX || "chat_widget_messages_v1_";
const STORAGE_INPUT_KEY = process.env.REACT_APP_CHAT_INPUT_KEY || "chat_widget_input_text";

function timeAgo(ts) {
  if (!ts) return "";
  const d = new Date(ts);
  const diff = Math.floor((Date.now() - d.getTime()) / 1000);
  if (diff < 10) return "just now";
  if (diff < 60) return `${diff}s`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return d.toLocaleDateString();
}

const defaultAvatar =
  "https://img.freepik.com/premium-vector/account-icon-user-icon-vector-graphics_292645-552.jpg?w=300";

const getProfileImageSrc = (userPhoto, isGuest = false) => {
  if (isGuest) return defaultAvatar;
  if (!userPhoto) return "";
  const isUploadPath =
    typeof userPhoto === "string" &&
    userPhoto.startsWith("/uploads/userAvatars/");
  return isUploadPath
    ? process.env.REACT_APP_API_URL + userPhoto
    : userPhoto;
};

async function fetchBusinessHours() {
  try {
    const res = await API.get(`/api/v1/businessHours/checkBusinessHoursStatus`);
    if (res.data.success) {
      return res.data.data;
    }
  } catch (err) {
    logWithIcon.error("Failed to fetch business hours", err);
  }
  return null;
}

const ChatBotIcon = () => {
  const { socket, isConnected } = useSocket();
  const [auth] = useAuth();
  const userFromAuth = auth?.user;

  const [input, setInput] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [session, setSession] = useState(null);
  const [messages, setMessages] = useState([]);
  const [businessInfo, setBusinessInfo] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showGuestForm, setShowGuestForm] = useState(false);
  const [isSubmittingGuest, setIsSubmittingGuest] = useState(false);
  const [guestFormSubmitted, setGuestFormSubmitted] = useState(false);
  const [guestFormErrors, setGuestFormErrors] = useState({});
  const [defaultMessagesLoaded, setDefaultMessagesLoaded] = useState(false);
  const [hasUserSentMessage, setHasUserSentMessage] = useState(false); // NEW: Track if user has sent a message
  
  const [pendingMessages, setPendingMessages] = useState(new Set());
  
  const [guestInfo, setGuestInfo] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: ''
  });

  const audioRef = useRef(null);
  const messagesEndRef = useRef(null);

  // FIXED: Proper user form submission check
  const userFormSubmitted = useMemo(() => {
    if (userFromAuth) {
      logWithIcon.success('User is authenticated:', userFromAuth.email);
      return true;
    }
    
    logWithIcon.active('Guest form submission status:', guestFormSubmitted);
    return guestFormSubmitted;
  }, [userFromAuth, guestFormSubmitted]);

  // FIXED: Simplified guest form trigger logic
  const shouldShowGuestForm = useMemo(() => {
    const result = !userFromAuth && !guestFormSubmitted;
    logWithIcon.guest('Should show guest form:', {
      userFromAuth: !!userFromAuth,
      guestFormSubmitted,
      result
    });
    return result;
  }, [userFromAuth, guestFormSubmitted]);

  const storageKey = useMemo(
    () => STORAGE_MESSAGES_PREFIX + (session?._id || session?.id || "guest"),
    [session]
  );

  // Load persisted input text on mount
  useEffect(() => {
    try {
      const savedInput = localStorage.getItem(STORAGE_INPUT_KEY);
      if (savedInput && savedInput.trim()) {
        setInput(savedInput);
      }
    } catch (error) {
      console.warn("Failed to load input from localStorage:", error);
    }
  }, []);

  // FIXED: Only persist input when chat is open and user is typing
  useEffect(() => {
    if (!isOpen) return; // Don't persist when chat is closed
    
    const timeoutId = setTimeout(() => {
      try {
        if (input && input.trim()) {
          localStorage.setItem(STORAGE_INPUT_KEY, input);
        } else if (!input) {
          localStorage.removeItem(STORAGE_INPUT_KEY);
        }
      } catch (error) {
        console.warn("Failed to save input to localStorage:", error);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [input, isOpen]);

  /** --- Load persisted guest + messages on mount --- **/
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_USER_KEY);
      if (raw) {
        const u = JSON.parse(raw);
        setGuestInfo({
          firstName: u.firstName || "",
          lastName: u.lastName || "",
          email: u.email || "",
          phone: u.phone || ""
        });
        
        const hasRequiredInfo = Boolean(u.firstName && u.email && u.firstName.trim() && u.email.trim());
        setGuestFormSubmitted(hasRequiredInfo);
        console.log('Loaded guest info from storage:', u, 'Form submitted:', hasRequiredInfo);
      }
    } catch (error) {
      console.warn("Failed to load guest info from localStorage:", error);
    }
  }, []);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const loadedMessages = JSON.parse(raw);
        setMessages(loadedMessages);
        // Check if user has sent any messages from loaded history
        const userMessageExists = loadedMessages.some(msg => msg.from === "user");
        if (userMessageExists) {
          setHasUserSentMessage(true);
        }
      }
    } catch (error) {
      console.warn("Failed to load messages from localStorage:", error);
    }
  }, [storageKey]);

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(messages));
    } catch (error) {
      console.warn("Failed to save messages to localStorage:", error);
    }
  }, [messages, storageKey]);

  /** --- Scroll to bottom on new messages when open --- **/
  useEffect(() => {
    if (isOpen && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  /** --- Prepare notification sound --- **/
  useEffect(() => {
    if (beepUrl) audioRef.current = new Audio(beepUrl);
  }, []);

  /** --- Socket listeners --- **/
  const normalizeMessage = useCallback(
    (msg) => {
      if (!msg) return null;
      const id = msg._id || msg.id || `m_${Date.now()}_${Math.random()}`;
      const text = msg.message || msg.text || "";
      const ts = msg.createdAt || msg.timestamp || Date.now();
      const from =
        msg.senderType === "user"
          ? "user"
          : msg.senderType === "agent"
          ? "agent"
          : msg.senderType === "bot"
          ? "bot"
          : msg.from || "bot";

      const avatar =
        msg.metadata?.senderAvatar ||
        (from === "agent"
          ? session?.agent?.photo || FavIconLogo
          : from === "user"
          ? getProfileImageSrc(userFromAuth?.photo, !userFromAuth)
          : FavIconLogo);

      return {
        id,
        from,
        text,
        timestamp: ts,
        avatar,
        quickReplies: msg.metadata?.quickReplies || msg.quickReplies || [],
      };
    },
    [session, userFromAuth]
  );

  const handleIncomingMessage = useCallback(
    (rawMsg) => {
      const msg = normalizeMessage(rawMsg);
      if (!msg) return;

      setMessages((prevMessages) => {
        const messageExists = prevMessages.some(existingMsg => 
          existingMsg.id === msg.id || 
          (existingMsg.text === msg.text && 
           existingMsg.from === msg.from && 
           Math.abs(existingMsg.timestamp - msg.timestamp) < 1000)
        );

        if (messageExists) {
          console.log('Duplicate message detected, skipping:', msg);
          return prevMessages;
        }

        if (msg.from === 'user') {
          setPendingMessages(prev => {
            const newPending = new Set(prev);
            for (const pendingId of prev) {
              if (pendingId.includes(msg.text.substring(0, 10))) {
                newPending.delete(pendingId);
              }
            }
            return newPending;
          });
        }

        return [...prevMessages, msg];
      });

      if (!isOpen) {
        setUnreadCount((n) => n + 1);
        try {
          audioRef.current && audioRef.current.play().catch(() => {});
        } catch {}
      }
    },
    [normalizeMessage, isOpen]
  );

  useEffect(() => {
    if (!socket) return;

    const onSessionCreated = (payloadRaw) => {
      console.log('Session created event received:', payloadRaw);
      const payload = payloadRaw?.body?.data || payloadRaw;
      const sess = payload?.session || payload || null;
      if (sess) {
        setSession(sess);
        console.log('Session set:', sess);
        if (payload.businessHours) setBusinessInfo(payload.businessHours);
      }
      if (payload?.welcomeMessage) {
        handleIncomingMessage(payload.welcomeMessage);
      }
    };

    const onMessageNew = (msg) => handleIncomingMessage(msg);
    const onMessageStatus = ({ messageId, status }) =>
      setMessages((prev) =>
        prev.map((m) => (m.id === messageId ? { ...m, status } : m))
      );

    socket.on("session:created", onSessionCreated);
    socket.on("message:new", onMessageNew);
    socket.on("message:status", onMessageStatus);

    return () => {
      socket.off("session:created", onSessionCreated);
      socket.off("message:new", onMessageNew);
      socket.off("message:status", onMessageStatus);
    };
  }, [socket, handleIncomingMessage]);

  /** --- Create a new session --- **/
  const createSession = useCallback(async () => {
    if (!socket || !socket.connected || session) {
      console.log('Cannot create session:', {
        hasSocket: !!socket,
        isConnected: socket?.connected,
        hasSession: !!session
      });
      return;
    }

    let sessionData;
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

    if (userFromAuth) {
      console.log('Creating session for authenticated user:', userFromAuth.email);
      sessionData = {
        entryPoint: "widget",
        selectedOption: "general_inquiry",
        timezone,
        firstName: userFromAuth.firstname || userFromAuth.firstName,
        lastName: userFromAuth.lastname || userFromAuth.lastName,
        email: userFromAuth.email,
        phone: userFromAuth.phone || '',
        metadata: {
          authenticatedUser: true,
          userId: userFromAuth._id || userFromAuth.id
        }
      };
    } else {
      console.log('Creating session for guest user:', guestInfo);
      const { firstName, lastName, email, phone } = guestInfo;
      
      try {
        localStorage.setItem(
          STORAGE_USER_KEY,
          JSON.stringify({ firstName, lastName, email, phone })
        );
      } catch (error) {
        console.warn("Failed to save guest info to localStorage:", error);
      }

      sessionData = {
        entryPoint: "widget",
        selectedOption: "general_inquiry",
        timezone,
        firstName,
        lastName,
        email,
        phone,
        guestEmail: email,
        metadata: {
          guestFirstName: firstName,
          guestLastName: lastName,
          guestPhone: phone
        }
      };
    }

    console.log('Emitting session:create with data:', sessionData);

    socket.emit("session:create", sessionData, (err, result) => {
      if (err) {
        console.error("session:create err", err);
        return;
      }
      console.log('Session creation response:', result);
      const data = result?.body?.data || result;
      const sess = data?.session || data || null;
      if (sess) {
        setSession(sess);
        if (data.welcomeMessage) handleIncomingMessage(data.welcomeMessage);
        if (data.businessHours) setBusinessInfo(data.businessHours);
      }
    });
  }, [
    socket,
    session,
    userFromAuth,
    guestInfo,
    handleIncomingMessage
  ]);

  /** --- FIXED: Send message with immediate guest form trigger --- **/
  const sendMessage = useCallback(() => {
    if (!input.trim()) return;
    
    const text = input.trim();
    const messageId = `local_${Date.now()}_${Math.random()}`;
    
    // Clear input immediately
    setInput("");
    try {
      localStorage.removeItem(STORAGE_INPUT_KEY);
    } catch (error) {
      console.warn("Failed to clear input from localStorage:", error);
    }
    
    // Add message locally for immediate feedback
    const userMessage = {
      id: messageId,
      from: "user",
      text,
      timestamp: Date.now(),
      avatar: userFromAuth
        ? getProfileImageSrc(userFromAuth?.photo)
        : defaultAvatar,
    };
    
    setMessages(prev => [...prev, userMessage]);
    setHasUserSentMessage(true);
    
    // FIXED: For guests, show form immediately after first message
    if (!userFromAuth && !guestFormSubmitted) {
      console.log('Guest user sent first message, triggering form...', {
        userFromAuth: !!userFromAuth,
        guestFormSubmitted,
        hasUserSentMessage: true
      });
      // Use immediate state update instead of setTimeout for more reliable triggering
      setShowGuestForm(true);
      return; // Don't send to server yet, wait for guest info
    }
    
    // Send via socket if user is authenticated or guest info is already collected
    if (socket && socket.connected && session) {
      socket.emit("message:send", {
        sessionId: session?._id || session?.id,
        message: text,
        messageType: "text",
      });
    }
  }, [input, session, socket, userFromAuth, guestFormSubmitted]);
    
  const handleQuickReply = useCallback(
    (option) => {
      const value = option.value || option.text || option;
      const text = option.text || value;
      const messageId = `local_qr_${Date.now()}_${Math.random()}`;
      
      // Add message locally for immediate feedback
      const userMessage = {
        id: messageId,
        from: "user",
        text,
        timestamp: Date.now(),
        avatar: userFromAuth
          ? getProfileImageSrc(userFromAuth?.photo)
          : defaultAvatar,
      };
      
      setMessages(prev => [...prev, userMessage]);
      setHasUserSentMessage(true);
      
      // FIXED: For guests, show form immediately after quick reply
      if (!userFromAuth && !guestFormSubmitted) {
        console.log('Guest user selected option, triggering form...', {
          userFromAuth: !!userFromAuth,
          guestFormSubmitted,
          hasUserSentMessage: true
        });
        // Use immediate state update instead of setTimeout
        setShowGuestForm(true);
        return; // Don't send to server yet, wait for guest info
      }
      
      // Send via socket if user is authenticated or guest info is collected
      if (socket && socket.connected && session) {
        socket.emit("message:send", {
          sessionId: session._id || session.id,
          message: value,
          messageType: "option_selection",
        });
      }
    },
    [session, socket, userFromAuth, guestFormSubmitted]
  );

  const renderMessage = (m, index) => {
    const isUser = m.from === "user";
    return (
      <div key={`${m.id}-${index}`} className={`chat-row ${isUser ? "user" : "agent-or-bot"}`}>
        {!isUser && (
          <img className="msg-avatar" src={m.avatar} alt={m.from} />
        )}
        <div className="msg-body">
          <div className={`msg-text ${isUser ? "user-bubble" : ""}`}>
            {m.text}
          </div>
          {m.quickReplies?.length > 0 && (
            <div className="message-quick-replies">
              {m.quickReplies.map((qr, i) => (
                <button
                  key={`${m.id}-qr-${i}`}
                  className="quick-reply-btn"
                  onClick={() => handleQuickReply(qr)}
                >
                  {qr.text || qr}
                </button>
              ))}
            </div>
          )}
          <div className="msg-meta">
            <span className="msg-time">{timeAgo(m.timestamp)}</span>
          </div>
        </div>
        {isUser && (
          <img
            className="msg-avatar"
            src={m.avatar}
            alt="You"
          />
        )}
      </div>
    );
  };

  /** --- Form Validation --- **/
  const validateGuestForm = () => {
    const errors = {};
    
    if (!guestInfo.firstName.trim()) {
      errors.firstName = 'First name is required';
    }
    
    if (!guestInfo.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(guestInfo.email)) {
      errors.email = 'Please enter a valid email';
    }
    
    if (guestInfo.phone && !/^[\d\s+\-()]+$/.test(guestInfo.phone)) {
      errors.phone = 'Please enter a valid phone number';
    }
    
    return errors;
  };

  /** --- FIXED: Initialize chat session --- **/
  const initializeChatSession = useCallback(async () => {
    console.log('Initializing chat session...', {
      hasSession: !!session,
      hasSocket: !!socket,
      isConnected: socket?.connected,
      userFormSubmitted,
      defaultMessagesLoaded
    });
    
    // Load default messages only once
    if (messages.length === 0 && !defaultMessagesLoaded) {
      setDefaultMessagesLoaded(true);
      
      const biz = await fetchBusinessHours();
      setBusinessInfo(biz);
      
      if (biz && !biz.isOpen && biz.outsideHoursMessage) {
        setMessages([
          {
            id: "outside-hours",
            from: "bot",
            text: biz.outsideHoursMessage,
            timestamp: Date.now(),
            avatar: FavIconLogo,
            quickReplies: biz.outsideHoursOptions || [],
          },
        ]);
      } else {
        setMessages([
          {
            id: "welcome-fallback",
            from: "bot",
            text: "How can I be of service to you?",
            timestamp: Date.now(),
            avatar: FavIconLogo,
            quickReplies: [
              { text: "What is your service?", value: "service_info" },
              { text: "Why should I choose you?", value: "why_choose_us" },
              { text: "How do I get started?", value: "getting_started" },
              { text: "Search Jobs", value: "search_job" },
              { text: "Partnership Info", value: "partner_pspl" },
              { text: "Application Help", value: "application_issue" },
              { text: "Talk to Agent", value: "live_agent" },
            ],
          },
        ]);
      }
    }
    
    // FIXED: Create session for authenticated users immediately, for guests only after form submission
    if (!session && socket && socket.connected) {
      if (userFromAuth) {
        // Authenticated users can create session immediately
        console.log('Creating session for authenticated user...');
        await createSession();
      } else if (guestFormSubmitted) {
        // Guest users only after form submission
        console.log('Creating session for guest user after form submission...');
        await createSession();
      }
    }
  }, [session, socket, userFormSubmitted, defaultMessagesLoaded, messages.length, createSession, userFromAuth, guestFormSubmitted]);

  const handleHeaderClick = () => {
    setIsOpen(false);
  };

  /** --- FIXED: Toggle Chat with proper initialization --- **/
  const handleToggle = async () => {
    const next = !isOpen;
    setIsOpen(next);
    
    if (next) {
      setUnreadCount(0);
      
      console.log('Debug - handleToggle:', {
        userFromAuth: !!userFromAuth,
        guestFormSubmitted,
        userFormSubmitted,
        hasUserSentMessage
      });
      
      // Always initialize chat when opening - guest form will show after first message if needed
      await initializeChatSession();
    }
  };

  const handleGuestFormChange = (e) => {
    const { name, value } = e.target;
    setGuestInfo({
      ...guestInfo,
      [name]: value
    });
    
    if (guestFormErrors[name]) {
      setGuestFormErrors({
        ...guestFormErrors,
        [name]: ''
      });
    }
  };

  /** --- FIXED: Submit guest form and create session, then send pending message --- **/
  const submitGuestForm = async () => {
    const errors = validateGuestForm();
    
    if (Object.keys(errors).length > 0) {
      setGuestFormErrors(errors);
      return;
    }

    setIsSubmittingGuest(true);
    
    try {
      const response = await API.post('/api/v1/guestUsers/create-guest-user', guestInfo);
      
      if (response.data.success) {
        const { firstName, lastName, email, phone } = response.data.data;
        
        setGuestInfo({ firstName, lastName, email, phone });
        setGuestFormSubmitted(true);
        setShowGuestForm(false);
        setGuestFormErrors({});
        
        try {
          localStorage.setItem(STORAGE_USER_KEY, JSON.stringify({
            firstName,
            lastName,
            email,
            phone
          }));
        } catch (error) {
          console.warn("Failed to save guest info to localStorage:", error);
        }
        
        // Create session immediately after guest form submission
        console.log('Guest form submitted, creating session...');
        if (socket && socket.connected && !session) {
          await createSession();
        }
        
        // Send any pending user messages to the server
        const lastUserMessage = messages[messages.length - 1];
        if (lastUserMessage && lastUserMessage.from === 'user') {
          console.log('Sending guest user message to server after form submission...');
          if (socket && socket.connected) {
            setTimeout(() => {
              socket.emit("message:send", {
                sessionId: session?._id || session?.id,
                message: lastUserMessage.text,
                messageType: "text",
              });
            }, 1000); // Small delay to ensure session is created
          }
        }
        
        logWithIcon.success('Guest user created and session initialized');
      }
    } catch (error) {
      console.error("Error saving guest user:", error);
      setGuestFormErrors({
        submit: error.response?.data?.message || 'Failed to save guest information. Please try again.'
      });
    } finally {
      setIsSubmittingGuest(false);
    }
  };

  // FIXED: Trigger guest form when it should show
  useEffect(() => {
    if (!userFromAuth && !guestFormSubmitted && hasUserSentMessage && !showGuestForm) {
      console.log('Triggering guest form - conditions met');
      setShowGuestForm(true);
    }
  }, [userFromAuth, guestFormSubmitted, hasUserSentMessage, showGuestForm]);

  return (
    <div className="chatbot-wrapper">
      <button
        className={`chatbot-toggle ${isOpen ? "open" : ""}`}
        onClick={handleToggle}
      >
        <div className="chat-toggle-inner">
          {!isOpen && <i className="fas fa-comment-dots fa-1x"></i>}
        </div>
        {unreadCount > 0 && <div className="unread-badge">{unreadCount}</div>}
      </button>

      {isOpen && (
        <div className="chatbot-box">
          <div className="chatbot-header" onClick={handleHeaderClick} style={{ cursor: 'pointer' }}>
            <div className="chat-header-left">
              <button
                className="chat-close-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsOpen(false);
                }}
              >
                <i className="fas fa-chevron-down"></i>
              </button>
              <div className="chat-avatar">
                <Link to="/" onClick={(e) => e.stopPropagation()}>
                  <img src={FavIconLogo} alt="ProsoftSynergies" />
                </Link>
              </div>
              <div>
                <div className="chat-title">
                  {userFromAuth 
                    ? `Chat Assistant - ${userFromAuth.firstname || 'User'}`
                    : userFormSubmitted 
                      ? `Chat Assistant - ${guestInfo.firstName}`
                      : 'Chat Assistant'
                  }
                </div>
                <div className="chat-sub">
                  {businessInfo
                    ? businessInfo.isOpen
                        ? "We're online now"
                        : "Outside business hours"
                    : isConnected
                        ? "Connected"
                        : "Connecting..."}
                </div>
              </div>
            </div>
          </div>

          <div className="chatbot-messages">
            {messages.map(renderMessage)}
            <div ref={messagesEndRef} />
          </div>

          <div className="chatbot-input">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type a message..."
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  sendMessage();
                }
              }}
              disabled={false} // Always enabled to allow first message
            />
            <button
              onClick={sendMessage}
              className="send-btn"
              disabled={false} // Always enabled to allow first message
            >
              →
            </button>
          </div>
        </div>
      )}

      {/* FIXED: Guest Form - Use conditional rendering instead of Modal */}
      {showGuestForm && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10000
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '2rem',
            borderRadius: '8px',
            maxWidth: '400px',
            width: '90%',
            maxHeight: '80vh',
            overflow: 'auto'
          }}>
            <div className="guest-form">
              <h2 style={{ marginTop: 0, marginBottom: '1rem' }}>Please provide your details to continue chatting</h2>
              <p style={{ marginBottom: '1.5rem', color: '#666' }}>
                We'd like to know who we're talking to so we can provide better assistance.
              </p>
              
              {guestFormErrors.submit && (
                <div className="error-message" style={{ color: 'red', marginBottom: '1rem', padding: '0.5rem', backgroundColor: '#fee', borderRadius: '4px' }}>
                  {guestFormErrors.submit}
                </div>
              )}
              
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>First Name *</label>
                <input
                  type="text"
                  name="firstName"
                  value={guestInfo.firstName}
                  onChange={handleGuestFormChange}
                  disabled={isSubmittingGuest}
                  required
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    border: '1px solid #ccc',
                    borderRadius: '4px',
                    fontSize: '1rem'
                  }}
                />
                {guestFormErrors.firstName && (
                  <span style={{ color: 'red', fontSize: '0.8rem', display: 'block', marginTop: '0.25rem' }}>
                    {guestFormErrors.firstName}
                  </span>
                )}
              </div>
              
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Last Name</label>
                <input
                  type="text"
                  name="lastName"
                  value={guestInfo.lastName}
                  onChange={handleGuestFormChange}
                  disabled={isSubmittingGuest}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    border: '1px solid #ccc',
                    borderRadius: '4px',
                    fontSize: '1rem'
                  }}
                />
              </div>
              
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Email *</label>
                <input
                  type="email"
                  name="email"
                  value={guestInfo.email}
                  onChange={handleGuestFormChange}
                  disabled={isSubmittingGuest}
                  required
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    border: '1px solid #ccc',
                    borderRadius: '4px',
                    fontSize: '1rem'
                  }}
                />
                {guestFormErrors.email && (
                  <span style={{ color: 'red', fontSize: '0.8rem', display: 'block', marginTop: '0.25rem' }}>
                    {guestFormErrors.email}
                  </span>
                )}
              </div>
              
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Phone</label>
                <input
                  type="tel"
                  name="phone"
                  value={guestInfo.phone}
                  onChange={handleGuestFormChange}
                  disabled={isSubmittingGuest}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    border: '1px solid #ccc',
                    borderRadius: '4px',
                    fontSize: '1rem'
                  }}
                />
                {guestFormErrors.phone && (
                  <span style={{ color: 'red', fontSize: '0.8rem', display: 'block', marginTop: '0.25rem' }}>
                    {guestFormErrors.phone}
                  </span>
                )}
              </div>
              
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button 
                  onClick={() => setShowGuestForm(false)}
                  disabled={isSubmittingGuest}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: '#6c757d',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: isSubmittingGuest ? 'not-allowed' : 'pointer',
                    fontSize: '1rem'
                  }}
                >
                  Cancel
                </button>
                <button 
                  onClick={submitGuestForm}
                  disabled={isSubmittingGuest}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: '#007bff',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: isSubmittingGuest ? 'not-allowed' : 'pointer',
                    fontSize: '1rem'
                  }}
                >
                  {isSubmittingGuest ? 'Submitting...' : 'Continue Chat'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatBotIcon;
