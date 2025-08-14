//server/routes/guestUserRoutes.js
const express = require('express');
const router = express.Router();
const { createGuestUser, getGuestUser } = require('../controllers/guestUserController');

// POST /api/guest-users - Create new guest user
router.post('/create-guest-user', createGuestUser);

// GET /api/guest-users/:email - Get guest user by email
router.get('/:email', getGuestUser);

module.exports = router;
