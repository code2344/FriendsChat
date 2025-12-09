const mongoose = require('mongoose');

const customRoleSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  color: {
    type: String,
    default: '#99aab5'
  },
  permissions: {
    manageChannels: { type: Boolean, default: false },
    manageRoles: { type: Boolean, default: false },
    kickMembers: { type: Boolean, default: false },
    banMembers: { type: Boolean, default: false },
    sendMessages: { type: Boolean, default: true },
    manageMessages: { type: Boolean, default: false }
  },
  position: {
    type: Number,
    default: 0
  }
});

const serverSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    default: ''
  },
  icon: {
    type: String,
    default: null // URL or emoji
  },
  banner: {
    type: String,
    default: null // URL
  },
  theme: {
    primaryColor: {
      type: String,
      default: '#5865f2'
    },
    accentColor: {
      type: String,
      default: '#7289da'
    },
    backgroundColor: {
      type: String,
      default: '#36393f'
    }
  },
  isPublic: {
    type: Boolean,
    default: false // Private by default
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  coOwners: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  moderators: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  members: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  customRoles: [customRoleSchema],
  memberRoles: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    roles: [{
      type: mongoose.Schema.Types.ObjectId
    }]
  }],
  bannedUsers: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    bannedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    bannedAt: {
      type: Date,
      default: Date.now
    },
    reason: String
  }],
  settings: {
    verificationLevel: {
      type: String,
      enum: ['none', 'low', 'medium', 'high'],
      default: 'none'
    },
    defaultNotifications: {
      type: String,
      enum: ['all', 'mentions'],
      default: 'all'
    },
    explicitContentFilter: {
      type: Boolean,
      default: true
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Server', serverSchema);
