const express = require("express");
const router = express.Router();


// WorkAuthorization Controller Methods
const { addWorkAuthorization, fetchWorkAuthorizations, updateWorkAuthorization, deleteWorkAuthorizationById } = require("../controllers/workAuthorizationController");


// WorkAuthorization Routes
router.post("/addWorkAuthorization", addWorkAuthorization);
router.get("/fetchWorkAuthorizations", fetchWorkAuthorizations);
router.put("/updateWorkAuthorization/:id", updateWorkAuthorization);
router.delete("/deleteWorkAuthorizationById/:id", deleteWorkAuthorizationById);


module.exports = router;