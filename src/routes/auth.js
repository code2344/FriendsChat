const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticate, isAdmin } = require('../middleware/auth');

// Public routes
router.post('/register', authController.register);
router.post('/login', authController.login);

// Admin routes
router.get('/pending-users', authenticate, isAdmin, authController.getPendingUsers);
router.post('/approve/:userId', authenticate, isAdmin, authController.approveUser);
router.delete('/deny/:userId', authenticate, isAdmin, authController.denyUser);

module.exports = router;
