const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticate, isAdmin } = require('../middleware/auth');

// Public routes
router.post('/register', authController.register);
router.post('/login', authController.login);

// Authenticated routes
router.get('/search-users', authenticate, authController.searchUsers);
router.get('/status', authenticate, authController.checkStatus);
router.post('/resubmit', authenticate, authController.resubmitRegistration);

// Admin routes
router.get('/pending-users', authenticate, isAdmin, authController.getPendingUsers);
router.get('/all-users', authenticate, isAdmin, authController.getAllUsers);
router.post('/approve/:userId', authenticate, isAdmin, authController.approveUser);
router.delete('/deny/:userId', authenticate, isAdmin, authController.denyUser);

module.exports = router;
