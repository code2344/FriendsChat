const mongoose = require('mongoose');

const webhookSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  channel: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Channel',
    required: true
  },
  server: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Server',
    required: true
  },
  token: {
    type: String,
    required: true,
    unique: true
  },
  avatar: {
    type: String,
    default: null
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  lastUsedAt: {
    type: Date,
    default: null
  }
});

module.exports = mongoose.model('Webhook', webhookSchema);
