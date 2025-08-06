import React, { useState } from "react";

//import the css for styling, this controls the look of the chat
import "./ChatBotIcon.css";

//okay so this is our chatbot component
const ChatBotIcon = () => {
  const [isOpen, setIsOpen] = useState(false);

  //this is our messages array, it has both bot and user messages
  const [messages, setMessages] = useState([
    { from: "bot", text: "Hi! How can I help you today?" } //default message when chatbot loads
  ]);

  //this stores what the user is typing in the input box
  const [input, setInput] = useState("");

  //this runs when user presses send (or enter)
  const handleSend = () => {
    //don’t let them send empty messages (like if they just hit space and enter)
    if (!input.trim()) return;

    //add the user's message to the messages list
    setMessages([...messages, { from: "user", text: input }]);

    //clear the input box after sending
    setInput("");

    //simulate bot response — kinda fake for now lol
    setTimeout(() => {
      setMessages(prev => [
        ...prev,
        { from: "bot", text: "Thanks for your message!" } //just a dummy reply
      ]);
    }, 800); //adds a little delay so it feels like it's "thinking"
  };

  //this is where we return all the actual UI
  return (
    <div className="chatbot-wrapper">
      <button className="chatbot-toggle" onClick={() => setIsOpen(!isOpen)}>
        <i className="fas fa-comments fa-2x"></i>
      </button>

      {/* only show this chat window box if the button isOpen */}
      {isOpen && (
        <div className="chatbot-box">
          
          {/* cute little header on top */}
          <div className="chatbot-header">Chat Assistant</div>

          {/* this shows all the messages (bot + user) */}
          <div className="chatbot-messages">
            {messages.map((msg, i) => (
              <div key={i} className={`chatbot-message ${msg.from}`}>
                {msg.text} {/* this is the actual text being shown */}
              </div>
            ))}
          </div>

          {/* input section at the bottom */}
          <div className="chatbot-input">
            <input
              type="text"
              value={input} //so it's connected to our input state
              onChange={(e) => setInput(e.target.value)} //updates the state when typing
              placeholder="Type a message..." //grey text when nothing is typed
              onKeyDown={(e) => e.key === "Enter" && handleSend()} //lets you press enter to send
            />
            <button onClick={handleSend}>→</button> {/* send button */}
          </div>
        </div>
      )}
    </div>
  );
};

//export this component so we can use it in app.jsx (just like <ChatBot />)
export default ChatBotIcon;
