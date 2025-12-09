const mongoose = require('mongoose');

const threadSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  parentChannel: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Channel',
    required: true
  },
  server: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Server',
    required: true
  },
  starterMessage: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message'
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  members: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  archived: {
    type: Boolean,
    default: false
  },
  locked: {
    type: Boolean,
    default: false
  },
  autoArchiveDuration: {
    type: Number, // minutes
    default: 1440 // 24 hours
  },
  lastActivity: {
    type: Date,
    default: Date.now
  },
  messageCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Thread', threadSchema);
