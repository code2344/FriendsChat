const express = require('express');
const router = express.Router();
const sponsorshipController = require('../controllers/sponsorshipController');
const { authenticateToken } = require('../middleware/auth');

// User routes
router.post('/', authenticateToken, sponsorshipController.createSponsorship);
router.get('/server/:serverId', authenticateToken, sponsorshipController.getServerSponsorships);
router.get('/sponsored', sponsorshipController.getSponsoredServers); // Public

// Tracking routes
router.post('/:sponsorshipId/view', sponsorshipController.trackView);
router.post('/:sponsorshipId/click', sponsorshipController.trackClick);

// Admin routes
router.get('/pending', authenticateToken, sponsorshipController.getPendingSponsorships);
router.put('/:sponsorshipId/verify', authenticateToken, sponsorshipController.verifySponsorship);
router.put('/:sponsorshipId/reject', authenticateToken, sponsorshipController.rejectSponsorship);

module.exports = router;
