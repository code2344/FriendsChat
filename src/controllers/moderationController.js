const ModerationAction = require('../models/ModerationAction');
const DirectWarning = require('../models/DirectWarning');
const User = require('../models/User');

// Apply Moderation Action
exports.applyModeration = async (req, res) => {
  try {
    const { type, targetUserId, reason, duration, context } = req.body;

    if (!req.user.role || (req.user.role !== 'admin' && req.user.role !== 'master_admin')) {
      return res.status(403).json({ error: 'Only admins can apply moderation actions' });
    }

    if (!reason || reason.length < 10) {
      return res.status(400).json({ error: 'Reason must be at least 10 characters' });
    }

    let expiresAt = null;
    if (duration && duration.unit !== 'permanent') {
      const multiplier = {
        'minutes': 60 * 1000,
        'hours': 60 * 60 * 1000,
        'days': 24 * 60 * 60 * 1000,
        'weeks': 7 * 24 * 60 * 60 * 1000,
        'months': 30 * 24 * 60 * 60 * 1000
      };
      expiresAt = new Date(Date.now() + (duration.value * multiplier[duration.unit]));
    }

    const action = new ModerationAction({
      type,
      target: targetUserId,
      moderator: req.user._id,
      reason,
      duration,
      expiresAt,
      context
    });

    await action.save();

    // Apply the action to the user
    const targetUser = await User.findById(targetUserId);
    if (targetUser) {
      if (type === 'mute') {
        targetUser.mutedUntil = expiresAt || new Date('2099-12-31');
      } else if (type === 'ban') {
        targetUser.isBanned = true;
        targetUser.bannedUntil = expiresAt;
      }
      await targetUser.save();
    }

    res.status(201).json({ message: 'Moderation action applied', action });
  } catch (error) {
    console.error('Error applying moderation:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Quick Slowmode
exports.applySlowmode = async (req, res) => {
  try {
    const { channelId, duration } = req.body;

    if (!req.user.role || (req.user.role !== 'admin' && req.user.role !== 'master_admin')) {
      return res.status(403).json({ error: 'Only admins can apply slowmode' });
    }

    // Duration in seconds
    const Channel = require('../models/Channel');
    const channel = await Channel.findById(channelId);
    if (!channel) {
      return res.status(404).json({ error: 'Channel not found' });
    }

    channel.slowmode = duration;
    await channel.save();

    res.json({ message: 'Slowmode applied', channel });
  } catch (error) {
    console.error('Error applying slowmode:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Quick Mute (preset durations)
exports.quickMute = async (req, res) => {
  try {
    const { userId, preset } = req.body; // preset: '1min', '1hour', '1day', '1week', '1month', 'permanent'

    const durations = {
      '1min': { value: 1, unit: 'minutes' },
      '1hour': { value: 1, unit: 'hours' },
      '1day': { value: 1, unit: 'days' },
      '1week': { value: 1, unit: 'weeks' },
      '1month': { value: 1, unit: 'months' },
      'permanent': { value: 0, unit: 'permanent' }
    };

    if (!durations[preset]) {
      return res.status(400).json({ error: 'Invalid preset' });
    }

    req.body = {
      type: 'mute',
      targetUserId: userId,
      reason: `Quick mute for ${preset}`,
      duration: durations[preset]
    };

    return exports.applyModeration(req, res);
  } catch (error) {
    console.error('Error applying quick mute:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Get Moderation Actions
exports.getModerationActions = async (req, res) => {
  try {
    const query = {};

    if (req.query.targetUserId) {
      query.target = req.query.targetUserId;
    }
    if (req.query.moderatorId) {
      query.moderator = req.query.moderatorId;
    }
    if (req.query.status) {
      query.status = req.query.status;
    }
    if (req.query.type) {
      query.type = req.query.type;
    }

    const actions = await ModerationAction.find(query)
      .populate('target', 'firstName lastName username')
      .populate('moderator', 'firstName lastName username')
      .populate('context.server', 'name')
      .populate('context.channel', 'name')
      .sort({ createdAt: -1 })
      .limit(100);

    res.json({ actions });
  } catch (error) {
    console.error('Error fetching moderation actions:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Submit Appeal
exports.submitAppeal = async (req, res) => {
  try {
    const { actionId } = req.params;
    const { reason } = req.body;

    const action = await ModerationAction.findById(actionId);
    if (!action) {
      return res.status(404).json({ error: 'Moderation action not found' });
    }

    if (!req.user._id.equals(action.target)) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    action.appeal = {
      submitted: true,
      reason,
      submittedAt: new Date(),
      decision: 'pending'
    };

    action.status = 'appealed';
    await action.save();

    res.json({ message: 'Appeal submitted', action });
  } catch (error) {
    console.error('Error submitting appeal:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Review Appeal
exports.reviewAppeal = async (req, res) => {
  try {
    const { actionId } = req.params;
    const { decision, decisionReason } = req.body;

    if (!req.user.role || (req.user.role !== 'admin' && req.user.role !== 'master_admin')) {
      return res.status(403).json({ error: 'Only admins can review appeals' });
    }

    const action = await ModerationAction.findById(actionId);
    if (!action) {
      return res.status(404).json({ error: 'Moderation action not found' });
    }

    action.appeal.decision = decision;
    action.appeal.decisionReason = decisionReason;
    action.appeal.reviewedBy = req.user._id;
    action.appeal.decidedAt = new Date();

    if (decision === 'approved') {
      action.status = 'revoked';
      action.revokedAt = new Date();
      action.revokedBy = req.user._id;
      action.revokeReason = `Appeal approved: ${decisionReason}`;

      // Remove punishment from user
      const targetUser = await User.findById(action.target);
      if (targetUser) {
        if (action.type === 'mute') {
          targetUser.mutedUntil = null;
        } else if (action.type === 'ban') {
          targetUser.isBanned = false;
          targetUser.bannedUntil = null;
        }
        await targetUser.save();
      }
    } else {
      action.status = 'active';
    }

    await action.save();

    res.json({ message: 'Appeal reviewed', action });
  } catch (error) {
    console.error('Error reviewing appeal:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Revoke Action
exports.revokeAction = async (req, res) => {
  try {
    const { actionId } = req.params;
    const { reason } = req.body;

    if (!req.user.role || (req.user.role !== 'admin' && req.user.role !== 'master_admin')) {
      return res.status(403).json({ error: 'Only admins can revoke actions' });
    }

    const action = await ModerationAction.findById(actionId);
    if (!action) {
      return res.status(404).json({ error: 'Moderation action not found' });
    }

    action.status = 'revoked';
    action.revokedAt = new Date();
    action.revokedBy = req.user._id;
    action.revokeReason = reason;

    await action.save();

    // Remove punishment from user
    const targetUser = await User.findById(action.target);
    if (targetUser) {
      if (action.type === 'mute') {
        targetUser.mutedUntil = null;
      } else if (action.type === 'ban') {
        targetUser.isBanned = false;
        targetUser.bannedUntil = null;
      }
      await targetUser.save();
    }

    res.json({ message: 'Action revoked', action });
  } catch (error) {
    console.error('Error revoking action:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Trigger Manual Spam Alert
exports.triggerSpamAlert = async (req, res) => {
  try {
    const { userId, serverId, channelId, reason } = req.body;

    if (!req.user.role || (req.user.role !== 'admin' && req.user.role !== 'master_admin')) {
      return res.status(403).json({ error: 'Only admins can trigger spam alerts' });
    }

    // TODO: Create notification for all admins
    // TODO: Log the spam alert

    res.json({ message: 'Spam alert triggered' });
  } catch (error) {
    console.error('Error triggering spam alert:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Check and Expire Actions
exports.checkExpiredActions = async () => {
  try {
    const now = new Date();
    
    const expiredActions = await ModerationAction.find({
      status: 'active',
      expiresAt: { $lt: now }
    });

    for (const action of expiredActions) {
      action.status = 'expired';
      await action.save();

      // Remove punishment from user
      const targetUser = await User.findById(action.target);
      if (targetUser) {
        if (action.type === 'mute') {
          targetUser.mutedUntil = null;
        } else if (action.type === 'ban' && action.expiresAt) {
          targetUser.isBanned = false;
          targetUser.bannedUntil = null;
        }
        await targetUser.save();
      }
    }
  } catch (error) {
    console.error('Error checking expired actions:', error);
  }
};

// Get Moderation Stats
exports.getModerationStats = async (req, res) => {
  try {
    if (!req.user.role || (req.user.role !== 'admin' && req.user.role !== 'master_admin')) {
      return res.status(403).json({ error: 'Only admins can view moderation stats' });
    }

    const stats = {
      total: await ModerationAction.countDocuments(),
      active: await ModerationAction.countDocuments({ status: 'active' }),
      expired: await ModerationAction.countDocuments({ status: 'expired' }),
      revoked: await ModerationAction.countDocuments({ status: 'revoked' }),
      appealed: await ModerationAction.countDocuments({ status: 'appealed' }),
      byType: {
        mute: await ModerationAction.countDocuments({ type: 'mute' }),
        ban: await ModerationAction.countDocuments({ type: 'ban' }),
        warn: await ModerationAction.countDocuments({ type: 'warn' }),
        slowmode: await ModerationAction.countDocuments({ type: 'slowmode' })
      }
    };

    res.json({ stats });
  } catch (error) {
    console.error('Error fetching moderation stats:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Get User's Active Punishments
exports.getUserPunishments = async (req, res) => {
  try {
    const { userId } = req.params;

    const punishments = await ModerationAction.find({
      target: userId,
      status: 'active'
    })
    .populate('moderator', 'firstName lastName username')
    .populate('context.server', 'name')
    .populate('context.channel', 'name')
    .sort({ createdAt: -1 });

    res.json({ punishments });
  } catch (error) {
    console.error('Error fetching user punishments:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = exports;
