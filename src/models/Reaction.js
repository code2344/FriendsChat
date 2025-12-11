const mongoose = require('mongoose');

const reactionSchema = new mongoose.Schema({
  message: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message',
    required: true
  },
  emoji: {
    type: String,
    required: true
  },
  users: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

reactionSchema.index({ message: 1, emoji: 1 });

module.exports = mongoose.model('Reaction', reactionSchema);
