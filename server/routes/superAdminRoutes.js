const express = require("express");
const router = express.Router();
const {    
    requireLogin,
    isSuperAdmin,
  } = require("../middlewares/authMiddleware.js");

const {
  fetchRegisteredUsers,
  fetchRegisteredUserById,
  fetchAllAppliedJobsByApplicants,
  fetchAdminWithSession
} = require("../controllers/superAdminController.js");

  // Route to Fetch Registered Users
router.get("/fetchRegisteredUsers", requireLogin, isSuperAdmin, fetchRegisteredUsers);

// Route to Fetch Registered User By Id From Admin Dashboard
router.get("/fetchRegisteredUserById/:id", requireLogin, isSuperAdmin, fetchRegisteredUserById);
router.get("/applicantAppliedJobs", fetchAllAppliedJobsByApplicants);
router.get("/fetchRegUsers", fetchRegisteredUsers);

// Route to Fetch Admins For Live status & sessions Update
router.get("/fetchAdminWithSession", requireLogin, isSuperAdmin, fetchAdminWithSession);
module.exports = router;
