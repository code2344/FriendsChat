const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const directWarningController = require('../controllers/directWarningController');

// All routes require authentication
router.use(authenticate);

// Create Direct Warning (admin/master_admin only)
router.post('/', directWarningController.createDirectWarning);

// Get all Direct Warnings (filtered by query params)
router.get('/', directWarningController.getDirectWarnings);

// Get specific Direct Warning
router.get('/:id', directWarningController.getDirectWarning);

// Send message in DW conversation
router.post('/:id/messages', directWarningController.sendDWMessage);

// Add admin note to DW
router.post('/:id/notes', directWarningController.addAdminNote);

// Submit user response/defense
router.post('/:id/response', directWarningController.submitUserResponse);

// Resolve Direct Warning (admin only)
router.put('/:id/resolve', directWarningController.resolveDirectWarning);

// Update Direct Warning
router.put('/:id', directWarningController.updateDirectWarning);

// Check for reminder notifications (internal/cron use)
router.post('/check-reminders', directWarningController.checkReminders);

module.exports = router;
