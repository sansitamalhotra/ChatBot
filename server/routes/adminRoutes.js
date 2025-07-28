const express = require("express");
const router = express.Router();


const {
    isAdmin,
    isRecruiter,
    requireLogin,
    isAdminOrSuperAdmin
  } = require("../middlewares/authMiddleware.js");

const {
  fetchRegisteredUsers,
  fetchRegisteredUserById,
  fetchAllAppliedJobsByApplicants
} = require("../controllers/adminController.js");


  // Route to Fetch Registered Users
router.get("/fetchRegisteredUsers", requireLogin, isAdminOrSuperAdmin, fetchRegisteredUsers);


// Route to Fetch Registered User By Id From Admin Dashboard
router.get("/fetchRegisteredUserById/:id", requireLogin, isAdminOrSuperAdmin, fetchRegisteredUserById);
router.get("/applicantAppliedJobs", fetchAllAppliedJobsByApplicants);
router.get("/fetchRegUsers", fetchRegisteredUsers);

// Route to Fetch Admins For Live status & sessions Update
// router.get("/fetchAdminWithSession", requireLogin, isAdmin, fetchAdminWithSession);


module.exports = router;
