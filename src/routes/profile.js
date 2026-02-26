const express = require('express');
const router = express.Router();
const profileController = require('../controllers/profileController');
const { authenticate } = require('../middleware/auth');

// Get current user's profile
router.get('/me', authenticate, profileController.getProfile);

// Get specific user's profile
router.get('/:userId', authenticate, profileController.getProfile);

// Update current user's profile
router.put('/me', authenticate, profileController.updateProfile);

module.exports = router;
