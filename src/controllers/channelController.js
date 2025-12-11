const Channel = require('../models/Channel');
const Server = require('../models/Server');

/**
 * Create a channel in a server
 */
async function createChannel(req, res) {
  try {
    const { serverId, name, type } = req.body;

    if (!serverId || !name) {
      return res.status(400).json({ error: 'Server ID and channel name are required' });
    }

    const server = await Server.findById(serverId);

    if (!server) {
      return res.status(404).json({ error: 'Server not found' });
    }

    // Check permissions
    const canCreate = server.owner.equals(req.user._id) ||
                      server.coOwners.includes(req.user._id) ||
                      server.moderators.includes(req.user._id);

    if (!canCreate) {
      return res.status(403).json({ error: 'Insufficient permissions to create channels' });
    }

    const channel = new Channel({
      name,
      server: serverId,
      type: type || 'text',
      createdBy: req.user._id
    });

    await channel.save();
    await channel.populate('createdBy', 'username');

    res.status(201).json(channel);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create channel', details: error.message });
  }
}

/**
 * Get all channels in a server
 */
async function getServerChannels(req, res) {
  try {
    const { serverId } = req.params;

    const server = await Server.findById(serverId);

    if (!server) {
      return res.status(404).json({ error: 'Server not found' });
    }

    // Check access
    const hasAccess = server.members.includes(req.user._id) ||
                      server.owner.equals(req.user._id) ||
                      req.user.role === 'master_admin';

    if (!hasAccess) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const channels = await Channel.find({ server: serverId })
      .populate('createdBy', 'username');

    res.json(channels);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch channels', details: error.message });
  }
}

/**
 * Delete a channel
 */
async function deleteChannel(req, res) {
  try {
    const { channelId } = req.params;

    const channel = await Channel.findById(channelId);

    if (!channel) {
      return res.status(404).json({ error: 'Channel not found' });
    }

    const server = await Server.findById(channel.server);

    // Check permissions
    const canDelete = server.owner.equals(req.user._id) ||
                      server.coOwners.includes(req.user._id) ||
                      req.user.role === 'master_admin';

    if (!canDelete) {
      return res.status(403).json({ error: 'Insufficient permissions to delete channels' });
    }

    await Channel.findByIdAndDelete(channelId);

    res.json({ message: 'Channel deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete channel', details: error.message });
  }
}

module.exports = {
  createChannel,
  getServerChannels,
  deleteChannel
};
