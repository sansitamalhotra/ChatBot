// components/AgentDashboard.js
import React, { useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const SupportAgentDashboard = () => {
  const [activeChats, setActiveChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const socket = useRef();

  useEffect(() => {
    fetchChats();
    socket.current = io(process.env.BACKEND_SERVER_API);

    socket.current.on('newMessage', (message) => {
      setActiveChats(chats => chats.map(chat => 
        chat._id === message.chatId ? 
        { ...chat, messages: [...chat.messages, message] } : chat
      ));
    });

    return () => socket.current.disconnect();
  }, []);

  const fetchChats = async () => {
    const response = await fetch('/api/v1/chats');
    const data = await response.json();
    setActiveChats(data);
  };

  const sendMessage = (message) => {
    socket.current.emit('sendMessage', {
      chatId: selectedChat._id,
      message,
      sender: 'agent'
    });
  };

  return (
    <div className="dashboard">
      <div className="active-chats">
        {activeChats.map(chat => (
          <div key={chat._id} onClick={() => setSelectedChat(chat)}>
            {chat.user.fullName}
          </div>
        ))}
      </div>
      {selectedChat && (
        <ChatWindow 
          messages={selectedChat.messages}
          onSend={sendMessage}
        />
      )}
    </div>
  );
};
export default SupportAgentDashboard;
