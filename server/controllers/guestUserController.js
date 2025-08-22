//guestUserController.js;

const GuestUser = require("../models/guestUserModel");
const { logWithIcon } = require("../services/consoleIcons");

module.exports = {

  createGuestUser: async (req, res) => {
    try {
      const { firstName, lastName, email, phone } = req.body;
      console.log('[DEBUG] Incoming guest user creation request:', req.body);
      // Validate required fields
      if (!firstName || !email) {
        console.log('[DEBUG] Missing required fields:', { firstName, email });
        return res.status(400).json({
          success: false,
          message: "First name and email are required",
        });
      }
      const existUser = await GuestUser.findOne({ email: email });

      if (existUser) {
        return res.status(201).json({
          success: true,
          message: "Guest user already exists",
          data: existUser,
          chatSessionStatus: "creating", // To let frontend know that chat is being prepared
        });
      }
      // Create new guest user
      const guestUser = new GuestUser({
        firstName,
        lastName: lastName || "",
        email: email.toLowerCase(),
        phone: phone || "",
      });
      console.log('[DEBUG] GuestUser object to save:', guestUser);
      const savedGuestUser = await guestUser.save();
      console.log('[DEBUG] Guest user created successfully:', savedGuestUser);
      console.log('[DEBUG] Guest user ID:', savedGuestUser._id);
      res.status(201).json({
        success: true,
        message: 'Guest user created',
        data: guestUser,
        chatSessionStatus: 'creating'
      });
    } catch (error) {
      logWithIcon.error('Error creating guest user:', error);
      console.log('[DEBUG] Error during guest user creation:', error);
      res.status(500).json({
        success: false,
        message: "Error creating guest user",
        error: error.message,
      });
    }
  },

  getGuestUser: async (req, res) => {
    try {
      const { email } = req.params;
      console.log('[DEBUG] Incoming getGuestUser request for email:', email);
      if (!email) {
        console.log('[DEBUG] Missing email parameter');
        return res.status(400).json({
          success: false,
          message: "Email parameter is required",
        });
      }
      const guestUser = await GuestUser.findOne({ email: email.toLowerCase() });
      console.log('[DEBUG] GuestUser found:', guestUser);
      if (!guestUser) {
        console.log('[DEBUG] Guest user not found for email:', email);
        return res.status(404).json({
          success: false,
          message: "Guest user not found",
        });
      }
      logWithIcon.success("Guest User Email Found: ", guestUser);
      res.status(200).json({
        success: true,
        message: "Guest user found",
        data: guestUser,
      });
    } catch (error) {
      logWithIcon.error('Error fetching guest user:', error);
      console.log('[DEBUG] Error during getGuestUser:', error);
      res.status(500).json({
        success: false,
        message: "Error fetching guest user",
        error: error.message,
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
        message: "Guest users retrieved successfully",
        data: {
          guestUsers,
          pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(total / limit),
            totalRecords: total,
          },
        },
      });
    } catch (error) {
      logWithIcon.error("Error fetching guest users:", error);
      res.status(500).json({
        success: false,
        message: "Error fetching guest users",
        error: error.message,
      });
    }
  },
};