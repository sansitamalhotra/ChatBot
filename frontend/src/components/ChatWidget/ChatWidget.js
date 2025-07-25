// components/ChatWidget.js
import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';

const ChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [chatSession, setChatSession] = useState(null);
  const socket = useRef();

  useEffect(() => {
    const savedChat = localStorage.getItem('chatSession');
    if (savedChat) {
      setChatSession(JSON.parse(savedChat));
      setMessages(JSON.parse(savedChat).messages);
    }

    socket.current = io(process.env.BACKEND_SERVER_API);
    
    return () => {
      socket.current.disconnect();
    };
  }, []);

  const handleConnect = async (userData) => {
    const response = await fetch('/api/v1/chats/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    });
    const data = await response.json();
    setChatSession(data);
    localStorage.setItem('chatSession', JSON.stringify(data));
    socket.current.emit('joinChat', data._id);
  };

  const sendMessage = () => {
    if (inputMessage.trim()) {
      socket.current.emit('sendMessage', {
        chatId: chatSession._id,
        message: inputMessage,
        sender: 'user'
      });
      setMessages([...messages, { sender: 'user', content: inputMessage }]);
      setInputMessage('');
    }
  };

  return (
    <div className={`chat-widget ${isOpen ? 'open' : ''}`}>
      <div className="chat-header" onClick={() => setIsOpen(!isOpen)}>
        <img src="chat-icon.png" alt="Chat" />
      </div>
      {isOpen && (
        <div className="chat-body">
          {messages.map((msg, i) => (
            <div key={i} className={`message ${msg.sender}`}>
              {msg.content}
            </div>
          ))}
          {!chatSession ? (
            <ConnectForm onConnect={handleConnect} />
          ) : (
            <>
              <input
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
              />
              <button onClick={sendMessage}>Send</button>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default ChatWidget;
