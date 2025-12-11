const mongoose = require('mongoose');

const teacherDataRequestSchema = new mongoose.Schema({
  teacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  targetType: {
    type: String,
    enum: ['user', 'channel', 'server', 'conversation'],
    required: true
  },
  targetUsers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  targetChannel: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Channel'
  },
  targetServer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Server'
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  reason: {
    type: String,
    required: true,
    minlength: 20
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'denied', 'expired'],
    default: 'pending'
  },
  approvedBy: [{
    admin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    approvedAt: {
      type: Date,
      default: Date.now
    },
    notes: String
  }],
  deniedBy: {
    admin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    deniedAt: Date,
    reason: String
  },
  dataProvided: {
    type: Boolean,
    default: false
  },
  dataProvidedAt: {
    type: Date
  },
  dataAccessLog: [{
    accessedAt: {
      type: Date,
      default: Date.now
    },
    accessType: String
  }],
  expiresAt: {
    type: Date
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('TeacherDataRequest', teacherDataRequestSchema);
