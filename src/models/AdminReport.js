const mongoose = require('mongoose');

const adminReportSchema = new mongoose.Schema({
  reporter: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  accusedAdmin: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  reason: {
    type: String,
    required: true,
    minlength: 50
  },
  allegationType: {
    type: String,
    enum: ['abuse_of_power', 'harassment', 'bias', 'privacy_violation', 'data_misuse', 'other'],
    required: true
  },
  evidence: [{
    type: {
      type: String,
      enum: ['message', 'screenshot', 'log', 'witness', 'other']
    },
    description: String,
    url: String,
    timestamp: Date
  }],
  acknowledgedConsequences: {
    type: Boolean,
    required: true,
    default: false
  },
  status: {
    type: String,
    enum: ['pending', 'investigating', 'under_review', 'resolved', 'dismissed'],
    default: 'pending'
  },
  adminFrozen: {
    type: Boolean,
    default: false
  },
  frozenAt: Date,
  investigation: {
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    assignedAt: Date,
    reporterEvidence: [{
      type: String,
      description: String,
      collectedAt: Date
    }],
    accusedStatement: {
      statement: String,
      submittedAt: Date,
      evidence: [String]
    },
    findings: String,
    recommendation: {
      type: String,
      enum: ['clear', 'warning', 'temporary_suspension', 'privilege_removal', 'permanent_removal'],
    },
    submittedAt: Date,
    submittedToMasterAdmin: Boolean
  },
  masterAdminReview: {
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    reviewedAt: Date,
    decision: {
      type: String,
      enum: ['cleared', 'warning_issued', 'suspended', 'demoted', 'removed']
    },
    reasoning: String,
    actionsTaken: [String]
  },
  outcome: {
    adminCleared: Boolean,
    disciplinaryAction: String,
    privilegesRestored: Boolean,
    restoredAt: Date,
    publicStatement: String
  },
  notifications: [{
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    type: String,
    message: String,
    sentAt: {
      type: Date,
      default: Date.now
    }
  }],
  resolvedAt: Date
}, {
  timestamps: true
});

// Indexes
adminReportSchema.index({ accusedAdmin: 1, status: 1 });
adminReportSchema.index({ reporter: 1 });
adminReportSchema.index({ 'investigation.assignedTo': 1 });
adminReportSchema.index({ status: 1 });

module.exports = mongoose.model('AdminReport', adminReportSchema);
