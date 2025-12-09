const mongoose = require('mongoose');

const scheduledEventSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    default: ''
  },
  server: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Server',
    required: true
  },
  channel: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Channel'
  },
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  scheduledStartTime: {
    type: Date,
    required: true
  },
  scheduledEndTime: {
    type: Date
  },
  entityType: {
    type: String,
    enum: ['voice', 'stage', 'external'],
    default: 'voice'
  },
  externalLocation: {
    type: String
  },
  status: {
    type: String,
    enum: ['scheduled', 'active', 'completed', 'canceled'],
    default: 'scheduled'
  },
  interestedUsers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  coverImage: {
    type: String
  },
  recurrenceRule: {
    type: String // RRULE format
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('ScheduledEvent', scheduledEventSchema);
