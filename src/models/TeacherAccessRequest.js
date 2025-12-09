const mongoose = require('mongoose');

const teacherAccessRequestSchema = new mongoose.Schema({
  teacher: {
    name: {
      type: String,
      required: true
    },
    email: {
      type: String,
      required: true
    },
    reason: {
      type: String,
      required: true
    }
  },
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'denied'],
    default: 'pending'
  },
  approvals: [{
    admin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    approvedAt: {
      type: Date,
      default: Date.now
    }
  }],
  deniedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  resolvedAt: {
    type: Date
  }
});

module.exports = mongoose.model('TeacherAccessRequest', teacherAccessRequestSchema);
