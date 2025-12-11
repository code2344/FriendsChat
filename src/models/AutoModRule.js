const mongoose = require('mongoose');

const autoModRuleSchema = new mongoose.Schema({
  server: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Server',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  enabled: {
    type: Boolean,
    default: true
  },
  eventType: {
    type: String,
    enum: ['keyword', 'spam', 'mention_spam', 'keyword_preset'],
    required: true
  },
  triggerType: {
    type: String,
    enum: ['keyword', 'harmful_links', 'spam', 'mention_spam'],
    required: true
  },
  triggerMetadata: {
    keywordFilter: [String],
    regexPatterns: [String],
    mentionLimit: Number,
    mentionRaidProtection: Boolean
  },
  actions: [{
    type: {
      type: String,
      enum: ['block_message', 'send_alert', 'timeout', 'kick', 'ban'],
      required: true
    },
    duration: Number, // seconds for timeout
    metadata: {
      channelId: mongoose.Schema.Types.ObjectId,
      customMessage: String
    }
  }],
  exemptRoles: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Role'
  }],
  exemptChannels: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Channel'
  }],
  triggeredCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('AutoModRule', autoModRuleSchema);
