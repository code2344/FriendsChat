const mongoose = require('mongoose');

const integrationSchema = new mongoose.Schema({
  server: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Server',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['bot', 'webhook', 'youtube', 'twitch', 'spotify', 'github', 'calendar', 'custom'],
    required: true
  },
  enabled: {
    type: Boolean,
    default: true
  },
  config: {
    apiKey: String,
    webhookUrl: String,
    channelId: mongoose.Schema.Types.ObjectId,
    customSettings: Object
  },
  permissions: [String],
  addedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Integration', integrationSchema);
