const User = require('../models/User');

/**
 * Get user profile
 */
async function getProfile(req, res) {
  try {
    const { userId } = req.params;
    
    // If no userId specified, return current user's profile
    const targetUserId = userId || req.user._id;
    
    const user = await User.findById(targetUserId)
      .select('-password -macAddress')
      .lean();
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json(user);
  } catch (error) {
    console.error('Error getting profile:', error);
    res.status(500).json({ error: 'Failed to get profile' });
  }
}

/**
 * Update user profile
 */
async function updateProfile(req, res) {
  try {
    const { bio, pronouns, customStatus, avatar, banner } = req.body;
    
    const updateData = {};
    
    if (bio !== undefined) {
      if (bio.length > 190) {
        return res.status(400).json({ error: 'Bio too long (max 190 characters)' });
      }
      updateData.bio = bio;
    }
    
    if (pronouns !== undefined) {
      updateData.pronouns = pronouns;
    }
    
    if (customStatus !== undefined) {
      updateData.customStatus = customStatus;
    }
    
    if (avatar !== undefined) {
      updateData.avatar = avatar;
    }
    
    if (banner !== undefined) {
      updateData.banner = banner;
    }
    
    const user = await User.findByIdAndUpdate(
      req.user._id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password -macAddress');
    
    res.json({ 
      message: 'Profile updated successfully',
      user 
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
}

module.exports = {
  getProfile,
  updateProfile
};
