const express = require("express");
const router = express.Router();
const upload = require("../services/postJobFile");

// Middlewares
const { 
    isAdmin, 
    isRecruiter, 
    isApplicant, 
    requireLogin, 
    isAuthorized, 
    isUserAdmin, 
    isUserRecruiter, 
    isUser 
} = require("../middlewares/authMiddleware");

const { 
    postJob,
    addNewJob, 
    downloadJobFileById, 
    fetchAllJobs, 
    fetchAllFiles, 
    fetchCountriesForJobPost,
    fetchProvincesForJobPost,
    fetchCitiesForJobPost,
    fetchJobsByRecruiter,
    fetchJobByIdController,
    fetchSingleJobController,
    fetchJobFileController,
    deleteJobController,
    updateJobController,
    fetchJobBySlugController,
    filterJobsBySector,
    filterJobsByWorkMode,
    filterJobByWorkExperience,
    filterJobByCountries,
    fetchJobRelatedSectors,
    fetchAllAppliedJobsByApplicants,
    fetchRegisteredUsers,
    fetchAllPostedJobs
} = require("../controllers/jobController");

// IMPORTANT: Remove authentication middleware for public routes
// These should be accessible without authentication for the counter display

// Public routes (no authentication required)
router.get("/fetchAllJobs", fetchAllJobs);
router.get("/applicantAppliedJobs", fetchAllAppliedJobsByApplicants);
router.get("/fetchRegUsers", fetchRegisteredUsers);

// Admin/Protected routes
router.post("/postJob", requireLogin, isAdmin, upload.single("filePath"), postJob);
router.post("/addNewJob", requireLogin, isAdmin, upload.single("filePath"), addNewJob);
router.get("/download/:slug", downloadJobFileById);
router.get("/fetchAllFiles", fetchAllFiles);
router.get("/fetchCountries", fetchCountriesForJobPost);
router.get("/provinces/:countryId", fetchProvincesForJobPost);
router.get("/cities/:provinceId", fetchCitiesForJobPost);
router.get("/fetchJobsByRecruiter/:userId", requireLogin, isAdmin, fetchJobsByRecruiter);
router.get("/job-details/:slug", fetchJobByIdController);
router.get("/job/:slug", fetchSingleJobController);
router.get("/jobFile/:jid", fetchJobFileController);
router.delete("/deleteJob/:slug", requireLogin, isAdmin, deleteJobController);
router.put("/updateJob/:slug", requireLogin, isAdmin, updateJobController);
router.get("/viewJob/:slug", fetchJobBySlugController);

// Filter routes
router.get("/sectors", filterJobsBySector);
router.get("/allSectors", fetchJobRelatedSectors);
router.get("/workModes", filterJobsByWorkMode);
router.get("/workExperiences", filterJobByWorkExperience);
router.get("/countries", filterJobByCountries);

// Additional routes
router.get("/fetchAllPostedJobs", fetchAllPostedJobs);

module.exports = router;
