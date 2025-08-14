//server/controllers/guestUserController.js
const GuestUser = require('../models/guestUserModel');
const { logWithIcon } = require('../services/consoleIcons');

module.exports = {
  createGuestUser: async (req, res) => {
    try {
      const { firstName, lastName, email, phone } = req.body;

      // Check if this request is coming from an authenticated user (shouldn't happen)
      if (req.user && req.user.id) {
        logWithIcon.warn('Authenticated user trying to create guest user - this should not happen');
        return res.status(400).json({
          success: false,
          message: 'Authenticated users should not create guest accounts'
        });
      }

      // Validate required fields
      if (!firstName || !email) {
        return res.status(400).json({
          success: false,
          message: 'First name and email are required'
        });
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          success: false,
          message: 'Please provide a valid email address'
        });
      }

      // Check if guest user already exists
      let existingGuestUser = await GuestUser.findOne({ email: email.toLowerCase() });
      
      if (existingGuestUser) {
        // Update existing guest user with new information
        existingGuestUser.firstName = firstName;
        existingGuestUser.lastName = lastName || existingGuestUser.lastName;
        existingGuestUser.phone = phone || existingGuestUser.phone;
        
        const updatedGuestUser = await existingGuestUser.save();
        
        logWithIcon.info("Guest User Updated Successfully: ", updatedGuestUser);
        
        return res.status(200).json({
          success: true,
          message: 'Guest User Updated Successfully',
          data: updatedGuestUser
        });
      }

      // Create new guest user
      const guestUser = new GuestUser({
        firstName,
        lastName: lastName || '',
        email: email.toLowerCase(), // Store email in lowercase for consistency
        phone: phone || ''
      });

      const savedGuestUser = await guestUser.save();
      
      logWithIcon.success("Guest User Created Successfully: ", savedGuestUser);
      
      res.status(201).json({
        success: true,
        message: 'Guest User Created Successfully',
        data: savedGuestUser
      });

    } catch (error) {
      logWithIcon.error('Error creating guest user:', error);
      
      // Handle mongoose validation errors
      if (error.name === 'ValidationError') {
        const validationErrors = Object.values(error.errors).map(err => err.message);
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: validationErrors
        });
      }

      // Handle duplicate key error
      if (error.code === 11000) {
        return res.status(409).json({
          success: false,
          message: 'A guest user with this email already exists'
        });
      }

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
