const express = require("express");
const router = express.Router();


// Country Controller Methods
const { addCountry, fetchCountries, updateCountry, deleteCountryById } = require("../controllers/countryController");


// Country Routes
router.post("/addCountry", addCountry);
router.get("/fetchCountries", fetchCountries);
router.put("/updateCountry/:id", updateCountry);
router.delete("/deleteCountryById/:id", deleteCountryById);


module.exports = router;