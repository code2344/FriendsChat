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
  boosts: {
    level: {
      type: Number,
      default: 0,
      min: 0,
      max: 3
    },
    boosters: [{
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      boostedAt: {
        type: Date,
        default: Date.now
      }
    }]
  },
  categories: [{
    name: {
      type: String,
      required: true
    },
    position: {
      type: Number,
      default: 0
    },
    channels: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Channel'
    }]
  }],
  emojis: [{
    name: {
      type: String,
      required: true
    },
    url: {
      type: String,
      required: true
    },
    animated: {
      type: Boolean,
      default: false
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  stickers: [{
    name: {
      type: String,
      required: true
    },
    url: {
      type: String,
      required: true
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  soundboard: [{
    name: {
      type: String,
      required: true
    },
    url: {
      type: String,
      required: true
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  vanityUrl: {
    type: String,
    default: null,
    unique: true,
    sparse: true
  },
  features: [{
    type: String,
    enum: ['verified', 'partnered', 'discoverable', 'animated_icon', 'banner', 'vanity_url', 'invite_splash', 'welcome_screen']
  }],
  welcomeScreen: {
    enabled: {
      type: Boolean,
      default: false
    },
    description: {
      type: String,
      default: ''
    },
    welcomeChannels: [{
      channel: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Channel'
      },
      description: {
        type: String
      },
      emoji: {
        type: String
      }
    }]
  },
  afkChannel: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Channel',
    default: null
  },
  afkTimeout: {
    type: Number,
    default: 300
  },
  systemChannel: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Channel',
    default: null
  },
  rulesChannel: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Channel',
    default: null
  },
  stats: {
    totalMessages: {
      type: Number,
      default: 0
    },
    totalMembers: {
      type: Number,
      default: 0
    },
    onlineMembers: {
      type: Number,
      default: 0
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Server', serverSchema);
