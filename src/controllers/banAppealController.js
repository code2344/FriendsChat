const BanAppeal = require('../models/BanAppeal');
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');

/**
 * Get ban appeal messages for the current user
 */
async function getAppealMessages(req, res) {
  try {
    let appeal = await BanAppeal.findOne({ user: req.user._id });
    
    if (!appeal) {
      // Create new appeal if doesn't exist
      appeal = new BanAppeal({
        user: req.user._id,
        messages: []
      });
      await appeal.save();
    }
    
    res.json(appeal.messages);
  } catch (error) {
    console.error('Error getting appeal messages:', error);
    res.status(500).json({ error: 'Failed to get appeal messages' });
  }
}

/**
 * Send a message in ban appeal
 */
async function sendAppealMessage(req, res) {
  try {
    const { message } = req.body;
    
    if (!message || message.trim().length === 0) {
      return res.status(400).json({ error: 'Message is required' });
    }
    
    if (message.length > 2000) {
      return res.status(400).json({ error: 'Message too long (max 2000 characters)' });
    }
    
    let appeal = await BanAppeal.findOne({ user: req.user._id });
    
    if (!appeal) {
      appeal = new BanAppeal({
        user: req.user._id,
        messages: []
      });
    }
    
    appeal.messages.push({
      message: message.trim(),
      isAdmin: false,
      sender: req.user._id
    });
    
    await appeal.save();
    
    // Log the appeal message
    await AuditLog.create({
      action: 'ban_appeal_message_sent',
      performedBy: req.user._id,
      details: `User ${req.user.username} sent ban appeal message`,
      severity: 'info'
    });
    
    res.json({ success: true, messages: appeal.messages });
  } catch (error) {
    console.error('Error sending appeal message:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
}

/**
 * Get all ban appeals (admin only)
 */
async function getAllAppeals(req, res) {
  try {
    const appeals = await BanAppeal.find()
      .populate('user', 'username firstName lastName email studentId')
      .populate('resolvedBy', 'username')
      .sort({ createdAt: -1 });
    
    res.json(appeals);
  } catch (error) {
    console.error('Error getting all appeals:', error);
    res.status(500).json({ error: 'Failed to get appeals' });
  }
}

/**
 * Admin reply to ban appeal
 */
async function adminReplyToAppeal(req, res) {
  try {
    const { userId, message } = req.body;
    
    if (!userId || !message) {
      return res.status(400).json({ error: 'User ID and message are required' });
    }
    
    const appeal = await BanAppeal.findOne({ user: userId });
    
    if (!appeal) {
      return res.status(404).json({ error: 'Appeal not found' });
    }
    
    appeal.messages.push({
      message: message.trim(),
      isAdmin: true,
      sender: req.user._id
    });
    
    await appeal.save();
    
    // Log admin reply
    await AuditLog.create({
      action: 'ban_appeal_admin_reply',
      performedBy: req.user._id,
      details: `Admin ${req.user.username} replied to ban appeal for user ${userId}`,
      severity: 'info'
    });
    
    res.json({ success: true, appeal });
  } catch (error) {
    console.error('Error admin replying to appeal:', error);
    res.status(500).json({ error: 'Failed to send reply' });
  }
}

/**
 * Resolve ban appeal (approve or deny)
 */
async function resolveAppeal(req, res) {
  try {
    const { userId, decision } = req.body;
    
    if (!userId || !['approved', 'denied'].includes(decision)) {
      return res.status(400).json({ error: 'Valid user ID and decision required' });
    }
    
    const appeal = await BanAppeal.findOne({ user: userId });
    
    if (!appeal) {
      return res.status(404).json({ error: 'Appeal not found' });
    }
    
    appeal.status = decision;
    appeal.resolvedAt = Date.now();
    appeal.resolvedBy = req.user._id;
    await appeal.save();
    
    // Update user ban status if approved
    if (decision === 'approved') {
      await User.findByIdAndUpdate(userId, { isBanned: false });
    }
    
    // Log resolution
    await AuditLog.create({
      action: `ban_appeal_${decision}`,
      performedBy: req.user._id,
      details: `Admin ${req.user.username} ${decision} ban appeal for user ${userId}`,
      severity: 'info'
    });
    
    res.json({ success: true, appeal });
  } catch (error) {
    console.error('Error resolving appeal:', error);
    res.status(500).json({ error: 'Failed to resolve appeal' });
  }
}

module.exports = {
  getAppealMessages,
  sendAppealMessage,
  getAllAppeals,
  adminReplyToAppeal,
  resolveAppeal
};
