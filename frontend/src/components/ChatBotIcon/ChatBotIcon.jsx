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

const STORAGE_USER_KEY = "chat_widget_userinfo_v1";
const STORAGE_MESSAGES_PREFIX = "chat_widget_messages_v1_";

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
  const [quickReplies, setQuickReplies] = useState([]);
  const [businessInfo, setBusinessInfo] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showGuestForm, setShowGuestForm] = useState(false);
  
  const [guestInfo, setGuestInfo] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: ''
  });

  const audioRef = useRef(null);
  const messagesEndRef = useRef(null);

  const userFormSubmitted = useMemo(
    () => Boolean(userFromAuth || (guestInfo.firstName && guestInfo.email)),
    [userFromAuth, guestInfo]
  );

  const storageKey = useMemo(
    () =>
      STORAGE_MESSAGES_PREFIX +
      (session?._id || session?.id || "guest"),
    [session]
  );

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
    } catch {}
  }, []);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) setMessages(JSON.parse(raw));
    } catch {}
  }, [storageKey]);

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(messages));
    } catch {}
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
  const createSession = useCallback(() => {
    if (!socket || !socket.connected || session) return;

    const firstName = guestInfo.firstName;
    const lastName = guestInfo.lastName;
    const email = guestInfo.email;
    const phone = guestInfo.phone;
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

    localStorage.setItem(
      STORAGE_USER_KEY,
      JSON.stringify({
        firstName,
        lastName,
        email,
        phone
      })
    );

    socket.emit(
      "session:create",
      {
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
      },
      (err, result) => {
        if (err) return console.error("session:create err", err);
        const data = result?.body?.data || result;
        const sess = data?.session || data || null;
        if (sess) {
          setSession(sess);
          if (data.welcomeMessage) handleIncomingMessage(data.welcomeMessage);
          if (data.businessHours) setBusinessInfo(data.businessHours);
        }
      }
    );
  }, [
    socket,
    session,
    guestInfo,
    handleIncomingMessage
  ]);

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
    setInput("");
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

  /** --- Toggle Chat --- **/
  const handleToggle = () => {
    const next = !isOpen;
    setIsOpen(next);
    
    if (next) {
      setUnreadCount(0);
      
      
      // Show guest form if not authenticated and no guest info
      if (!userFromAuth && !guestInfo.email) {
        setShowGuestForm(true);
        return;
      }

      // Show guest form if not authenticated and no guest info
      if (!userFromAuth && !guestInfo.email) {
        setShowGuestForm(true);
        return;
      }
      
      if (!session && socket && socket.connected && userFormSubmitted) {
        createSession();
      }
      
      if (messages.length === 0) {
        fetchBusinessHours().then((biz) => {
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
        });
      }
    }
  };

  const handleGuestFormChange = (e) => {
    setGuestInfo({
      ...guestInfo,
      [e.target.name]: e.target.value
    });
  };

  const submitGuestForm = async () => {
    try {
      // Save guest user to backend
      const response = await API.post('/api/v1/guestUsers/add-guest-user', guestInfo);
      
      if (response.data.success) {
        const { firstName, lastName, email, phone } = response.data.data;
        setGuestInfo({ firstName, lastName, email, phone });
        setShowGuestForm(false);
        
        // Save to localStorage
        localStorage.setItem(STORAGE_USER_KEY, JSON.stringify({
          firstName,
          lastName,
          email,
          phone
        }));
        
        // Create session after saving guest
        if (socket && socket.connected) {
          createSession();
        }
      }
    } catch (error) {
      console.error("Error saving guest user:", error);
    }
  };

  const inputEnabled = userFormSubmitted;

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
          <div className="chatbot-header">
            <div className="chat-header-left">
              <button
                className="chat-close-btn"
                onClick={() => setIsOpen(false)}
              >
                <i className="fas fa-chevron-down"></i>
              </button>
              <div className="chat-avatar">
                <Link to="/">
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
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type a message..."
              onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
              disabled={!inputEnabled}
            />
            <button
              onClick={sendMessage}
              className={`send-btn ${!inputEnabled ? "disabled" : ""}`}
            >
              →
            </button>
          </div>
        </div>
      )}

      {/* Guest Form Modal */}
      <Modal
        isOpen={showGuestForm}
        onRequestClose={() => setShowGuestForm(false)}
        className="modal"
        overlayClassName="modal-overlay"
      >
        <div className="guest-form">
          <h2>Please provide your details to start chatting</h2>
          <div className="form-group">
            <label>First Name</label>
            <input
              type="text"
              name="firstName"
              value={guestInfo.firstName}
              onChange={handleGuestFormChange}
              required
            />
          </div>
          <div className="form-group">
            <label>Last Name</label>
            <input
              type="text"
              name="lastName"
              value={guestInfo.lastName}
              onChange={handleGuestFormChange}
              required
            />
          </div>
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              name="email"
              value={guestInfo.email}
              onChange={handleGuestFormChange}
              required
            />
          </div>
          <div className="form-group">
            <label>Phone</label>
            <input
              type="tel"
              name="phone"
              value={guestInfo.phone}
              onChange={handleGuestFormChange}
              required
            />
          </div>
          <div className="form-actions">
            <button onClick={submitGuestForm}>Submit</button>
            <button onClick={() => setShowGuestForm(false)}>Cancel</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default ChatBotIcon;
