const express = require("express");
const router = express.Router();


// Work Experience Controller Methods
const { addWorkExperience, fetchWorkExperiences, updateWorkExperience, deleteWorkExperienceById } = require("../controllers/workExperienceController");


// Country Routes
router.post("/addWorkExperience", addWorkExperience);
router.get("/fetchWorkExperiences", fetchWorkExperiences);
router.put("/updateWorkExperience/:id", updateWorkExperience);
router.delete("/deleteWorkExperienceById/:id", deleteWorkExperienceById);


module.exports = router;