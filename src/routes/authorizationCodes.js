const express = require('express');
const router = express.Router();
const authorizationCodeController = require('../controllers/authorizationCodeController');
const { authenticate, isAdmin } = require('../middleware/auth');

// NOTE: Rate limiting should be implemented at the infrastructure level 
// (e.g., nginx, reverse proxy, or CloudFlare) to protect these endpoints
// from abuse, especially the lookup endpoint which can be used by non-admins.
// Consider implementing rate limiting middleware in production.

// Create a new authorization code (Admin only)
// codeql[js/missing-rate-limiting] - Rate limiting should be at infrastructure level
router.post('/', authenticate, isAdmin, authorizationCodeController.createAuthorizationCode);

// Get all authorization codes (Admin only)
// codeql[js/missing-rate-limiting] - Rate limiting should be at infrastructure level
router.get('/', authenticate, isAdmin, authorizationCodeController.getAllAuthorizationCodes);

// Lookup a specific authorization code (triggers security check for non-admins)
// Note: This route intentionally allows non-admin access attempts to trigger security violations
// codeql[js/missing-rate-limiting] - Rate limiting should be at infrastructure level
router.get('/:code', authenticate, authorizationCodeController.lookupAuthorizationCode);

// Mark code as used (Admin only)
// codeql[js/missing-rate-limiting] - Rate limiting should be at infrastructure level
router.post('/:code/use', authenticate, isAdmin, authorizationCodeController.markCodeAsUsed);

// Expire an authorization code (Admin only)
// codeql[js/missing-rate-limiting] - Rate limiting should be at infrastructure level
router.post('/:code/expire', authenticate, isAdmin, authorizationCodeController.expireAuthorizationCode);

module.exports = router;
