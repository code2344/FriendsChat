const multer = require('multer');
const { uploadFile, validateFile } = require('../utils/githubStorage');
const User = require('../models/User');

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 512 * 1024 * 1024 // 512MB max
  }
});

/**
 * Upload profile avatar
 */
async function uploadAvatar(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    // Validate file
    const validation = validateFile(req.file.mimetype, req.file.size, 'avatar');
    if (!validation.valid) {
      return res.status(400).json({ error: validation.error });
    }
    
    // Upload to GitHub
    const result = await uploadFile(
      req.file.buffer,
      req.file.originalname,
      req.file.mimetype,
      'avatars'
    );
    
    // Update user avatar
    await User.findByIdAndUpdate(req.user._id, {
      avatar: result.url
    });
    
    res.json({
      message: 'Avatar uploaded successfully',
      url: result.url
    });
  } catch (error) {
    console.error('Error uploading avatar:', error);
    res.status(500).json({ error: 'Failed to upload avatar' });
  }
}

/**
 * Upload profile banner
 */
async function uploadBanner(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    // Validate file
    const validation = validateFile(req.file.mimetype, req.file.size, 'banner');
    if (!validation.valid) {
      return res.status(400).json({ error: validation.error });
    }
    
    // Upload to GitHub
    const result = await uploadFile(
      req.file.buffer,
      req.file.originalname,
      req.file.mimetype,
      'banners'
    );
    
    // Update user banner
    await User.findByIdAndUpdate(req.user._id, {
      banner: result.url
    });
    
    res.json({
      message: 'Banner uploaded successfully',
      url: result.url
    });
  } catch (error) {
    console.error('Error uploading banner:', error);
    res.status(500).json({ error: 'Failed to upload banner' });
  }
}

/**
 * Upload file for message attachment
 */
async function uploadMessageFile(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    // Validate file
    const validation = validateFile(req.file.mimetype, req.file.size, 'message');
    if (!validation.valid) {
      return res.status(400).json({ error: validation.error });
    }
    
    // Upload to GitHub
    const result = await uploadFile(
      req.file.buffer,
      req.file.originalname,
      req.file.mimetype,
      'messages'
    );
    
    res.json({
      message: 'File uploaded successfully',
      url: result.url,
      fileName: req.file.originalname,
      fileType: req.file.mimetype,
      fileSize: req.file.size
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    res.status(500).json({ error: 'Failed to upload file' });
  }
}

module.exports = {
  upload,
  uploadAvatar,
  uploadBanner,
  uploadMessageFile
};
