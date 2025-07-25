const express = require("express");
const router = express.Router();


// Work Mode Controller Methods
const { addWorkMode, fetchWorkModes, updateWorkMode, deleteWorkModeById } = require("../controllers/workModeController");


// Country Routes
router.post("/addWorkMode", addWorkMode);
router.get("/fetchWorkModes", fetchWorkModes);
router.put("/updateWorkMode/:id", updateWorkMode);
router.delete("/deleteWorkModeById/:id", deleteWorkModeById);


module.exports = router;