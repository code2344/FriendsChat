const Friend = require('../models/Friend');
const User = require('../models/User');

/**
 * Send a friend request
 */
async function sendFriendRequest(req, res) {
  try {
    const { recipientId } = req.body;

    if (!recipientId) {
      return res.status(400).json({ error: 'Recipient ID is required' });
    }

    if (recipientId === req.user._id.toString()) {
      return res.status(400).json({ error: 'Cannot send friend request to yourself' });
    }

    // Check if recipient exists
    const recipient = await User.findById(recipientId);
    if (!recipient) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if already friends or request exists
    const existing = await Friend.findOne({
      $or: [
        { requester: req.user._id, recipient: recipientId },
        { requester: recipientId, recipient: req.user._id }
      ]
    });

    if (existing) {
      if (existing.status === 'accepted') {
        return res.status(400).json({ error: 'Already friends' });
      }
      return res.status(400).json({ error: 'Friend request already sent' });
    }

    // Create friend request
    const friendRequest = new Friend({
      requester: req.user._id,
      recipient: recipientId,
      status: 'pending'
    });

    await friendRequest.save();
    await friendRequest.populate('requester recipient', 'username firstName lastName');

    res.status(201).json({
      message: 'Friend request sent',
      friendRequest
    });
  } catch (error) {
    console.error('Error sending friend request:', error);
    res.status(500).json({ error: 'Failed to send friend request', details: error.message });
  }
}

/**
 * Accept a friend request
 */
async function acceptFriendRequest(req, res) {
  try {
    const { id } = req.params;

    const friendRequest = await Friend.findById(id);

    if (!friendRequest) {
      return res.status(404).json({ error: 'Friend request not found' });
    }

    // Verify user is the recipient
    if (!friendRequest.recipient.equals(req.user._id)) {
      return res.status(403).json({ error: 'Not authorized to accept this request' });
    }

    if (friendRequest.status !== 'pending') {
      return res.status(400).json({ error: 'Request already processed' });
    }

    friendRequest.status = 'accepted';
    friendRequest.acceptedAt = new Date();
    await friendRequest.save();

    await friendRequest.populate('requester recipient', 'username firstName lastName');

    res.json({
      message: 'Friend request accepted',
      friend: friendRequest
    });
  } catch (error) {
    console.error('Error accepting friend request:', error);
    res.status(500).json({ error: 'Failed to accept friend request', details: error.message });
  }
}

/**
 * Decline a friend request
 */
async function declineFriendRequest(req, res) {
  try {
    const { id } = req.params;

    const friendRequest = await Friend.findById(id);

    if (!friendRequest) {
      return res.status(404).json({ error: 'Friend request not found' });
    }

    // Verify user is the recipient
    if (!friendRequest.recipient.equals(req.user._id)) {
      return res.status(403).json({ error: 'Not authorized to decline this request' });
    }

    await Friend.findByIdAndDelete(id);

    res.json({ message: 'Friend request declined' });
  } catch (error) {
    console.error('Error declining friend request:', error);
    res.status(500).json({ error: 'Failed to decline friend request', details: error.message });
  }
}

/**
 * Get user's friends
 */
async function getFriends(req, res) {
  try {
    const friends = await Friend.find({
      $or: [
        { requester: req.user._id, status: 'accepted' },
        { recipient: req.user._id, status: 'accepted' }
      ]
    })
    .populate('requester recipient', 'username firstName lastName status')
    .sort({ acceptedAt: -1 });

    // Format response to always show the other user
    const formattedFriends = friends.map(f => {
      const friend = f.requester._id.equals(req.user._id) ? f.recipient : f.requester;
      return {
        _id: f._id,
        friend,
        since: f.acceptedAt
      };
    });

    res.json(formattedFriends);
  } catch (error) {
    console.error('Error fetching friends:', error);
    res.status(500).json({ error: 'Failed to fetch friends', details: error.message });
  }
}

/**
 * Get pending friend requests
 */
async function getPendingRequests(req, res) {
  try {
    const requests = await Friend.find({
      recipient: req.user._id,
      status: 'pending'
    })
    .populate('requester', 'username firstName lastName')
    .sort({ createdAt: -1 });

    res.json(requests);
  } catch (error) {
    console.error('Error fetching pending requests:', error);
    res.status(500).json({ error: 'Failed to fetch pending requests', details: error.message });
  }
}

/**
 * Remove a friend
 */
async function removeFriend(req, res) {
  try {
    const { id } = req.params;

    const friendship = await Friend.findById(id);

    if (!friendship) {
      return res.status(404).json({ error: 'Friendship not found' });
    }

    // Verify user is part of the friendship
    if (!friendship.requester.equals(req.user._id) && !friendship.recipient.equals(req.user._id)) {
      return res.status(403).json({ error: 'Not authorized to remove this friendship' });
    }

    await Friend.findByIdAndDelete(id);

    res.json({ message: 'Friend removed' });
  } catch (error) {
    console.error('Error removing friend:', error);
    res.status(500).json({ error: 'Failed to remove friend', details: error.message });
  }
}

module.exports = {
  sendFriendRequest,
  acceptFriendRequest,
  declineFriendRequest,
  getFriends,
  getPendingRequests,
  removeFriend
};
