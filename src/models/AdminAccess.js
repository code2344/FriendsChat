const mongoose = require('mongoose');

const adminAccessSchema = new mongoose.Schema({
  admin: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  accessType: {
    type: String,
    enum: ['server', 'channel', 'dm', 'report_review', 'investigation'],
    required: true
  },
  target: {
    server: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Server'
    },
    channel: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Channel'
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  reason: {
    type: String,
    required: true,
    minlength: 20
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'blocked', 'appealed'],
    default: 'active'
  },
  duration: {
    start: {
      type: Date,
      default: Date.now
    },
    end: Date
  },
  banner: {
    shown: {
      type: Boolean,
      default: true
    },
    message: String,
    dismissedBy: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }]
  },
  blocked: {
    by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    reason: String,
    blockedAt: Date
  },
  appeal: {
    submitted: Boolean,
    reason: String,
    submittedAt: Date,
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    approved: Boolean,
    reviewedAt: Date
  },
  actionsPerformed: [{
    action: String,
    timestamp: {
      type: Date,
      default: Date.now
    },
    details: String
  }],
  messagesSent: {
    type: Number,
    default: 0
  },
  approvedToMessage: {
    type: Boolean,
    default: false
  },
  completedAt: Date,
  notes: String
}, {
  timestamps: true
});

// Indexes
adminAccessSchema.index({ admin: 1, status: 1 });
adminAccessSchema.index({ 'target.server': 1 });
adminAccessSchema.index({ 'duration.start': 1 });

module.exports = mongoose.model('AdminAccess', adminAccessSchema);
