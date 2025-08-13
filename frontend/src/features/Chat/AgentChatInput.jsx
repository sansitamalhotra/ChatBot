import React, { useState } from "react";
import { io } from "socket.io-client";

const socket = io(process.env.BACKEND_SERVER_API, {
    withCredentials: true,
    path: 'socket.io'
});

const ChatInput = ({ handleSendMessage, conversationId }) => {
  const [message, setMessage] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (message.trim()) {
      handleSendMessage(conversationId, message);
      setMessage("");
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      handleSubmit(e);
    }
  };

  const handleTyping = () => {
    if (conversationId) {
      socket.emit("userTyping", { chatId: conversationId });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="d-flex mt-3 gap-2">
      <input
        type="text"
        name="messageInput"
        className="form-control rounded-4"
        placeholder="Type your message"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyDown={handleKeyDown}
        onKeyUp={handleTyping}
      />
      <button type="submit" className="btn d-flex align-items-center justify-content-center p-3" style={{ width: "40px", height: "40px", background: "radial-gradient(circle, #00c6ff, #0072ff)", color: "#fff", borderRadius: "50%" }}>
        <i className="fas fa-paper-plane"></i>
      </button>
    </form>
  );
};

export default React.memo(AgentChatInput);
