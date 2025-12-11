const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const reactionController = require('../controllers/reactionController');

// All routes require authentication
router.use(authenticate);

// Toggle reaction on a message (add or remove)
router.post('/:id/react', reactionController.toggleReaction);

// Get all reactions for a message
router.get('/:id/reactions', reactionController.getReactions);

// Remove a specific reaction
router.delete('/:id/react/:emoji', reactionController.removeReaction);

module.exports = router;
