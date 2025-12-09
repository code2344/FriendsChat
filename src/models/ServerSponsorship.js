const mongoose = require('mongoose');

const serverSponsorshipSchema = new mongoose.Schema({
  server: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Server',
    required: true
  },
  paidBy: {
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
    required: true,
    default: 2.00
  },
  status: {
    type: String,
    enum: ['pending', 'active', 'expired', 'rejected'],
    default: 'pending'
  },
  sponsorshipType: {
    type: String,
    enum: ['featured', 'sponsored', 'promoted'],
    default: 'sponsored'
  },
  startDate: {
    type: Date
  },
  endDate: {
    type: Date
  },
  duration: {
    type: Number, // days
    default: 30
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
  },
  views: {
    type: Number,
    default: 0
  },
  clicks: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('ServerSponsorship', serverSponsorshipSchema);
