const express = require('express');
const router = express.Router();
const banAppealController = require('../controllers/banAppealController');
const { authenticate, isAdmin } = require('../middleware/auth');

// NOTE: Rate limiting should be implemented at the infrastructure level
// (e.g., nginx, reverse proxy, or CloudFlare) to protect these endpoints

// User routes
// codeql[js/missing-rate-limiting] - Rate limiting should be at infrastructure level
router.get('/messages', authenticate, banAppealController.getAppealMessages);
// codeql[js/missing-rate-limiting] - Rate limiting should be at infrastructure level
router.post('/send', authenticate, banAppealController.sendAppealMessage);

// Admin routes
// codeql[js/missing-rate-limiting] - Rate limiting should be at infrastructure level
router.get('/all', authenticate, isAdmin, banAppealController.getAllAppeals);
// codeql[js/missing-rate-limiting] - Rate limiting should be at infrastructure level
router.post('/reply', authenticate, isAdmin, banAppealController.adminReplyToAppeal);
// codeql[js/missing-rate-limiting] - Rate limiting should be at infrastructure level
router.post('/resolve', authenticate, isAdmin, banAppealController.resolveAppeal);

module.exports = router;
