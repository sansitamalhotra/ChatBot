//server/models/chatModel.js
const mongoose = require('mongoose');

const chatUserDetails = new mongoose.Schema({
  name: String,
  email: String,
  phone: String,
});

const messageSchema = new mongoose.Schema({
  sender: String,
  content: String,
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

const chatSchema = new mongoose.Schema({
  chatId: {
    type: String,
    unique: true,
    required: true,
  },
  messages: [messageSchema],
  userDetails: chatUserDetails
}, { timestamps: true });

module.exports = mongoose.model('Chat', chatSchema);
