//server/routes/businessHoursRoutes.js
const express = require("express");
const router = express.Router();
const {    
    requireLogin,
    isSuperAdmin,
    isAdminOrSuperAdmin
} = require("../middlewares/authMiddleware.js");
  
const BusinessHoursController = require('../controllers/businessHoursController');

// Public routes - No Authentication/Authorization Required
// These should come FIRST to avoid middleware conflicts
router.get('/checkBusinessHoursStatus', BusinessHoursController.checkBusinessHoursStatus);
router.get('/checkSpecificDateTime', BusinessHoursController.checkSpecificDateTime);

// Protected Business Hours API Routes
router.get('/fetchBusinessHours', requireLogin, isAdminOrSuperAdmin, BusinessHoursController.fetchBusinessHours);
router.post('/addBusinessHours', requireLogin, isAdminOrSuperAdmin, BusinessHoursController.addBusinessHours);
router.put('/updateBusinessHours/:id', requireLogin, isAdminOrSuperAdmin, BusinessHoursController.updateBusinessHours);

// Special Hours and Holidays API Routes
router.post('/addSpecialHours', requireLogin, isAdminOrSuperAdmin, BusinessHoursController.addSpecialHours);
router.post('/addHoliday', requireLogin, isAdminOrSuperAdmin, BusinessHoursController.addHoliday);
router.get('/fetchForthComingSchedule', requireLogin, isAdminOrSuperAdmin, BusinessHoursController.fetchForthComingSchedule);
router.get('/holidaysMoreThan30Days', requireLogin, isAdminOrSuperAdmin, BusinessHoursController.holidaysMoreThan30Days);

// Default Business Hours API Routes
router.post('/addDefaultBusinessHoursConfiguration', requireLogin, isAdminOrSuperAdmin, BusinessHoursController.addDefaultBusinessHoursConfiguration);

// Middleware route for business hours validation
router.use('/validateBusinessHours', requireLogin, isAdminOrSuperAdmin, BusinessHoursController.validateBusinessHours);

module.exports = router;
