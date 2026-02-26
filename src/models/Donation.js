const mongoose = require('mongoose');

const donationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  referenceCode: {
    type: String,
    required: true,
    unique: true
  },
  amount: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'verified', 'rejected'],
    default: 'pending'
  },
  donorTier: {
    type: String,
    enum: ['bronze', 'silver', 'gold', 'platinum'],
    default: 'bronze'
  },
  perks: {
    customNameplate: {
      enabled: { type: Boolean, default: false },
      text: { type: String, default: '' },
      color: { type: String, default: '#ffa500' },
      gradient: { type: Boolean, default: false },
      gradientColors: [String]
    },
    customFont: {
      enabled: { type: Boolean, default: false },
      fontFamily: { type: String, default: 'Arial' },
      fontWeight: { type: String, default: 'normal' },
      fontStyle: { type: String, default: 'normal' }
    },
    badge: {
      type: String,
      default: 'donor'
    },
    profile: {
      animatedAvatar: { type: Boolean, default: false },
      customBanner: { type: Boolean, default: true },
      profileTheme: { type: Boolean, default: true }
    },
    media: {
      hdVideoQuality: { type: Boolean, default: false },
      hdAudioQuality: { type: Boolean, default: false }
    }
  },
  verifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  verifiedAt: {
    type: Date
  },
  notes: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Donation', donationSchema);
