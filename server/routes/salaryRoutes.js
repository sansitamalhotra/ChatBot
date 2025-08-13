const express = require("express");
const router = express.Router();

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


// Country Controller Methods
const { addSalary, fetchSalaries, updateSalary, deleteSalaryById } = require("../controllers/salaryController");


// Country Routes
router.post("/addSalary", requireLogin, isAdmin, addSalary);
router.get("/fetchSalaries", fetchSalaries);
router.put("/updateSalary/:id", requireLogin, isAdmin, updateSalary);
router.delete("/deleteSalaryById/:id", requireLogin, isAdmin, deleteSalaryById);


module.exports = router;