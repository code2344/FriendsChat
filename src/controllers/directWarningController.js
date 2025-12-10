const DirectWarning = require('../models/DirectWarning');
const { encryptMessage, decryptMessage } = require('../utils/encryption');

// Create Direct Warning
exports.createDirectWarning = async (req, res) => {
  try {
    const { userId, reason, violationType, punishmentType, punishmentDuration, punishmentDetails } = req.body;

    if (!req.user.role || (req.user.role !== 'admin' && req.user.role !== 'master_admin')) {
      return res.status(403).json({ error: 'Only admins can create Direct Warnings' });
    }

    const dw = new DirectWarning({
      user: userId,
      admin: req.user._id,
      reason,
      violationType,
      punishmentIssued: {
        type: punishmentType || 'none',
        duration: punishmentDuration,
        details: punishmentDetails
      }
    });

    await dw.save();

    // TODO: Send Socket.IO notification to user

    res.status(201).json({ message: 'Direct Warning created', directWarning: dw });
  } catch (error) {
    console.error('Error creating Direct Warning:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Get Direct Warnings
exports.getDirectWarnings = async (req, res) => {
  try {
    const query = {};
    
    // Users can only see their own DWs unless admin
    if (req.user.role === 'admin' || req.user.role === 'master_admin') {
      if (req.query.userId) {
        query.user = req.query.userId;
      }
      if (req.query.adminId) {
        query.admin = req.query.adminId;
      }
    } else {
      query.user = req.user._id;
    }

    if (req.query.status) {
      query.status = req.query.status;
    }

    const dws = await DirectWarning.find(query)
      .populate('user', 'firstName lastName username')
      .populate('admin', 'firstName lastName username')
      .sort({ lastActivity: -1 });

    res.json({ directWarnings: dws });
  } catch (error) {
    console.error('Error fetching Direct Warnings:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Send Message in DW
exports.sendDWMessage = async (req, res) => {
  try {
    const { dwId } = req.params;
    const { content } = req.body;

    const dw = await DirectWarning.findById(dwId);
    if (!dw) {
      return res.status(404).json({ error: 'Direct Warning not found' });
    }

    // Check if user is involved in this DW
    const isAdmin = req.user._id.equals(dw.admin);
    const isUser = req.user._id.equals(dw.user);

    if (!isAdmin && !isUser) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const encryptedContent = encryptMessage(content);

    dw.messages.push({
      sender: req.user._id,
      content,
      encryptedContent,
      isAdminMessage: isAdmin
    });

    dw.lastActivity = new Date();
    await dw.save();

    // TODO: Send Socket.IO notification

    res.json({ message: 'Message sent', directWarning: dw });
  } catch (error) {
    console.error('Error sending DW message:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Submit User Response (defense/appeal)
exports.submitUserResponse = async (req, res) => {
  try {
    const { dwId } = req.params;
    const { defense, appeal } = req.body;

    const dw = await DirectWarning.findById(dwId);
    if (!dw) {
      return res.status(404).json({ error: 'Direct Warning not found' });
    }

    if (!req.user._id.equals(dw.user)) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    dw.userResponse = {
      defense,
      appeal,
      timestamp: new Date()
    };

    dw.lastActivity = new Date();

    if (appeal) {
      dw.status = 'appealed';
    }

    await dw.save();

    res.json({ message: 'Response submitted', directWarning: dw });
  } catch (error) {
    console.error('Error submitting user response:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Resolve Direct Warning
exports.resolveDirectWarning = async (req, res) => {
  try {
    const { dwId } = req.params;
    const { resolution } = req.body;

    if (!req.user.role || (req.user.role !== 'admin' && req.user.role !== 'master_admin')) {
      return res.status(403).json({ error: 'Only admins can resolve Direct Warnings' });
    }

    const dw = await DirectWarning.findById(dwId);
    if (!dw) {
      return res.status(404).json({ error: 'Direct Warning not found' });
    }

    dw.status = 'resolved';
    dw.resolvedAt = new Date();
    dw.resolvedBy = req.user._id;
    dw.resolution = resolution;

    await dw.save();

    res.json({ message: 'Direct Warning resolved', directWarning: dw });
  } catch (error) {
    console.error('Error resolving Direct Warning:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Add Admin Note
exports.addAdminNote = async (req, res) => {
  try {
    const { dwId } = req.params;
    const { note } = req.body;

    if (!req.user.role || (req.user.role !== 'admin' && req.user.role !== 'master_admin')) {
      return res.status(403).json({ error: 'Only admins can add notes' });
    }

    const dw = await DirectWarning.findById(dwId);
    if (!dw) {
      return res.status(404).json({ error: 'Direct Warning not found' });
    }

    dw.notes.push({
      admin: req.user._id,
      note
    });

    await dw.save();

    res.json({ message: 'Note added', directWarning: dw });
  } catch (error) {
    console.error('Error adding admin note:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Check for unresolved DWs needing reminders
exports.checkReminders = async () => {
  try {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    const dwsNeedingReminder = await DirectWarning.find({
      status: 'active',
      reminderSent: false,
      lastActivity: { $lt: oneDayAgo }
    });

    for (const dw of dwsNeedingReminder) {
      // TODO: Send reminder notification
      dw.reminderSent = true;
      dw.reminderSentAt = new Date();
      await dw.save();
    }
  } catch (error) {
    console.error('Error checking DW reminders:', error);
  }
};

// Get Single DW
exports.getDirectWarning = async (req, res) => {
  try {
    const { dwId } = req.params;

    const dw = await DirectWarning.findById(dwId)
      .populate('user', 'firstName lastName username avatar')
      .populate('admin', 'firstName lastName username avatar')
      .populate('messages.sender', 'firstName lastName username avatar')
      .populate('resolvedBy', 'firstName lastName username')
      .populate('notes.admin', 'firstName lastName username');

    if (!dw) {
      return res.status(404).json({ error: 'Direct Warning not found' });
    }

    // Check authorization
    const isAdmin = req.user.role === 'admin' || req.user.role === 'master_admin';
    const isInvolved = req.user._id.equals(dw.user) || req.user._id.equals(dw.admin);

    if (!isAdmin && !isInvolved) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    res.json({ directWarning: dw });
  } catch (error) {
    console.error('Error fetching Direct Warning:', error);
    res.status(500).json({ error: 'Server error' });
  }
};
// Update Direct Warning
exports.updateDirectWarning = async (req, res) => {
  try {
    const { id } = req.params;  // matches :id in your route
    const updates = req.body;

    const dw = await DirectWarning.findById(id);
    if (!dw) {
      return res.status(404).json({ error: 'Direct Warning not found' });
    }

    // Only admins can update
    if (!req.user.role || (req.user.role !== 'admin' && req.user.role !== 'master_admin')) {
      return res.status(403).json({ error: 'Only admins can update Direct Warnings' });
    }

    // Apply updates (example: reason, punishment, etc.)
    Object.keys(updates).forEach(key => {
      dw[key] = updates[key];
    });

    dw.lastActivity = new Date();
    await dw.save();

    res.json({ message: 'Direct Warning updated', directWarning: dw });
  } catch (error) {
    console.error('Error updating Direct Warning:', error);
    res.status(500).json({ error: 'Server error' });
  }
};
