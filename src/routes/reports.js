const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const {
  createReport,
  getReports,
  getMyReports,
  updateReport,
  deleteReport
} = require('../controllers/reportController');

// Authorization middleware for admins
const authorizeAdmin = (req, res, next) => {
  if (req.user.role !== 'admin' && req.user.role !== 'master_admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

// Create new report
router.post('/', authenticate, createReport);

// Get user's own reports
router.get('/my-reports', authenticate, getMyReports);

// Get all reports (admin only)
router.get('/', authenticate, authorizeAdmin, getReports);

// Update report status (admin only)
router.put('/:id', authenticate, authorizeAdmin, updateReport);

// Delete report (admin only)
router.delete('/:id', authenticate, authorizeAdmin, deleteReport);

module.exports = router;
