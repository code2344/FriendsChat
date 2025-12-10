const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  server: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Server',
    required: true
  },
  position: {
    type: Number,
    default: 0
  },
  collapsed: {
    type: Boolean,
    default: false
  },
  permissions: [{
    roleId: {
      type: mongoose.Schema.Types.ObjectId
    },
    allow: {
      type: Number,
      default: 0
    },
    deny: {
      type: Number,
      default: 0
    }
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Category', categorySchema);
