const express = require("express");
const router = express.Router();

const { fetchAllOffices, addOffice, updateOffice, deleteOffice } = require("../controllers/officesController");

// Route to fetch all offices
router.get("/fetchAllOffices", fetchAllOffices);
router.post("/addOffice", addOffice);
router.put("/updateOffice/:id", updateOffice);
router.delete("/deleteOffice/:id", deleteOffice);

module.exports = router;