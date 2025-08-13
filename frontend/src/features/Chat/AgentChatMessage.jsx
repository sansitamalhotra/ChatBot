import React from "react";

const AgentChatMessage = ({ message }) => {
  return (
    <div className={`chat-message mb-2 d-flex ${message.sender === "agent" ? "justify-content-end" : "justify-content-start"}`}>
      <span
        className="d-inline-block px-3 py-2"
        style={{
          background: message.sender === "agent" ? "linear-gradient(90deg, #00c6ff, #0072ff)" : "linear-gradient(90deg, #e6e6e6, #f9f9f9)",
          color: message.sender === "agent" ? "#fff" : "#000",
          maxWidth: "70%",
          borderRadius: message.sender === "agent" ? "16px 16px 0px 16px" : "0px 16px 16px 16px",
        }}
      >
        {message.content}
      </span>
    </div>
  );
};

export default React.memo(AgentChatMessage);
