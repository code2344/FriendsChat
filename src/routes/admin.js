const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticate, isAdmin, isMasterAdmin } = require('../middleware/auth');

// Report routes
router.post('/reports', authenticate, adminController.createReport);
router.get('/reports', authenticate, isAdmin, adminController.getReports);
router.put('/reports/:reportId', authenticate, isAdmin, adminController.resolveReport);

// Ban routes
router.post('/ban/:userId', authenticate, isAdmin, adminController.permanentlyBanUser);
router.get('/banned', authenticate, isAdmin, adminController.getBannedUsers);

// Admin management routes (master admin only)
router.post('/promote/:userId', authenticate, isMasterAdmin, adminController.promoteToAdmin);
router.post('/demote/:userId', authenticate, isMasterAdmin, adminController.demoteAdmin);

// Master admin only - System management
router.get('/stats/database', authenticate, isMasterAdmin, adminController.getDatabaseStats);
router.get('/stats/health', authenticate, isMasterAdmin, adminController.getSystemHealth);
router.post('/archive/trigger', authenticate, isMasterAdmin, adminController.triggerArchive);
router.get('/archive/search', authenticate, isMasterAdmin, adminController.searchArchived);

module.exports = router;
