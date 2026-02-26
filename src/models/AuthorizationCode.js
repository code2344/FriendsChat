const mongoose = require('mongoose');

// Regex pattern for 8-digit codes
const CODE_PATTERN = /^\d{8}$/;

const authorizationCodeSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    match: CODE_PATTERN,
    validate: {
      validator: function(v) {
        return CODE_PATTERN.test(v);
      },
      message: 'Authorization code must be exactly 8 digits'
    }
  },
  description: {
    type: String,
    required: true,
    trim: true,
    maxlength: 500
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  isUsed: {
    type: Boolean,
    default: false
  },
  usedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  usedAt: {
    type: Date,
    default: null
  },
  isExpired: {
    type: Boolean,
    default: false
  },
  expiredBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  expiredAt: {
    type: Date,
    default: null
  }
});

authorizationCodeSchema.index({ code: 1 });
authorizationCodeSchema.index({ createdBy: 1 });
authorizationCodeSchema.index({ isUsed: 1, isExpired: 1 });

module.exports = mongoose.model('AuthorizationCode', authorizationCodeSchema);
