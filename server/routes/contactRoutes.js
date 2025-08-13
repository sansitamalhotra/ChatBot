const express = require("express");
const router = express.Router();

// Middlewares
const { isAdmin, isRecruiter, isApplicant, requireLogin, isAuthorized, isUserAdmin, isUserRecruiter, isUser, } = require("../middlewares/authMiddleware");

const { 
    contactFormRequestController, 
    fetchContactMessages, 
    fetchContactMessageByIdController ,
    deleteContactMessageController
} = require("../controllers/contactController");



// Route for Contact Us
router.post("/contact-form", contactFormRequestController);


// Route to fetch all messages from contact us form
router.get("/messages", requireLogin, isAdmin, fetchContactMessages);
router.get("/message/:id", requireLogin, isAdmin, fetchContactMessageByIdController);
router.delete("/delete/:id", requireLogin, isAdmin, deleteContactMessageController);

module.exports = router;