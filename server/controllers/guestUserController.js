const GuestUser = require('../models/guestUserModel');
const { logWithIcon } = require('../services/consoleIcons');
const EventEmitter = require('events');

const guestUserEventEmitter = new EventEmitter();

module.exports = {
  guestUserEventEmitter,

  createGuestUser: async (req, res) => {
    try {
      const { firstName, lastName, email, phone } = req.body;
      
      // Validate required fields
      if (!firstName || !email) {
        return res.status(400).json({
          success: false,
          message: 'First name and email are required'
        });
      }
      
      // Create new guest user
      const guestUser = new GuestUser({
        firstName,
        lastName: lastName || '',
        email: email.toLowerCase(),
        phone: phone || ''
      });
      console.log('Creating guest user:', guestUser);
      
      const savedGuestUser = await guestUser.save();
      console.log('Guest user created successfully:', savedGuestUser);
      console.log('Guest user ID:', savedGuestUser._id);
      
      res.status(201).json({
        success: true,
        message: 'Guest user created',
        data: guestUser,
        chatSessionStatus: 'creating' // To let frontend know that chat is being prepared
      });
    } catch (error) {
      logWithIcon.error('Error creating guest user:', error);
      res.status(500).json({
        success: false,
        message: 'Error creating guest user',
        error: error.message
      });
    }
  },

  getGuestUser: async (req, res) => {
    try {
      const { email } = req.params;

      if (!email) {
        return res.status(400).json({
          success: false,
          message: 'Email parameter is required'
        });
      }

      const guestUser = await GuestUser.findOne({ email: email.toLowerCase() });
      
      if (!guestUser) {
        return res.status(404).json({
          success: false,
          message: 'Guest user not found'
        });
      }

      logWithIcon.success("Guest User Email Found: ", guestUser);
      
      res.status(200).json({
        success: true,
        message: 'Guest user found',
        data: guestUser
      });

    } catch (error) {
      logWithIcon.error('Error fetching guest user:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching guest user',
        error: error.message
      });
    }
  },

  // Optional: Get all guest users (for admin purposes)
  getAllGuestUsers: async (req, res) => {
    try {
      const { page = 1, limit = 10 } = req.query;
      
      const guestUsers = await GuestUser.find()
        .sort({ createdAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit);

      const total = await GuestUser.countDocuments();

      res.status(200).json({
        success: true,
        message: 'Guest users retrieved successfully',
        data: {
          guestUsers,
          pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(total / limit),
            totalRecords: total
          }
        }
      });

    } catch (error) {
      logWithIcon.error('Error fetching guest users:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching guest users',
        error: error.message
      });
    }
  }
};
