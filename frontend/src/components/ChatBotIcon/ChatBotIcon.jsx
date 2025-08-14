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
const STORAGE_INPUT_KEY = process.env.REACT_APP_CHAT_INPUT_KEY || "chat_widget_input_v1"; // New storage key for input
const STORAGE_CHAT_STATE_KEY = process.env.REACT_APP_CHAT_STATE_KEY || "chat_widget_state_v1"; // New storage key for chat state

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
  const { user } = useAuth();

  const [input, setInput] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [session, setSession] = useState(null);
  const [messages, setMessages] = useState([]);
  const [quickReplies, setQuickReplies] = useState([]);
  const [businessInfo, setBusinessInfo] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showGuestForm, setShowGuestForm] = useState(false);
  const [isSubmittingGuest, setIsSubmittingGuest] = useState(false);
  const [guestFormErrors, setGuestFormErrors] = useState({});
  
  const [guestInfo, setGuestInfo] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: ''
  });

  const audioRef = useRef(null);
  const messagesEndRef = useRef(null);

  // Check if user form is properly submitted
  const userFormSubmitted = useMemo(() => {
    if (userFromAuth) return true;
    return Boolean(guestInfo.firstName && guestInfo.email && guestInfo.firstName.trim() && guestInfo.email.trim());
  }, [userFromAuth, guestInfo.firstName, guestInfo.email]);

  // Determine if user needs to fill guest form
  const needsGuestForm = useMemo(() => {
    logWithIcon.logging('Checking needsGuestForm:', {
      userFromAuth: !!userFromAuth,
      userFormSubmitted,
      guestInfoComplete: !!(guestInfo.firstName && guestInfo.email)
    });
    
    // If user is authenticated, they never need guest form
    if (userFromAuth) {
      return false;
    }
    
    // If not authenticated and guest form not submitted, they need form
    return !userFormSubmitted;
  }, [userFromAuth, userFormSubmitted, guestInfo]);

  const storageKey = useMemo(
    () => STORAGE_MESSAGES_PREFIX + (session?._id || session?.id || "guest"),
    [session]
  );

  // Enhanced: Load persisted input text on mount
  useEffect(() => {
    try {
      const savedInput = localStorage.getItem(STORAGE_INPUT_KEY);
      if (savedInput) {
        setInput(savedInput);
        logWithIcon.info("Restored input text from localStorage:", savedInput);
      }
    } catch (error) {
      logWithIcon.warning("Failed to load input from localStorage:", error);
    }
  }, []);

  // Enhanced: Save input text to localStorage whenever it changes
  useEffect(() => {
    try {
      if (input.trim()) {
        localStorage.setItem(STORAGE_INPUT_KEY, input);
      } else {
        localStorage.removeItem(STORAGE_INPUT_KEY);
      }
    } catch (error) {
      logWithIcon.warning("Failed to save input to localStorage:", error);
    }
  }, [input]);

  // Enhanced: Load persisted chat state on mount
  useEffect(() => {
    try {
      const savedChatState = localStorage.getItem(STORAGE_CHAT_STATE_KEY);
      if (savedChatState) {
        const chatState = JSON.parse(savedChatState);
        if (chatState.isOpen) {
          setIsOpen(chatState.isOpen);
          logWithIcon.info("Restored chat state from localStorage:", chatState);
        }
        if (chatState.unreadCount && chatState.unreadCount > 0) {
          setUnreadCount(chatState.unreadCount);
        }
      }
    } catch (error) {
      logWithIcon.warning("Failed to load chat state from localStorage:", error);
    }
  }, []);

  // Enhanced: Save chat state to localStorage whenever it changes
  useEffect(() => {
    try {
      const chatState = {
        isOpen,
        unreadCount,
        timestamp: Date.now()
      };
      localStorage.setItem(STORAGE_CHAT_STATE_KEY, JSON.stringify(chatState));
    } catch (error) {
      logWithIcon.warning("Failed to save chat state to localStorage:", error);
    }
  }, [isOpen, unreadCount]);

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
      }
    } catch (error) {
      logWithIcon.warning("Failed to load guest info from localStorage:", error);
    }
  }, []);

  // Enhanced: Load persisted messages on mount with fallback initialization
  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const savedMessages = JSON.parse(raw);
        if (savedMessages && savedMessages.length > 0) {
          setMessages(savedMessages);
          logWithIcon.info('💾 Loaded messages from localStorage:', savedMessages.length);
          
          // Restore quick replies from the last message if any
          const lastMessage = savedMessages[savedMessages.length - 1];
          if (lastMessage && lastMessage.quickReplies && lastMessage.quickReplies.length > 0) {
            setQuickReplies(lastMessage.quickReplies);
          }
        }
      }
    } catch (error) {
      logWithIcon.warning("Failed to load messages from localStorage:", error);
    }
  }, [storageKey]);

  // Enhanced: Save messages to localStorage and preserve quick replies
  useEffect(() => {
    try {
      if (messages.length > 0) {
        localStorage.setItem(storageKey, JSON.stringify(messages));
      }
    } catch (error) {
      logWithIcon.warning("Failed to save messages to localStorage:", error);
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
      const id = msg._id || msg.id || `m_${Date.now()}`;
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

      setMessages((prev) => [...prev, msg]);
      setQuickReplies(msg.quickReplies.length ? msg.quickReplies : []);

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
      const payload = payloadRaw?.body?.data || payloadRaw;
      const sess = payload?.session || payload || null;
      if (sess) {
        setSession(sess);
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
  if (!socket || !socket.connected) {
    logWithIcon.error('Cannot create session: socket not connected');
    return;
  }
  
  if (session) {
    logWithIcon.info('ℹ️ Session already exists:', session._id);
    return;
  }

  let sessionData;
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  logWithIcon.waiting('Creating session - user check:', {
    userFromAuth: !!userFromAuth,
    userEmail: userFromAuth?.email,
    userId: userFromAuth?._id || userFromAuth?.id,
    guestInfo: guestInfo.email
  });

  // CRITICAL FIX: Proper authentication check using the actual auth context
  if (userFromAuth && (userFromAuth._id || userFromAuth.id)) {
    // For AUTHENTICATED users - DO NOT send guestEmail
    sessionData = {
      entryPoint: "widget",
      selectedOption: "general_inquiry", 
      timezone,
      firstName: userFromAuth.firstname || userFromAuth.firstName || 'User',
      lastName: userFromAuth.lastname || userFromAuth.lastName || '',
      email: userFromAuth.email,
      phone: userFromAuth.phone || '',
      // CRITICAL: NO guestEmail for authenticated users
      metadata: {
        authenticatedUser: true,
        userId: userFromAuth._id || userFromAuth.id
      }
    };
    
    logWithIcon.success('Creating session for AUTHENTICATED user:', {
      email: userFromAuth.email,
      userId: userFromAuth._id || userFromAuth.id
    });
  } 
  // Only for actual GUEST users
  else if (!userFromAuth && userFormSubmitted && guestInfo.firstName && guestInfo.email) {
    const { firstName, lastName, email, phone } = guestInfo;
    
    if (!firstName.trim() || !email.trim()) {
      logWithIcon.error('Cannot create guest session: missing required fields');
      return;
    }
    
    sessionData = {
      entryPoint: "widget",
      selectedOption: "general_inquiry",
      timezone,
      firstName: firstName.trim(),
      lastName: lastName?.trim() || '',
      email: email.toLowerCase().trim(),
      phone: phone?.trim() || '',
      guestEmail: email.toLowerCase().trim(), // This tells backend it's a guest user
      metadata: {
        guestFirstName: firstName.trim(),
        guestLastName: lastName?.trim() || '',
        guestPhone: phone?.trim() || '',
        authenticatedUser: false,
        isGuest: true
      }
    };
    
    logWithIcon.success('Creating session for GUEST user:', email);
  } else {
    logWithIcon.error('Cannot create session: invalid user state', {
      userFromAuth: !!userFromAuth,
      userFormSubmitted,
      guestEmail: guestInfo.email
    });
    return;
  }

  // Create session with proper error handling
  try {
    logWithIcon.emit('📤 Emitting session:create with data:', {
      ...sessionData,
      email: sessionData.email,
      isGuest: !userFromAuth
    });

    const result = await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Session creation timeout'));
      }, 10000);

      socket.emit("session:create", sessionData, (err, result) => {
        clearTimeout(timeout);
        
        if (err) {
          logWithIcon.error("session:create error:", err);
          reject(err);
          return;
        }
        
        logWithIcon.emit('session:create response:', result);
        
        const data = result?.body?.data || result;
        const sess = data?.session || data || null;
        
        if (sess) {
          logWithIcon.success('Session created successfully:', sess._id);
          setSession(sess);
          if (data.welcomeMessage) handleIncomingMessage(data.welcomeMessage);
          if (data.businessHours) setBusinessInfo(data.businessHours);
          resolve(sess);
        } else {
          logWithIcon.error('No session data in response:', result);
          reject(new Error('No session data received'));
        }
      });
    });

    logWithIcon.success('Session creation completed:', result._id);
  } catch (error) {
    logWithIcon.error('Failed to create session:', error);
    setMessages([
      {
        id: "session-error",
        from: "bot", 
        text: "Sorry, I'm having trouble starting our conversation. Please try refreshing the page.",
        timestamp: Date.now(),
        avatar: FavIconLogo,
        quickReplies: [],
      },
    ]);
  }
}, [socket, session, userFromAuth, guestInfo, userFormSubmitted, handleIncomingMessage]);

  /** --- Send message --- **/
  const sendMessage = useCallback(() => {
    if (!input.trim()) return;
    const text = input.trim();
    const draft = {
      id: `local_${Date.now()}`,
      from: "user",
      text,
      timestamp: Date.now(),
      avatar: userFromAuth
        ? getProfileImageSrc(userFromAuth?.photo)
        : defaultAvatar,
    };
    setMessages((prev) => [...prev, draft]);
    
    // Enhanced: Clear input and remove from localStorage after sending
    setInput("");
    try {
      localStorage.removeItem(STORAGE_INPUT_KEY);
    } catch (error) {
      logWithIcon.warning("Failed to remove input from localStorage:", error);
    }
    
    if (!socket || !socket.connected) return;
    socket.emit("message:send", {
      sessionId: session?._id || session?.id,
      message: text,
      messageType: "text",
    });
  }, [input, session, socket, userFromAuth]);

  const handleQuickReply = useCallback(
    (option) => {
      const value = option.value || option.text || option;
      const draft = {
        id: `local_qr_${Date.now()}`,
        from: "user",
        text: option.text || value,
        timestamp: Date.now(),
        avatar: userFromAuth
          ? getProfileImageSrc(userFromAuth?.photo)
          : defaultAvatar,
      };
      setMessages((prev) => [...prev, draft]);
      setQuickReplies([]);
      if (socket && socket.connected && session) {
        socket.emit("message:send", {
          sessionId: session._id || session.id,
          message: value,
          messageType: "option_selection",
        });
      }
    },
    [session, socket, userFromAuth]
  );

  const renderMessage = (m) => {
    const isUser = m.from === "user";
    return (
      <div key={m.id} className={`chat-row ${isUser ? "user" : "agent-or-bot"}`}>
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
                  key={i}
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
    
    if (guestInfo.phone && !/^[\d\s\+\-\(\)]+$/.test(guestInfo.phone)) {
      errors.phone = 'Please enter a valid phone number';
    }
    
    return errors;
  };

  /** --- Initialize chat session and messages --- **/
  const initializeChatSession = async () => {
    try {
      logWithIcon.info('🚀 Initializing chat session...', {
        hasSession: !!session,
        messagesLength: messages.length,
        userFormSubmitted,
        userFromAuth: !!userFromAuth
      });

      // Always show initial messages if none exist, regardless of session status
      if (messages.length === 0) {
        const biz = await fetchBusinessHours();
        setBusinessInfo(biz);
        
        const userName = userFromAuth?.firstname || userFromAuth?.firstName || guestInfo.firstName || 'there';
        
        if (biz && !biz.isOpen && biz.outsideHoursMessage) {
          logWithIcon.info('📅 Setting outside hours message');
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
          setQuickReplies(biz.outsideHoursOptions || []);
        } else {
          logWithIcon.info('👋 Setting welcome message with default options');
          const welcomeMessage = {
            id: "welcome-fallback",
            from: "bot",
            text: `Hello ${userName}! How can I be of service to you?`,
            timestamp: Date.now(),
            avatar: FavIconLogo,
            quickReplies: [
              { text: "What is your service?", value: "service_info" },
              { text: "Why should I choose you?", value: "why_choose_us" },
              { text: "Search Jobs", value: "search_job" },
              { text: "Partnership Info", value: "partner_pspl" },
              { text: "Application Help", value: "application_issue" },
              { text: "Talk to Agent", value: "live_agent" },
            ],
          };
          
          setMessages([welcomeMessage]);
          setQuickReplies(welcomeMessage.quickReplies);
        }
      }

      // Create session after showing initial messages
      if (!session && socket && socket.connected) {
        // Check if we have proper user info (either authenticated or guest)
        if (userFromAuth || userFormSubmitted) {
          logWithIcon.info('🔗 Creating session...');
          await createSession();
        } else {
          logWithIcon.warning('⚠️ Cannot create session: missing user information');
          return;
        }
      }
      
    } catch (error) {
      logWithIcon.error('❌ Error initializing chat session:', error);
      // Show error message to user
      setMessages([
        {
          id: "error-message",
          from: "bot",
          text: "Sorry, I'm having trouble connecting right now. Please try again in a moment.",
          timestamp: Date.now(),
          avatar: FavIconLogo,
          quickReplies: [],
        },
      ]);
      setQuickReplies([]);
    }
  };

  /** --- Enhanced: Close chat function --- **/
  const handleCloseChat = useCallback(() => {
    setIsOpen(false);
    logWithIcon.info("Chat closed by user");
  }, []);

  /** --- Toggle Chat --- **/
  const handleToggle = async () => {
    const next = !isOpen;
    setIsOpen(next);
    
    if (next) {
      setUnreadCount(0);
      
      logWithIcon.debug('🔍 Debug - handleToggle:', {
        userFromAuth: !!userFromAuth,
        userEmail: userFromAuth?.email,
        needsGuestForm,
        userFormSubmitted,
        guestInfo: guestInfo.email,
        messagesLength: messages.length
      });
      
      // CRITICAL: Check for authenticated user FIRST
      if (userFromAuth) {
        logWithIcon.success('✅ Authenticated user detected - initializing chat');
        await initializeChatSession();
        return;
      }
      
      // For unauthenticated users - check if guest form is needed
      if (!userFromAuth && !userFormSubmitted) {
        logWithIcon.guest('👤 Guest user needs form - showing modal');
        setShowGuestForm(true);
        return;
      }
      
      // If guest form completed, initialize chat
      if (!userFromAuth && userFormSubmitted) {
        logWithIcon.success('📝 Guest form completed - initializing chat');
        await initializeChatSession();
        return;
      }
      
      // Fallback - ensure chat is initialized
      logWithIcon.info('🔄 Fallback - initializing chat');
      await initializeChatSession();
    }
  };

  const handleGuestFormChange = (e) => {
    const { name, value } = e.target;
    setGuestInfo({
      ...guestInfo,
      [name]: value
    });
    
    // Clear specific error when user starts typing
    if (guestFormErrors[name]) {
      setGuestFormErrors({
        ...guestFormErrors,
        [name]: ''
      });
    }
  };

  const submitGuestForm = async () => {
  const errors = validateGuestForm();
  
  if (Object.keys(errors).length > 0) {
    setGuestFormErrors(errors);
    return;
  }

  setIsSubmittingGuest(true);
  
  try {
    // Clean the data before sending
    const cleanGuestInfo = {
      firstName: guestInfo.firstName.trim(),
      lastName: guestInfo.lastName.trim(),
      email: guestInfo.email.toLowerCase().trim(),
      phone: guestInfo.phone.trim()
    };

    logWithIcon.waiting('Submitting guest form:', cleanGuestInfo);
    
    const response = await API.post('/api/v1/guestUsers/create-guest-user', cleanGuestInfo);
    
    if (response.data.success) {
      const { firstName, lastName, email, phone } = response.data.data;
      
      logWithIcon.guest('Guest user created/updated:', email);
      
      // Update local state with clean data from server
      setGuestInfo({ firstName, lastName, email, phone });
      setShowGuestForm(false);
      setGuestFormErrors({});
      
      // Save to localStorage
      try {
        localStorage.setItem(STORAGE_USER_KEY, JSON.stringify({
          firstName,
          lastName,
          email,
          phone
        }));
      } catch (error) {
        logWithIcon.warning("Failed to save guest info to localStorage:", error);
      }
      
      // Initialize chat session
      logWithIcon.guest('Guest form submitted successfully, initializing chat...');
      await initializeChatSession();
      
      logWithIcon.success('Guest user created and chat initialized');
    }
  } catch (error) {
    logWithIcon.error("Error saving guest user:", error);
    setGuestFormErrors({
      submit: error.response?.data?.message || 'Failed to save guest information. Please try again.'
    });
  } finally {
    setIsSubmittingGuest(false);
  }
};

  // Enhanced: Handle input change with persistence
  const handleInputChange = useCallback((e) => {
    const value = e.target.value;
    setInput(value);
  }, []);

  // Enhanced: Handle key down with enter support
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter' && inputEnabled) {
      e.preventDefault();
      sendMessage();
    }
  }, [sendMessage]);

  const inputEnabled = userFormSubmitted && !showGuestForm;

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
          <div 
            className="chatbot-header"
            onClick={handleCloseChat}
            style={{ cursor: 'pointer' }}
            title="Click to close chat"
          >
            <div className="chat-header-left">
              <button
                className="chat-close-btn"
                onClick={(e) => {
                  e.stopPropagation(); // Prevent event bubbling
                  handleCloseChat();
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
                <div className="chat-title">Chat Assistant</div>
                <div className="chat-sub">
                  {businessInfo
                    ? businessInfo.isOpen
                      ? "We are online"
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

          {quickReplies.length > 0 && (
            <div className="chatbot-quickreplies global">
              {quickReplies.map((qr, i) => (
                <button
                  key={i}
                  className="quick-reply-btn"
                  onClick={() => handleQuickReply(qr)}
                >
                  {qr.text || qr}
                </button>
              ))}
            </div>
          )}

          <div className="chatbot-input">
            <input
              value={input}
              onChange={handleInputChange}
              placeholder={inputEnabled ? "Type a message..." : "Please fill the form to start chatting"}
              onKeyDown={handleKeyDown}
              disabled={!inputEnabled}
            />
            <button
              onClick={sendMessage}
              className={`send-btn ${!inputEnabled ? "disabled" : ""}`}
              disabled={!inputEnabled}
            >
              →
            </button>
          </div>
        </div>
      )}

      {/* Guest Form Modal */}
      <Modal
        isOpen={showGuestForm}
        onRequestClose={() => {
          if (!isSubmittingGuest) {
            setShowGuestForm(false);
            // If user closes modal without submitting, close the chat as well
            setIsOpen(false);
          }
        }}
        className="modal"
        overlayClassName="modal-overlay"
        shouldCloseOnOverlayClick={!isSubmittingGuest}
        shouldCloseOnEsc={!isSubmittingGuest}
      >
        <div className="guest-form">
          <div className="modal-header">
            <h2>Welcome to PSPL Support!</h2>
            <p>Please provide your details to start chatting with our assistant.</p>
          </div>
          
          {guestFormErrors.submit && (
            <div className="error-message" style={{ 
              color: '#e74c3c', 
              backgroundColor: '#ffebee', 
              padding: '10px', 
              borderRadius: '4px',
              marginBottom: '1rem',
              border: '1px solid #ffcdd2'
            }}>
              {guestFormErrors.submit}
            </div>
          )}
          
          <div className="form-group">
            <label>First Name *</label>
            <input
              type="text"
              name="firstName"
              value={guestInfo.firstName}
              onChange={handleGuestFormChange}
              disabled={isSubmittingGuest}
              placeholder="Enter your first name"
              autoFocus
              required
            />
            {guestFormErrors.firstName && (
              <span className="field-error" style={{ color: '#e74c3c', fontSize: '0.8rem', marginTop: '4px', display: 'block' }}>
                {guestFormErrors.firstName}
              </span>
            )}
          </div>
          
          <div className="form-group">
            <label>Last Name</label>
            <input
              type="text"
              name="lastName"
              value={guestInfo.lastName}
              onChange={handleGuestFormChange}
              disabled={isSubmittingGuest}
              placeholder="Enter your last name (optional)"
            />
          </div>
          
          <div className="form-group">
            <label>Email *</label>
            <input
              type="email"
              name="email"
              value={guestInfo.email}
              onChange={handleGuestFormChange}
              disabled={isSubmittingGuest}
              placeholder="Enter your email address"
              required
            />
            {guestFormErrors.email && (
              <span className="field-error" style={{ color: '#e74c3c', fontSize: '0.8rem', marginTop: '4px', display: 'block' }}>
                {guestFormErrors.email}
              </span>
            )}
          </div>
          
          <div className="form-group">
            <label>Phone</label>
            <input
              type="tel"
              name="phone"
              value={guestInfo.phone}
              onChange={handleGuestFormChange}
              disabled={isSubmittingGuest}
              placeholder="Enter your phone number (optional)"
            />
            {guestFormErrors.phone && (
              <span className="field-error" style={{ color: '#e74c3c', fontSize: '0.8rem', marginTop: '4px', display: 'block' }}>
                {guestFormErrors.phone}
              </span>
            )}
          </div>
          
          <div className="form-actions" style={{ marginTop: '1.5rem', display: 'flex', gap: '10px' }}>
            <button 
              onClick={submitGuestForm}
              disabled={isSubmittingGuest}
              style={{
                backgroundColor: '#2196f3',
                color: 'white',
                border: 'none',
                padding: '12px 24px',
                borderRadius: '4px',
                cursor: isSubmittingGuest ? 'not-allowed' : 'pointer',
                opacity: isSubmittingGuest ? 0.7 : 1,
                flex: 1
              }}
            >
              {isSubmittingGuest ? 'Starting Chat...' : 'Start Chat'}
            </button>
            <button 
              onClick={() => {
                setShowGuestForm(false);
                setIsOpen(false);
              }}
              disabled={isSubmittingGuest}
              style={{
                backgroundColor: '#f5f5f5',
                color: '#666',
                border: '1px solid #ddd',
                padding: '12px 24px',
                borderRadius: '4px',
                cursor: isSubmittingGuest ? 'not-allowed' : 'pointer',
                opacity: isSubmittingGuest ? 0.7 : 1
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ChatBotIcon;
