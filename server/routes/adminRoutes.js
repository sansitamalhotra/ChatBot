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

  const { fetchRegisteredUsers, fetchRegisteredUserById, fetchAllAppliedJobsByApplicants } = require("../controllers/adminController.js");


  // Route to Fetch Registered Users
router.get("/fetchRegisteredUsers", requireLogin, isAdmin, fetchRegisteredUsers);


// Route to Fetch Registered User By Id From Admin Dashboard
router.get("/fetchRegisteredUserById/:id", requireLogin, isAdmin, fetchRegisteredUserById);
router.get("/applicantAppliedJobs", fetchAllAppliedJobsByApplicants);
router.get("/fetchRegUsers", fetchRegisteredUsers);


module.exports = router;
