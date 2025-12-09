const ServerFolder = require('../models/ServerFolder');
const Server = require('../models/Server');

// Get all folders for a user
exports.getUserFolders = async (req, res) => {
  try {
    const folders = await ServerFolder.find({ user: req.user.id })
      .populate('servers', 'name icon')
      .sort({ position: 1 });
    
    res.json(folders);
  } catch (error) {
    console.error('Error fetching folders:', error);
    res.status(500).json({ error: 'Failed to fetch folders' });
  }
};

// Create a new folder
exports.createFolder = async (req, res) => {
  try {
    const { name, color, serverIds } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'Folder name is required' });
    }
    
    // Get max position
    const maxPosFolder = await ServerFolder.findOne({ user: req.user.id })
      .sort({ position: -1 });
    const position = maxPosFolder ? maxPosFolder.position + 1 : 0;
    
    const folder = new ServerFolder({
      name,
      color: color || '#5865f2',
      user: req.user.id,
      servers: serverIds || [],
      position
    });
    
    await folder.save();
    await folder.populate('servers', 'name icon');
    
    res.status(201).json(folder);
  } catch (error) {
    console.error('Error creating folder:', error);
    res.status(500).json({ error: 'Failed to create folder' });
  }
};

// Update folder
exports.updateFolder = async (req, res) => {
  try {
    const { folderId } = req.params;
    const { name, color, serverIds, isCollapsed } = req.body;
    
    const folder = await ServerFolder.findOne({
      _id: folderId,
      user: req.user.id
    });
    
    if (!folder) {
      return res.status(404).json({ error: 'Folder not found' });
    }
    
    if (name !== undefined) folder.name = name;
    if (color !== undefined) folder.color = color;
    if (serverIds !== undefined) folder.servers = serverIds;
    if (isCollapsed !== undefined) folder.isCollapsed = isCollapsed;
    
    await folder.save();
    await folder.populate('servers', 'name icon');
    
    res.json(folder);
  } catch (error) {
    console.error('Error updating folder:', error);
    res.status(500).json({ error: 'Failed to update folder' });
  }
};

// Delete folder
exports.deleteFolder = async (req, res) => {
  try {
    const { folderId } = req.params;
    
    const folder = await ServerFolder.findOneAndDelete({
      _id: folderId,
      user: req.user.id
    });
    
    if (!folder) {
      return res.status(404).json({ error: 'Folder not found' });
    }
    
    res.json({ message: 'Folder deleted successfully' });
  } catch (error) {
    console.error('Error deleting folder:', error);
    res.status(500).json({ error: 'Failed to delete folder' });
  }
};

// Add server to folder
exports.addServerToFolder = async (req, res) => {
  try {
    const { folderId, serverId } = req.params;
    
    const folder = await ServerFolder.findOne({
      _id: folderId,
      user: req.user.id
    });
    
    if (!folder) {
      return res.status(404).json({ error: 'Folder not found' });
    }
    
    if (!folder.servers.includes(serverId)) {
      folder.servers.push(serverId);
      await folder.save();
    }
    
    await folder.populate('servers', 'name icon');
    res.json(folder);
  } catch (error) {
    console.error('Error adding server to folder:', error);
    res.status(500).json({ error: 'Failed to add server to folder' });
  }
};

// Remove server from folder
exports.removeServerFromFolder = async (req, res) => {
  try {
    const { folderId, serverId } = req.params;
    
    const folder = await ServerFolder.findOne({
      _id: folderId,
      user: req.user.id
    });
    
    if (!folder) {
      return res.status(404).json({ error: 'Folder not found' });
    }
    
    folder.servers = folder.servers.filter(id => id.toString() !== serverId);
    await folder.save();
    await folder.populate('servers', 'name icon');
    
    res.json(folder);
  } catch (error) {
    console.error('Error removing server from folder:', error);
    res.status(500).json({ error: 'Failed to remove server from folder' });
  }
};

// Reorder folders
exports.reorderFolders = async (req, res) => {
  try {
    const { folderOrders } = req.body; // Array of { folderId, position }
    
    if (!Array.isArray(folderOrders)) {
      return res.status(400).json({ error: 'Invalid folder order data' });
    }
    
    const updatePromises = folderOrders.map(({ folderId, position }) => 
      ServerFolder.findOneAndUpdate(
        { _id: folderId, user: req.user.id },
        { position },
        { new: true }
      )
    );
    
    await Promise.all(updatePromises);
    
    const folders = await ServerFolder.find({ user: req.user.id })
      .populate('servers', 'name icon')
      .sort({ position: 1 });
    
    res.json(folders);
  } catch (error) {
    console.error('Error reordering folders:', error);
    res.status(500).json({ error: 'Failed to reorder folders' });
  }
};
