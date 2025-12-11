const express = require('express');
const router = express.Router();
const authorizationCodeController = require('../controllers/authorizationCodeController');
const { authenticate, isAdmin } = require('../middleware/auth');

// Create a new authorization code (Admin only)
router.post('/', authenticate, isAdmin, authorizationCodeController.createAuthorizationCode);

// Get all authorization codes (Admin only)
router.get('/', authenticate, isAdmin, authorizationCodeController.getAllAuthorizationCodes);

// Lookup a specific authorization code (triggers security check for non-admins)
// Note: This route intentionally allows non-admin access attempts to trigger security violations
// Rate limiting should be implemented at the infrastructure level (e.g., nginx, CloudFlare)
// to prevent DoS attacks via repeated lookups
router.get('/:code', authenticate, authorizationCodeController.lookupAuthorizationCode);

// Mark code as used (Admin only)
router.post('/:code/use', authenticate, isAdmin, authorizationCodeController.markCodeAsUsed);

// Expire an authorization code (Admin only)
router.post('/:code/expire', authenticate, isAdmin, authorizationCodeController.expireAuthorizationCode);

module.exports = router;
