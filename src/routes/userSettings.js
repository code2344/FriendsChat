const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const userSettingsController = require('../controllers/userSettingsController');

// All routes require authentication
router.use(authenticate);

// Get settings
router.get('/', userSettingsController.getUserSettings);

// Update settings
router.put('/', userSettingsController.updateUserSettings);

// Custom status
router.post('/status', userSettingsController.setCustomStatus);
router.delete('/status', userSettingsController.clearCustomStatus);

// Block/unblock users
router.post('/block/:userId', userSettingsController.blockUser);
router.delete('/block/:userId', userSettingsController.unblockUser);
router.get('/blocked', userSettingsController.getBlockedUsers);

// Mute/unmute servers
router.post('/mute/server/:serverId', userSettingsController.muteServer);
router.delete('/mute/server/:serverId', userSettingsController.unmuteServer);

// Favorite servers
router.post('/favorite/:serverId', userSettingsController.toggleFavoriteServer);

module.exports = router;
