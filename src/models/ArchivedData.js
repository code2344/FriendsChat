const mongoose = require('mongoose');
const zlib = require('zlib');

const archivedDataSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['message', 'directMessage', 'user', 'report'],
    required: true,
    index: true
  },
  originalId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  compressedData: {
    type: Buffer,
    required: true
  },
  metadata: {
    archivedAt: {
      type: Date,
      default: Date.now
    },
    originalDate: {
      type: Date,
      required: true
    },
    size: {
      type: Number,
      required: true
    },
    compressedSize: {
      type: Number,
      required: true
    }
  },
  searchableFields: {
    username: String,
    channelId: mongoose.Schema.Types.ObjectId,
    serverId: mongoose.Schema.Types.ObjectId,
    content: String // Keep first 100 chars for search
  }
});

// Index for efficient querying
archivedDataSchema.index({ 'metadata.originalDate': 1 });
archivedDataSchema.index({ 'searchableFields.username': 1 });
archivedDataSchema.index({ 'searchableFields.channelId': 1 });

module.exports = mongoose.model('ArchivedData', archivedDataSchema);
