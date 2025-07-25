const express = require("express");
const router = express.Router();
const uploadUserPhoto = require("../services/uploadUserPhoto");

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
    fetchUserProfile, 
    fetchApplicantProfile, 
    updateApplicantProfile,
    addAcademicQualification,
    fetchApplicantCountries,
    fetchApplicationEducation, 
    deleteApplicationEducation,
    fetchEducation,
    fetchLoggedInUserById,
    updateUserPhoto,
    addApplicantSkills,
    fetchApplicantSkills,
    fetchApplicantSkill,
    deleteApplicantSkill,
    addApplicantWorkExperience,
    fetchApplicantExperience,
    fetchApplicantExperienceById,
    deleteApplicationExperience
} = require("../controllers/applicantController");


// Applicant Routes
router.get('/user', requireLogin, fetchUserProfile);
router.get('/profile', requireLogin, fetchApplicantProfile);
router.put('/update-profile', requireLogin, updateApplicantProfile);
router.post("/add-education", requireLogin, addAcademicQualification);

router.get("/countries", fetchApplicantCountries);

router.get("/education-history/:userId", requireLogin, fetchApplicationEducation);
router.get("/education/:id", requireLogin, fetchEducation);
router.delete("/delete-education/:id", requireLogin, deleteApplicationEducation);
router.get("/loggedInUser/:userId", requireLogin, fetchLoggedInUserById);

router.put('/user-photo/:userId', uploadUserPhoto.single("photo"), updateUserPhoto);


router.post("/add-skills", requireLogin, addApplicantSkills);
router.get("/skills/:userId", requireLogin, fetchApplicantSkills);
router.get("/skill/:id", requireLogin, fetchApplicantSkill);
router.delete("/delete-skill/:id", requireLogin, deleteApplicantSkill);


router.post("/add-experience", requireLogin, addApplicantWorkExperience);
router.get("/job-exerience/:userId", requireLogin, fetchApplicantExperience);
router.get("/experience/:id", requireLogin, fetchApplicantExperienceById);
router.delete("/delete-applicant-experience/:id", requireLogin, deleteApplicationExperience);

module.exports = router;