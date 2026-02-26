const express = require('express');
const router = express.Router();
const uploadController = require('../controllers/uploadController');
const { authenticate } = require('../middleware/auth');

// Upload avatar
router.post('/avatar', 
  authenticate, 
  uploadController.upload.single('avatar'),
  uploadController.uploadAvatar
);

// Upload banner
router.post('/banner', 
  authenticate,
  uploadController.upload.single('banner'),
  uploadController.uploadBanner
);

// Upload file for message
router.post('/file',
  authenticate,
  uploadController.upload.single('file'),
  uploadController.uploadMessageFile
);

module.exports = router;
