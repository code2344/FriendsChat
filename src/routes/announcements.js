const express = require('express');
const router = express.Router();
const announcementController = require('../controllers/announcementController');
const { authenticateToken } = require('../middleware/auth');

// User routes
router.get('/user', authenticateToken, announcementController.getUserAnnouncements);
router.put('/:announcementId/read', authenticateToken, announcementController.markAsRead);

// Admin routes
router.post('/', authenticateToken, announcementController.createAnnouncement);
router.get('/all', authenticateToken, announcementController.getAllAnnouncements);
router.delete('/:announcementId', authenticateToken, announcementController.deleteAnnouncement);
router.put('/:announcementId/deactivate', authenticateToken, announcementController.deactivateAnnouncement);

module.exports = router;
