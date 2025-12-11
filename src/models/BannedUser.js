const mongoose = require('mongoose');

const bannedUserSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  macAddress: {
    type: String,
    required: true
  },
  bannedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  reason: {
    type: String,
    required: true
  },
  isPermanent: {
    type: Boolean,
    default: true
  },
  bannedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('BannedUser', bannedUserSchema);
