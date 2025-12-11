const mongoose = require('mongoose');

const adminRemovalVoteSchema = new mongoose.Schema({
  targetAdmin: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  initiatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  reason: {
    type: String,
    required: true,
    minlength: 50
  },
  grounds: {
    type: String,
    enum: ['inactivity', 'abuse_of_power', 'ineffectiveness', 'misconduct', 'community_request', 'other'],
    required: true
  },
  status: {
    type: String,
    enum: ['voting', 'passed', 'failed', 'vetoed'],
    default: 'voting'
  },
  votingPeriod: {
    start: {
      type: Date,
      default: Date.now
    },
    end: Date
  },
  eligibleVoters: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  votes: [{
    voter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    vote: {
      type: String,
      enum: ['remove', 'keep', 'abstain']
    },
    reason: String,
    votedAt: {
      type: Date,
      default: Date.now
    }
  }],
  results: {
    remove: {
      type: Number,
      default: 0
    },
    keep: {
      type: Number,
      default: 0
    },
    abstain: {
      type: Number,
      default: 0
    },
    majorityRequired: Number,
    passed: Boolean,
    calculatedAt: Date
  },
  masterAdminOverride: {
    overridden: Boolean,
    decision: {
      type: String,
      enum: ['uphold', 'veto']
    },
    reason: String,
    overriddenAt: Date
  },
  outcome: {
    adminRemoved: Boolean,
    removedAt: Date,
    newRole: String,
    notificationSent: Boolean
  },
  completedAt: Date
}, {
  timestamps: true
});

// Indexes
adminRemovalVoteSchema.index({ targetAdmin: 1, status: 1 });
adminRemovalVoteSchema.index({ status: 1 });

module.exports = mongoose.model('AdminRemovalVote', adminRemovalVoteSchema);
