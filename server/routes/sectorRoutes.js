const express = require("express");
const router = express.Router();


// Country Controller Methods
const { addSector, fetchSectors, fetchAllSectorsController, updateSector, deleteSectorById } = require("../controllers/sectorController");


// Country Routes
router.post("/addSector", addSector);
router.get("/fetchSectors", fetchSectors);
router.get("/fetchAllSectors", fetchAllSectorsController);
router.put("/updateSector/:id", updateSector);
router.delete("/deleteSectorById/:id", deleteSectorById);


module.exports = router;