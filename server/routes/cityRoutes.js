const express = require("express");
const router = express.Router();

// City Controller Methods
const { addCity, fetchAllCities, fetchCities, getAllCities } = require("../controllers/cityController");


// City Routes
router.post("/addCity", addCity);
router.get("/fetchAllCities/:cityId", fetchAllCities);
router.get("/fetchCities", fetchCities);
router.get("/getAllCities", getAllCities);


module.exports = router;