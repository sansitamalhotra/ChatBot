const express = require("express");
const router = express.Router();
const multer = require('multer');
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


const { applyJobApplication, fetchApplicantAppliedJobs, fetchAllAppliedJobsByApplicants } = require("../controllers/applicantJobApplicationController");


const createDirectoryIfNotExists = (directoryPath) => {
    try {
        if (!fs.existsSync(directoryPath)) {
            fs.mkdirSync(directoryPath, { recursive: true });
        }
    } catch (err) {
        console.error(`Error creating directory: ${directoryPath}`, err);
    }
  };
  
  const uploadDirectory = './uploads/JobApplicationFiles';
  createDirectoryIfNotExists(uploadDirectory);
  
  const storage = multer.diskStorage({
      destination: uploadDirectory,
      filename: (req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
          const fileExtension = path.extname(file.originalname);
          cb(null, file.fieldname + '-' + uniqueSuffix + fileExtension);
      }
  });
  
  const upload = multer({ storage: storage });
  
  router.post("/jobapplication/:slug", requireLogin, upload.fields([
      { name: 'resume', maxCount: 1 },
      { name: 'jobMatrix', maxCount: 1 }
  ]), applyJobApplication);
  
  
router.get("/appliedApplicants", fetchApplicantAppliedJobs);
router.get("/applicantAppliedJobs", fetchAllAppliedJobsByApplicants);



module.exports = router;
