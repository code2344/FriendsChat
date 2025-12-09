const mongoose = require('mongoose');

const channelSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  server: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Server',
    required: true
  },
  type: {
    type: String,
    enum: ['text', 'voice', 'announcement', 'stage', 'forum'],
    default: 'text'
  },
  topic: {
    type: String,
    default: '',
    maxlength: 1024
  },
  position: {
    type: Number,
    default: 0
  },
  nsfw: {
    type: Boolean,
    default: false
  },
  rateLimitPerUser: {
    type: Number,
    default: 0,
    min: 0,
    max: 21600
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    default: null
  },
  permissions: [{
    roleId: {
      type: mongoose.Schema.Types.ObjectId
    },
    allow: {
      type: Number,
      default: 0
    },
    deny: {
      type: Number,
      default: 0
    }
  }],
  pinnedMessages: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message'
  }],
  lastMessageId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message',
    default: null
  },
  lastMessageAt: {
    type: Date,
    default: null
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Channel', channelSchema);
