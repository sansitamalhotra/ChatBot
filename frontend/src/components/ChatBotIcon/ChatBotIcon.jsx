// frontend/src/components/ChatBotIcon/ChatBotIcon.jsx
import React, { useEffect, useRef, useState, useMemo, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import ReactDOM from "react-dom";
import API from "../../helpers/API";
import { useSocket } from "../../Context/SocketContext";
import { useAuth } from "../../Context/AuthContext";
import { logWithIcon } from "../../utils/consoleIcons";
import "./ChatBotIcon.css";
import beepUrl from "./ping";
import FavIconLogo from "./FaviIcon-Logo.png";
import Modal from 'react-modal';

Modal.setAppElement('#root');

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

// Fixed fetchBusinessHours function with proper timezone and error handling
async function fetchBusinessHours() {
  try {
    logWithIcon.info('Fetching business hours with Toronto timezone...');
    const res = await API.get(`/api/v1/businessHours/checkBusinessHoursStatus`, {
      params: {
        timezone: 'America/Toronto' // Toronto timezone (EST/EDT)
      }
    });
    
    if (res.data && res.data.success && res.data.data) {
      const businessData = res.data.data;
      logWithIcon.success('Business hours fetched successfully:', {
        isOpen: businessData.isOpen,
        timezone: businessData.timezone,
        currentTime: businessData.currentTime
      });
      return businessData;
    } else {
      logWithIcon.warning('Business hours API returned unexpected format:', res.data);
      return null;
    }
  } catch (err) {
    logWithIcon.error("Failed to fetch business hours:", err);
    return null;
  }
}

const ChatBotIcon = () => {
  const { socket, isConnected, ensureSocketConnection } = useSocket();
  const [auth] = useAuth();
  const userFromAuth = auth?.user;
  const navigate = useNavigate();

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
  const [showQuitConfirm, setShowQuitConfirm] = useState(false);
  const [pendingMessages, setPendingMessages] = useState(new Set());
  const [isQuitting, setIsQuitting] = useState(false);

  const [guestInfo, setGuestInfo] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: ''
  });

  const audioRef = useRef(null);
  const messagesEndRef = useRef(null);
  const quitTimeoutRef = useRef(null);
  const businessHoursIntervalRef = useRef(null);

  const userFormSubmitted = useMemo(() => {
    if (userFromAuth) {
      logWithIcon.success('User is authenticated:', userFromAuth.email);
      return true;
    }
    logWithIcon.active('Guest form submission status:', guestFormSubmitted);
    return guestFormSubmitted;
  }, [userFromAuth, guestFormSubmitted]);

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

  // Enhanced quit functionality with comprehensive cleanup
  const handleQuit = useCallback(async () => {
    if (isQuitting) {
      console.warn('Quit already in progress, ignoring duplicate request');
      return;
    }

    console.log('Starting enhanced quit sequence...');
    setIsQuitting(true);

    try {
      // 1. Clear business hours interval immediately
      if (businessHoursIntervalRef.current) {
        clearInterval(businessHoursIntervalRef.current);
        businessHoursIntervalRef.current = null;
      }

      // 2. Immediately clear UI state to prevent freezing
      setShowQuitConfirm(false);
      setIsOpen(false);

      // 3. Use setTimeout to defer heavy operations
      setTimeout(() => {
        // 4. Socket cleanup (non-blocking)
        if (socket?.connected && session) {
          socket.emit('session:end', { 
            sessionId: session._id || session.id 
          });
          console.log('Socket session end signal sent');
        }

        // 5. Batch state updates to prevent multiple re-renders
        ReactDOM.unstable_batchedUpdates(() => {
          setMessages([]);
          setSession(null);
          setUnreadCount(0);
          setDefaultMessagesLoaded(false);
          setHasUserSentMessage(false);
          setPendingMessages(new Set());
          setInput("");
          setBusinessInfo(null); // Clear business info on quit
        });

        // 6. Reset guest form states if applicable
        if (!userFromAuth) {
          setShowGuestForm(false);
          setGuestFormSubmitted(false);
          setGuestFormErrors({});
          setIsSubmittingGuest(false);
          setGuestInfo({
            firstName: '',
            lastName: '',
            email: '',
            phone: ''
          });
        }

        // 7. localStorage cleanup (asynchronous)
        setTimeout(() => {
          try {
            const currentSessionKey = session ? (STORAGE_MESSAGES_PREFIX + (session.id || session._id)) : null;
            
            if (currentSessionKey) {
              localStorage.removeItem(currentSessionKey);
              console.log(`Cleared current session: ${currentSessionKey}`);
            }
            
            // Clean up all chat-related storage
            const keysToRemove = [];
            for (let i = 0; i < localStorage.length; i++) {
              const key = localStorage.key(i);
              if (key && key.startsWith(STORAGE_MESSAGES_PREFIX)) {
                keysToRemove.push(key);
              }
            }
            
            keysToRemove.forEach(key => {
              localStorage.removeItem(key);
              console.log(`Cleaned up: ${key}`);
            });
            
            // Clear input and guest info if needed
            localStorage.removeItem(STORAGE_INPUT_KEY);
            
            if (!userFromAuth) {
              localStorage.removeItem(STORAGE_USER_KEY);
              console.log('Cleared guest user information');
            }
            
            console.log('localStorage cleanup completed');
          } catch (error) {
            console.warn('localStorage cleanup error (non-critical):', error);
          }
        }, 0);

        console.log('Enhanced quit sequence completed successfully');
        
        // 8. Reset isQuitting after cleanup is complete
        setIsQuitting(false);
      }, 0);
      
    } catch (error) {
      console.error('Error during quit sequence:', error);
      setIsQuitting(false);
    }
  }, [session, userFromAuth, socket]);

  // Reset chat to completely initial state
  const resetChatToInitialState = useCallback(() => {
    if (isQuitting) return; // Prevent conflicts
    
    console.log('Resetting chat to initial state...');
    
    // Clear business hours interval
    if (businessHoursIntervalRef.current) {
      clearInterval(businessHoursIntervalRef.current);
      businessHoursIntervalRef.current = null;
    }
    
    // Batch all state updates
    const resetState = () => {
      setInput("");
      setIsOpen(false);
      setSession(null);
      setMessages([]);
      setBusinessInfo(null);
      setUnreadCount(0);
      setShowGuestForm(false);
      setIsSubmittingGuest(false);
      setGuestFormSubmitted(false);
      setGuestFormErrors({});
      setDefaultMessagesLoaded(false);
      setHasUserSentMessage(false);
      setShowQuitConfirm(false);
      setPendingMessages(new Set());
      
      if (!userFromAuth) {
        setGuestInfo({
          firstName: '',
          lastName: '',
          email: '',
          phone: ''
        });
      }
    };

    requestAnimationFrame(resetState);
    console.log('Chat state reset completed');
  }, [userFromAuth, isQuitting]);

  const resetGuestForm = useCallback(() => {
    if (isQuitting) return;
    
    setShowGuestForm(false);
    setGuestFormErrors({});
    setIsSubmittingGuest(false);
  }, [isQuitting]);

  const cancelGuestForm = useCallback(() => {
    if (isQuitting) return;
    
    setShowGuestForm(false);
    setGuestFormErrors({});
    setIsSubmittingGuest(false);
    setGuestFormSubmitted(false);
    setHasUserSentMessage(false);

    setMessages(prev => {
      const lastMessage = prev[prev.length - 1];
      if (lastMessage && lastMessage.from === 'user' && !guestFormSubmitted) {
        return prev.slice(0, -1);
      }
      return prev;
    });

    try {
      localStorage.removeItem(STORAGE_USER_KEY);
    } catch (error) {
      console.warn("Failed to clear guest info from localStorage:", error);
    }

    setGuestInfo({
      firstName: '',
      lastName: '',
      email: '',
      phone: ''
    });

    console.log('Guest form cancelled and state reset');
  }, [guestFormSubmitted, isQuitting]);

  const handleModalOverlayClick = useCallback((e) => {
    if (e.target === e.currentTarget && !isSubmittingGuest && !isQuitting) {
      resetGuestForm();
    }
  }, [isSubmittingGuest, isQuitting, resetGuestForm]);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (quitTimeoutRef.current) {
        clearTimeout(quitTimeoutRef.current);
      }
      if (businessHoursIntervalRef.current) {
        clearInterval(businessHoursIntervalRef.current);
        businessHoursIntervalRef.current = null;
      }
    };
  }, []);

  // FIXED: Real-time business hours checking with proper error handling and logging
  useEffect(() => {
    // Clear any existing interval
    if (businessHoursIntervalRef.current) {
      clearInterval(businessHoursIntervalRef.current);
      businessHoursIntervalRef.current = null;
    }

    // Only set up interval if chat is open and not quitting
    if (isOpen && !isQuitting) {
      console.log('Setting up business hours real-time monitoring...');
      
      // Initial fetch with proper error handling
      const initialFetch = async () => {
        try {
          const biz = await fetchBusinessHours();
          if (biz) {
            console.log('Initial business hours status:', {
              isOpen: biz.isOpen,
              timezone: biz.timezone || 'America/Toronto',
              currentTime: biz.currentTime
            });
            setBusinessInfo(biz);
          } else {
            console.warn('Initial business hours fetch returned null, using fallback');
            setBusinessInfo({
              isOpen: false,
              timezone: 'America/Toronto',
              currentTime: new Date().toISOString(),
              message: 'Business hours temporarily unavailable'
            });
          }
        } catch (error) {
          console.error('Initial business hours fetch error:', error);
          setBusinessInfo({
            isOpen: false,
            timezone: 'America/Toronto', 
            currentTime: new Date().toISOString(),
            message: 'Business hours temporarily unavailable'
          });
        }
      };
      
      initialFetch();
      
      // Set up interval to check every 30 seconds (more frequent for real-time updates)
      businessHoursIntervalRef.current = setInterval(async () => {
        if (isQuitting) {
          console.log('Skipping business hours check - quitting in progress');
          return;
        }
        
        try {
          console.log('Checking business hours status...');
          const biz = await fetchBusinessHours();
          if (biz) {
            setBusinessInfo(prevInfo => {
              // Log status changes
              if (prevInfo && prevInfo.isOpen !== biz.isOpen) {
                console.log(`Business hours status changed: ${prevInfo.isOpen ? 'OPEN' : 'CLOSED'} -> ${biz.isOpen ? 'OPEN' : 'CLOSED'}`);
              }
              return biz;
            });
          }
        } catch (error) {
          console.error('Business hours interval check error:', error);
        }
      }, 30000); // Check every 30 seconds
      
      console.log('Business hours monitoring interval started');
    }

    return () => {
      if (businessHoursIntervalRef.current) {
        clearInterval(businessHoursIntervalRef.current);
        businessHoursIntervalRef.current = null;
        console.log('Business hours monitoring interval cleared');
      }
    };
  }, [isOpen, isQuitting]);

  useEffect(() => {
    const handleEscKey = (e) => {
      if (e.key === 'Escape' && !isQuitting) {
        if (showGuestForm && !isSubmittingGuest) {
          resetGuestForm();
        } else if (showQuitConfirm) {
          setShowQuitConfirm(false);
        }
      }
    };

    if ((showGuestForm || showQuitConfirm) && !isQuitting) {
      document.addEventListener('keydown', handleEscKey);
      return () => document.removeEventListener('keydown', handleEscKey);
    }
  }, [showGuestForm, showQuitConfirm, isSubmittingGuest, isQuitting, resetGuestForm]);

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

  useEffect(() => {
    if (!isOpen || isQuitting) return;

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
  }, [input, isOpen, isQuitting]);

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
    if (isQuitting) return;
    
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const loadedMessages = JSON.parse(raw);
        setMessages(loadedMessages);
        const userMessageExists = loadedMessages.some(msg => msg.from === "user");
        if (userMessageExists) {
          setHasUserSentMessage(true);
        }
      }
    } catch (error) {
      console.warn("Failed to load messages from localStorage:", error);
    }
  }, [storageKey, isQuitting]);

  useEffect(() => {
    if (isQuitting) return;
    
    try {
      localStorage.setItem(storageKey, JSON.stringify(messages));
    } catch (error) {
      console.warn("Failed to save messages to localStorage:", error);
    }
  }, [messages, storageKey, isQuitting]);

  useEffect(() => {
    if (isOpen && messagesEndRef.current && !isQuitting) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen, isQuitting]);

  useEffect(() => {
    if (beepUrl) audioRef.current = new Audio(beepUrl);
  }, []);

  const normalizeMessage = useCallback(
    (msg) => {
      if (!msg || isQuitting) return null;
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
        metadata: msg.metadata || {},
        ...msg,
      };
    },
    [session, userFromAuth, isQuitting]
  );

  const handleIncomingMessage = useCallback(
    (rawMsg) => {
      if (isQuitting) {
        console.log('Ignoring incoming message - chat is quitting');
        return;
      }
      
      const msg = normalizeMessage(rawMsg);
      if (!msg) return;

      if (msg.from === 'bot' && rawMsg.metadata?.redirectUrl) {
        console.log("Redirecting to:", rawMsg.metadata.redirectUrl);
        const url = rawMsg.metadata.redirectUrl;
        if (url.startsWith("/")) {
          window.open(url, '_blank');
        }
        return;
      }

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
      
      if (msg.from === 'bot' && msg.quickReplies.length > 0) {
        console.log('Bot message with quick replies:', msg.quickReplies);
      }
    },
    [normalizeMessage, isQuitting]
  );

  useEffect(() => {
    if (!socket || isQuitting) return;

    const onSessionCreated = (payloadRaw) => {
      if (isQuitting) return;
      
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

    const guestSessionEvent = session?.guestEmail ? `guestUserSessionCreated:${session.guestEmail}` : null;
    const onGuestSessionCreated = (payload) => {
      if (isQuitting) return;
      
      console.log('Guest user session created event received:', payload);
      if (payload?.welcomeMessage) {
        handleIncomingMessage(payload.welcomeMessage);
      }
    };

    const onMessageNew = (msg) => {
      if (isQuitting) return;
      
      console.log('New message event received:', msg);
      handleIncomingMessage(msg);
    };

    const onMessageStatus = ({ messageId, status }) => {
      if (isQuitting) return;
      
      setMessages((prev) =>
        prev.map((m) => (m.id === messageId ? { ...m, status } : m))
      );
    };

    socket.on("session:created", onSessionCreated);
    socket.on("message:new", onMessageNew);
    socket.on("message:status", onMessageStatus);
    if (guestSessionEvent) {
      socket.on(guestSessionEvent, onGuestSessionCreated);
    }

    return () => {
      socket.off("session:created", onSessionCreated);
      socket.off("message:new", onMessageNew);
      socket.off("message:status", onMessageStatus);
      if (guestSessionEvent) {
        socket.off(guestSessionEvent, onGuestSessionCreated);
      }
    };
  }, [socket, handleIncomingMessage, session, isQuitting]);

  const createSession = useCallback(async () => {
    if (!socket || !socket.connected || session || isQuitting) {
      console.log('Cannot create session:', {
        hasSocket: !!socket,
        isConnected: socket?.connected,
        hasSession: !!session,
        isQuitting
      });
      return;
    }

    let sessionData;
    const timezone = 'America/Toronto'; // Force Toronto timezone

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
          guestPhone: phone,
          isGuest: true
        }
      };
    }

    console.log('Emitting session:create with data:', sessionData);

    socket.emit("session:create", sessionData, (err, result) => {
      if (err || isQuitting) {
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
  }, [socket, session, userFromAuth, guestInfo, handleIncomingMessage, isQuitting]);

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
      const phoneRegex = /^[\d\s+\-()\.]+$/;
      if (!phoneRegex.test(guestInfo.phone)) {
        errors.phone = 'Please enter a valid phone number';
      }
    }

    return errors;
  }, [guestInfo]);

  const handleGuestFormChange = useCallback((e) => {
    if (isQuitting) return;
    
    const { name, value } = e.target;

    setGuestInfo(prev => ({
      ...prev,
      [name]: value
    }));

    if (guestFormErrors[name]) {
      setGuestFormErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }

    if (guestFormErrors.submit) {
      setGuestFormErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.submit;
        return newErrors;
      });
    }
  }, [guestFormErrors, isQuitting]);

  const submitGuestForm = useCallback(async () => {
    if (isQuitting) return;
    
    const errors = validateGuestForm();

    if (Object.keys(errors).length > 0) {
      setGuestFormErrors(errors);
      return;
    }

    setIsSubmittingGuest(true);
    setGuestFormErrors({});

    try {
      const response = await API.post('/api/v1/guestUsers/create-guest-user', {
        firstName: guestInfo.firstName.trim(),
        lastName: guestInfo.lastName.trim(),
        email: guestInfo.email.trim(),
        phone: guestInfo.phone.trim()
      });

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

        console.log('Guest form submitted, creating session...');
        if (socket && socket.connected && !session && !isQuitting) {
          await createSession();
        } else {
          console.log('Socket connection status:', {
            hasSocket: !!socket,
            isConnected: socket?.connected,
            hasSession: !!session
          });
        }

        // Retain the user's last message (if any) and re-add the welcome message
        const lastUserMessage = messages.find(msg => msg.from === 'user');
        setMessages(lastUserMessage ? [lastUserMessage] : []);

        // Trigger the welcome message with quick replies
        const biz = await fetchBusinessHours();
        if (biz) setBusinessInfo(biz);

        const welcomeMessage = {
          id: `welcome-${Date.now()}`,
          from: "bot",
          text: biz && !biz.isOpen && biz.outsideHoursMessage
            ? biz.outsideHoursMessage
            : "How can I be of service to you?",
          timestamp: Date.now(),
          avatar: FavIconLogo,
          quickReplies: biz && !biz.isOpen && biz.outsideHoursOptions
            ? biz.outsideHoursOptions
            : [
                { text: "What is your service?", value: "service_info" },
                { text: "Why should I choose you?", value: "why_choose_us" },
                { text: "How do I get started?", value: "getting_started" },
                { text: "Search Jobs", value: "search_job" },
                { text: "Partnership Info", value: "partner_pspl" },
                { text: "Application Help", value: "application_issue" },
                { text: "Talk to Agent", value: "live_agent" },
              ],
        };

        setMessages(prev => [...prev, welcomeMessage]);

        // Resend the last user message to the server if it exists
        if (lastUserMessage && socket && socket.connected && session && !isQuitting) {
          console.log('Sending guest user message to server after form submission...');
          socket.emit("message:send", {
            sessionId: session?._id || session?.id,
            message: lastUserMessage.text,
            messageType: "text",
          });
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
  }, [guestInfo, validateGuestForm, socket, session, messages, createSession, isQuitting]);

  const sendMessage = useCallback(() => {
    if (!input.trim() || isQuitting) return;

    const text = input.trim();
    const messageId = `local_${Date.now()}_${Math.random()}`;

    // Enhanced live agent request detection
    const isLiveAgentRequest = 
      text.toLowerCase().includes('talk to agent') ||
      text.toLowerCase().includes('live agent') ||
      text.toLowerCase().includes('speak to someone') ||
      text.toLowerCase().includes('human support') ||
      text.toLowerCase().includes('connect me to agent') ||
      text.toLowerCase().includes('real person') ||
      /\b(agent|human|person|representative|support staff)\b/i.test(text);

    setPendingMessages(prev => new Set([...prev, messageId]));

    setInput("");
    try {
      localStorage.removeItem(STORAGE_INPUT_KEY);
    } catch (error) {
      console.warn("Failed to clear input from localStorage:", error);
    }

    const userMessage = {
      id: messageId,
      from: "user",
      text,
      timestamp: Date.now(),
      avatar: userFromAuth
        ? getProfileImageSrc(userFromAuth?.photo)
        : defaultAvatar,
      metadata: { isLiveAgentRequest }
    };

    setMessages(prev => [...prev, userMessage]);
    setHasUserSentMessage(true);

    if (!userFromAuth && !guestFormSubmitted) {
      console.log('Guest user sent message requesting agent, triggering form...');
      setShowGuestForm(true);
      return;
    }

    if (socket && socket.connected && session) {
      socket.emit("message:send", {
        sessionId: session?._id || session?.id,
        message: text,
        messageType: isLiveAgentRequest ? "live_agent_request" : "text",
        metadata: {
          isLiveAgentRequest, // Critical flag for backend processing
          requestType: isLiveAgentRequest ? 'agent_connection' : 'standard_message',
          timestamp: Date.now()
        }
      });

      // Show connecting message for live agent requests
      if (isLiveAgentRequest) {
        setTimeout(() => {
          const connectingMessage = {
            id: `connecting_${Date.now()}`,
            from: "bot",
            text: "🔄 I understand you'd like to speak with a live agent. Let me connect you with someone who can help...",
            timestamp: Date.now(),
            avatar: FavIconLogo,
            metadata: { requestType: 'agent_connection', isTemporary: true }
          };
          setMessages(prev => [...prev, connectingMessage]);
        }, 500);
      }
    } else {
      setPendingMessages(prev => {
        const newPending = new Set(prev);
        newPending.delete(messageId);
        return newPending;
      });
    }
  }, [input, session, socket, userFromAuth, guestFormSubmitted, isQuitting]);

  const handleQuickReply = useCallback(
    (option) => {
      if (isQuitting) return;
      
      const value = option.value || option.text || option;
      const text = option.text || value;
      const messageId = `local_qr_${Date.now()}_${Math.random()}`;

      // Special handling for job search - existing functionality
      if (value === "search_job") {
        navigate("/Search-Jobs");
        return;
      }

      // Enhanced live agent detection
      const isLiveAgentRequest = 
        value === "live_agent" || 
        value === "talk_to_agent" ||
        text.toLowerCase().includes('talk to agent') ||
        text.toLowerCase().includes('live agent') ||
        text.toLowerCase().includes('human support') ||
        text.toLowerCase().includes('speak to someone');

      setPendingMessages(prev => new Set([...prev, messageId]));

      if (socket && socket.connected && session) {
        // Include live agent flag in message metadata
        socket.emit("message:send", {
          sessionId: session._id || session.id,
          message: text,
          messageType: isLiveAgentRequest ? "live_agent_request" : "option_selection",
          metadata: {
            isLiveAgentRequest, // Critical flag for backend processing
            requestType: isLiveAgentRequest ? 'agent_connection' : 'standard_option',
            userSelection: value,
            timestamp: Date.now()
          }
        });

        // Show visual feedback for live agent requests
        if (isLiveAgentRequest) {
          // Add a temporary system message to show we're processing the request
          const tempMessage = {
            id: `temp_agent_req_${Date.now()}`,
            from: "bot",
            text: "🔄 Connecting you with a live agent. Please wait while we find an available representative...",
            timestamp: Date.now(),
            avatar: FavIconLogo,
            metadata: { isTemporary: true, requestType: 'agent_connection' }
          };
          setMessages(prev => [...prev, tempMessage]);
        }
      } else {
        // Fallback for disconnected state
        const userMessage = {
          id: messageId,
          from: "user",
          text,
          timestamp: Date.now(),
          avatar: userFromAuth
            ? getProfileImageSrc(userFromAuth?.photo)
            : defaultAvatar,
          metadata: { isLiveAgentRequest }
        };
        setMessages(prev => [...prev, userMessage]);
        setHasUserSentMessage(true);

        if (!userFromAuth && !guestFormSubmitted) {
          console.log('Guest user requested agent, triggering form...');
          setShowGuestForm(true);
          return;
        }
      }

      setPendingMessages(prev => {
        const newPending = new Set(prev);
        newPending.delete(messageId);
        return newPending;
      });
    }, [session, socket, userFromAuth, guestFormSubmitted, navigate, isQuitting]);

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

  const initializeChatSession = useCallback(async () => {
    if (isQuitting) {
      console.log('Skipping chat initialization - quitting in progress');
      return;
    }
    
    console.log('Initializing chat session...', {
      hasSession: !!session,
      hasSocket: !!socket,
      isConnected: socket?.connected,
      userFormSubmitted,
      defaultMessagesLoaded
    });

    if (!session && socket && socket.connected) {
      if (userFromAuth) {
        console.log('Creating session for authenticated user...');
        await createSession();
      } else if (guestFormSubmitted) {
        console.log('Creating session for guest user after form submission...');
        await createSession();
      }
    }

    if (messages.length === 0 && !defaultMessagesLoaded) {
      setDefaultMessagesLoaded(true);

      const biz = await fetchBusinessHours();
      if (biz) {
        console.log('Business hours for welcome message:', {
          isOpen: biz.isOpen,
          timezone: biz.timezone,
          outsideHoursMessage: biz.outsideHoursMessage
        });
        setBusinessInfo(biz);
      }

      const welcomeMessage = {
        id: `welcome-${Date.now()}`,
        from: "bot",
        text: biz && !biz.isOpen && biz.outsideHoursMessage
          ? biz.outsideHoursMessage
          : "How can I be of service to you?",
        timestamp: Date.now(),
        avatar: FavIconLogo,
        quickReplies: biz && !biz.isOpen && biz.outsideHoursOptions
          ? biz.outsideHoursOptions
          : [
              { text: "What is your service?", value: "service_info" },
              { text: "Why should I choose you?", value: "why_choose_us" },
              { text: "How do I get started?", value: "getting_started" },
              { text: "Search Jobs", value: "search_job" },
              { text: "Partnership Info", value: "partner_pspl" },
              { text: "Application Help", value: "application_issue" },
              { text: "Talk to Agent", value: "live_agent" },
            ],
      };

      setMessages([welcomeMessage]);
    }
  }, [session, socket, userFormSubmitted, defaultMessagesLoaded, messages.length, createSession, userFromAuth, guestFormSubmitted, isQuitting]);

  const handleHeaderClick = () => {
    if (!isQuitting) {
      setIsOpen(false);
    }
  };

  const handleToggle = async () => {
    if (isQuitting) {
      console.log('Ignoring toggle - quit in progress');
      return;
    }
    
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
      await initializeChatSession();
    }
  };

  useEffect(() => {
    if (!userFromAuth && !guestFormSubmitted && hasUserSentMessage && !showGuestForm && !isQuitting) {
      console.log('Triggering guest form - conditions met');
      setShowGuestForm(true);
    }
  }, [userFromAuth, guestFormSubmitted, hasUserSentMessage, showGuestForm, isQuitting]);

  // Enhanced Quit Confirmation Modal Component
  const QuitConfirmationModal = () => (
    <div 
      className="chat-quit-overlay" 
      onClick={() => !isQuitting && setShowQuitConfirm(false)}
    >
      <div 
        className="chat-quit-modal" 
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="chat-quit-modal-header">
          <div className="chat-quit-modal-icon">
            <i className="fas fa-sign-out-alt"></i>
          </div>
          <h3 className="chat-quit-modal-title">
            End Chat Session?
          </h3>
          <p className="chat-quit-modal-subtitle">
            This will clear your conversation history and end the current session.
          </p>
        </div>
        
        {/* Modal Body */}
        <div className="chat-quit-modal-body">
          <div className="chat-quit-warning">
            <i className="fas fa-info-circle"></i>
            <span>You can always start a new conversation by clicking the chat button again.</span>
          </div>
          
          {/* Action Buttons */}
          <div className="chat-quit-modal-actions">
            <button
              onClick={() => !isQuitting && setShowQuitConfirm(false)}
              disabled={isQuitting}
              className={`chat-quit-btn-cancel ${isQuitting ? 'disabled' : ''}`}
            >
              <i className="fas fa-arrow-left"></i>
              <span>Continue Chat</span>
            </button>
            
            <button
              onClick={() => !isQuitting && handleQuit()}
              disabled={isQuitting}
              className={`chat-quit-btn-confirm ${isQuitting ? 'loading' : ''}`}
            >
              {isQuitting ? (
                <>
                  <i className="fas fa-spinner fa-spin"></i>
                  <span>Ending...</span>
                </>
              ) : (
                <>
                  <i className="fas fa-sign-out-alt"></i>
                  <span>End Session</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // FIXED: Proper business hours status display logic
  const getBusinessHoursDisplayText = () => {
    if (isQuitting) return "Ending session...";
    
    if (businessInfo) {
      console.log('Business info for display:', {
        isOpen: businessInfo.isOpen,
        timezone: businessInfo.timezone,
        currentTime: businessInfo.currentTime
      });
      
      if (businessInfo.isOpen) {
        return "We're online now";
      } else {
        return "Outside business hours";
      }
    }
    
    // Fallback while loading
    return isConnected ? "Checking availability..." : "Connecting...";
  };

  const inputEnabled = !isQuitting;
  
  return (
    <div className="chatbot-wrapper">
      <button
        className={`chatbot-toggle ${isOpen ? "open" : ""}`}
        onClick={handleToggle}
        disabled={isQuitting}
      >
        <div className="chat-toggle-inner">
          {!isOpen && <i className="fas fa-comment-dots fa-1x"></i>}
        </div>
        {unreadCount > 0 && <div className="unread-badge">{unreadCount}</div>}
      </button>

      {isOpen && (
        <div className="chatbot-box">
          <div className="chatbot-header" onClick={handleHeaderClick}>
            <div className="chat-header-left">
              <button
                className="chat-close-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  if (!isQuitting) {
                    setIsOpen(false);
                  }
                }}
                disabled={isQuitting}
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
                  {getBusinessHoursDisplayText()}
                </div>
              </div>
            </div>
            
            {/* Enhanced Chat Header Right Section */}
            <div className="chat-header-right" onClick={(e) => e.stopPropagation()}>
              {hasUserSentMessage && (
                <button
                  className={`chat-quit-btn ${isQuitting ? 'disabled' : ''}`}
                  aria-label="End chat session"
                  onClick={() => !isQuitting && setShowQuitConfirm(true)}
                  title="End Chat Session"
                  disabled={isQuitting}
                >
                  <i className={`fas ${isQuitting ? 'fa-spinner fa-spin' : 'fa-times'}`}></i>
                </button>
              )}
            </div>
          </div>

          <div className="chatbot-messages">
            {messages.map(renderMessage)}
            <div ref={messagesEndRef} />
          </div>

          {/* Enhanced Quit Confirmation Modal */}
          {showQuitConfirm && <QuitConfirmationModal />}

          <div className="chatbot-input">
            <input
              value={input}
              onChange={(e) => !isQuitting && setInput(e.target.value)}
              placeholder={isQuitting ? "Ending session..." : "Type a message..."}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !isQuitting) {
                  sendMessage();
                }
              }}
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

      {showGuestForm && !isQuitting && (
        <div
          className={`chat-modal-overlay ${isSubmittingGuest ? 'submitting' : ''}`}
          onClick={handleModalOverlayClick}
        >
          <div
            className="chat-modal-container"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="chat-modal-header">
              <button
                onClick={cancelGuestForm}
                disabled={isSubmittingGuest}
                className={`chat-modal-close ${isSubmittingGuest ? 'disabled' : ''}`}
              >
                <i className="fas fa-times"></i>
              </button>

              <div className="chat-modal-header-content">
                <div className="chat-modal-icon">
                  <i className="fas fa-user-plus"></i>
                </div>
                <h2 className="chat-modal-title">
                  Let's get started!
                </h2>
                <p className="chat-modal-subtitle">
                  Help us provide you with personalized assistance by sharing a few details.
                </p>
              </div>
            </div>

            <div className="chat-modal-body">
              {guestFormErrors.submit && (
                <div className="chat-submit-error">
                  <i className="fas fa-exclamation-triangle"></i>
                  <div>
                    <strong>Unable to proceed:</strong> {guestFormErrors.submit}
                  </div>
                </div>
              )}

              <div className="chat-form-group">
                <label className="chat-form-label">
                  First Name <span className="chat-required">*</span>
                </label>
                <input
                  type="text"
                  name="firstName"
                  value={guestInfo.firstName}
                  onChange={handleGuestFormChange}
                  disabled={isSubmittingGuest}
                  className={`chat-form-input ${guestFormErrors.firstName ? 'error' :
                    guestInfo.firstName.trim() ? 'success' : ''
                  } ${isSubmittingGuest ? 'disabled' : ''}`}
                  placeholder="Enter your first name"
                  autoComplete="given-name"
                  required
                />
                {guestFormErrors.firstName && (
                  <div className="chat-error-message">
                    <i className="fas fa-exclamation-circle"></i>
                    {guestFormErrors.firstName}
                  </div>
                )}
              </div>

              <div className="chat-form-group">
                <label className="chat-form-label">
                  Last Name
                </label>
                <input
                  type="text"
                  name="lastName"
                  value={guestInfo.lastName}
                  onChange={handleGuestFormChange}
                  disabled={isSubmittingGuest}
                  className={`chat-form-input ${guestInfo.lastName.trim() ? 'success' : ''
                  } ${isSubmittingGuest ? 'disabled' : ''}`}
                  placeholder="Enter your last name"
                  autoComplete="family-name"
                />
              </div>

              <div className="chat-form-group">
                <label className="chat-form-label">
                  Email Address <span className="chat-required">*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  value={guestInfo.email}
                  onChange={handleGuestFormChange}
                  disabled={isSubmittingGuest}
                  className={`chat-form-input ${guestFormErrors.email ? 'error' :
                    guestInfo.email.trim() && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(guestInfo.email) ? 'success' : ''
                  } ${isSubmittingGuest ? 'disabled' : ''}`}
                  placeholder="your.email@example.com"
                  autoComplete="email"
                  required
                />
                {guestFormErrors.email && (
                  <div className="chat-error-message">
                    <i className="fas fa-exclamation-circle"></i>
                    {guestFormErrors.email}
                  </div>
                )}
              </div>

              <div className="chat-form-group">
                <label className="chat-form-label">
                  Phone Number
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={guestInfo.phone}
                  onChange={handleGuestFormChange}
                  disabled={isSubmittingGuest}
                  className={`chat-form-input ${guestFormErrors.phone ? 'error' :
                    guestInfo.phone.trim() ? 'success' : ''
                  } ${isSubmittingGuest ? 'disabled' : ''}`}
                  placeholder="+1 (555) 123-4567"
                  autoComplete="tel"
                />
                {guestFormErrors.phone && (
                  <div className="chat-error-message">
                    <i className="fas fa-exclamation-circle"></i>
                    {guestFormErrors.phone}
                  </div>
                )}
              </div>
            </div>

            <div className="chat-modal-actions">
              <button
                type="button"
                onClick={cancelGuestForm}
                disabled={isSubmittingGuest}
                className={`chat-btn-secondary ${isSubmittingGuest ? 'disabled' : ''}`}
              >
                <i className="fas fa-times"></i>
                <span>Cancel</span>
              </button>
              <button
                type="button"
                onClick={submitGuestForm}
                disabled={isSubmittingGuest}
                className={`chat-btn-primary ${isSubmittingGuest ? 'loading' : ''}`}
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
    </div>
  );
};

export default ChatBotIcon;
