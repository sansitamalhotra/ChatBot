const express = require('express');
const { requestLiveAgent } = require('../controllers/liveAgentController');

const router = express.Router();

router.post('/request', requestLiveAgent);

module.exports = router;
