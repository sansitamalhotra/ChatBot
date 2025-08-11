// frontend/src/components/ChatBotIcon/ChatBotIcon.jsx
import React, { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { useSocket } from "../../Context/SocketContext";
import { useAuth } from "../../Context/AuthContext";
import "./ChatBotIcon.css";
import beepUrl from "./ping";

// Helper: relative time
function timeAgo(ts) {
  if (!ts) return "";
  const d = new Date(ts);
  const diff = Math.floor((Date.now() - d.getTime()) / 1000); // seconds
  if (diff < 10) return "just now";
  if (diff < 60) return `${diff}s`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  // older -> date
  return d.toLocaleDateString();
}

const STORAGE_USER_KEY = "chat_widget_userinfo_v1";
const STORAGE_MESSAGES_PREFIX = "chat_widget_messages_v1_";

const ChatBotIcon = () => {
  const location = useLocation();
  const { socket, isConnected } = useSocket();
  const [auth] = useAuth();
  const userFromAuth = auth?.user;

  const [isOpen, setIsOpen] = useState(false);
  const [session, setSession] = useState(null);
  const [messages, setMessages] = useState([]);
  const [quickReplies, setQuickReplies] = useState([]);
  const [typingUsers, setTypingUsers] = useState({});
  const [businessInfo, setBusinessInfo] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showAutoSendModal, setShowAutoSendModal] = useState(false);
  const [userFormSubmitted, setUserFormSubmitted] = useState(false);

  // guest form state
  const [guestFirstName, setGuestFirstName] = useState("");
  const [guestLastName, setGuestLastName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [sendDefaultIfUnavailable, setSendDefaultIfUnavailable] = useState(true);
  const [preferredTime, setPreferredTime] = useState(""); // optional string like "09:00-17:00"

  // input
  const [input, setInput] = useState("");

  const messagesEndRef = useRef(null);
  const audioRef = useRef(null);

  // load saved user info
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_USER_KEY);
      if (raw) {
        const u = JSON.parse(raw);
        setGuestFirstName(u.firstName || "");
        setGuestLastName(u.lastName || "");
        setGuestEmail(u.email || "");
        setSendDefaultIfUnavailable(!!u.sendDefaultIfUnavailable);
        setPreferredTime(u.preferredTime || "");
        // If we have saved user info, consider form submitted
        if (u.firstName || u.email) {
          setUserFormSubmitted(true);
        }
      }
    } catch (e) {}
  }, []);

  // Check if user form is ready (either auth user or guest info provided)
  useEffect(() => {
    if (userFromAuth || (guestFirstName && guestEmail)) {
      setUserFormSubmitted(true);
    } else {
      setUserFormSubmitted(false);
    }
  }, [userFromAuth, guestFirstName, guestEmail]);

  // load persisted messages for current session (when session becomes available)
  useEffect(() => {
    const key = session ? (STORAGE_MESSAGES_PREFIX + (session._id || session.id)) : (STORAGE_MESSAGES_PREFIX + "guest");
    try {
      const raw = localStorage.getItem(key);
      if (raw) setMessages(JSON.parse(raw));
    } catch (e) {}
  }, [session]);

  // persist messages on change (per-session)
  useEffect(() => {
    const key = session ? (STORAGE_MESSAGES_PREFIX + (session._id || session.id)) : (STORAGE_MESSAGES_PREFIX + "guest");
    try {
      localStorage.setItem(key, JSON.stringify(messages));
    } catch (e) {}
  }, [messages, session]);

  // scroll to bottom on new messages when open
  useEffect(() => {
    if (isOpen && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth", block: "end" });
    }
  }, [messages, isOpen]);

  // prepare audio
  useEffect(() => {
    // If you have a file at ./ping.wav, import above. Otherwise default to a simple beep via WebAudio
    if (beepUrl) {
      audioRef.current = new Audio(beepUrl);
    } else {
      audioRef.current = null;
    }
  }, []);

  // Auto-send behavior when session is created and business hours are closed
  useEffect(() => {
    if (session && businessInfo && !businessInfo.isOpen && sendDefaultIfUnavailable) {
      // Check if we should auto-send default message
      if (session.sessionType === "live_agent" || !session.sessionType) {
        setShowAutoSendModal(true);
      }
    }
  }, [session, businessInfo, sendDefaultIfUnavailable]);

  // socket listeners
  useEffect(() => {
    if (!socket) return;

    const onSessionCreated = (payloadRaw) => {
      const payload = (payloadRaw && payloadRaw.body && payloadRaw.body.data && payloadRaw.body.data.session) ? payloadRaw.body.data : payloadRaw;
      const sess = payload && (payload.session || payload._id) ? (payload.session || payload) : null;
      if (sess) {
        setSession(sess);
        // try reading business hours from payload
        if (payload.businessHours) setBusinessInfo(payload.businessHours);
        if (payload.businessHoursStatus) setBusinessInfo(payload.businessHoursStatus);
      }
      // welcomeMessage may be included
      if (payload && payload.welcomeMessage) {
        handleIncomingMessage(payload.welcomeMessage);
      }
    };

    const onMessageNew = (msg) => handleIncomingMessage(msg);

    const onMessageStatus = ({ messageId, status }) => {
      setMessages(prev => prev.map(m => m.id === messageId ? { ...m, status } : m));
    };

    const onTyping = ({ sessionId, user, isTyping }) => {
      if (!session) return;
      const sid = session._id || session.id;
      if (sessionId && sid !== sessionId) return;
      setTypingUsers(prev => {
        const copy = { ...prev };
        if (isTyping) copy[user.id] = user;
        else delete copy[user.id];
        return copy;
      });
    };

    socket.on("session:created", onSessionCreated);
    socket.on("message:new", onMessageNew);
    socket.on("message:status", onMessageStatus);
    socket.on("typing", onTyping);

    return () => {
      socket.off("session:created", onSessionCreated);
      socket.off("message:new", onMessageNew);
      socket.off("message:status", onMessageStatus);
      socket.off("typing", onTyping);
    };
  }, [socket, session]);

  function handleIncomingMessage(msg) {
    if (!msg) return;
    const id = msg._id || msg.id || `m_${Date.now()}`;
    const text = msg.message || msg.text || "";
    const ts = msg.createdAt || msg.timestamp || Date.now();
    const from = msg.senderType === "user" ? "user" : (msg.senderType === "agent" ? "agent" : (msg.senderType === "bot" ? "bot" : (msg.from || "bot")));
    const avatar = msg.metadata?.senderAvatar || (from === "agent" ? (session?.agent?.photo || "/agent-avatar.png") : (from === "user" ? (userFromAuth?.photo || "/you-avatar.png") : "/bot-avatar.png"));
    const templatePayload = msg.metadata?.templatePayload || null;
    const messageObj = {
      id,
      from,
      text,
      timestamp: ts,
      avatar,
      raw: msg,
      templatePayload,
      quickReplies: msg.metadata?.quickReplies || msg.quickReplies || []
    };

    setMessages(prev => [...prev, messageObj]);

    // set quick replies global
    if (Array.isArray(messageObj.quickReplies) && messageObj.quickReplies.length > 0) setQuickReplies(messageObj.quickReplies);
    else setQuickReplies([]);

    // If closed, increment unread and play audio
    if (!isOpen) {
      setUnreadCount(n => n + 1);
      playNotificationSound();
    }
  }

  function playNotificationSound() {
    try {
      if (audioRef.current) {
        audioRef.current.play().catch(() => {});
        return;
      }
      // fallback to simple beep via WebAudio
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = "sine";
      o.connect(g);
      g.connect(ctx.destination);
      o.frequency.value = 880;
      g.gain.value = 0.05;
      o.start();
      setTimeout(() => {
        o.stop();
        try { ctx.close(); } catch (e) {}
      }, 120);
    } catch (e) {}
  }

  // Create session (called when widget opens)
  function createSession() {
    if (!socket || !socket.connected) return;

    // Prefer auth user info if present
    let firstName = guestFirstName, lastName = guestLastName, email = guestEmail, timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (userFromAuth) {
      firstName = userFromAuth.firstname || userFromAuth.firstName || firstName;
      lastName = userFromAuth.lastname || userFromAuth.lastName || lastName;
      email = userFromAuth.email || email;
    }

    // save local guest info
    try {
      localStorage.setItem(STORAGE_USER_KEY, JSON.stringify({
        firstName, lastName, email, sendDefaultIfUnavailable, preferredTime
      }));
    } catch (e) {}

    socket.emit("session:create", {
      entryPoint: "widget",
      selectedOption: "general_inquiry",
      timezone,
      firstName,
      lastName,
      email,
      preferredTime,
      sendDefaultIfUnavailable: !!sendDefaultIfUnavailable
    }, (err, result) => {
      if (err) {
        console.error("session:create err", err);
        return;
      }
      const data = (result && result.body && result.body.data) ? result.body.data : result;
      const sess = data && (data.session || data._id) ? (data.session || data) : null;
      if (sess) {
        setSession(sess);
        // server may include welcomeMessage
        if (data.welcomeMessage) handleIncomingMessage(data.welcomeMessage);
        if (data.businessHours) setBusinessInfo(data.businessHours);
      }
    });
  }

  // Send chat message (text)
  function sendMessage() {
    if (!input.trim()) return;

    const text = input.trim();
    // optimistic push
    const draft = {
      id: `local_${Date.now()}`,
      from: "user",
      text,
      timestamp: Date.now(),
      avatar: (userFromAuth?.photo || "https://img.freepik.com/premium-vector/account-icon-user-icon-vector-graphics_292645-552.jpg?w=300")
    };
    setMessages(prev => [...prev, draft]);
    setInput("");

    if (!socket || !socket.connected) return;

    socket.emit("message:send", {
      sessionId: session ? (session._id || session.id) : null,
      message: text,
      messageType: "text",
      metadata: {}
    }, (err, result) => {
      if (err) {
        console.error("message:send ack err", err);
        return;
      }
      const saved = result?.body?.data || result?.data || result;
      if (saved) {
        setMessages(prev => prev.map(m => (m.id === draft.id ? {
          id: saved._id || `m_${Date.now()}`,
          from: "user",
          text: saved.message || text,
          timestamp: saved.createdAt || Date.now(),
          avatar: (userFromAuth?.photo || "/you-avatar.png"),
          raw: saved
        } : m)));
      }
    });
  }

  // Auto-send default message when business hours are closed
  function sendDefaultMessage() {
    if (!socket || !socket.connected || !session) return;

    const defaultMessage = `Hello, I'm trying to reach you but I see you're currently outside business hours. My preferred contact time is ${preferredTime || "anytime during business hours"}. Please get back to me when you're available. Thank you!`;
    
    const draft = {
      id: `local_${Date.now()}`,
      from: "user",
      text: defaultMessage,
      timestamp: Date.now(),
      avatar: (userFromAuth?.photo || "/you-avatar.png")
    };
    setMessages(prev => [...prev, draft]);

    socket.emit("message:send", {
      sessionId: session._id || session.id,
      message: defaultMessage,
      messageType: "default_outside_hours",
      metadata: { isDefaultMessage: true, preferredTime }
    }, (err, result) => {
      if (err) {
        console.error("default message send err", err);
        return;
      }
      const saved = result?.body?.data || result?.data || result;
      if (saved) {
        setMessages(prev => prev.map(m => (m.id === draft.id ? {
          id: saved._id || `m_${Date.now()}`,
          from: "user",
          text: saved.message || defaultMessage,
          timestamp: saved.createdAt || Date.now(),
          avatar: (userFromAuth?.photo || "/you-avatar.png"),
          raw: saved
        } : m)));
      }
    });

    setShowAutoSendModal(false);
  }

  // Quick reply handler
  function handleQuickReply(qr) {
    const value = qr?.value || qr;
    if (value === "live_agent") {
      requestAgent();
      return;
    }
    if (!socket || !socket.connected) return;
    socket.emit("message:send", {
      sessionId: session ? (session._id || session.id) : null,
      message: value,
      messageType: "option_selection",
      metadata: {}
    });
  }

  function requestAgent() {
    if (!socket || !socket.connected || !session) return;
    socket.emit("session:transfer", { sessionId: session._id || session.id }, (err, res) => {
      if (err) console.error("request agent err", err);
    });
  }

  // Handle user form submission
  function handleUserFormSubmit() {
    setUserFormSubmitted(true);
    createSession();
  }

  // Template renderer (cards/list/kv)
  const renderTemplatePayload = (payload) => {
    if (!payload) return null;
    const { type, items } = payload;
    if (type === "cards" && Array.isArray(items)) {
      return (
        <div className="template-cards">
          {items.map((card, i) => (
            <div className="template-card" key={i}>
              {card.image && <div className="card-image" style={{ backgroundImage: `url(${card.image})` }} />}
              <div className="card-body">
                {card.title && <div className="card-title">{card.title}</div>}
                {card.subtitle && <div className="card-subtitle">{card.subtitle}</div>}
                {Array.isArray(card.buttons) && (
                  <div className="card-actions">
                    {card.buttons.map((b, idx) => (
                      <button key={idx} onClick={() => handleQuickReply(b)} className="quick-reply-btn small">{b.text || b}</button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      );
    }

    if (type === "list" && Array.isArray(items)) {
      return <ul className="template-list">{items.map((it, idx) => <li key={idx}>{it.title || it}</li>)}</ul>;
    }

    if (type === "kv" && Array.isArray(items)) {
      return <div className="template-kv">{items.map((it, idx) => (
        <div className="kv-row" key={idx}><div className="kv-key">{it.key}</div><div className="kv-value">{it.value}</div></div>
      ))}</div>;
    }

    return null;
  };

  // Render message bubble
  const renderMessage = (m) => {
    return (
      <div key={m.id} className={`chat-row ${m.from}`}>
        <img className="msg-avatar" src={m.avatar || (m.from === "user" ? (userFromAuth?.photo || "/you-avatar.png") : "/bot-avatar.png")} alt="avatar" />
        <div className="msg-body">
          <div className={`msg-text ${m.from === "user" ? "user-bubble" : ""}`}>{m.text}</div>
          {m.templatePayload && renderTemplatePayload(m.templatePayload)}
          {Array.isArray(m.quickReplies) && m.quickReplies.length > 0 && (
            <div className="message-quick-replies">
              {m.quickReplies.map((qr, i) => <button key={i} className="quick-reply-btn" onClick={() => handleQuickReply(qr)}>{qr.text || qr}</button>)}
            </div>
          )}
          <div className="msg-meta">
            <span className="msg-time">{timeAgo(m.timestamp)}</span>
            {m.status && <span className="msg-status">{m.status}</span>}
          </div>
        </div>
      </div>
    );
  };

  // Determine input enabled (disable until user form is submitted and handle business hours)
  const inputEnabled = (() => {
    // First check if user form is submitted
    if (!userFormSubmitted) return false;
    
    if (!session) return true; // allow typing while session initializing
    if (!businessInfo) return true;
    if (session.sessionType === "bot") return true;
    
    // For live agent sessions, check business hours
    if (businessInfo.isOpen) return true;
    
    // If outside business hours and sendDefaultIfUnavailable is true, still allow input
    // (user can compose their message even if agents are offline)
    return sendDefaultIfUnavailable;
  })();

  return (
    <div className="chatbot-wrapper">
      <button className={`chatbot-toggle ${isOpen ? "open" : ""}`} onClick={() => {
        const next = !isOpen;
        setIsOpen(next);
        if (next) setUnreadCount(0);
        // When opening: if no session yet and form is submitted, create it
        if (next && (!session) && socket && socket.connected && userFormSubmitted) {
          createSession();
        }
      }}>
        <div className="chat-toggle-inner">💬</div>
        {unreadCount > 0 && <div className="unread-badge">{unreadCount}</div>}
      </button>

      {isOpen && (
        <div className="chatbot-box">
          <div className="chatbot-header">
            <div className="chat-header-left">
              <div className="chat-avatar">💬</div>
              <div>
                <div className="chat-title">Chat Assistant</div>
                <div className="chat-sub">{businessInfo ? (businessInfo.isOpen ? "We are online" : "Outside business hours") : (isConnected ? "Connected" : "Connecting...")}</div>
              </div>
            </div>
          </div>

          {/* If no saved user info (guest) and not auth user, show form */}
          {!userFromAuth && !userFormSubmitted && (
            <div className="guest-form">
              <div style={{ display: "flex", gap: 8 }}>
                <input placeholder="First name *" value={guestFirstName} onChange={e => setGuestFirstName(e.target.value)} />
                <input placeholder="Last name" value={guestLastName} onChange={e => setGuestLastName(e.target.value)} />
              </div>
              <div style={{ marginTop: 8 }}>
                <input placeholder="Email *" value={guestEmail} onChange={e => setGuestEmail(e.target.value)} />
              </div>
              <div style={{ marginTop: 8, display: "flex", gap: 8, alignItems: "center" }}>
                <input type="checkbox" id="sendDefault" checked={sendDefaultIfUnavailable} onChange={e => setSendDefaultIfUnavailable(e.target.checked)} />
                <label htmlFor="sendDefault">Send default message if live agents unavailable</label>
              </div>
              <div style={{ marginTop: 8 }}>
                <input placeholder="Preferred contact time (e.g. 09:00-17:00)" value={preferredTime} onChange={e => setPreferredTime(e.target.value)} />
              </div>
              <div style={{ marginTop: 10, display: "flex", gap: 8 }}>
                <button 
                  onClick={handleUserFormSubmit}
                  className="save-user-btn"
                  disabled={!guestFirstName.trim() || !guestEmail.trim()}
                >
                  Start Chat
                </button>
                <button onClick={() => {
                  setGuestFirstName("Guest");
                  setGuestEmail("guest@example.com");
                  setTimeout(() => handleUserFormSubmit(), 100);
                }} className="save-user-btn alt">Continue as Guest</button>
              </div>
            </div>
          )}

          <div className="chatbot-messages" role="log" aria-live="polite">
            {messages.map(renderMessage)}
            <div ref={messagesEndRef} />
          </div>

          {/* Auto-send modal for outside business hours */}
          {showAutoSendModal && (
            <div className="auto-send-modal" style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              background: "white",
              border: "1px solid #ddd",
              borderRadius: "8px",
              padding: "20px",
              boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
              zIndex: 1000,
              maxWidth: "300px"
            }}>
              <h4>Outside Business Hours</h4>
              <p>We're currently offline. Would you like to send a default message letting us know you'd like to be contacted?</p>
              <div style={{ display: "flex", gap: 8, marginTop: 15 }}>
                <button onClick={sendDefaultMessage} className="save-user-btn">Send Message</button>
                <button onClick={() => setShowAutoSendModal(false)} className="save-user-btn alt">Skip</button>
              </div>
            </div>
          )}

          {/* quick replies global */}
          {Array.isArray(quickReplies) && quickReplies.length > 0 && (
            <div className="chatbot-quickreplies global">
              {quickReplies.map((qr, i) => <button key={i} className="quick-reply-btn" onClick={() => handleQuickReply(qr)}>{qr.text || qr}</button>)}
            </div>
          )}

          {/* business hours notice if outside and live_agent */}
          {businessInfo && !businessInfo.isOpen && session && session.sessionType === "live_agent" && (
            <div className="business-hours-notice">
              Live agents are offline. Next available: {businessInfo.nextAvailable || "Unknown"}.
              {sendDefaultIfUnavailable && " You can still send messages and we'll respond when available."}
            </div>
          )}

          <div className="chatbot-input">
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder={
                !userFormSubmitted 
                  ? "Please fill out the form above to start chatting..." 
                  : (!businessInfo || businessInfo.isOpen || session?.sessionType === "bot") 
                    ? "Type a message..." 
                    : "Live agents offline — leave a message..."
              }
              onKeyDown={e => e.key === "Enter" && sendMessage()}
              disabled={!inputEnabled}
            />
            <button onClick={sendMessage} className={`send-btn ${!inputEnabled ? "disabled" : ""}`}>→</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatBotIcon;
