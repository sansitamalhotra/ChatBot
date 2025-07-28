import React from 'react';

const ChatMessage = ({ content, role }) => (
  <div
      className={`chat-message mb-2 d-flex ${
        role === "user" ? "justify-content-end" : "justify-content-start"
      }`}
      style={{
        whiteSpace: "pre-wrap", wordBreak: "break-word"
      }}
    >
      {/* Add logo only for bot messages */}
      {role === "bot" && (
        <img
          src="../../assets/img/team-3.jpg"
          alt="Bot Logo"
          style={{
            width: "40px",
            height: "40px",
            borderRadius: "50%",
            marginRight: "10px",
          }}
        />
      )}

      <span
        className="d-inline-block px-3 py-2"
        style={{
          background: role === "user" 
            ? "linear-gradient(90deg, #00c6ff, #0072ff)" // Gradient for user
            : "linear-gradient(90deg, #e6e6e6, #f9f9f9)", // Light gradient for bot
          color: role === "user" ? "#fff" : "#000",
          maxWidth: "70%",
          borderRadius: role === "user"
            ? "16px 16px 0px 16px" // All rounded except top-right for user
            : "0px 16px 16px 16px", // All rounded except top-left for bot
        }}
      >
        {content}
      </span>
    </div>
);

export default React.memo(ChatMessage);
