const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: true,
    trim: true
  },
  lastName: {
    type: String,
    required: true,
    trim: true
  },
  studentId: {
    type: String,
    required: true,
    unique: true,
    match: /^\d{5}$/,
    validate: {
      validator: function(v) {
        return /^\d{5}$/.test(v);
      },
      message: 'Student ID must be exactly 5 digits'
    }
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['user', 'admin', 'master_admin'],
    default: 'user'
  },
  isApproved: {
    type: Boolean,
    default: false
  },
  isBanned: {
    type: Boolean,
    default: false
  },
  macAddress: {
    type: String,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  approvedAt: {
    type: Date,
    default: null
  },
  avatar: {
    type: String,
    default: null
  },
  banner: {
    type: String,
    default: null
  },
  bio: {
    type: String,
    default: '',
    maxlength: 190
  },
  pronouns: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['online', 'idle', 'dnd', 'invisible', 'offline'],
    default: 'online'
  },
  customStatus: {
    text: String,
    emoji: String,
    expiresAt: Date
  },
  lastSeen: {
    type: Date,
    default: Date.now
  },
  badges: [{
    type: String,
    enum: ['staff', 'partner', 'verified', 'early_supporter', 'bug_hunter', 'contributor']
  }]
});

module.exports = mongoose.model('User', userSchema);
