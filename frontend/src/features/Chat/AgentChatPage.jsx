import React, { useState, useEffect } from "react";
import { io } from "socket.io-client";
import API from "../../helpers/API";
import "bootstrap/dist/css/bootstrap.min.css";
import "./ChatWindow.css";

const socket = io(process.env.BACKEND_SERVER_API, {
    withCredentials: true
});

const LiveChatPage = () => {
  const [chats, setChats] = useState([]); 
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]); 
  const [newMessage, setNewMessage] = useState(""); 
  const [typingStatus, setTypingStatus] = useState(false);

  const handleTyping = () => {
    if (selectedChat) {
      socket.emit("typing", { chatId: selectedChat.chatId });
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault(); // Prevents the default behavior of adding a new line
      handleSendMessage(selectedChat.chatId); // Send the message
      setNewMessage(""); // Clear the input field
    } else {
      handleTyping(); // Indicate that the user is typing
    }
  };

  const fetchChats = async () => {
    try {
      const response = await API.get("/api/v1/chats/fetchChats");
      setChats(response.data.chats);
    } catch (error) {
      console.error("Error fetching chats:", error);
    }
  };

  useEffect(() => {
    fetchChats();
  }, []);
  
  useEffect(() => {
    const handleNewChat = async (newChat) => {
      try {
        const response = await API.get(`/api/v1/chats/adminFetchChatById/${newChat.chatId}`);
        setChats((prevChats) => [
          ...prevChats,
          { ...newChat, messages: response.data?.chat?.messages || [] }
        ]);
      } catch (error) {
        console.error("Error fetching initial chat messages:", error);
      }
    };
  
    socket.on("newChat", handleNewChat);
  
    return () => {
      socket.off("newChat", handleNewChat);
    };
  }, []);

  useEffect(() => {
    const handleAgentMessage = (data) => {
      setChats((prevChats) => {
        return prevChats.map((chat) => {
          if (chat.chatId === data.chatId) {
            const updatedMessages = [...(chat.messages || []), data];
            // Update messages for the selected chat
            if (selectedChat?.chatId === chat.chatId) {
              setMessages(updatedMessages);
            }
            return {
              ...chat,
              messages: updatedMessages,
            };
          }
          return chat;
        });
      });
  
      // Update message list for the selected chat only
      if (selectedChat?.chatId === data.chatId) {
        setMessages((prevMessages) => [...prevMessages, data]);
      }
    };
  
    socket.on('agentReceiveMessage', handleAgentMessage);
  
    return () => {
      socket.off('agentReceiveMessage', handleAgentMessage);
    };
  }, [socket, selectedChat]);

  const handleSelectChat = async (chat) => {
    setSelectedChat(chat);

    socket.emit("joinChat", chat.chatId);
    try {
      const response = await API.get(`/api/v1/chats/fetchChatById/${chat.chatId}`);
      setMessages(response.data?.chat?.messages || []);
    } catch (error) {
      console.error("Error fetching messages:", error);
    }
  };

  useEffect(() => {
    let typingTimeout;
  
    const handleTypingResponse = ({ chatId: typingChatId, isTyping }) => {
      if (typingChatId === selectedChat?.chatId) {
        setTypingStatus(isTyping);
  
        if (isTyping) {
          clearTimeout(typingTimeout);
          typingTimeout = setTimeout(() => {
            setTypingStatus(false);
          }, 2000);
        }
      }
    };

    socket.on("stopUserTypingIndicator", ({ chatId }) => {
      if (chatId === selectedChat.chatId) {
        clearTimeout(typingTimeout);
        setTypingStatus(false);
      }
    });
  
    socket.on("userTypingResponse", handleTypingResponse);
  
    return () => {
      clearTimeout(typingTimeout);
      socket.off("stopUserTypingIndicator");
      socket.off("userTypingResponse", handleTypingResponse);
    };
  }, [selectedChat, socket]);

  const handleSendMessage = async (chatId) => {
    if (newMessage.trim() === "" || !chatId) return;
  
    const messageData = {
      chatId,
      content: newMessage,
      sender: "agent"
    };
  
    try {
      socket.emit("stopAgentTyping", { chatId: chatId });
      await API.post(`/api/v1/chats/createOrAppendChat`, messageData);
      socket.emit("sendMessage", messageData);
      setNewMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  return (
    <div className="container-fluid vh-100 d-flex">
      {/* Sidebar */}
      <div className="col-3 border-end bg-light p-3">
        <h4 className="text-center mb-4">Chats</h4>
        <ul className="list-group">
          {chats.length > 0 ? (
            chats.map((chat) => {
              const latestMessage = chat.messages?.[chat.messages.length - 1]; 
              return (
                <li
                  key={chat.chatId}
                  className={`list-group-item ${selectedChat?.chatId === chat.chatId ? "active" : ""}`}
                  onClick={() => handleSelectChat(chat)}
                  style={{ cursor: "pointer" }}
                >
                  {/* Name and email */}
                  <div style={{ overflow: "hidden", textOverflow: "ellipsis" }}>
                    <strong>
                      {chat.userDetails.name} </strong><small style={{ fontSize: "0.9em" }}>({chat.userDetails.email})</small>
                    
                  </div>
                  {/* Latest message preview */}
                  {latestMessage && (
                    <div style={{ fontSize: "0.85em", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      <strong>{latestMessage.sender === "agent" ? "You: " : `${chat.userDetails.name}: `}</strong>
                      {latestMessage.content}
                    </div>
                  )}
                </li>
              );
            })
          ) : (
            <li className="list-group-item text-center text-muted">No chats available</li>
          )}
        </ul>
      </div>

      {/* Chat Window */}
      <div className="col-9 d-flex flex-column">
        {selectedChat ? (
          <>
            <div className="border-bottom p-3">
              <h5>Chat with {`${selectedChat.userDetails.name}`}</h5>
            </div>
            <div className="flex-grow-1 p-3 bg-white overflow-auto">
              {/* Render message history */}
              {messages.length > 0 ? (
                messages.map((message, index) => (
                  <div
                    key={index}
                    className={`chat-message mb-2 d-flex ${
                      message.sender === "agent" ? "justify-content-end" : "justify-content-start"
                    }`}
                    style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}
                  >
                    <span
                      className="d-inline-block px-3 py-2"
                      style={{
                        background: message.sender === "agent"
                          ? "linear-gradient(90deg, #00c6ff, #0072ff)" 
                          : "linear-gradient(90deg, #e6e6e6, #f9f9f9)", 
                        color: message.sender === "agent" ? "#fff" : "#000",
                        maxWidth: "70%",
                        borderRadius: message.sender === "agent"
                          ? "16px 16px 0px 16px" 
                          : "0px 16px 16px 16px", 
                      }}
                    >
                      {message.content}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-muted">No messages yet.</p>
              )}

              {/* Live Agent Typing indicator */}
              {typingStatus && (
                <div className="chat-message text-start">
                  <div
                    className="px-3 py-2 rounded-pill text-muted typing-indicator-container"
                    style={{
                      background: "#F1F2F7",
                      maxWidth: "14%",
                    }}
                  >
                    <span className="dot"></span>
                    <span className="dot"></span>
                    <span className="dot"></span>
                  </div>
                </div>
              )}
            </div>

            <div className="p-3 border-top">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (newMessage.trim()) {
                    handleSendMessage(selectedChat.chatId);
                    setNewMessage("");
                  }
                }}
                className="d-flex gap-2"
              >

                <textarea
                  className="form-control rounded-4"
                  rows="1"
                  placeholder="Type your message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={handleKeyDown}
                />

                <button
                  type="submit"
                  className="btn d-flex align-items-center justify-content-center p-3"
                  style={{
                    width: "40px",
                    height: "40px",
                    background: "radial-gradient(circle, #00c6ff, #0072ff)",
                    color: "#fff",
                    borderRadius: "50%",
                    cursor: "pointer",
                  }}
                >
                  <i className="fas fa-paper-plane"></i>
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="d-flex flex-grow-1 justify-content-center align-items-center">
            <p className="text-muted">Select a chat to start messaging</p>
          </div>
        )}
      </div>

    </div>
  );
};

export default LiveChatPage;


