const Chat = require('../models/chatModel');
const ChatSession = require('../models/chatSession');
const nodemailer = require('nodemailer');

module.exports = {
  fetchChats: async (req, res) => {
    try {
      const chats = await Chat.find().sort({ createdAt: -1 });
      res.status(200).send({ success: true, message: 'All Chats Fetched Successfully!', chats });
    } catch (error) {
      console.log(error);
      res.status(500).send({ success: false, message: 'Error fetching chats', error });
    }
  },

  fetchChatById: async (req, res) => {
    try {
      const chat = await Chat.findOne({ chatId: req.params.id });
      if (!chat) {
        return res.status(404).send({ success: false, message: 'Chat not found' });
      }
      res.status(200).send({ success: true, message: 'Chat fetched successfully!', chat });
    } catch (error) {
      console.log(error);
      res.status(500).send({ success: false, message: 'Error fetching chat by ID', error });
    }
  },
  adminFetchChatById: async (req, res) => {
    try {
      const chat = await Chat.findOne({ chatId: req.params.id });
      if (!chat) {
        return res.status(404).send({ success: false, message: 'Chat not found' });
      }
      res.status(200).send({ success: true, message: 'Chat fetched successfully!', chat });
    } catch (error) {
      console.log(error);
      res.status(500).send({ success: false, message: 'Error fetching chat by ID', error });
    }
  },

  createOrAppendChat: async (req, res) => {
    try {
      const { chatId, sender, content, userDetails } = req.body;
      if (!chatId || !sender || !content) {
        return res.status(400).send({ success: false, message: 'Missing required fields' });
      }

      let chat = await Chat.findOne({ chatId });
      if (!chat) {
        chat = await Chat.create({ chatId, messages: [{ sender, content }], userDetails: { name:userDetails.name, email:userDetails.email, phone:userDetails.phone} });
      } else {
        chat.messages.push({ sender, content });
        await chat.save();
      }

      res.status(201).send({ success: true, message: 'Message added successfully!', chat });
    } catch (error) {
      console.log(error);
      res.status(500).send({ success: false, message: 'Error adding message to chat', error });
    }
  },

  deleteChatById: async (req, res) => {
    try {
      await Chat.findOneAndDelete({ chatId: req.params.id });
      res.status(200).send({ success: true, message: 'Chat deleted successfully!' });
    } catch (error) {
      console.log(error);
      res.status(500).send({ success: false, message: 'Error deleting chat', error });
    }
  },
  startChatSession: async (req, res) => {
    try {
      const { fullName, email, phone } = req.body;
      const newSession = await ChatSession.create({ user: { fullName, email, phone } });
      
      // Send email notification
      const transporter = nodemailer.createTransport({
        service: "gmail",
        host: process.env.SEND_EMAIL_HOST,
        port: 465,
        auth: {
            user: process.env.EMAIL_NOTIFICATION_USER,
            pass: process.env.EMAIL_NOTIFICATION_PASS 
        },
      });

      await transporter.sendMail({
        from: "ProsoftSynergies Private Limited <hrpspl@prosoftsynergies.com>",
        to: process.env.EMAIL_RECIPIENTS.split(","),
        subject: 'New Chat Session Started',
        html: `<p>New chat session started by ${fullName}</p>
              <a href="${process.env.FRONTEND_BASE_URL}/${newSession._id}">Join Chat</a>`
      });

      res.status(201).json(newSession);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
  fetchChatSession: async (req, res) => {
    try {
      const session = await ChatSession.findById(req.params.id);
      res.json(session);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
  fetchAllChatSessions: async (req, res) => {
    try {
      const sessions = await ChatSession.find().sort({ createdAt: -1 });
      res.status(200).json(sessions);
    } catch (error) {
      res.status(500).json({ error: "Failed to retrieve chat sessions" });
    }
  }
};
