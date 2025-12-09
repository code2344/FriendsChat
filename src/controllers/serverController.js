const Server = require('../models/Server');
const Channel = require('../models/Channel');

/**
 * Create a new server
 */
async function createServer(req, res) {
  try {
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Server name is required' });
    }

    const server = new Server({
      name,
      description: description || '',
      owner: req.user._id,
      members: [req.user._id]
    });

    await server.save();
    await server.populate('owner', 'username firstName lastName');

    res.status(201).json(server);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create server', details: error.message });
  }
}

/**
 * Get all servers user is a member of
 */
async function getUserServers(req, res) {
  try {
    const servers = await Server.find({
      $or: [
        { owner: req.user._id },
        { members: req.user._id },
        { coOwners: req.user._id },
        { moderators: req.user._id }
      ]
    })
    .populate('owner', 'username firstName lastName')
    .populate('members', 'username firstName lastName');

    res.json(servers);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch servers', details: error.message });
  }
}

/**
 * Get all servers (master admin only)
 */
async function getAllServers(req, res) {
  try {
    const servers = await Server.find()
      .populate('owner', 'username firstName lastName')
      .populate('members', 'username firstName lastName');

    res.json(servers);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch all servers', details: error.message });
  }
}

/**
 * Get server by ID
 */
async function getServer(req, res) {
  try {
    const { serverId } = req.params;

    const server = await Server.findById(serverId)
      .populate('owner coOwners moderators', 'username firstName lastName')
      .populate('members', 'username');

    if (!server) {
      return res.status(404).json({ error: 'Server not found' });
    }

    // Check access
    const hasAccess = server.members.some(m => m._id.equals(req.user._id)) ||
                      server.owner.equals(req.user._id) ||
                      req.user.role === 'master_admin';

    if (!hasAccess) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json(server);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch server', details: error.message });
  }
}

/**
 * Join a server
 */
async function joinServer(req, res) {
  try {
    const { serverId } = req.params;

    const server = await Server.findById(serverId);

    if (!server) {
      return res.status(404).json({ error: 'Server not found' });
    }

    // Check if already a member
    if (server.members.includes(req.user._id)) {
      return res.status(400).json({ error: 'Already a member of this server' });
    }

    // Check if banned
    const isBanned = server.bannedUsers.some(ban => ban.user.equals(req.user._id));
    if (isBanned) {
      return res.status(403).json({ error: 'You are banned from this server' });
    }

    server.members.push(req.user._id);
    await server.save();

    res.json({ message: 'Joined server successfully', server });
  } catch (error) {
    res.status(500).json({ error: 'Failed to join server', details: error.message });
  }
}

/**
 * Add co-owner to server
 */
async function addCoOwner(req, res) {
  try {
    const { serverId, userId } = req.params;

    const server = await Server.findById(serverId);

    if (!server) {
      return res.status(404).json({ error: 'Server not found' });
    }

    // Only owner can add co-owners
    if (!server.owner.equals(req.user._id)) {
      return res.status(403).json({ error: 'Only server owner can add co-owners' });
    }

    if (server.coOwners.includes(userId)) {
      return res.status(400).json({ error: 'User is already a co-owner' });
    }

    server.coOwners.push(userId);
    await server.save();

    res.json({ message: 'Co-owner added successfully', server });
  } catch (error) {
    res.status(500).json({ error: 'Failed to add co-owner', details: error.message });
  }
}

/**
 * Add moderator to server
 */
async function addModerator(req, res) {
  try {
    const { serverId, userId } = req.params;

    const server = await Server.findById(serverId);

    if (!server) {
      return res.status(404).json({ error: 'Server not found' });
    }

    // Owner or co-owner can add moderators
    const canAddMod = server.owner.equals(req.user._id) || server.coOwners.includes(req.user._id);
    if (!canAddMod) {
      return res.status(403).json({ error: 'Only owner or co-owner can add moderators' });
    }

    if (server.moderators.includes(userId)) {
      return res.status(400).json({ error: 'User is already a moderator' });
    }

    server.moderators.push(userId);
    await server.save();

    res.json({ message: 'Moderator added successfully', server });
  } catch (error) {
    res.status(500).json({ error: 'Failed to add moderator', details: error.message });
  }
}

/**
 * Ban user from server
 */
async function banUserFromServer(req, res) {
  try {
    const { serverId, userId } = req.params;
    const { reason } = req.body;

    const server = await Server.findById(serverId);

    if (!server) {
      return res.status(404).json({ error: 'Server not found' });
    }

    // Check permissions
    const canBan = server.owner.equals(req.user._id) ||
                   server.coOwners.includes(req.user._id) ||
                   server.moderators.includes(req.user._id);

    if (!canBan) {
      return res.status(403).json({ error: 'Insufficient permissions to ban users' });
    }

    // Check if already banned
    const alreadyBanned = server.bannedUsers.some(ban => ban.user.equals(userId));
    if (alreadyBanned) {
      return res.status(400).json({ error: 'User is already banned' });
    }

    // Add to banned list
    server.bannedUsers.push({
      user: userId,
      bannedBy: req.user._id,
      reason: reason || 'No reason provided'
    });

    // Remove from members
    server.members = server.members.filter(m => !m.equals(userId));

    await server.save();

    res.json({ message: 'User banned from server successfully', server });
  } catch (error) {
    res.status(500).json({ error: 'Failed to ban user', details: error.message });
  }
}

module.exports = {
  createServer,
  getUserServers,
  getAllServers,
  getServer,
  joinServer,
  addCoOwner,
  addModerator,
  banUserFromServer
};
