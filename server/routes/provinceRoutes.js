const express = require("express");
const router = express.Router();

// Province Controller Methods
const {
    addProvince,
    fetchAllProvinces,
    fetchProvinces,
    getallProvince,
    updateProvince,
    deleteProvinceById
} = require("../controllers/provinceController");


// Province Routes
router.post("/addProvince", addProvince);
router.get("/fetchAllProvinces/:countryId", fetchAllProvinces);
router.get("/fetchProvinces", fetchProvinces);
router.get("/getallProvince", getallProvince);

router.put("/updateProvince/:id", updateProvince);
router.delete("/deleteProvinceById/:id", deleteProvinceById);


module.exports = router;
