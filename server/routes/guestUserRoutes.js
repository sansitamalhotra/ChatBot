//server/routes/guestUserRoutes.js
const express = require('express');
const router = express.Router();
const { createGuestUser, getGuestUser, createGuestSession } = require('../controllers/guestUserController');

// POST /api/guest-users - Create new guest user
router.post('/create-guest-user', createGuestUser);

// GET /api/guest-users/:email - Get guest user by email
router.get('/:email', getGuestUser);

// Guest session creation endpoint
router.post('/chat-sessions/guest', createGuestSession);

// Guest user creation endpoint
router.post('/guest-users', createGuestUser);

// Get guest user by email
router.get('/guest-users/:email', getGuestUser);

module.exports = router;
