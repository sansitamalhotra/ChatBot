import React, { useState } from 'react';
import { io } from "socket.io-client";
const socket = io("http://localhost:8000");

const ChatInput = ({ handleSendMessage, conversationId }) => {
  const [message, setMessage] = useState('');
  
    const handleSubmit = (e) => {
      e.preventDefault();
      // const input = e.target.elements.messageInput.value.trim();
      // if (input) {
      //   handleSendMessage(input); 
      //   e.target.reset();
      // }
      if (message.trim()) {
        handleSendMessage(message);
        setMessage('');
      }
  };
  
  const handleKeyDown = (e) => { 
    if (e.key === 'Enter' && !e.shiftKey) {
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
        <button
          type="submit"
          className="btn d-flex align-items-center justify-content-center p-3"
          style={{
            width: "40px",
            height: "40px",
            background: 'radial-gradient(circle, #00c6ff, #0072ff)',
            color: "#fff",
            borderRadius: "50%",
            cursor: "pointer",
          }}
        >
          <i className="fas fa-paper-plane"></i>
        </button>
      </form>
    );
  };
  
 export default React.memo(ChatInput);
  