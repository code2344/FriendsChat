const mongoose = require('mongoose');

const userSettingsSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  theme: {
    type: String,
    enum: ['dark', 'light', 'amoled'],
    default: 'dark'
  },
  displayCompactMode: {
    type: Boolean,
    default: false
  },
  showTimestamps: {
    type: Boolean,
    default: true
  },
  use24HourTime: {
    type: Boolean,
    default: false
  },
  fontSize: {
    type: Number,
    default: 16,
    min: 12,
    max: 20
  },
  notifications: {
    desktopEnabled: {
      type: Boolean,
      default: true
    },
    soundEnabled: {
      type: Boolean,
      default: true
    },
    mentionSound: {
      type: String,
      default: 'default'
    }
  },
  privacy: {
    allowDMs: {
      type: String,
      enum: ['everyone', 'friends', 'none'],
      default: 'everyone'
    },
    showActivity: {
      type: Boolean,
      default: true
    },
    readReceipts: {
      type: Boolean,
      default: true
    }
  },
  status: {
    type: String,
    enum: ['online', 'idle', 'dnd', 'invisible'],
    default: 'online'
  },
  customStatus: {
    text: {
      type: String,
      default: ''
    },
    emoji: {
      type: String,
      default: ''
    },
    expiresAt: {
      type: Date,
      default: null
    }
  },
  blockedUsers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  mutedServers: [{
    server: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Server'
    },
    until: {
      type: Date,
      default: null
    }
  }],
  mutedChannels: [{
    channel: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Channel'
    },
    until: {
      type: Date,
      default: null
    }
  }],
  favoriteServers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Server'
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

userSettingsSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('UserSettings', userSettingsSchema);
