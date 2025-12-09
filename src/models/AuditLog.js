const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  server: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Server',
    required: true
  },
  action: {
    type: String,
    required: true,
    enum: [
      'channel_create', 'channel_update', 'channel_delete',
      'role_create', 'role_update', 'role_delete',
      'member_kick', 'member_ban', 'member_unban',
      'member_role_update', 'member_update',
      'message_delete', 'message_bulk_delete',
      'server_update', 'invite_create', 'invite_delete',
      'webhook_create', 'webhook_update', 'webhook_delete',
      'emoji_create', 'emoji_update', 'emoji_delete'
    ]
  },
  executor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  target: {
    type: String // User ID, Channel ID, etc.
  },
  reason: {
    type: String
  },
  changes: {
    before: Object,
    after: Object
  },
  metadata: Object
}, {
  timestamps: true
});

module.exports = mongoose.model('AuditLog', auditLogSchema);
