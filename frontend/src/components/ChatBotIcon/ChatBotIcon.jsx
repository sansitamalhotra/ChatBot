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
const STORAGE_INPUT_KEY = process.env.REACT_APP_CHAT_INPUT_KEY || "chat_widget_input_text"; // NEW: Input persistence key

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
  
  // NEW: Track pending messages to prevent duplicates
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

  // FIXED: Determine if user needs to fill guest form
  const needsGuestForm = useMemo(() => {
    const result = !userFromAuth && !userFormSubmitted;
    logWithIcon.guest('Needs guest form:', {
      userFromAuth: !!userFromAuth,
      userFormSubmitted,
      result
    });
    return result;
  }, [userFromAuth, userFormSubmitted]);

  const storageKey = useMemo(
    () => STORAGE_MESSAGES_PREFIX + (session?._id || session?.id || "guest"),
    [session]
  );

  // FIX 2: Load persisted input text on mount
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

  // FIX 2: Persist input text changes (debounced to avoid excessive writes)
  useEffect(() => {
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
    }, 300); // Debounce for 300ms

    return () => clearTimeout(timeoutId);
  }, [input]);

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
        
        // Set guest form as submitted if we have required fields
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
      if (raw) setMessages(JSON.parse(raw));
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

  // FIXED: Enhanced handleIncomingMessage with better duplicate prevention
  const handleIncomingMessage = useCallback(
    (rawMsg) => {
      const msg = normalizeMessage(rawMsg);
      if (!msg) return;

      // Check if this message already exists (by ID or by content and timestamp)
      setMessages((prevMessages) => {
        const messageExists = prevMessages.some(existingMsg => 
          existingMsg.id === msg.id || 
          (existingMsg.text === msg.text && 
           existingMsg.from === msg.from && 
           Math.abs(existingMsg.timestamp - msg.timestamp) < 1000) // Within 1 second
        );

        if (messageExists) {
          console.log('Duplicate message detected, skipping:', msg);
          return prevMessages;
        }

        // Remove from pending if this is a confirmation of a sent message
        if (msg.from === 'user') {
          setPendingMessages(prev => {
            const newPending = new Set(prev);
            // Remove any pending message with similar content
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

      // Only update quick replies for bot messages
      if (msg.from === 'bot' && msg.quickReplies.length > 0) {
        // Don't show quick replies in global footer - they'll be shown with the message
        // setQuickReplies(msg.quickReplies);
      }

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

    // FIXED: Proper session data creation based on user type
    if (userFromAuth) {
      // For authenticated users - use their actual data
      console.log('Creating session for authenticated user:', userFromAuth.email);
      sessionData = {
        entryPoint: "widget",
        selectedOption: "general_inquiry",
        timezone,
        firstName: userFromAuth.firstname || userFromAuth.firstName,
        lastName: userFromAuth.lastname || userFromAuth.lastName,
        email: userFromAuth.email,
        phone: userFromAuth.phone || '',
        // Don't send guestEmail for authenticated users
        metadata: {
          authenticatedUser: true,
          userId: userFromAuth._id || userFromAuth.id
        }
      };
    } else {
      // For guest users - use guest info
      console.log('Creating session for guest user:', guestInfo);
      const { firstName, lastName, email, phone } = guestInfo;
      
      // Save guest info to localStorage
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
        guestEmail: email, // This tells backend it's a guest user
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

  /** --- Send message --- FIXED to prevent duplicates **/
  const sendMessage = useCallback(() => {
    if (!input.trim()) return;
    
    const text = input.trim();
    const messageId = `local_${Date.now()}_${Math.random()}`;
    
    // Add to pending messages to track it
    setPendingMessages(prev => new Set([...prev, messageId]));
    
    // Clear input state and localStorage immediately
    setInput("");
    try {
      localStorage.removeItem(STORAGE_INPUT_KEY);
    } catch (error) {
      console.warn("Failed to clear input from localStorage:", error);
    }
    
    // Only send via socket, don't add to local messages
    // The message will be added when it comes back from the server
    if (socket && socket.connected) {
      socket.emit("message:send", {
        sessionId: session?._id || session?.id,
        message: text,
        messageType: "text",
      });
    } else {
      // If no socket connection, add locally as fallback
      const draft = {
        id: messageId,
        from: "user",
        text,
        timestamp: Date.now(),
        avatar: userFromAuth
          ? getProfileImageSrc(userFromAuth?.photo)
          : defaultAvatar,
      };
      setMessages((prev) => [...prev, draft]);
      // Remove from pending since we added it locally
      setPendingMessages(prev => {
        const newPending = new Set(prev);
        newPending.delete(messageId);
        return newPending;
      });
    }
    
    // FIXED: Show guest form AFTER sending the first message for unauthenticated users
    if (!userFromAuth && !guestFormSubmitted) {
      console.log('Guest user sent first message, showing form for data collection...');
      setTimeout(() => {
        setShowGuestForm(true);
      }, 500); // Small delay so user sees their message first
    }
  }, [input, session, socket, userFromAuth, guestFormSubmitted]);
    
  const handleQuickReply = useCallback(
    (option) => {
      const value = option.value || option.text || option;
      const text = option.text || value;
      const messageId = `local_qr_${Date.now()}_${Math.random()}`;

      console.log("Quick reply selected:", value);
      if(value === "Search Jobs" || value === "Search for jobs" || value === "search_job" || value === "View all jobs") {
        console.log("Search Jobs clicked:", value);
        window.open("Search-Jobs", "_blank", "noopener,noreferrer");
      }

      // Add to pending messages
      setPendingMessages(prev => new Set([...prev, messageId]));
      
      // Clear any existing quick replies
      // setQuickReplies([]);
      
      // Send via socket only
      if (socket && socket.connected && session) {
        socket.emit("message:send", {
          sessionId: session._id || session.id,
          message: value,
          messageType: "option_selection",
        });
      } else {
        // Fallback if no socket
        const draft = {
          id: messageId,
          from: "user",
          text,
          timestamp: Date.now(),
          avatar: userFromAuth
            ? getProfileImageSrc(userFromAuth?.photo)
            : defaultAvatar,
        };
        setMessages((prev) => [...prev, draft]);
        setPendingMessages(prev => {
          const newPending = new Set(prev);
          newPending.delete(messageId);
          return newPending;
        });
      }
    },
    [session, socket, userFromAuth]
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

  /** --- Initialize chat session and messages --- **/
  const initializeChatSession = async () => {
    console.log('Initializing chat session...', {
      hasSession: !!session,
      hasSocket: !!socket,
      isConnected: socket?.connected,
      userFormSubmitted,
      defaultMessagesLoaded
    });
    
    // FIX 4: Load default messages only once and prevent duplicates
    if (messages.length === 0 && !defaultMessagesLoaded) {
      setDefaultMessagesLoaded(true); // Prevent future duplicate loads
      
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
    
    // Create session only if user has submitted form/is authenticated
    if (!session && socket && socket.connected && userFormSubmitted) {
      console.log('Creating session...');
      await createSession();
    }
  };

  // FIX 1: Close chat when chat header is clicked
  const handleHeaderClick = () => {
    setIsOpen(false);
  };

  /** --- Toggle Chat --- **/
  const handleToggle = async () => {
    const next = !isOpen;
    setIsOpen(next);
    
    if (next) {
      setUnreadCount(0);
      
      console.log('Debug - handleToggle:', {
        userFromAuth: !!userFromAuth,
        needsGuestForm,
        guestInfo,
        userFormSubmitted
      });
      
      // FIXED: Show guest form only for unauthenticated users without guest info
      if (needsGuestForm) {
        console.log('Showing guest form...');
        setShowGuestForm(true);
        // Still initialize default messages even when showing form
        await initializeChatSession();
        return;
      }
      
      // Initialize chat for authenticated users or users with guest info
      console.log('Initializing chat...');
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
      const response = await API.post('/api/v1/guestUsers/create-guest-user', guestInfo);
      
      if (response.data.success) {
        const { firstName, lastName, email, phone } = response.data.data;
        
        // Update local state
        setGuestInfo({ firstName, lastName, email, phone });
        setGuestFormSubmitted(true);
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
          console.warn("Failed to save guest info to localStorage:", error);
        }
        
        // Initialize chat session now that guest info is available
        console.log('Guest form submitted successfully, initializing chat session...');
        await initializeChatSession();
        
        logWithIcon.success('Guest user created and chat initialized');
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

  const inputEnabled = true;

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
          {/* FIX 1: Make entire header clickable to close chat */}
          <div className="chatbot-header" onClick={handleHeaderClick} style={{ cursor: 'pointer' }}>
            <div className="chat-header-left">
              <button
                className="chat-close-btn"
                onClick={(e) => {
                  e.stopPropagation(); // Prevent double trigger
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
                  sendMessage(); // This will trigger guest form if needed
                }
              }}
              disabled={false} // Always enabled
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

      {/* FIXED: Guest Form Modal - Now properly triggered */}
      <Modal
        isOpen={showGuestForm}
        onRequestClose={() => !isSubmittingGuest && setShowGuestForm(false)}
        className="modal"
        overlayClassName="modal-overlay"
        shouldCloseOnOverlayClick={!isSubmittingGuest}
      >
        <div className="guest-form">
          <h2>Please provide your details to start chatting</h2>
          
          {guestFormErrors.submit && (
            <div className="error-message" style={{ color: 'red', marginBottom: '1rem' }}>
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
              required
            />
            {guestFormErrors.firstName && (
              <span className="field-error" style={{ color: 'red', fontSize: '0.8rem' }}>
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
              required
            />
            {guestFormErrors.email && (
              <span className="field-error" style={{ color: 'red', fontSize: '0.8rem' }}>
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
            />
            {guestFormErrors.phone && (
              <span className="field-error" style={{ color: 'red', fontSize: '0.8rem' }}>
                {guestFormErrors.phone}
              </span>
            )}
          </div>
          
          <div className="form-actions">
            <button 
              onClick={submitGuestForm}
              disabled={isSubmittingGuest}
            >
              {isSubmittingGuest ? 'Submitting...' : 'Submit'}
            </button>
            <button 
              onClick={() => setShowGuestForm(false)}
              disabled={isSubmittingGuest}
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
