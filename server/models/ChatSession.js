// models/ChatSession.js
const mongoose = require('mongoose');

const chatSessionSchema = new mongoose.Schema({
  user: {
    fullName: String,
    email: String,
    phone: String
  },
  messages: [{
    sender: String, // 'user' or 'agent'
    content: String,
    timestamp: { type: Date, default: Date.now }
  }],
  active: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('ChatSession', chatSessionSchema);
