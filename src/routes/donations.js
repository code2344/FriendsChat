const express = require('express');
const router = express.Router();
const donationController = require('../controllers/donationController');
const { authenticate } = require('../middleware/auth');

// User routes
router.post('/', authenticate, donationController.createDonation);
router.get('/my', authenticate, donationController.getUserDonations);
router.put('/customization', authenticateToken, donationController.updateCustomization);

// Admin routes
router.get('/pending', authenticate, donationController.getPendingDonations);
router.put('/:donationId/verify', authenticate, donationController.verifyDonation);
router.put('/:donationId/reject', authenticate, donationController.rejectDonation);

module.exports = router;
