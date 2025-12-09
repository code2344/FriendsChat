const Report = require('../models/Report');
const BannedUser = require('../models/BannedUser');
const User = require('../models/User');

/**
 * Create a report
 */
async function createReport(req, res) {
  try {
    const { reportedUserId, reason, messageId, messageType } = req.body;

    if (!reportedUserId || !reason) {
      return res.status(400).json({ error: 'Reported user ID and reason are required' });
    }

    const report = new Report({
      reportedUser: reportedUserId,
      reportedBy: req.user._id,
      reason,
      messageId: messageId || null,
      messageType: messageType || null
    });

    await report.save();
    await report.populate('reportedUser reportedBy', 'username firstName lastName');

    res.status(201).json({ message: 'Report submitted successfully', report });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create report', details: error.message });
  }
}

/**
 * Get all reports
 */
async function getReports(req, res) {
  try {
    const { status } = req.query;

    const query = status ? { status } : {};
    
    const reports = await Report.find(query)
      .populate('reportedUser reportedBy resolvedBy', 'username firstName lastName')
      .sort({ createdAt: -1 });

    res.json(reports);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch reports', details: error.message });
  }
}

/**
 * Resolve a report
 */
async function resolveReport(req, res) {
  try {
    const { reportId } = req.params;
    const { status, resolution } = req.body;

    if (!status || !['resolved', 'dismissed'].includes(status)) {
      return res.status(400).json({ error: 'Valid status (resolved/dismissed) is required' });
    }

    const report = await Report.findById(reportId);

    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }

    report.status = status;
    report.resolution = resolution || '';
    report.resolvedBy = req.user._id;
    report.resolvedAt = Date.now();

    await report.save();
    await report.populate('reportedUser reportedBy resolvedBy', 'username firstName lastName');

    res.json({ message: 'Report resolved successfully', report });
  } catch (error) {
    res.status(500).json({ error: 'Failed to resolve report', details: error.message });
  }
}

/**
 * Permanently ban a user
 */
async function permanentlyBanUser(req, res) {
  try {
    const { userId } = req.params;
    const { reason, macAddress } = req.body;

    if (!reason || !macAddress) {
      return res.status(400).json({ error: 'Reason and MAC address are required' });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Update user status
    user.isBanned = true;
    user.macAddress = macAddress;
    await user.save();

    // Create permanent ban record
    const bannedUser = new BannedUser({
      user: userId,
      macAddress,
      bannedBy: req.user._id,
      reason
    });

    await bannedUser.save();

    res.json({ message: 'User permanently banned successfully', bannedUser });
  } catch (error) {
    res.status(500).json({ error: 'Failed to ban user', details: error.message });
  }
}

/**
 * Get all banned users
 */
async function getBannedUsers(req, res) {
  try {
    const bannedUsers = await BannedUser.find()
      .populate('user bannedBy', 'username firstName lastName email studentId')
      .sort({ bannedAt: -1 });

    res.json(bannedUsers);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch banned users', details: error.message });
  }
}

/**
 * Promote user to admin
 */
async function promoteToAdmin(req, res) {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.role === 'admin' || user.role === 'master_admin') {
      return res.status(400).json({ error: 'User is already an admin' });
    }

    user.role = 'admin';
    await user.save();

    res.json({ message: 'User promoted to admin successfully', user });
  } catch (error) {
    res.status(500).json({ error: 'Failed to promote user', details: error.message });
  }
}

/**
 * Demote admin to regular user
 */
async function demoteAdmin(req, res) {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.role === 'master_admin') {
      return res.status(400).json({ error: 'Cannot demote master admin' });
    }

    if (user.role !== 'admin') {
      return res.status(400).json({ error: 'User is not an admin' });
    }

    user.role = 'user';
    await user.save();

    res.json({ message: 'Admin demoted to user successfully', user });
  } catch (error) {
    res.status(500).json({ error: 'Failed to demote admin', details: error.message });
  }
}

module.exports = {
  createReport,
  getReports,
  resolveReport,
  permanentlyBanUser,
  getBannedUsers,
  promoteToAdmin,
  demoteAdmin
};
