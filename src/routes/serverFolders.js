const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const serverFolderController = require('../controllers/serverFolderController');

// All routes require authentication
router.use(authenticate);

// Get user's folders
router.get('/', serverFolderController.getUserFolders);

// Create folder
router.post('/', serverFolderController.createFolder);

// Update folder
router.put('/:folderId', serverFolderController.updateFolder);

// Delete folder
router.delete('/:folderId', serverFolderController.deleteFolder);

// Add server to folder
router.post('/:folderId/servers/:serverId', serverFolderController.addServerToFolder);

// Remove server from folder
router.delete('/:folderId/servers/:serverId', serverFolderController.removeServerFromFolder);

// Reorder folders
router.put('/reorder', serverFolderController.reorderFolders);

module.exports = router;
