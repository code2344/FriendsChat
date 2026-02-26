const express = require('express');
const router = express.Router();
const webrtcController = require('../controllers/webrtcController');
const { authenticate } = require('../middleware/auth');

// Get user's media quality settings based on donor tier
router.get('/quality', authenticate, webrtcController.getMediaQuality);

// Get ICE servers configuration for WebRTC
router.get('/ice-servers', authenticate, webrtcController.getIceServers);

module.exports = router;
