const mongoose = require('mongoose');

const adminEscalationSchema = new mongoose.Schema({
  requestingAdmin: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  issue: {
    type: String,
    required: true,
    minlength: 20
  },
  category: {
    type: String,
    enum: ['difficult_case', 'policy_clarification', 'second_opinion', 'urgent_decision', 'technical_issue', 'other'],
    required: true
  },
  priority: {
    type: String,
    enum: ['low', 'normal', 'high', 'urgent'],
    default: 'normal'
  },
  context: {
    relatedReport: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AdminReport'
    },
    relatedWarning: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'DirectWarning'
    },
    relatedAction: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ModerationAction'
    },
    description: String
  },
  status: {
    type: String,
    enum: ['pending', 'assigned', 'resolved', 'escalated_to_master'],
    default: 'pending'
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  assignedAt: Date,
  responses: [{
    responder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    response: String,
    advice: String,
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  resolution: {
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    decision: String,
    reasoning: String,
    resolvedAt: Date
  },
  escalatedToMaster: {
    escalated: Boolean,
    reason: String,
    escalatedAt: Date,
    masterResponse: String,
    masterRespondedAt: Date
  }
}, {
  timestamps: true
});

// Indexes
adminEscalationSchema.index({ requestingAdmin: 1, status: 1 });
adminEscalationSchema.index({ priority: 1, status: 1 });
adminEscalationSchema.index({ status: 1 });

module.exports = mongoose.model('AdminEscalation', adminEscalationSchema);
