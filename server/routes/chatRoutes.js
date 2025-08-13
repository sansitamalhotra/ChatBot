// // const express = require('express');
// // const router = express.Router();
// // const { fetchChats, fetchChatById, adminFetchChatById, createOrAppendChat, deleteChatById, startChatSession, fetchChatSession, fetchAllChatSessions } = require('../controllers/chatController');

// // // Middlewares
// // const { isAdmin, requireLogin } = require("../middlewares/authMiddleware");

// // router.get('/fetchChats', fetchChats);
// // router.get('/adminFetchChatById/:id', requireLogin, isAdmin, adminFetchChatById);
// // router.get('/fetchChatById/:id', fetchChatById);
// // router.post('/createOrAppendChat', createOrAppendChat);
// // router.delete('/deleteChatById/:id', deleteChatById);
// // router.post('/startChat', startChatSession);
// // router.get('/fetchChatSession/:id', requireLogin, isAdmin, fetchChatSession);
// // router.get('/fetchAllChatSessions', requireLogin, isAdmin, fetchAllChatSessions);


// // module.exports = router;


// const express = require('express');
// const router = express.Router();
// const chatController = require('../controllers/chatController');

// // Create a new chat session
// router.post('/createChatSession', chatController.createChatSession);

// // Get active session for a user
// router.get('/getActiveSession/:userId', chatController.getActiveSession);

// // Update chat session
// router.put('/updateChatSession/:sessionId', chatController.updateChatSession);

// // Close chat session
// router.delete('/closeSession/:sessionId', chatController.closeSession);

// // Transfer to live agent
// router.post('/:sessionId/transferToAgent', chatController.transferToAgent);

// // Add message to session
// router.post('/:sessionId/addMessage', chatController.addMessage);

// module.exports = router;
