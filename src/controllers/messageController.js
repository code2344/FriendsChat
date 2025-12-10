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
    // Accept both 'recipient' and 'recipientId' for compatibility
    const recipientId = req.body.recipientId || req.body.recipient;
    const { content } = req.body;

    if (!content || !recipientId) {
      return res.status(400).json({ error: 'Content and recipient ID are required' });
    }

    // Filter profanity
    const { filteredMessage, isFiltered } = filterProfanity(content);

    // Encrypt message
    const encryptedContent = encryptMessage(filteredMessage);

    // Find or create DM conversation
    let dmConversation = await DirectMessage.findOne({
      participants: { $all: [req.user._id, recipientId] }
    });

    if (!dmConversation) {
      // Create new conversation
      dmConversation = new DirectMessage({
        participants: [req.user._id, recipientId],
        messages: []
      });
    }

    // Add message to conversation
    dmConversation.messages.push({
      sender: req.user._id,
      content: filteredMessage,
      encryptedContent,
      isFiltered
    });

    dmConversation.lastMessage = new Date();
    await dmConversation.save();
    
    // Populate for response
    await dmConversation.populate('participants', 'username firstName lastName');
    await dmConversation.populate('messages.sender', 'username firstName lastName');

    res.status(201).json({
      conversation: dmConversation,
      message: dmConversation.messages[dmConversation.messages.length - 1]
    });
  } catch (error) {
    console.error('Error sending DM:', error);
    res.status(500).json({ error: 'Failed to send direct message', details: error.message });
  }
}

/**
 * Get direct messages with a user
 */
async function getDirectMessages(req, res) {
  try {
    const { userId } = req.params;

    // Find DM conversation
    const dmConversation = await DirectMessage.findOne({
      participants: { $all: [req.user._id, userId] }
    })
    .populate('participants', 'username firstName lastName')
    .populate('messages.sender', 'username firstName lastName');

    if (!dmConversation) {
      return res.json({ messages: [] });
    }

    res.json({
      conversation: dmConversation,
      messages: dmConversation.messages
    });
  } catch (error) {
    console.error('Error fetching DMs:', error);
    res.status(500).json({ error: 'Failed to fetch direct messages', details: error.message });
  }
}

/**
 * Get all DM conversations for current user
 */
async function getDmConversations(req, res) {
  try {
    // Find all conversations where user is a participant
    const conversations = await DirectMessage.find({
      participants: req.user._id
    })
    .populate('participants', 'username firstName lastName')
    .populate('messages.sender', 'username firstName lastName')
    .sort({ lastMessage: -1 });

    // Decrypt messages for master admin
    if (req.user.role === 'master_admin') {
      conversations.forEach(conv => {
        conv.messages.forEach(msg => {
          msg.content = decryptMessage(msg.encryptedContent);
        });
      });
    }

    res.json({ conversations });
  } catch (error) {
    console.error('Error fetching DM conversations:', error);
    res.status(500).json({ error: 'Failed to fetch conversations', details: error.message });
  }
}

/**
 * Get all messages (master admin only)
 */
async function getAllMessages(req, res) {
  try {
    const { type = 'all', limit = 100 } = req.query;
    let allMessages = [];

    if (type === 'direct' || type === 'all') {
      const dmConversations = await DirectMessage.find()
        .sort({ lastMessage: -1 })
        .limit(parseInt(limit))
        .populate('participants', 'username firstName lastName')
        .populate('messages.sender', 'username firstName lastName');
      
      dmConversations.forEach(conv => {
        conv.messages.forEach(msg => {
          msg.content = decryptMessage(msg.encryptedContent);
        });
      });
      
      allMessages = allMessages.concat(dmConversations);
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
      
      allMessages = allMessages.concat(channelMsgs);
    }

    res.json({ messages: allMessages });
  } catch (error) {
    console.error('Error fetching all messages:', error);
    res.status(500).json({ error: 'Failed to fetch all messages', details: error.message });
  }
}

/**
 * Edit a message
 */
async function editMessage(req, res) {
  try {
    const { id } = req.params;
    const { content } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ error: 'Content is required' });
    }

    const message = await Message.findById(id);
    
    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    // Check if user owns the message or is master admin
    if (!message.author.equals(req.user._id) && req.user.role !== 'master_admin') {
      return res.status(403).json({ error: 'Not authorized to edit this message' });
    }

    // Filter profanity
    const { filteredMessage, isFiltered } = filterProfanity(content);

    // Update message
    message.content = filteredMessage;
    message.encryptedContent = encryptMessage(filteredMessage);
    message.isEdited = true;
    message.editedAt = new Date();
    message.isFiltered = isFiltered;

    await message.save();
    await message.populate('author', 'username firstName lastName');

    res.json(message);
  } catch (error) {
    console.error('Error editing message:', error);
    res.status(500).json({ error: 'Failed to edit message', details: error.message });
  }
}

module.exports = {
  sendMessage,
  getMessages,
  sendDirectMessage,
  getDirectMessages,
  getDmConversations,
  getAllMessages,
  editMessage
};
