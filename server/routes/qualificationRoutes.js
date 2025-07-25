const express = require("express");
const router = express.Router();


// Qualification Controller Methods
const { addQualification, fetchQualifications, updateQualification, deleteQualificationById } = require("../controllers/qualificationController");


// Country Routes
router.post("/addQualification", addQualification);
router.get("/fetchQualifications", fetchQualifications);
router.put("/updateQualification/:id", updateQualification);
router.delete("/deleteQualificationById/:id", deleteQualificationById);


module.exports = router;