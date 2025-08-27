const express = require("express");
const router = express.Router();

// Middlewares
const { isAdmin, isRecruiter, isApplicant, requireLogin } = require("../middlewares/authMiddleware");


const {
    fetchRegUserById,
} = require("../controllers/userController");


router.get("/fetchRegUserById/:id", fetchRegUserById);
module.exports = router;