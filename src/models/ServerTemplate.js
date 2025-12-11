const mongoose = require('mongoose');

const serverTemplateSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  sourceServer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Server'
  },
  category: {
    type: String,
    enum: ['education', 'gaming', 'community', 'creative', 'social', 'study_group'],
    default: 'community'
  },
  isOfficial: {
    type: Boolean,
    default: false
  },
  usageCount: {
    type: Number,
    default: 0
  },
  channels: [{
    name: String,
    type: {
      type: String,
      enum: ['text', 'voice', 'announcement', 'stage', 'forum']
    },
    category: String,
    position: Number
  }],
  roles: [{
    name: String,
    color: String,
    permissions: Object,
    position: Number
  }],
  icon: {
    type: String
  },
  settings: {
    verificationLevel: String,
    defaultNotifications: String,
    explicitContentFilter: String
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('ServerTemplate', serverTemplateSchema);
