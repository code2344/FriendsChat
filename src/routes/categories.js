const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');
const { authenticate } = require('../middleware/auth');

// All routes require authentication
router.use(authenticate);

// Category routes
router.post('/server/:serverId', categoryController.createCategory);
router.get('/server/:serverId', categoryController.getCategories);
router.put('/:categoryId', categoryController.updateCategory);
router.delete('/:categoryId', categoryController.deleteCategory);

// Move channel to category
router.put('/channel/:channelId/move', categoryController.moveChannelToCategory);

module.exports = router;
