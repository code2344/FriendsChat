const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');
const { authenticate, isMasterAdmin } = require('../middleware/auth');

// Message routes
router.post('/', authenticate, messageController.sendMessage);
router.get('/channel/:channelId', authenticate, messageController.getMessages);

// Direct message routes
router.post('/direct', authenticate, messageController.sendDirectMessage);
router.get('/direct/:userId', authenticate, messageController.getDirectMessages);

// Master admin routes
router.get('/all', authenticate, isMasterAdmin, messageController.getAllMessages);

module.exports = router;
