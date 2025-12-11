const mongoose = require('mongoose');

const serverFolderSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  color: {
    type: String,
    default: '#5865f2'
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  servers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Server'
  }],
  position: {
    type: Number,
    default: 0
  },
  isCollapsed: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('ServerFolder', serverFolderSchema);
