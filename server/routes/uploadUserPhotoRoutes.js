const express = require("express");
const router = express.Router();
const { uploadPhoto, updateUserPhoto } = require("../controllers/userPhotoUploadController");
const { requireLogin } = require("../middlewares/authMiddleware");

router.post('/upload_photo', requireLogin, uploadPhoto);
router.post("/update_user_photo", requireLogin, updateUserPhoto);

module.exports = router;
