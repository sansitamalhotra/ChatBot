import React from "react";
import Modal from "react-bootstrap/Modal";
import ChatMessage from "./ChatMessage";
import ChatInput from "./ChatInput";
import "./ChatWindow.css";

const ChatWindow = ({ 
  showChatWindow, 
  messages, 
  loading, 
  quickReplies, 
  showQuickReplies, 
  handleCloseChat, 
  handleSendMessage,
  showLiveAgentForm,
  userDetails, 
  setUserDetails, 
  handleSubmitLiveAgentForm,
  typingStatus, 
  conversationId}) => {

  return (
    <Modal
      show={showChatWindow}
      onHide={handleCloseChat}
      dialogClassName="position-fixed bottom-0 end-0 m-3"
      backdropClassName="transparent-backdrop"
      contentClassName="custom-modal"
      onEntered={() => {
        document.body.style.overflow = "auto";
      }}
    >
      <Modal.Header 
        className="border-0 p-3"
        style={{
          background: "#0072ff",
          borderTopLeftRadius: "15px",
          borderTopRightRadius: "15px",
        }}
      >
        <div className="w-100 d-flex justify-content-between align-items-center">
          {/* Replaced h4 with span */}
          <span
            className="modal-title"
            style={{
              fontSize: "1.25rem",
              fontWeight: "bold",
              color: "#fff",
            }}
          >
            Chat
          </span>
          <button
            type="button"
            className="btn-close"
            onClick={handleCloseChat}
            aria-label="Close"
            style={{
              filter: "invert(1)"
            }}
          ></button>
        </div>
      </Modal.Header>

      <Modal.Body className="p-3">
        <div className="chat-window d-flex flex-column">
          <div
            className="chat-messages rounded-3 p-3 overflow-auto"
            style={{ height: "50vh", width: "40vh" }}
          >
            {/* Render all chat messages */}
            {messages.map((msg, index) => (
              <ChatMessage key={index} content={msg.content} role={msg.role} />
            ))}

            {/* Typing Indicator */}
            {loading && (
              <div className="chat-message text-start">
                <div
                  className="d-inline-block px-3 py-2 rounded-pill text-muted typing-indicator-container"
                  style={{
                    background: "#F1F2F7",
                    maxWidth: "70%",
                  }}
                >
                  <span className="dot"></span>
                  <span className="dot"></span>
                  <span className="dot"></span>
                </div>
              </div>
            )}

            {/* Live Agent Typing indicator */}
            {typingStatus && (
              <div className="chat-message text-start">
                <div
                  className="d-inline-block px-3 py-2 rounded-pill text-muted typing-indicator-container"
                  style={{
                    background: "#F1F2F7",
                    maxWidth: "70%",
                  }}
                >
                  <span className="dot"></span>
                  <span className="dot"></span>
                  <span className="dot"></span>
                </div>
              </div>
            )}

            {/* Show Quick Replies */}
            {showQuickReplies && (
              <div className="quick-replies">
                <p className="text-muted">Quick Replies:</p>
                <div className="d-flex flex-wrap gap-2">
                  {quickReplies.map((reply) => (
                    <button
                      key={reply.id}
                      className="quick-reply-btn p-2"
                      onClick={() => {
                        handleSendMessage(reply.label);
                      }}
                    >
                      {reply.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Render Live Agent Form */}
            {showLiveAgentForm && (
              <div className="form-container d-flex flex-column align-items-center" style={{ width: "100%" }}>
                <div
                  className="live-agent-form rounded-3 p-4"
                  style={{width: "100%"}}
                >
                  <h5 className="mb-3">Request Live Support</h5>
                  <div className="mb-3">
                    <label>Full Name</label>
                    <input
                      type="text"
                      className="form-control"
                      value={userDetails.fullName}
                      onChange={(e) =>
                        setUserDetails({ ...userDetails, fullName: e.target.value })
                      }
                    />
                  </div>
                  <div className="mb-3">
                    <label>Email</label>
                    <input
                      type="email"
                      className="form-control"
                      value={userDetails.email}
                      onChange={(e) =>
                        setUserDetails({ ...userDetails, email: e.target.value })
                      }
                    />
                  </div>
                  <div className="mb-3">
                    <label>Phone Number</label>
                    <input
                      type="text"
                      className="form-control"
                      value={userDetails.phoneNumber}
                      onChange={(e) =>
                        setUserDetails({ ...userDetails, phoneNumber: e.target.value })
                      }
                    />
                  </div>
                  <button
                    className="btn btn-primary w-100"
                    role="button"
                    onClick={handleSubmitLiveAgentForm}
                  >
                    Submit
                  </button>
                </div>
              </div>
            )}
          </div>

          <ChatInput 
            handleSendMessage={handleSendMessage} 
            conversationId={conversationId}
          />
        </div>
      </Modal.Body>
    </Modal>
  );
};

export default ChatWindow;
