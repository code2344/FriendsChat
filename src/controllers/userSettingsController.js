const UserSettings = require('../models/UserSettings');

// Get user settings
exports.getUserSettings = async (req, res) => {
  try {
    let settings = await UserSettings.findOne({ user: req.user.id });
    
    if (!settings) {
      // Create default settings
      settings = new UserSettings({ user: req.user.id });
      await settings.save();
    }
    
    res.json(settings);
  } catch (error) {
    console.error('Error fetching settings:', error);
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
};

// Update user settings
exports.updateUserSettings = async (req, res) => {
  try {
    const updates = req.body;
    
    let settings = await UserSettings.findOne({ user: req.user.id });
    
    if (!settings) {
      settings = new UserSettings({ user: req.user.id, ...updates });
    } else {
      Object.keys(updates).forEach(key => {
        if (typeof updates[key] === 'object' && !Array.isArray(updates[key])) {
          settings[key] = { ...settings[key], ...updates[key] };
        } else {
          settings[key] = updates[key];
        }
      });
    }
    
    await settings.save();
    res.json(settings);
  } catch (error) {
    console.error('Error updating settings:', error);
    res.status(500).json({ error: 'Failed to update settings' });
  }
};

// Set custom status
exports.setCustomStatus = async (req, res) => {
  try {
    const { text, emoji, expiresIn } = req.body;
    
    let settings = await UserSettings.findOne({ user: req.user.id });
    
    if (!settings) {
      settings = new UserSettings({ user: req.user.id });
    }
    
    settings.customStatus = {
      text: text || '',
      emoji: emoji || '',
      expiresAt: expiresIn ? new Date(Date.now() + expiresIn * 60000) : null
    };
    
    await settings.save();
    res.json(settings.customStatus);
  } catch (error) {
    console.error('Error setting custom status:', error);
    res.status(500).json({ error: 'Failed to set custom status' });
  }
};

// Clear custom status
exports.clearCustomStatus = async (req, res) => {
  try {
    const settings = await UserSettings.findOne({ user: req.user.id });
    
    if (settings) {
      settings.customStatus = { text: '', emoji: '', expiresAt: null };
      await settings.save();
    }
    
    res.json({ message: 'Custom status cleared' });
  } catch (error) {
    console.error('Error clearing status:', error);
    res.status(500).json({ error: 'Failed to clear status' });
  }
};

// Block user
exports.blockUser = async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (userId === req.user.id) {
      return res.status(400).json({ error: 'Cannot block yourself' });
    }
    
    let settings = await UserSettings.findOne({ user: req.user.id });
    
    if (!settings) {
      settings = new UserSettings({ user: req.user.id });
    }
    
    if (!settings.blockedUsers.includes(userId)) {
      settings.blockedUsers.push(userId);
      await settings.save();
    }
    
    res.json({ message: 'User blocked successfully' });
  } catch (error) {
    console.error('Error blocking user:', error);
    res.status(500).json({ error: 'Failed to block user' });
  }
};

// Unblock user
exports.unblockUser = async (req, res) => {
  try {
    const { userId } = req.params;
    
    const settings = await UserSettings.findOne({ user: req.user.id });
    
    if (settings) {
      settings.blockedUsers = settings.blockedUsers.filter(
        id => id.toString() !== userId
      );
      await settings.save();
    }
    
    res.json({ message: 'User unblocked successfully' });
  } catch (error) {
    console.error('Error unblocking user:', error);
    res.status(500).json({ error: 'Failed to unblock user' });
  }
};

// Get blocked users
exports.getBlockedUsers = async (req, res) => {
  try {
    const settings = await UserSettings.findOne({ user: req.user.id })
      .populate('blockedUsers', 'username avatar');
    
    res.json(settings?.blockedUsers || []);
  } catch (error) {
    console.error('Error fetching blocked users:', error);
    res.status(500).json({ error: 'Failed to fetch blocked users' });
  }
};

// Mute server
exports.muteServer = async (req, res) => {
  try {
    const { serverId } = req.params;
    const { duration } = req.body; // Duration in minutes
    
    let settings = await UserSettings.findOne({ user: req.user.id });
    
    if (!settings) {
      settings = new UserSettings({ user: req.user.id });
    }
    
    // Remove if already muted
    settings.mutedServers = settings.mutedServers.filter(
      m => m.server.toString() !== serverId
    );
    
    // Add mute
    settings.mutedServers.push({
      server: serverId,
      until: duration ? new Date(Date.now() + duration * 60000) : null
    });
    
    await settings.save();
    res.json({ message: 'Server muted successfully' });
  } catch (error) {
    console.error('Error muting server:', error);
    res.status(500).json({ error: 'Failed to mute server' });
  }
};

// Unmute server
exports.unmuteServer = async (req, res) => {
  try {
    const { serverId } = req.params;
    
    const settings = await UserSettings.findOne({ user: req.user.id });
    
    if (settings) {
      settings.mutedServers = settings.mutedServers.filter(
        m => m.server.toString() !== serverId
      );
      await settings.save();
    }
    
    res.json({ message: 'Server unmuted successfully' });
  } catch (error) {
    console.error('Error unmuting server:', error);
    res.status(500).json({ error: 'Failed to unmute server' });
  }
};

// Toggle favorite server
exports.toggleFavoriteServer = async (req, res) => {
  try {
    const { serverId } = req.params;
    
    let settings = await UserSettings.findOne({ user: req.user.id });
    
    if (!settings) {
      settings = new UserSettings({ user: req.user.id });
    }
    
    const index = settings.favoriteServers.findIndex(
      id => id.toString() === serverId
    );
    
    if (index > -1) {
      settings.favoriteServers.splice(index, 1);
    } else {
      settings.favoriteServers.push(serverId);
    }
    
    await settings.save();
    res.json({ 
      isFavorite: index === -1,
      message: index === -1 ? 'Server added to favorites' : 'Server removed from favorites'
    });
  } catch (error) {
    console.error('Error toggling favorite:', error);
    res.status(500).json({ error: 'Failed to toggle favorite' });
  }
};
