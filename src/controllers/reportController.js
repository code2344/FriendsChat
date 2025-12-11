const Report = require('../models/Report');
const User = require('../models/User');
const Message = require('../models/Message');

/**
 * Create a new report
 */
async function createReport(req, res) {
  try {
    const { reportedUserId, reason, messageId, details } = req.body;

    if (!reportedUserId || !reason) {
      return res.status(400).json({ error: 'Reported user and reason are required' });
    }

    // Cannot report yourself
    if (reportedUserId === req.user._id.toString()) {
      return res.status(400).json({ error: 'Cannot report yourself' });
    }

    // Check if reported user exists
    const reportedUser = await User.findById(reportedUserId);
    if (!reportedUser) {
      return res.status(404).json({ error: 'Reported user not found' });
    }

    // Check if message exists (if provided)
    if (messageId) {
      const message = await Message.findById(messageId);
      if (!message) {
        return res.status(404).json({ error: 'Message not found' });
      }
    }

    // Create report
    const report = new Report({
      reportedUser: reportedUserId,
      reportedBy: req.user._id,
      reason,
      messageId: messageId || undefined,
      messageType: messageId ? 'Message' : undefined,
      details: details || ''
    });

    await report.save();

    // Populate for response
    await report.populate('reportedUser', 'username firstName lastName');
    await report.populate('reportedBy', 'username firstName lastName');

    res.status(201).json({
      message: 'Report submitted successfully',
      report
    });
  } catch (error) {
    console.error('Error creating report:', error);
    res.status(500).json({ error: 'Failed to create report' });
  }
}

/**
 * Get all reports (admin only)
 */
async function getReports(req, res) {
  try {
    const { status } = req.query;
    const filter = {};
    
    if (status) {
      filter.status = status;
    }

    const reports = await Report.find(filter)
      .populate('reportedUser', 'username firstName lastName email')
      .populate('reportedBy', 'username firstName lastName')
      .populate('resolvedBy', 'username firstName lastName')
      .sort({ createdAt: -1 });

    res.json({ reports });
  } catch (error) {
    console.error('Error fetching reports:', error);
    res.status(500).json({ error: 'Failed to fetch reports' });
  }
}

/**
 * Get user's own reports
 */
async function getMyReports(req, res) {
  try {
    const reports = await Report.find({ reportedBy: req.user._id })
      .populate('reportedUser', 'username firstName lastName')
      .populate('resolvedBy', 'username firstName lastName')
      .sort({ createdAt: -1 });

    res.json({ reports });
  } catch (error) {
    console.error('Error fetching user reports:', error);
    res.status(500).json({ error: 'Failed to fetch reports' });
  }
}

/**
 * Update report status (admin only)
 */
async function updateReport(req, res) {
  try {
    const { id } = req.params;
    const { status, resolution } = req.body;

    if (!['reviewing', 'resolved', 'dismissed'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const report = await Report.findById(id);
    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }

    report.status = status;
    if (resolution) {
      report.resolution = resolution;
    }
    
    if (status === 'resolved' || status === 'dismissed') {
      report.resolvedBy = req.user._id;
      report.resolvedAt = new Date();
    }

    await report.save();
    await report.populate('reportedUser', 'username firstName lastName');
    await report.populate('reportedBy', 'username firstName lastName');
    await report.populate('resolvedBy', 'username firstName lastName');

    res.json({
      message: 'Report updated successfully',
      report
    });
  } catch (error) {
    console.error('Error updating report:', error);
    res.status(500).json({ error: 'Failed to update report' });
  }
}

/**
 * Delete report (admin only)
 */
async function deleteReport(req, res) {
  try {
    const { id } = req.params;

    const report = await Report.findByIdAndDelete(id);
    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }

    res.json({ message: 'Report deleted successfully' });
  } catch (error) {
    console.error('Error deleting report:', error);
    res.status(500).json({ error: 'Failed to delete report' });
  }
}

module.exports = {
  createReport,
  getReports,
  getMyReports,
  updateReport,
  deleteReport
};
