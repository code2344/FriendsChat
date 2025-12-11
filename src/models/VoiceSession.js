const mongoose = require('mongoose');

const voiceSessionSchema = new mongoose.Schema({
  channel: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Channel',
    required: true
  },
  participants: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    joinedAt: {
      type: Date,
      default: Date.now
    },
    isMuted: {
      type: Boolean,
      default: false
    },
    isDeafened: {
      type: Boolean,
      default: false
    },
    isVideoEnabled: {
      type: Boolean,
      default: false
    },
    isScreenSharing: {
      type: Boolean,
      default: false
    }
  }],
  startedAt: {
    type: Date,
    default: Date.now
  },
  endedAt: {
    type: Date
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('VoiceSession', voiceSessionSchema);
