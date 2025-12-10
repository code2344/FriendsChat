const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const friendController = require('../controllers/friendController');

// All routes require authentication
router.use(authenticate);

// Send friend request
router.post('/request', friendController.sendFriendRequest);

// Get all friends
router.get('/', friendController.getFriends);

// Get pending friend requests
router.get('/requests', friendController.getPendingRequests);

// Accept friend request
router.post('/accept/:id', friendController.acceptFriendRequest);

// Decline friend request
router.post('/decline/:id', friendController.declineFriendRequest);

// Remove friend
router.delete('/:id', friendController.removeFriend);

module.exports = router;
