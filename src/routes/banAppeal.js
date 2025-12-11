const express = require('express');
const router = express.Router();
const banAppealController = require('../controllers/banAppealController');
const { authenticate, isAdmin } = require('../middleware/auth');

// User routes
router.get('/messages', authenticate, banAppealController.getAppealMessages);
router.post('/send', authenticate, banAppealController.sendAppealMessage);

// Admin routes
router.get('/all', authenticate, isAdmin, banAppealController.getAllAppeals);
router.post('/reply', authenticate, isAdmin, banAppealController.adminReplyToAppeal);
router.post('/resolve', authenticate, isAdmin, banAppealController.resolveAppeal);

module.exports = router;
