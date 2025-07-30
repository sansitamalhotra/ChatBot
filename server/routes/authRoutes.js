const express = require("express");
const router = express.Router();
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const moment = require('moment');

//Auth Controller actions/methods
const  { 
    registerController, 
    loginController, 
    regUserVerifyToken, 
    logoutController,
    forgotPasswordResetController,
    resetPasswordController,
    changePasswordController,
    uploadUserPhoto,
    fetchUserPhoto
} = require("../controllers/authController");

// User Controller Actions/Methods
const { fetchAllUsers, getUsers, fetchRegUsers } = require("../controllers/userController");

// Middlewares
const { isAdmin, isRecruiter, requireLogin, isSuperAdmin, isAdminOrSuperAdmin } = require("../middlewares/authMiddleware");



//const uploadDirectory = './uploads/UserPhotos';
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
        cb(new Error('Invalid file type. Only JPG, JPEG,  and PNG file types are allowed.'));
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



// Auth action/method routes
router.post("/register", registerController);
router.post("/login", loginController);
router.get("/:id/verify/:token", regUserVerifyToken);
router.get("/Email-Account-Verification/:id/:token", regUserVerifyToken);


router.post("/logout", requireLogin, logoutController);


// Forgot & Reset Password
router.post("/forgot-password", forgotPasswordResetController);
router.post("/reset-password/:id/:resetToken", resetPasswordController);
router.post("/Password-Reset-Link/:id/:resetToken", resetPasswordController);

router.put("/Account/Change-Password", requireLogin, changePasswordController);


router.put('/upload-user-photo', requireLogin, upload.single('photo'), uploadUserPhoto);
router.get('/user-photo/:userId', requireLogin, fetchUserPhoto);

// Admin Route
router.get("/adminRoute", requireLogin, isAdmin, (req, res) => { res.status(200).send({ ok: true }); });
router.get("/fetchRegUsers", fetchRegUsers);

// Super Admin Route
router.get("/isSuperAdminRoute", requireLogin, isSuperAdmin, (req, res) => { res.status(200).send({ ok: true }); });

// Super Admin Or Admin Route
router.get("/isAdminOrSuperAdminRoute", requireLogin, isAdminOrSuperAdmin, (req, res) => { res.status(200).send({ ok: true }); });

// Protected Employer route Auth
router.get("/employerRoute", requireLogin, isRecruiter, (req, res) => {
    res.status(200).send({ ok: true });
});

// Protected Applicant route Auth
router.get("/applicantRoute", requireLogin, (req, res) => {
    res.status(200).send({ ok: true });
});



module.exports = router;
