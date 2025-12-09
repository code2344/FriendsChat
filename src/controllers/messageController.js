const Message = require('../models/Message');
const DirectMessage = require('../models/DirectMessage');
const Channel = require('../models/Channel');
const Server = require('../models/Server');
const { encryptMessage, decryptMessage } = require('../utils/encryption');
const { filterProfanity } = require('../utils/profanityFilter');

/**
 * Send a message to a channel
 */
async function sendMessage(req, res) {
  try {
    const { channelId, content } = req.body;

    if (!content || !channelId) {
      return res.status(400).json({ error: 'Content and channel ID are required' });
    }

    // Verify channel exists
    const channel = await Channel.findById(channelId);
    if (!channel) {
      return res.status(404).json({ error: 'Channel not found' });
    }

    // Verify user is member of the server
    const server = await Server.findById(channel.server);
    const isMember = server.members.includes(req.user._id) || 
                     server.owner.equals(req.user._id) ||
                     req.user.role === 'master_admin';

    if (!isMember) {
      return res.status(403).json({ error: 'Not a member of this server' });
    }

    // Filter profanity
    const { filteredMessage, isFiltered } = filterProfanity(content);

    // Encrypt message
    const encryptedContent = encryptMessage(filteredMessage);

    // Create message
    const message = new Message({
      content: filteredMessage,
      encryptedContent,
      author: req.user._id,
      channel: channelId,
      server: channel.server,
      isFiltered
    });

    await message.save();
    await message.populate('author', 'username firstName lastName');

    res.status(201).json(message);
  } catch (error) {
    res.status(500).json({ error: 'Failed to send message', details: error.message });
  }
}

/**
 * Get messages from a channel
 */
async function getMessages(req, res) {
  try {
    const { channelId } = req.params;
    const { limit = 50, before } = req.query;

    // Verify channel exists
    const channel = await Channel.findById(channelId);
    if (!channel) {
      return res.status(404).json({ error: 'Channel not found' });
    }

    // Verify user has access
    const server = await Server.findById(channel.server);
    const hasAccess = server.members.includes(req.user._id) || 
                      server.owner.equals(req.user._id) ||
                      req.user.role === 'master_admin';

    if (!hasAccess) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Build query
    const query = { channel: channelId };
    if (before) {
      query.createdAt = { $lt: new Date(before) };
    }

    const messages = await Message.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .populate('author', 'username firstName lastName');

    // Decrypt messages for master admin
    if (req.user.role === 'master_admin') {
      messages.forEach(msg => {
        msg.content = decryptMessage(msg.encryptedContent);
      });
    }

    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch messages', details: error.message });
  }
}

/**
 * Send a direct message
 */
async function sendDirectMessage(req, res) {
  try {
    const { recipientId, content } = req.body;

    if (!content || !recipientId) {
      return res.status(400).json({ error: 'Content and recipient ID are required' });
    }

    // Filter profanity
    const { filteredMessage, isFiltered } = filterProfanity(content);

    // Encrypt message
    const encryptedContent = encryptMessage(filteredMessage);

    // Create direct message
    const dm = new DirectMessage({
      content: filteredMessage,
      encryptedContent,
      sender: req.user._id,
      recipient: recipientId,
      isFiltered
    });

    await dm.save();
    await dm.populate('sender recipient', 'username firstName lastName');

    res.status(201).json(dm);
  } catch (error) {
    res.status(500).json({ error: 'Failed to send direct message', details: error.message });
  }
}

/**
 * Get direct messages with a user
 */
async function getDirectMessages(req, res) {
  try {
    const { userId } = req.params;
    const { limit = 50, before } = req.query;

    // Build query
    const query = {
      $or: [
        { sender: req.user._id, recipient: userId },
        { sender: userId, recipient: req.user._id }
      ]
    };

    if (before) {
      query.createdAt = { $lt: new Date(before) };
    }

    const messages = await DirectMessage.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .populate('sender recipient', 'username firstName lastName');

    // Decrypt messages for master admin
    if (req.user.role === 'master_admin') {
      messages.forEach(msg => {
        msg.content = decryptMessage(msg.encryptedContent);
      });
    }

    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch direct messages', details: error.message });
  }
}

/**
 * Get all messages (master admin only)
 */
async function getAllMessages(req, res) {
  try {
    const { type = 'all', limit = 100 } = req.query;
    let messages = [];

    if (type === 'direct' || type === 'all') {
      const dms = await DirectMessage.find()
        .sort({ createdAt: -1 })
        .limit(parseInt(limit))
        .populate('sender recipient', 'username firstName lastName');
      
      dms.forEach(msg => {
        msg.content = decryptMessage(msg.encryptedContent);
      });
      
      messages = messages.concat(dms);
    }

    if (type === 'channel' || type === 'all') {
      const channelMsgs = await Message.find()
        .sort({ createdAt: -1 })
        .limit(parseInt(limit))
        .populate('author', 'username firstName lastName')
        .populate('channel', 'name')
        .populate('server', 'name');
      
      channelMsgs.forEach(msg => {
        msg.content = decryptMessage(msg.encryptedContent);
      });
      
      messages = messages.concat(channelMsgs);
    }

    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch all messages', details: error.message });
  }
}

module.exports = {
  sendMessage,
  getMessages,
  sendDirectMessage,
  getDirectMessages,
  getAllMessages
};
