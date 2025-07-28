// server/routes/onlineStatusRoutes.js
const express = require('express');
const { isBusinessHours } = require('../utils/timeUtils');

const router = express.Router();

router.get('/business-hours', (req, res) => {
  const status = isBusinessHours();
  res.json({ 
    isBusinessHour: status,
    message: status 
      ? 'Agents are available' 
      : 'Outside business hours'
  });
});

module.exports = router;
