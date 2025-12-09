const mongoose = require('mongoose');

const systemStatusSchema = new mongoose.Schema({
  status: {
    type: String,
    enum: ['operational', 'maintenance', 'frozen', 'emergency'],
    default: 'operational'
  },
  maintenanceMode: {
    enabled: {
      type: Boolean,
      default: false
    },
    reason: String,
    message: String,
    estimatedDuration: String,
    startedAt: Date,
    endedAt: Date,
    startedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  emergencyFreeze: {
    active: {
      type: Boolean,
      default: false
    },
    reason: String,
    severity: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical']
    },
    frozenAt: Date,
    unfrozenAt: Date,
    frozenBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    affectedFeatures: [String]
  },
  systemHealth: {
    database: {
      status: String,
      lastCheck: Date
    },
    messaging: {
      status: String,
      lastCheck: Date
    },
    authentication: {
      status: String,
      lastCheck: Date
    }
  },
  announcements: [{
    message: String,
    type: {
      type: String,
      enum: ['info', 'warning', 'critical']
    },
    startDate: Date,
    endDate: Date,
    active: Boolean
  }],
  logs: [{
    action: String,
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    details: String,
    timestamp: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

// Only one document should exist
systemStatusSchema.index({ status: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model('SystemStatus', systemStatusSchema);
