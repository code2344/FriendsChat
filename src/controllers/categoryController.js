const Category = require('../models/Category');
const Channel = require('../models/Channel');
const Server = require('../models/Server');

/**
 * Create a new category in a server
 */
async function createCategory(req, res) {
  try {
    const { serverId } = req.params;
    const { name, position } = req.body;

    // Check if user is owner or has permissions
    const server = await Server.findById(serverId);
    if (!server) {
      return res.status(404).json({ error: 'Server not found' });
    }

    const isOwner = server.owner.toString() === req.user._id.toString();
    const isCoOwner = server.coOwners.some(id => id.toString() === req.user._id.toString());
    const isModerator = server.moderators.some(id => id.toString() === req.user._id.toString());

    if (!isOwner && !isCoOwner && !isModerator) {
      return res.status(403).json({ error: 'Permission denied' });
    }

    const category = new Category({
      name,
      server: serverId,
      position: position || 0,
      createdBy: req.user._id
    });

    await category.save();

    res.status(201).json({
      message: 'Category created successfully',
      category
    });
  } catch (error) {
    console.error('Error creating category:', error);
    res.status(500).json({ error: 'Failed to create category', details: error.message });
  }
}

/**
 * Get all categories for a server
 */
async function getCategories(req, res) {
  try {
    const { serverId } = req.params;

    const categories = await Category.find({ server: serverId })
      .sort({ position: 1 });

    // Get channels for each category
    const categoriesWithChannels = await Promise.all(
      categories.map(async (category) => {
        const channels = await Channel.find({ 
          server: serverId, 
          category: category._id 
        }).sort({ position: 1 });

        return {
          ...category.toObject(),
          channels
        };
      })
    );

    // Get uncategorized channels
    const uncategorizedChannels = await Channel.find({
      server: serverId,
      $or: [
        { category: null },
        { category: { $exists: false } }
      ]
    }).sort({ position: 1 });

    res.json({
      categories: categoriesWithChannels,
      uncategorizedChannels
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Failed to fetch categories', details: error.message });
  }
}

/**
 * Update a category
 */
async function updateCategory(req, res) {
  try {
    const { categoryId } = req.params;
    const { name, position, collapsed } = req.body;

    const category = await Category.findById(categoryId);
    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    // Check permissions
    const server = await Server.findById(category.server);
    const isOwner = server.owner.toString() === req.user._id.toString();
    const isCoOwner = server.coOwners.some(id => id.toString() === req.user._id.toString());
    const isModerator = server.moderators.some(id => id.toString() === req.user._id.toString());

    if (!isOwner && !isCoOwner && !isModerator) {
      return res.status(403).json({ error: 'Permission denied' });
    }

    if (name !== undefined) category.name = name;
    if (position !== undefined) category.position = position;
    if (collapsed !== undefined) category.collapsed = collapsed;

    await category.save();

    res.json({
      message: 'Category updated successfully',
      category
    });
  } catch (error) {
    console.error('Error updating category:', error);
    res.status(500).json({ error: 'Failed to update category', details: error.message });
  }
}

/**
 * Delete a category
 */
async function deleteCategory(req, res) {
  try {
    const { categoryId } = req.params;

    const category = await Category.findById(categoryId);
    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    // Check permissions
    const server = await Server.findById(category.server);
    const isOwner = server.owner.toString() === req.user._id.toString();
    const isCoOwner = server.coOwners.some(id => id.toString() === req.user._id.toString());

    if (!isOwner && !isCoOwner) {
      return res.status(403).json({ error: 'Permission denied' });
    }

    // Move all channels in this category to uncategorized
    await Channel.updateMany(
      { category: categoryId },
      { $set: { category: null } }
    );

    await Category.findByIdAndDelete(categoryId);

    res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    console.error('Error deleting category:', error);
    res.status(500).json({ error: 'Failed to delete category', details: error.message });
  }
}

/**
 * Move channel to a category
 */
async function moveChannelToCategory(req, res) {
  try {
    const { channelId } = req.params;
    const { categoryId } = req.body;

    const channel = await Channel.findById(channelId);
    if (!channel) {
      return res.status(404).json({ error: 'Channel not found' });
    }

    // Check permissions
    const server = await Server.findById(channel.server);
    const isOwner = server.owner.toString() === req.user._id.toString();
    const isCoOwner = server.coOwners.some(id => id.toString() === req.user._id.toString());
    const isModerator = server.moderators.some(id => id.toString() === req.user._id.toString());

    if (!isOwner && !isCoOwner && !isModerator) {
      return res.status(403).json({ error: 'Permission denied' });
    }

    // Verify category exists if provided
    if (categoryId) {
      const category = await Category.findById(categoryId);
      if (!category) {
        return res.status(404).json({ error: 'Category not found' });
      }
      if (category.server.toString() !== channel.server.toString()) {
        return res.status(400).json({ error: 'Category and channel must be in the same server' });
      }
    }

    channel.category = categoryId || null;
    await channel.save();

    res.json({
      message: 'Channel moved successfully',
      channel
    });
  } catch (error) {
    console.error('Error moving channel:', error);
    res.status(500).json({ error: 'Failed to move channel', details: error.message });
  }
}

module.exports = {
  createCategory,
  getCategories,
  updateCategory,
  deleteCategory,
  moveChannelToCategory
};
