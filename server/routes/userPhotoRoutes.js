const express = require("express");
const router = express.Router();
const multer = require('multer');
const moment = require('moment-timezone');
const fs = require('fs');
const path = require('path');


const {
    isAdmin,
    isRecruiter,
    isApplicant,
    requireLogin,
    isAuthorized,
    isUserAdmin,
    isUserRecruiter,
    isUser,
} = require("../middlewares/authMiddleware.js");

const { 
    uploadPhoto,
    fetchUserPhoto
} = require("../controllers/userPhotoController");



const createDirectoryIfNotExists = (directoryPath) => {
    try {
        if (!fs.existsSync(directoryPath)) {
            fs.mkdirSync(directoryPath, { recursive: true });
        }
    } catch (err) {
        console.error(`Error creating directory: ${directoryPath}`, err);
    }
  };
  
  const uploadDirectory = './uploads/UserPhotos';
  createDirectoryIfNotExists(uploadDirectory);

  const fileFilter = (req, file, cb) => {
    const allowedFileTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    if (allowedFileTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only DOC, DOCX, Excel and PDF file types are allowed.'));
    }
};

  
  const storage = multer.diskStorage({
      destination: uploadDirectory,
      filename: (req, file, cb) => {
        const timestamp = Date.now();
        const formattedDate = moment(timestamp).format('YYYY-MM-DD');
        const ext = path.extname(file.originalname);
        const filename = `${file.originalname.split('.')[0]}-${formattedDate}${ext}`;
        cb(null, filename);
    }
  });
  
  const upload = multer({
    storage: storage,
    limits: {
        fileSize: 1024 * 1024 * 5,
    },
    fileFilter: fileFilter,
});

router.post("/update-user-photo/:userId", requireLogin, upload.single('photo'), uploadPhoto);
router.get("/user-photo/:userId", requireLogin, fetchUserPhoto);

module.exports = router;