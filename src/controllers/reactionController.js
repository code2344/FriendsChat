const Message = require('../models/Message');
const Reaction = require('../models/Reaction');

/**
 * Add or remove a reaction to a message
 */
async function toggleReaction(req, res) {
  try {
    const { id: messageId } = req.params;
    const { emoji } = req.body;

    if (!emoji) {
      return res.status(400).json({ error: 'Emoji is required' });
    }

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    // Find existing reaction
    let reaction = await Reaction.findOne({ message: messageId, emoji });

    if (!reaction) {
      // Create new reaction
      reaction = new Reaction({
        message: messageId,
        emoji,
        users: [req.user._id]
      });
      await reaction.save();
    } else {
      // Toggle user in reaction
      const userIndex = reaction.users.findIndex(u => u.equals(req.user._id));
      
      if (userIndex > -1) {
        // Remove user from reaction
        reaction.users.splice(userIndex, 1);
        
        // Delete reaction if no users left
        if (reaction.users.length === 0) {
          await Reaction.findByIdAndDelete(reaction._id);
          return res.json({ action: 'removed', emoji, count: 0 });
        }
      } else {
        // Add user to reaction
        reaction.users.push(req.user._id);
      }
      
      await reaction.save();
    }

    await reaction.populate('users', 'username firstName lastName');

    res.json({
      action: reaction.users.find(u => u._id.equals(req.user._id)) ? 'added' : 'removed',
      emoji,
      count: reaction.users.length,
      users: reaction.users
    });
  } catch (error) {
    console.error('Error toggling reaction:', error);
    res.status(500).json({ error: 'Failed to toggle reaction', details: error.message });
  }
}

/**
 * Get all reactions for a message
 */
async function getReactions(req, res) {
  try {
    const { id: messageId } = req.params;

    const reactions = await Reaction.find({ message: messageId })
      .populate('users', 'username firstName lastName');

    res.json(reactions);
  } catch (error) {
    console.error('Error fetching reactions:', error);
    res.status(500).json({ error: 'Failed to fetch reactions', details: error.message });
  }
}

/**
 * Remove a specific reaction (emoji) from a message
 */
async function removeReaction(req, res) {
  try {
    const { id: messageId, emoji } = req.params;

    const reaction = await Reaction.findOne({ message: messageId, emoji });
    
    if (!reaction) {
      return res.status(404).json({ error: 'Reaction not found' });
    }

    // Remove user from reaction
    reaction.users = reaction.users.filter(u => !u.equals(req.user._id));

    if (reaction.users.length === 0) {
      await Reaction.findByIdAndDelete(reaction._id);
    } else {
      await reaction.save();
    }

    res.json({ message: 'Reaction removed', count: reaction.users.length });
  } catch (error) {
    console.error('Error removing reaction:', error);
    res.status(500).json({ error: 'Failed to remove reaction', details: error.message });
  }
}

module.exports = {
  toggleReaction,
  getReactions,
  removeReaction
};
