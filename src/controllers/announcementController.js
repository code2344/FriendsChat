const Announcement = require('../models/Announcement');
const User = require('../models/User');
const DirectMessage = require('../models/DirectMessage');

// Create announcement (admin only)
exports.createAnnouncement = async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'master_admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const { 
      title, 
      content, 
      type, 
      targets, 
      specificUsers, 
      servers, 
      priority, 
      expiresAt,
      attachments 
    } = req.body;

    const announcement = new Announcement({
      title,
      content,
      type: type || 'info',
      author: req.user._id,
      targets: targets || 'all',
      specificUsers: specificUsers || [],
      servers: servers || [],
      priority: priority || 'normal',
      expiresAt,
      attachments: attachments || []
    });

    await announcement.save();

    // Send as DM to all targeted users
    let targetUsersList = [];

    if (targets === 'all') {
      targetUsersList = await User.find({ isApproved: true });
    } else if (targets === 'students') {
      targetUsersList = await User.find({ isApproved: true, accountType: 'student' });
    } else if (targets === 'teachers') {
      targetUsersList = await User.find({ isApproved: true, accountType: 'teacher' });
    } else if (targets === 'admins') {
      targetUsersList = await User.find({ 
        isApproved: true, 
        role: { $in: ['admin', 'master_admin'] } 
      });
    } else if (targets === 'specific') {
      targetUsersList = await User.find({ _id: { $in: specificUsers } });
    }

    // Create read-only DM for each user
    const dmPromises = targetUsersList.map(user => {
      const dm = new DirectMessage({
        participants: [req.user._id, user._id],
        messages: [{
          sender: req.user._id,
          content: `**${title}**\n\n${content}`,
          isAnnouncement: true,
          readOnly: true,
          priority: priority,
          announcementType: type,
          attachments: attachments || []
        }]
      });
      return dm.save();
    });

    await Promise.all(dmPromises);

    res.status(201).json({ 
      message: `Announcement sent to ${targetUsersList.length} users`,
      announcement 
    });
  } catch (error) {
    res.status(500).json({ message: 'Error creating announcement', error: error.message });
  }
};

// Get all announcements
exports.getAllAnnouncements = async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'master_admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const announcements = await Announcement.find()
      .populate('author', 'username')
      .sort({ createdAt: -1 });
    
    res.json(announcements);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching announcements', error: error.message });
  }
};

// Get user's announcements
exports.getUserAnnouncements = async (req, res) => {
  try {
    const query = {
      $or: [
        { targets: 'all' },
        { targets: 'students', specificUsers: { $in: [req.user._id] } },
        { targets: 'teachers', specificUsers: { $in: [req.user._id] } },
        { targets: 'specific', specificUsers: { $in: [req.user._id] } }
      ],
      isActive: true,
      $or: [
        { expiresAt: { $exists: false } },
        { expiresAt: { $gt: new Date() } }
      ]
    };

    const announcements = await Announcement.find(query)
      .populate('author', 'username avatar badges')
      .sort({ priority: -1, createdAt: -1 });
    
    res.json(announcements);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching announcements', error: error.message });
  }
};

// Mark announcement as read
exports.markAsRead = async (req, res) => {
  try {
    const { announcementId } = req.params;

    const announcement = await Announcement.findById(announcementId);
    if (!announcement) {
      return res.status(404).json({ message: 'Announcement not found' });
    }

    // Check if already read
    const alreadyRead = announcement.readBy.some(
      rb => rb.user.toString() === req.user._id.toString()
    );

    if (!alreadyRead) {
      announcement.readBy.push({
        user: req.user._id,
        readAt: new Date()
      });
      await announcement.save();
    }

    res.json({ message: 'Announcement marked as read' });
  } catch (error) {
    res.status(500).json({ message: 'Error marking announcement as read', error: error.message });
  }
};

// Delete announcement
exports.deleteAnnouncement = async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'master_admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const { announcementId } = req.params;

    await Announcement.findByIdAndDelete(announcementId);

    res.json({ message: 'Announcement deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting announcement', error: error.message });
  }
};

// Deactivate announcement
exports.deactivateAnnouncement = async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'master_admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const { announcementId } = req.params;

    const announcement = await Announcement.findByIdAndUpdate(
      announcementId,
      { isActive: false },
      { new: true }
    );

    res.json({ message: 'Announcement deactivated', announcement });
  } catch (error) {
    res.status(500).json({ message: 'Error deactivating announcement', error: error.message });
  }
};
