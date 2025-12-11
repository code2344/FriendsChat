const mongoose = require('mongoose');

const moderationActionSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['slowmode', 'mute', 'ban', 'warn', 'kick', 'timeout'],
    required: true
  },
  target: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  moderator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  reason: {
    type: String,
    required: true,
    minlength: 10
  },
  duration: {
    value: Number,
    unit: {
      type: String,
      enum: ['minutes', 'hours', 'days', 'weeks', 'months', 'permanent']
    }
  },
  expiresAt: Date,
  context: {
    server: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Server'
    },
    channel: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Channel'
    },
    message: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Message'
    }
  },
  status: {
    type: String,
    enum: ['active', 'expired', 'revoked', 'appealed'],
    default: 'active'
  },
  directWarning: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DirectWarning'
  },
  appeal: {
    submitted: Boolean,
    reason: String,
    submittedAt: Date,
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    decision: {
      type: String,
      enum: ['approved', 'denied', 'pending']
    },
    decisionReason: String,
    decidedAt: Date
  },
  revokedAt: Date,
  revokedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  revokeReason: String
}, {
  timestamps: true
});

// Indexes
moderationActionSchema.index({ target: 1, status: 1 });
moderationActionSchema.index({ moderator: 1 });
moderationActionSchema.index({ expiresAt: 1 });
moderationActionSchema.index({ 'context.server': 1 });

module.exports = mongoose.model('ModerationAction', moderationActionSchema);
