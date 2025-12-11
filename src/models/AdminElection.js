const mongoose = require('mongoose');

const adminElectionSchema = new mongoose.Schema({
  year: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['nomination', 'voting', 'completed', 'cancelled'],
    default: 'nomination'
  },
  nominationPeriod: {
    start: {
      type: Date,
      required: true
    },
    end: {
      type: Date,
      required: true
    }
  },
  votingPeriod: {
    start: Date,
    end: Date
  },
  candidates: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    nominatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    nominationReason: String,
    nominatedAt: Date,
    accepted: {
      type: Boolean,
      default: false
    },
    acceptedAt: Date,
    statement: String,
    votes: {
      type: Number,
      default: 0
    }
  }],
  maxAdmins: {
    type: Number,
    default: 10
  },
  currentAdmins: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  eligibleVoters: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  votes: [{
    voter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    candidate: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    votedAt: {
      type: Date,
      default: Date.now
    }
  }],
  results: {
    winners: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    totalVotes: Number,
    turnout: Number,
    calculatedAt: Date
  },
  masterAdminVeto: {
    vetoed: Boolean,
    vetoedCandidates: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    reason: String,
    vetoedAt: Date
  },
  triggered: Boolean,
  triggeredBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  triggeredAt: Date,
  completedAt: Date,
  notes: String
}, {
  timestamps: true
});

// Indexes
adminElectionSchema.index({ year: 1 });
adminElectionSchema.index({ status: 1 });

module.exports = mongoose.model('AdminElection', adminElectionSchema);
