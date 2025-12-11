const AuthorizationCode = require('../models/AuthorizationCode');
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');

/**
 * Generate a random 8-digit authorization code
 */
function generateCode() {
  // Generate a random 8-digit number (10000000 to 99999999)
  return Math.floor(10000000 + Math.random() * 90000000).toString();
}

/**
 * Create a new authorization code (Admin only)
 */
async function createAuthorizationCode(req, res) {
  try {
    const { description } = req.body;

    if (!description || description.trim().length === 0) {
      return res.status(400).json({ error: 'Description is required' });
    }

    // Generate unique code
    let code;
    let isUnique = false;
    let attempts = 0;
    const maxAttempts = 10;

    while (!isUnique && attempts < maxAttempts) {
      code = generateCode();
      const existing = await AuthorizationCode.findOne({ code });
      if (!existing) {
        isUnique = true;
      }
      attempts++;
    }

    if (!isUnique) {
      return res.status(500).json({ error: 'Failed to generate unique code. Please try again.' });
    }

    const authCode = new AuthorizationCode({
      code,
      description: description.trim(),
      createdBy: req.user._id
    });

    await authCode.save();
    await authCode.populate('createdBy', 'username firstName lastName');

    // Log the creation
    await AuditLog.create({
      action: 'authorization_code_created',
      performedBy: req.user._id,
      details: `Authorization code ${code} created with description: ${description.trim()}`
    });

    res.status(201).json({
      message: 'Authorization code created successfully',
      code: authCode
    });
  } catch (error) {
    console.error('Error creating authorization code:', error);
    res.status(500).json({ error: 'Failed to create authorization code', details: error.message });
  }
}

/**
 * Get all authorization codes (Admin only)
 */
async function getAllAuthorizationCodes(req, res) {
  try {
    const { status } = req.query;

    let query = {};
    if (status === 'used') {
      query.isUsed = true;
    } else if (status === 'unused') {
      query.isUsed = false;
      query.isExpired = false;
    } else if (status === 'expired') {
      query.isExpired = true;
    }

    const codes = await AuthorizationCode.find(query)
      .populate('createdBy', 'username firstName lastName')
      .populate('usedBy', 'username firstName lastName')
      .populate('expiredBy', 'username firstName lastName')
      .sort({ createdAt: -1 });

    res.json(codes);
  } catch (error) {
    console.error('Error fetching authorization codes:', error);
    res.status(500).json({ error: 'Failed to fetch authorization codes', details: error.message });
  }
}

/**
 * Lookup an authorization code by code number
 */
async function lookupAuthorizationCode(req, res) {
  try {
    const { code } = req.params;

    if (!code || !/^\d{8}$/.test(code)) {
      return res.status(400).json({ error: 'Invalid code format. Must be 8 digits.' });
    }

    const authCode = await AuthorizationCode.findOne({ code })
      .populate('createdBy', 'username firstName lastName role')
      .populate('usedBy', 'username firstName lastName');

    if (!authCode) {
      return res.status(404).json({ error: 'Code not found' });
    }

    // Check if the user trying to lookup the code is an admin
    const isAdmin = req.user.role === 'admin' || req.user.role === 'master_admin';

    if (!isAdmin) {
      // Non-admin user is attempting to access authorization code
      // This is a security violation - disable their account
      
      // Disable the user account
      req.user.isBanned = true;
      await req.user.save();

      // Expire all codes created by this user
      await AuthorizationCode.updateMany(
        { createdBy: req.user._id, isUsed: false, isExpired: false },
        { 
          isExpired: true,
          expiredBy: req.user._id,
          expiredAt: Date.now()
        }
      );

      // Log the security violation
      await AuditLog.create({
        action: 'security_violation_code_access',
        performedBy: req.user._id,
        details: `Non-admin user ${req.user.username} attempted to access authorization code ${code}. Account disabled and all their codes expired. Potential unauthorized access to confidential documents.`,
        severity: 'critical'
      });

      console.error(`SECURITY ALERT: Non-admin user ${req.user.username} (ID: ${req.user._id}) attempted to access authorization code ${code}. Account has been disabled.`);

      return res.status(403).json({ 
        error: 'Unauthorized access detected. Your account has been disabled pending review by a master admin.',
        contactAdmin: true
      });
    }

    // Admin is looking up the code - return the information
    const response = {
      code: authCode.code,
      description: authCode.description,
      createdBy: {
        username: authCode.createdBy.username,
        name: `${authCode.createdBy.firstName} ${authCode.createdBy.lastName}`,
        role: authCode.createdBy.role
      },
      createdAt: authCode.createdAt,
      isUsed: authCode.isUsed,
      isExpired: authCode.isExpired
    };

    if (authCode.isUsed) {
      response.usedBy = authCode.usedBy ? {
        username: authCode.usedBy.username,
        name: `${authCode.usedBy.firstName} ${authCode.usedBy.lastName}`
      } : null;
      response.usedAt = authCode.usedAt;
    }

    // Check if the code's creator has been flagged for security violations
    const securityViolations = await AuditLog.countDocuments({
      performedBy: authCode.createdBy._id,
      action: 'security_violation_code_access'
    });

    if (securityViolations > 0 && !authCode.isUsed && !authCode.isExpired) {
      response.securityWarning = 'This code is valid and unused, but other documents by this admin have been accessed without authorization.';
    }

    res.json(response);
  } catch (error) {
    console.error('Error looking up authorization code:', error);
    res.status(500).json({ error: 'Failed to lookup authorization code', details: error.message });
  }
}

/**
 * Mark an authorization code as used
 */
async function markCodeAsUsed(req, res) {
  try {
    const { code } = req.params;

    if (!code || !/^\d{8}$/.test(code)) {
      return res.status(400).json({ error: 'Invalid code format. Must be 8 digits.' });
    }

    const authCode = await AuthorizationCode.findOne({ code });

    if (!authCode) {
      return res.status(404).json({ error: 'Code not found' });
    }

    if (authCode.isUsed) {
      return res.status(400).json({ error: 'Code has already been used' });
    }

    if (authCode.isExpired) {
      return res.status(400).json({ error: 'Code has been expired' });
    }

    // Mark as used
    authCode.isUsed = true;
    authCode.usedBy = req.user._id;
    authCode.usedAt = Date.now();
    await authCode.save();

    // Log the usage
    await AuditLog.create({
      action: 'authorization_code_used',
      performedBy: req.user._id,
      details: `Authorization code ${code} marked as used by ${req.user.username}`
    });

    res.json({ message: 'Code marked as used successfully' });
  } catch (error) {
    console.error('Error marking code as used:', error);
    res.status(500).json({ error: 'Failed to mark code as used', details: error.message });
  }
}

/**
 * Manually expire an authorization code (Admin only)
 */
async function expireAuthorizationCode(req, res) {
  try {
    const { code } = req.params;

    if (!code || !/^\d{8}$/.test(code)) {
      return res.status(400).json({ error: 'Invalid code format. Must be 8 digits.' });
    }

    const authCode = await AuthorizationCode.findOne({ code });

    if (!authCode) {
      return res.status(404).json({ error: 'Code not found' });
    }

    if (authCode.isExpired) {
      return res.status(400).json({ error: 'Code is already expired' });
    }

    authCode.isExpired = true;
    authCode.expiredBy = req.user._id;
    authCode.expiredAt = Date.now();
    await authCode.save();

    // Log the expiration
    await AuditLog.create({
      action: 'authorization_code_expired',
      performedBy: req.user._id,
      details: `Authorization code ${code} manually expired by ${req.user.username}`
    });

    res.json({ message: 'Code expired successfully' });
  } catch (error) {
    console.error('Error expiring authorization code:', error);
    res.status(500).json({ error: 'Failed to expire authorization code', details: error.message });
  }
}

module.exports = {
  createAuthorizationCode,
  getAllAuthorizationCodes,
  lookupAuthorizationCode,
  markCodeAsUsed,
  expireAuthorizationCode
};
