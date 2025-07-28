//server/controllers/guestUserController.js

const GuestUser = require('../models/guestUserModel');
const { logWithIcon } = require('../services/consoleIcons');


module.exports = {

  createGuestUser: async (req, res) => {
    try {
      const { firstName, lastName, email, phone } = req.body;
      // Validate input
      if (!firstName || !lastName || !email || !phone) {
        return res.status(400).json({
          success: false,
          message: 'All fields are required'
        });
      }

      // Check if guest user already exists
      const existingGuest = await GuestUser.findOne({ email });
      if (existingGuest) {
        return res.status(200).json({
          success: true,
          data: existingGuest
        });
      }

      const guestUser = new GuestUser({
        firstName,
        lastName,
        email,
        phone
      });

      await guestUser.save();

      res.status(201).json({
        success: true,
        data: guestUser
      });
    } catch (error) {
      // Handle duplicate key error specifically
      if (error.code === 11000 && error.keyPattern?.email) {
        // Try to find the existing guest user
        const existingGuest = await GuestUser.findOne({ email });
        if (existingGuest) {
          return res.status(200).json({
            success: true,
            data: existingGuest
          });
        }
      }
    
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
    
      const guestUser = await GuestUser.findOne({ email });
      if (!guestUser) {
        return res.status(404).json({
          success: false,
          message: 'Guest user not found'
        });
      }

      res.json({
        success: true,
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
  }
}
