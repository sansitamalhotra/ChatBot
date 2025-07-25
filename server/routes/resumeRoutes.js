const express = require("express");
const router = express.Router();
const multer = require('multer');
const moment = require('moment-timezone');
const fs = require('fs');
const path = require('path');
const uuid = require('uuid').v4


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
    uploadResume,
    fetchResumes,
    fetchResume,
    deleteResume,
} = require("../controllers/resumeController");


const createDirectoryIfNotExists = (directoryPath) => {
    try {
        if (!fs.existsSync(directoryPath)) {
            fs.mkdirSync(directoryPath, { recursive: true });
        }
    } catch (err) {
        console.error(`Error creating directory: ${directoryPath}`, err);
    }
  };
  
  const uploadDirectory = './uploads/ApplicantResume';
  createDirectoryIfNotExists(uploadDirectory);

  const fileFilter = (req, file, cb) => {
    const allowedFileTypes = ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
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
        const uniqueId = uuid();
        const filename = `${uniqueId}-${file.originalname.split('.')[0]}-${formattedDate}${ext}`;
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




// router.post("/upload-resume/:userId", requireLogin, upload.fields([
//     { name: 'resume', maxCount: 3 },
// ]), uploadResume);

router.post("/upload-resume/:userId", requireLogin, upload.fields([
    { name: 'resume', maxCount: Infinity },
]), uploadResume);


router.get("/applicant-resumes/:userId", requireLogin, fetchResumes);
router.get("/applicant-resume/:userId", requireLogin, fetchResume);
router.delete("/delete-resume/:id", requireLogin, deleteResume);



module.exports = router;