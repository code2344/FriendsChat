const mongoose = require('mongoose');

const directWarningSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  admin: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  reason: {
    type: String,
    required: true,
    minlength: 20
  },
  violationType: {
    type: String,
    enum: ['spam', 'harassment', 'inappropriate_content', 'rule_violation', 'other'],
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'resolved', 'appealed', 'dismissed'],
    default: 'active'
  },
  messages: [{
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    content: {
      type: String,
      required: true
    },
    encryptedContent: String,
    timestamp: {
      type: Date,
      default: Date.now
    },
    isAdminMessage: Boolean
  }],
  punishmentIssued: {
    type: {
      type: String,
      enum: ['warning', 'slowmode', 'mute', 'ban', 'none'],
      default: 'none'
    },
    duration: String,
    details: String
  },
  userResponse: {
    defense: String,
    appeal: String,
    timestamp: Date
  },
  reminderSent: {
    type: Boolean,
    default: false
  },
  reminderSentAt: Date,
  lastActivity: {
    type: Date,
    default: Date.now
  },
  resolvedAt: Date,
  resolvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  resolution: String,
  notes: [{
    admin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    note: String,
    timestamp: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

// Index for efficient queries
directWarningSchema.index({ user: 1, status: 1 });
directWarningSchema.index({ admin: 1 });
directWarningSchema.index({ lastActivity: 1 });

module.exports = mongoose.model('DirectWarning', directWarningSchema);
