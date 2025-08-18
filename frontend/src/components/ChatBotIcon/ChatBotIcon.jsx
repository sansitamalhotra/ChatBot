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
  const [hasUserSentMessage, setHasUserSentMessage] = useState(false);
  
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

  // FIXED: Add proper modal reset function
  const resetGuestForm = useCallback(() => {
    setShowGuestForm(false);
    setGuestFormErrors({});
    setIsSubmittingGuest(false);
    // Don't reset guestInfo data as user might want to retry
  }, []);

  // FIXED: Add proper form cancellation that clears everything
  const cancelGuestForm = useCallback(() => {
    setShowGuestForm(false);
    setGuestFormErrors({});
    setIsSubmittingGuest(false);
    setGuestFormSubmitted(false);
    
    // Clear any pending state
    setHasUserSentMessage(false);
    
    // Remove the last user message if it was added before form submission
    setMessages(prev => {
      const lastMessage = prev[prev.length - 1];
      if (lastMessage && lastMessage.from === 'user' && !guestFormSubmitted) {
        return prev.slice(0, -1);
      }
      return prev;
    });
    
    // Clear localStorage guest info
    try {
      localStorage.removeItem(STORAGE_USER_KEY);
    } catch (error) {
      console.warn("Failed to clear guest info from localStorage:", error);
    }
    
    // Reset guest info
    setGuestInfo({
      firstName: '',
      lastName: '',
      email: '',
      phone: ''
    });
    
    console.log('Guest form cancelled and state reset');
  }, [guestFormSubmitted]);

  // FIXED: Enhanced modal overlay click handler
  const handleModalOverlayClick = useCallback((e) => {
    // Only close if clicking directly on the overlay (not on modal content)
    if (e.target === e.currentTarget && !isSubmittingGuest) {
      resetGuestForm();
    }
  }, [isSubmittingGuest, resetGuestForm]);

  // FIXED: Enhanced ESC key handler
  useEffect(() => {
    const handleEscKey = (e) => {
      if (e.key === 'Escape' && showGuestForm && !isSubmittingGuest) {
        resetGuestForm();
      }
    };

    if (showGuestForm) {
      document.addEventListener('keydown', handleEscKey);
      return () => document.removeEventListener('keydown', handleEscKey);
    }
  }, [showGuestForm, isSubmittingGuest, resetGuestForm]);

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

  // FIXED: Enhanced form validation with better error handling
  const validateGuestForm = useCallback(() => {
    const errors = {};
    
    if (!guestInfo.firstName.trim()) {
      errors.firstName = 'First name is required';
    } else if (guestInfo.firstName.trim().length < 2) {
      errors.firstName = 'First name must be at least 2 characters';
    }
    
    if (!guestInfo.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(guestInfo.email.trim())) {
      errors.email = 'Please enter a valid email address';
    }
    
    if (guestInfo.phone && guestInfo.phone.trim()) {
      // More flexible phone validation
      const phoneRegex = /^[\d\s+\-()\.]+$/;
      if (!phoneRegex.test(guestInfo.phone)) {
        errors.phone = 'Please enter a valid phone number';
      }
    }
    
    return errors;
  }, [guestInfo]);

  // FIXED: Enhanced guest form change handler with real-time validation clearing
  const handleGuestFormChange = useCallback((e) => {
    const { name, value } = e.target;
    
    setGuestInfo(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear specific field error when user starts typing
    if (guestFormErrors[name]) {
      setGuestFormErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
    
    // Clear submit error when user makes changes
    if (guestFormErrors.submit) {
      setGuestFormErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.submit;
        return newErrors;
      });
    }
  }, [guestFormErrors]);

  // FIXED: Enhanced submit function with better error handling
  const submitGuestForm = useCallback(async () => {
    const errors = validateGuestForm();
    
    if (Object.keys(errors).length > 0) {
      setGuestFormErrors(errors);
      return;
    }

    setIsSubmittingGuest(true);
    setGuestFormErrors({}); // Clear any previous errors
    
    try {
      const response = await API.post('/api/v1/guestUsers/create-guest-user', {
        firstName: guestInfo.firstName.trim(),
        lastName: guestInfo.lastName.trim(),
        email: guestInfo.email.trim(),
        phone: guestInfo.phone.trim()
      });
      
      if (response.data.success) {
        const { firstName, lastName, email, phone } = response.data.data;
        
        // Update guest info with server response
        setGuestInfo({ firstName, lastName, email, phone });
        setGuestFormSubmitted(true);
        setShowGuestForm(false);
        setGuestFormErrors({});
        
        // Persist to localStorage
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
        
        // Create session and send pending message
        console.log('Guest form submitted, creating session...');
        if (socket && socket.connected && !session) {
          await createSession();
        }
        
        // Send the last user message after form submission
        const lastUserMessage = messages[messages.length - 1];
        if (lastUserMessage && lastUserMessage.from === 'user') {
          console.log('Sending guest user message to server after form submission...');
          // Small delay to ensure session is created
          setTimeout(() => {
            if (socket && socket.connected && session) {
              socket.emit("message:send", {
                sessionId: session?._id || session?.id,
                message: lastUserMessage.text,
                messageType: "text",
              });
            }
          }, 1000);
        }
        
        logWithIcon.success('Guest user created and session initialized');
      } else {
        throw new Error(response.data.message || 'Failed to create guest user');
      }
    } catch (error) {
      console.error("Error saving guest user:", error);
      setGuestFormErrors({
        submit: error.response?.data?.message || 
                 error.message || 
                 'Failed to save guest information. Please try again.'
      });
    } finally {
      setIsSubmittingGuest(false);
    }
  }, [guestInfo, validateGuestForm, socket, session, messages, createSession]);

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

      {/* FIXED: Guest Form Modal with proper event handling and styling */}
      {showGuestForm && (
        <div 
          className={`modal-overlay ${isSubmittingGuest ? 'submitting' : ''}`}
          onClick={handleModalOverlayClick}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '1rem',
            backdropFilter: 'blur(4px)'
          }}
        >
          <div 
            className="modal-container" 
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: 'white',
              borderRadius: '16px',
              maxWidth: '480px',
              width: '100%',
              maxHeight: '90vh',
              overflow: 'hidden',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
              position: 'relative',
              animation: 'modalSlideIn 0.3s ease-out'
            }}
          >
            {/* Enhanced Header */}
            <div className="modal-header" style={{
              padding: '2rem 2rem 1rem',
              textAlign: 'center',
              background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
              borderBottom: '1px solid #e2e8f0',
              position: 'relative'
            }}>
              {/* Close button in top-right corner */}
              <button
                onClick={resetGuestForm}
                disabled={isSubmittingGuest}
                style={{
                  position: 'absolute',
                  top: '1rem',
                  right: '1rem',
                  background: 'none',
                  border: 'none',
                  fontSize: '1.25rem',
                  color: '#64748b',
                  cursor: isSubmittingGuest ? 'not-allowed' : 'pointer',
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s ease',
                  opacity: isSubmittingGuest ? 0.5 : 1
                }}
                onMouseEnter={(e) => {
                  if (!isSubmittingGuest) {
                    e.target.style.backgroundColor = '#f1f5f9';
                    e.target.style.color = '#374151';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSubmittingGuest) {
                    e.target.style.backgroundColor = 'transparent';
                    e.target.style.color = '#64748b';
                  }
                }}
              >
                <i className="fas fa-times" onClick={cancelGuestForm}></i>
              </button>

              <div className="modal-header-content">
                <div className="modal-icon" style={{
                  width: '48px',
                  height: '48px',
                  backgroundColor: '#3b82f6',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 1rem',
                  color: 'white',
                  fontSize: '1.5rem'
                }}>
                  <i className="fas fa-user-plus"></i>
                </div>
                <h2 className="modal-title" style={{
                  fontSize: '1.5rem',
                  fontWeight: '700',
                  color: '#1e293b',
                  margin: '0 0 0.5rem'
                }}>
                  Let's get started!
                </h2>
                <p className="modal-subtitle" style={{
                  color: '#64748b',
                  fontSize: '0.95rem',
                  lineHeight: '1.5',
                  margin: 0
                }}>
                  Help us provide you with personalized assistance by sharing a few details.
                </p>
              </div>
            </div>

            {/* Enhanced Form Body */}
            <div className="modal-body" style={{
              padding: '1.5rem 2rem',
              maxHeight: '400px',
              overflowY: 'auto'
            }}>
              {guestFormErrors.submit && (
                <div className="submit-error" style={{
                  backgroundColor: '#fef2f2',
                  border: '1px solid #fecaca',
                  borderRadius: '8px',
                  padding: '0.75rem',
                  marginBottom: '1rem',
                  color: '#dc2626',
                  fontSize: '0.875rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  <i className="fas fa-exclamation-triangle"></i>
                  <div>
                    <strong>Unable to proceed:</strong> {guestFormErrors.submit}
                  </div>
                </div>
              )}

              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="form-label" style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  color: '#374151',
                  marginBottom: '0.5rem'
                }}>
                  First Name <span className="required" style={{ color: '#dc2626' }}>*</span>
                </label>
                <input
                  type="text"
                  name="firstName"
                  value={guestInfo.firstName}
                  onChange={handleGuestFormChange}
                  disabled={isSubmittingGuest}
                  className={`form-input ${
                    guestFormErrors.firstName ? 'error' : 
                    guestInfo.firstName.trim() ? 'success' : ''
                  }`}
                  placeholder="Enter your first name"
                  autoComplete="given-name"
                  required
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: `2px solid ${
                      guestFormErrors.firstName ? '#dc2626' :
                      guestInfo.firstName.trim() ? '#10b981' : '#d1d5db'
                    }`,
                    borderRadius: '8px',
                    fontSize: '0.95rem',
                    transition: 'border-color 0.2s, box-shadow 0.2s',
                    outline: 'none',
                    opacity: isSubmittingGuest ? 0.7 : 1
                  }}
                  onFocus={(e) => {
                    if (!guestFormErrors.firstName) {
                      e.target.style.borderColor = '#3b82f6';
                      e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
                    }
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = guestFormErrors.firstName ? '#dc2626' :
                      guestInfo.firstName.trim() ? '#10b981' : '#d1d5db';
                    e.target.style.boxShadow = 'none';
                  }}
                />
                {guestFormErrors.firstName && (
                  <div className="error-message" style={{
                    color: '#dc2626',
                    fontSize: '0.8rem',
                    marginTop: '0.25rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem'
                  }}>
                    <i className="fas fa-exclamation-circle" style={{ fontSize: '0.75rem' }}></i>
                    {guestFormErrors.firstName}
                  </div>
                )}
              </div>

              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="form-label" style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  color: '#374151',
                  marginBottom: '0.5rem'
                }}>
                  Last Name
                </label>
                <input
                  type="text"
                  name="lastName"
                  value={guestInfo.lastName}
                  onChange={handleGuestFormChange}
                  disabled={isSubmittingGuest}
                  className={`form-input ${
                    guestInfo.lastName.trim() ? 'success' : ''
                  }`}
                  placeholder="Enter your last name"
                  autoComplete="family-name"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: `2px solid ${
                      guestInfo.lastName.trim() ? '#10b981' : '#d1d5db'
                    }`,
                    borderRadius: '8px',
                    fontSize: '0.95rem',
                    transition: 'border-color 0.2s, box-shadow 0.2s',
                    outline: 'none',
                    opacity: isSubmittingGuest ? 0.7 : 1
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#3b82f6';
                    e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = guestInfo.lastName.trim() ? '#10b981' : '#d1d5db';
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>

              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="form-label" style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  color: '#374151',
                  marginBottom: '0.5rem'
                }}>
                  Email Address <span className="required" style={{ color: '#dc2626' }}>*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  value={guestInfo.email}
                  onChange={handleGuestFormChange}
                  disabled={isSubmittingGuest}
                  className={`form-input ${
                    guestFormErrors.email ? 'error' : 
                    guestInfo.email.trim() && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(guestInfo.email) ? 'success' : ''
                  }`}
                  placeholder="your.email@example.com"
                  autoComplete="email"
                  required
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: `2px solid ${
                      guestFormErrors.email ? '#dc2626' :
                      guestInfo.email.trim() && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(guestInfo.email) ? '#10b981' : '#d1d5db'
                    }`,
                    borderRadius: '8px',
                    fontSize: '0.95rem',
                    transition: 'border-color 0.2s, box-shadow 0.2s',
                    outline: 'none',
                    opacity: isSubmittingGuest ? 0.7 : 1
                  }}
                  onFocus={(e) => {
                    if (!guestFormErrors.email) {
                      e.target.style.borderColor = '#3b82f6';
                      e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
                    }
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = guestFormErrors.email ? '#dc2626' :
                      guestInfo.email.trim() && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(guestInfo.email) ? '#10b981' : '#d1d5db';
                    e.target.style.boxShadow = 'none';
                  }}
                />
                {guestFormErrors.email && (
                  <div className="error-message" style={{
                    color: '#dc2626',
                    fontSize: '0.8rem',
                    marginTop: '0.25rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem'
                  }}>
                    <i className="fas fa-exclamation-circle" style={{ fontSize: '0.75rem' }}></i>
                    {guestFormErrors.email}
                  </div>
                )}
              </div>

              <div className="form-group" style={{ marginBottom: '0' }}>
                <label className="form-label" style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  color: '#374151',
                  marginBottom: '0.5rem'
                }}>
                  Phone Number
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={guestInfo.phone}
                  onChange={handleGuestFormChange}
                  disabled={isSubmittingGuest}
                  className={`form-input ${
                    guestFormErrors.phone ? 'error' : 
                    guestInfo.phone.trim() ? 'success' : ''
                  }`}
                  placeholder="+1 (555) 123-4567"
                  autoComplete="tel"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: `2px solid ${
                      guestFormErrors.phone ? '#dc2626' :
                      guestInfo.phone.trim() ? '#10b981' : '#d1d5db'
                    }`,
                    borderRadius: '8px',
                    fontSize: '0.95rem',
                    transition: 'border-color 0.2s, box-shadow 0.2s',
                    outline: 'none',
                    opacity: isSubmittingGuest ? 0.7 : 1
                  }}
                  onFocus={(e) => {
                    if (!guestFormErrors.phone) {
                      e.target.style.borderColor = '#3b82f6';
                      e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
                    }
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = guestFormErrors.phone ? '#dc2626' :
                      guestInfo.phone.trim() ? '#10b981' : '#d1d5db';
                    e.target.style.boxShadow = 'none';
                  }}
                />
                {guestFormErrors.phone && (
                  <div className="error-message" style={{
                    color: '#dc2626',
                    fontSize: '0.8rem',
                    marginTop: '0.25rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem'
                  }}>
                    <i className="fas fa-exclamation-circle" style={{ fontSize: '0.75rem' }}></i>
                    {guestFormErrors.phone}
                  </div>
                )}
              </div>
            </div>

            {/* FIXED: Enhanced Actions with proper styling and handlers */}
            <div className="modal-actions" style={{ 
              display: 'flex',
              gap: '0.75rem',
              justifyContent: 'flex-end',
              padding: '1.5rem 2rem 2rem',
              backgroundColor: '#ffffff',
              borderTop: '1px solid #f1f3f4',
              flexShrink: 0,
              position: 'relative',
              zIndex: 10
            }}>
              <button 
                type="button"
                onClick={cancelGuestForm} // FIXED: Use proper cancel handler
                disabled={isSubmittingGuest}
                className="btn btn-secondary"
                style={{ 
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  padding: '0.875rem 1.5rem',
                  borderRadius: '12px',
                  fontSize: '0.95rem',
                  fontWeight: '600',
                  cursor: isSubmittingGuest ? 'not-allowed' : 'pointer',
                  backgroundColor: '#f8fafc',
                  color: '#64748b',
                  border: '2px solid #e2e8f0',
                  minHeight: '44px',
                  minWidth: '100px',
                  transition: 'all 0.2s ease',
                  opacity: isSubmittingGuest ? 0.5 : 1
                }}
                onMouseEnter={(e) => {
                  if (!isSubmittingGuest) {
                    e.target.style.backgroundColor = '#f1f5f9';
                    e.target.style.borderColor = '#cbd5e1';
                    e.target.style.transform = 'translateY(-1px)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSubmittingGuest) {
                    e.target.style.backgroundColor = '#f8fafc';
                    e.target.style.borderColor = '#e2e8f0';
                    e.target.style.transform = 'translateY(0)';
                  }
                }}
              >
                <i className="fas fa-times"></i>
                <span>Cancel</span>
              </button>
              <button 
                type="button"
                onClick={submitGuestForm}
                disabled={isSubmittingGuest}
                className={`btn btn-primary ${isSubmittingGuest ? 'btn-loading' : ''}`}
                style={{ 
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  padding: '0.875rem 1.5rem',
                  borderRadius: '12px',
                  fontSize: '0.95rem',
                  fontWeight: '600',
                  cursor: isSubmittingGuest ? 'not-allowed' : 'pointer',
                  background: isSubmittingGuest 
                    ? 'linear-gradient(135deg, #64748b 0%, #94a3b8 100%)' 
                    : 'linear-gradient(135deg, #0b6ea9 0%, #1e88e5 100%)',
                  color: 'white',
                  border: '2px solid transparent',
                  minHeight: '44px',
                  minWidth: '120px',
                  transition: 'all 0.2s ease',
                  opacity: isSubmittingGuest ? 0.8 : 1,
                  boxShadow: isSubmittingGuest ? 'none' : '0 4px 12px rgba(59, 130, 246, 0.15)'
                }}
                onMouseEnter={(e) => {
                  if (!isSubmittingGuest) {
                    e.target.style.transform = 'translateY(-1px)';
                    e.target.style.boxShadow = '0 6px 16px rgba(59, 130, 246, 0.25)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSubmittingGuest) {
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.15)';
                  }
                }}
              >
                {isSubmittingGuest ? (
                  <>
                    <i className="fas fa-spinner fa-spin"></i>
                    <span>Submitting...</span>
                  </>
                ) : (
                  <>
                    <i className="fas fa-arrow-right"></i>
                    <span>Continue Chat</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FIXED: Add CSS for modal animations */}
      <style jsx>{`
        @keyframes modalSlideIn {
          from {
            opacity: 0;
            transform: scale(0.95) translateY(-10px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }

        .modal-overlay {
          backdrop-filter: blur(4px);
          -webkit-backdrop-filter: blur(4px);
        }

        .modal-container {
          animation: modalSlideIn 0.3s ease-out;
        }

        .form-input:focus {
          border-color: #3b82f6 !important;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1) !important;
        }

        .form-input.error:focus {
          border-color: #dc2626 !important;
          box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.1) !important;
        }

        .btn:active {
          transform: translateY(0) !important;
        }

        .btn:disabled {
          cursor: not-allowed !important;
          transform: none !important;
        }

        .submit-error {
          animation: errorSlideIn 0.3s ease-out;
        }

        @keyframes errorSlideIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};

export default ChatBotIcon;
