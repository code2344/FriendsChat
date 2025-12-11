const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Middleware to verify JWT token and authenticate user
 */
async function authenticate(req, res, next) {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findOne({ _id: decoded.userId, isApproved: true });

    if (!user) {
      return res.status(401).json({ error: 'User not found or not approved' });
    }

    if (user.isBanned) {
      return res.status(403).json({ error: 'User is banned' });
    }

    req.user = user;
    req.token = token;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid authentication token' });
  }
}

/**
 * Middleware to check if user is an admin
 */
function isAdmin(req, res, next) {
  if (req.user.role === 'admin' || req.user.role === 'master_admin') {
    next();
  } else {
    res.status(403).json({ error: 'Admin access required' });
  }
}

/**
 * Middleware to check if user is the master admin
 */
function isMasterAdmin(req, res, next) {
  if (req.user.role === 'master_admin') {
    next();
  } else {
    res.status(403).json({ error: 'Master admin access required' });
  }
}

/**
 * Middleware to check if user is approved
 */
function isApproved(req, res, next) {
  if (req.user.isApproved) {
    next();
  } else {
    res.status(403).json({ error: 'Account pending approval' });
  }
}

module.exports = {
  authenticate,
  authenticateToken: authenticate,  // <-- alias
  isAdmin,
  isMasterAdmin,
  isApproved
};
