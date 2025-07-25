import React from "react";

const TypingIndicator = () => {
  return (
    <div className="chat-message text-start">
      <div className="px-3 py-2 rounded-pill text-muted typing-indicator-container" style={{ background: "#F1F2F7", maxWidth: "14%" }}>
        <span className="dot"></span>
        <span className="dot"></span>
        <span className="dot"></span>
      </div>
    </div>
  );
};

export default TypingIndicator;
