const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  content: {
    type: String,
    required: true
  },
  encryptedContent: {
    type: String,
    required: true
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  channel: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Channel',
    required: true
  },
  server: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Server',
    required: true
  },
  isFiltered: {
    type: Boolean,
    default: false
  },
  attachments: [{
    url: {
      type: String,
      required: true
    },
    filename: {
      type: String,
      required: true
    },
    size: {
      type: Number,
      required: true
    },
    contentType: {
      type: String,
      required: true
    }
  }],
  embeds: [{
    title: String,
    description: String,
    url: String,
    color: String,
    thumbnail: String,
    image: String,
    author: {
      name: String,
      iconUrl: String
    },
    fields: [{
      name: String,
      value: String,
      inline: Boolean
    }]
  }],
  replyTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message',
    default: null
  },
  mentions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  mentionEveryone: {
    type: Boolean,
    default: false
  },
  mentionRoles: [{
    type: mongoose.Schema.Types.ObjectId
  }],
  isPinned: {
    type: Boolean,
    default: false
  },
  isEdited: {
    type: Boolean,
    default: false
  },
  editedAt: {
    type: Date,
    default: null
  },
  isDeleted: {
    type: Boolean,
    default: false
  },
  deletedAt: {
    type: Date,
    default: null
  },
  deletedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  type: {
    type: String,
    enum: ['default', 'reply', 'system', 'user_join', 'user_leave', 'channel_name_change', 'channel_icon_change'],
    default: 'default'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

messageSchema.index({ channel: 1, createdAt: -1 });
messageSchema.index({ server: 1, createdAt: -1 });
messageSchema.index({ author: 1, createdAt: -1 });

module.exports = mongoose.model('Message', messageSchema);
