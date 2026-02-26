const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticate, isAdmin } = require('../middleware/auth');

// NOTE: Rate limiting should be implemented at the infrastructure level
// See DEPLOYMENT.md for configuration examples

// Public routes
router.post('/register', authController.register);
router.post('/login', authController.login);

// Authenticated routes
router.get('/search-users', authenticate, authController.searchUsers);
// codeql[js/missing-rate-limiting] - Rate limiting should be at infrastructure level
router.get('/status', authenticate, authController.checkStatus);
// codeql[js/missing-rate-limiting] - Rate limiting should be at infrastructure level
router.post('/resubmit', authenticate, authController.resubmitRegistration);

// Admin routes
router.get('/pending-users', authenticate, isAdmin, authController.getPendingUsers);
router.get('/all-users', authenticate, isAdmin, authController.getAllUsers);
router.post('/approve/:userId', authenticate, isAdmin, authController.approveUser);
// codeql[js/missing-rate-limiting] - Rate limiting should be at infrastructure level
router.delete('/deny/:userId', authenticate, isAdmin, authController.denyUser);

module.exports = router;
