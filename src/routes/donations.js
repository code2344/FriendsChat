const express = require('express');
const router = express.Router();
const donationController = require('../controllers/donationController');
const { authenticateToken } = require('../middleware/auth');

// User routes
router.post('/', authenticateToken, donationController.createDonation);
router.get('/my', authenticateToken, donationController.getUserDonations);
router.put('/customization', authenticateToken, donationController.updateCustomization);

// Admin routes
router.get('/pending', authenticateToken, donationController.getPendingDonations);
router.put('/:donationId/verify', authenticateToken, donationController.verifyDonation);
router.put('/:donationId/reject', authenticateToken, donationController.rejectDonation);

module.exports = router;
