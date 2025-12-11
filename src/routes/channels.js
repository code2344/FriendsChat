const express = require('express');
const router = express.Router();
const channelController = require('../controllers/channelController');
const { authenticate } = require('../middleware/auth');

// Channel routes
router.post('/', authenticate, channelController.createChannel);
router.get('/server/:serverId', authenticate, channelController.getServerChannels);
router.delete('/:channelId', authenticate, channelController.deleteChannel);

module.exports = router;
