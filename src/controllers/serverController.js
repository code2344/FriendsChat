const Server = require('../models/Server');
const Channel = require('../models/Channel');

/**
 * Create a new server
 */
async function createServer(req, res) {
  try {
    const { name, description, isPublic } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Server name is required' });
    }

    // Check if user can create public servers
    const canCreatePublic = req.user.role === 'admin' || req.user.role === 'master_admin';
    
    if (isPublic && !canCreatePublic) {
      return res.status(403).json({ error: 'Only admins can create public servers' });
    }

    const server = new Server({
      name,
      description: description || '',
      owner: req.user._id,
      members: [req.user._id],
      isPublic: isPublic && canCreatePublic ? true : false
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
    // Build query based on user role
    let query;
    
    if (req.user.role === 'admin' || req.user.role === 'master_admin') {
      // Admins can see all servers
      query = {};
    } else {
      // Regular users only see servers they're members of or public servers
      query = {
        $or: [
          { owner: req.user._id },
          { members: req.user._id },
          { coOwners: req.user._id },
          { moderators: req.user._id },
          { isPublic: true }
        ]
      };
    }
    
    const servers = await Server.find(query)
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

/**
 * Create invite code for server
 */
async function createInvite(req, res) {
  try {
    const { serverId } = req.params;
    const ServerInvite = require('../models/ServerInvite');

    const server = await Server.findById(serverId);
    if (!server) {
      return res.status(404).json({ error: 'Server not found' });
    }

    // Check permissions
    const canInvite = server.owner.equals(req.user._id) ||
                      server.coOwners.includes(req.user._id) ||
                      server.moderators.includes(req.user._id) ||
                      server.members.includes(req.user._id);

    if (!canInvite) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    // Generate unique code
    const code = Math.random().toString(36).substring(2, 10).toUpperCase();

    const invite = new ServerInvite({
      code,
      server: serverId,
      createdBy: req.user._id
    });

    await invite.save();

    res.status(201).json({ code, inviteId: invite._id });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create invite', details: error.message });
  }
}

/**
 * Join server with invite code
 */
async function joinWithInvite(req, res) {
  try {
    const { code } = req.body;
    const ServerInvite = require('../models/ServerInvite');

    if (!code) {
      return res.status(400).json({ error: 'Invite code is required' });
    }

    const invite = await ServerInvite.findOne({ code: code.toUpperCase() });
    if (!invite) {
      return res.status(404).json({ error: 'Invalid invite code' });
    }

    // Check if expired
    if (invite.expiresAt && invite.expiresAt < Date.now()) {
      return res.status(400).json({ error: 'Invite code has expired' });
    }

    // Check max uses
    if (invite.maxUses && invite.uses >= invite.maxUses) {
      return res.status(400).json({ error: 'Invite code has reached maximum uses' });
    }

    const server = await Server.findById(invite.server);
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

    // Add to server
    server.members.push(req.user._id);
    await server.save();

    // Increment uses
    invite.uses += 1;
    await invite.save();

    res.json({ message: 'Joined server successfully', server });
  } catch (error) {
    res.status(500).json({ error: 'Failed to join server', details: error.message });
  }
}

/**
 * Update server settings (icon, banner, theme, etc.)
 */
async function updateServerSettings(req, res) {
  try {
    const { serverId } = req.params;
    const { icon, banner, theme, description, isPublic } = req.body;

    const server = await Server.findById(serverId);
    if (!server) {
      return res.status(404).json({ error: 'Server not found' });
    }

    // Check permissions
    const isOwner = server.owner.equals(req.user._id);
    const isCoOwner = server.coOwners.includes(req.user._id);
    
    if (!isOwner && !isCoOwner) {
      return res.status(403).json({ error: 'Only owner or co-owners can update server settings' });
    }

    // Update fields
    if (icon !== undefined) server.icon = icon;
    if (banner !== undefined) server.banner = banner;
    if (description !== undefined) server.description = description;
    if (theme) {
      server.theme = { ...server.theme, ...theme };
    }
    
    // Only admins can change public/private status
    if (isPublic !== undefined && (req.user.role === 'admin' || req.user.role === 'master_admin')) {
      server.isPublic = isPublic;
    }

    await server.save();
    res.json({ message: 'Server settings updated successfully', server });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update server settings', details: error.message });
  }
}

/**
 * Create custom role
 */
async function createRole(req, res) {
  try {
    const { serverId } = req.params;
    const { name, color, permissions } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Role name is required' });
    }

    const server = await Server.findById(serverId);
    if (!server) {
      return res.status(404).json({ error: 'Server not found' });
    }

    // Check permissions
    const canManageRoles = server.owner.equals(req.user._id) || 
                           server.coOwners.includes(req.user._id);
    
    if (!canManageRoles) {
      return res.status(403).json({ error: 'Insufficient permissions to manage roles' });
    }

    const role = {
      name,
      color: color || '#99aab5',
      permissions: permissions || {
        manageChannels: false,
        manageRoles: false,
        kickMembers: false,
        banMembers: false,
        sendMessages: true,
        manageMessages: false
      },
      position: server.customRoles.length
    };

    server.customRoles.push(role);
    await server.save();

    res.status(201).json({ message: 'Role created successfully', role: server.customRoles[server.customRoles.length - 1] });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create role', details: error.message });
  }
}

/**
 * Assign role to member
 */
async function assignRole(req, res) {
  try {
    const { serverId, userId, roleId } = req.params;

    const server = await Server.findById(serverId);
    if (!server) {
      return res.status(404).json({ error: 'Server not found' });
    }

    // Check permissions
    const canManageRoles = server.owner.equals(req.user._id) || 
                           server.coOwners.includes(req.user._id);
    
    if (!canManageRoles) {
      return res.status(403).json({ error: 'Insufficient permissions to assign roles' });
    }

    // Check if user is member
    if (!server.members.includes(userId)) {
      return res.status(400).json({ error: 'User is not a member of this server' });
    }

    // Find or create member role entry
    let memberRole = server.memberRoles.find(mr => mr.user.equals(userId));
    
    if (!memberRole) {
      memberRole = { user: userId, roles: [] };
      server.memberRoles.push(memberRole);
    }

    // Add role if not already assigned
    if (!memberRole.roles.includes(roleId)) {
      memberRole.roles.push(roleId);
    }

    await server.save();
    res.json({ message: 'Role assigned successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to assign role', details: error.message });
  }
}

/**
 * Add member to server (for private servers)
 */
async function addMember(req, res) {
  try {
    const { serverId, userId } = req.params;

    const server = await Server.findById(serverId);
    if (!server) {
      return res.status(404).json({ error: 'Server not found' });
    }

    // Check permissions
    const canAddMembers = server.owner.equals(req.user._id) || 
                          server.coOwners.includes(req.user._id) ||
                          server.moderators.includes(req.user._id);
    
    if (!canAddMembers) {
      return res.status(403).json({ error: 'Insufficient permissions to add members' });
    }

    // Check if already a member
    if (server.members.includes(userId)) {
      return res.status(400).json({ error: 'User is already a member' });
    }

    // Check if banned
    const isBanned = server.bannedUsers.some(ban => ban.user.equals(userId));
    if (isBanned) {
      return res.status(400).json({ error: 'User is banned from this server' });
    }

    server.members.push(userId);
    await server.save();

    res.json({ message: 'Member added successfully', server });
  } catch (error) {
    res.status(500).json({ error: 'Failed to add member', details: error.message });
  }
}

/**
 * Get list of public servers
 */
async function getPublicServers(req, res) {
  try {
    const servers = await Server.find({ isPublic: true })
      .populate('owner', 'username firstName lastName')
      .select('name description icon banner members')
      .limit(50);

    res.json(servers);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch public servers', details: error.message });
  }
}

/**
 * Invite specific user to server (by username/ID)
 */
async function inviteUser(req, res) {
  try {
    const { serverId } = req.params;
    const { username, userId } = req.body;

    if (!username && !userId) {
      return res.status(400).json({ error: 'Username or user ID is required' });
    }

    const server = await Server.findById(serverId);
    if (!server) {
      return res.status(404).json({ error: 'Server not found' });
    }

    // Check permissions
    const canInvite = server.owner.equals(req.user._id) || 
                      server.coOwners.includes(req.user._id) ||
                      server.moderators.includes(req.user._id) ||
                      server.members.includes(req.user._id);

    if (!canInvite) {
      return res.status(403).json({ error: 'You must be a member to invite users' });
    }

    // Find the user to invite
    const User = require('../models/User');
    const targetUser = userId 
      ? await User.findById(userId) 
      : await User.findOne({ username });

    if (!targetUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (!targetUser.isApproved) {
      return res.status(400).json({ error: 'User is not approved yet' });
    }

    // Check if already a member
    if (server.members.includes(targetUser._id)) {
      return res.status(400).json({ error: 'User is already a member' });
    }

    // Check if banned
    const isBanned = server.bannedUsers.some(ban => ban.user.equals(targetUser._id));
    if (isBanned) {
      return res.status(400).json({ error: 'User is banned from this server' });
    }

    // Create a pending invite notification (we'll store this in user's document or create an Invite model)
    // For now, auto-add them
    server.members.push(targetUser._id);
    await server.save();

    res.json({ 
      message: `${targetUser.username} has been added to the server`,
      user: {
        id: targetUser._id,
        username: targetUser.username,
        firstName: targetUser.firstName,
        lastName: targetUser.lastName
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to invite user', details: error.message });
  }
}

/**
 * Remove member from server
 */
async function removeMember(req, res) {
  try {
    const { serverId, userId } = req.params;

    const server = await Server.findById(serverId);
    if (!server) {
      return res.status(404).json({ error: 'Server not found' });
    }

    // Check permissions (owner, co-owners, or moderators can remove members)
    const canRemove = server.owner.equals(req.user._id) || 
                      server.coOwners.includes(req.user._id) ||
                      server.moderators.includes(req.user._id);

    if (!canRemove) {
      return res.status(403).json({ error: 'Insufficient permissions to remove members' });
    }

    // Cannot remove owner
    if (server.owner.equals(userId)) {
      return res.status(400).json({ error: 'Cannot remove server owner' });
    }

    // Remove from all role arrays
    server.members = server.members.filter(m => !m.equals(userId));
    server.coOwners = server.coOwners.filter(m => !m.equals(userId));
    server.moderators = server.moderators.filter(m => !m.equals(userId));
    server.memberRoles = server.memberRoles.filter(mr => !mr.user.equals(userId));

    await server.save();

    res.json({ message: 'Member removed successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to remove member', details: error.message });
  }
}

/**
 * Get server members with their roles
 */
async function getServerMembers(req, res) {
  try {
    const { serverId } = req.params;

    const server = await Server.findById(serverId)
      .populate('owner', 'username firstName lastName')
      .populate('members', 'username firstName lastName')
      .populate('coOwners', 'username firstName lastName')
      .populate('moderators', 'username firstName lastName');

    if (!server) {
      return res.status(404).json({ error: 'Server not found' });
    }

    // Check if user has access
    const hasAccess = req.user.role === 'admin' || 
                      req.user.role === 'master_admin' ||
                      server.members.some(m => m._id.equals(req.user._id)) ||
                      server.owner.equals(req.user._id);

    if (!hasAccess) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Build member list with roles
    const memberList = server.members.map(member => {
      const isOwner = server.owner._id.equals(member._id);
      const isCoOwner = server.coOwners.some(co => co._id.equals(member._id));
      const isModerator = server.moderators.some(mod => mod._id.equals(member._id));
      const memberRoles = server.memberRoles.find(mr => mr.user.equals(member._id));

      let role = 'Member';
      if (isOwner) role = 'Owner';
      else if (isCoOwner) role = 'Co-Owner';
      else if (isModerator) role = 'Moderator';

      return {
        id: member._id,
        username: member.username,
        firstName: member.firstName,
        lastName: member.lastName,
        role,
        customRoles: memberRoles ? memberRoles.roles : []
      };
    });

    res.json({
      server: {
        id: server._id,
        name: server.name,
        description: server.description,
        icon: server.icon,
        banner: server.banner,
        theme: server.theme,
        isPublic: server.isPublic
      },
      members: memberList,
      totalMembers: memberList.length
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch server members', details: error.message });
  }
}

/**
 * Update member role (promote/demote)
 */
async function updateMemberRole(req, res) {
  try {
    const { serverId, userId } = req.params;
    const { action } = req.body; // 'promote-coowner', 'promote-moderator', 'demote'

    const server = await Server.findById(serverId);
    if (!server) {
      return res.status(404).json({ error: 'Server not found' });
    }

    // Only owner and co-owners can manage roles
    const canManage = server.owner.equals(req.user._id) || 
                      server.coOwners.includes(req.user._id);

    if (!canManage) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    // Cannot modify owner
    if (server.owner.equals(userId)) {
      return res.status(400).json({ error: 'Cannot modify owner role' });
    }

    // Ensure user is a member
    if (!server.members.includes(userId)) {
      return res.status(400).json({ error: 'User is not a member' });
    }

    switch(action) {
      case 'promote-coowner':
        if (!server.owner.equals(req.user._id)) {
          return res.status(403).json({ error: 'Only owner can promote co-owners' });
        }
        if (!server.coOwners.includes(userId)) {
          server.coOwners.push(userId);
        }
        // Remove from moderators if present
        server.moderators = server.moderators.filter(m => !m.equals(userId));
        break;

      case 'promote-moderator':
        if (!server.moderators.includes(userId)) {
          server.moderators.push(userId);
        }
        // Remove from co-owners if present (demotion)
        server.coOwners = server.coOwners.filter(m => !m.equals(userId));
        break;

      case 'demote':
        server.coOwners = server.coOwners.filter(m => !m.equals(userId));
        server.moderators = server.moderators.filter(m => !m.equals(userId));
        break;

      default:
        return res.status(400).json({ error: 'Invalid action' });
    }

    await server.save();
    res.json({ message: 'Member role updated successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update member role', details: error.message });
  }
}

/**
 * Transfer server ownership
 */
async function transferOwnership(req, res) {
  try {
    const { serverId, userId } = req.params;

    const server = await Server.findById(serverId);
    if (!server) {
      return res.status(404).json({ error: 'Server not found' });
    }

    // Only current owner can transfer
    if (!server.owner.equals(req.user._id)) {
      return res.status(403).json({ error: 'Only the owner can transfer ownership' });
    }

    // New owner must be a member
    if (!server.members.includes(userId)) {
      return res.status(400).json({ error: 'New owner must be a member of the server' });
    }

    // Transfer ownership
    const oldOwner = server.owner;
    server.owner = userId;

    // Make old owner a co-owner
    if (!server.coOwners.includes(oldOwner)) {
      server.coOwners.push(oldOwner);
    }

    // Remove new owner from co-owners/moderators
    server.coOwners = server.coOwners.filter(m => !m.equals(userId));
    server.moderators = server.moderators.filter(m => !m.equals(userId));

    await server.save();
    res.json({ message: 'Ownership transferred successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to transfer ownership', details: error.message });
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
  banUserFromServer,
  createInvite,
  joinWithInvite,
  updateServerSettings,
  createRole,
  assignRole,
  addMember,
  getPublicServers,
  inviteUser,
  removeMember,
  getServerMembers,
  updateMemberRole,
  transferOwnership
};
