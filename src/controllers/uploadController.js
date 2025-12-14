const multer = require('multer');
const { uploadFile, validateFile } = require('../utils/githubStorage');
const { detectNSFW, logContentSafetyCheck } = require('../utils/nsfwDetection');
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
    
    // NSFW detection
    const nsfwCheck = await detectNSFW({
      filename: req.file.originalname,
      mimetype: req.file.mimetype,
      buffer: req.file.buffer
    });
    
    // Block if flagged as unsafe
    if (!nsfwCheck.safe && nsfwCheck.confidence > 0.7) {
      await logContentSafetyCheck(req.user._id, null, nsfwCheck);
      return res.status(400).json({ 
        error: 'Image rejected by content filter',
        reason: 'Content appears to violate community guidelines'
      });
    }
    
    // Upload to GitHub
    const result = await uploadFile(
      req.file.buffer,
      req.file.originalname,
      req.file.mimetype,
      'avatars'
    );
    
    // Update user avatar (marked for review if needed)
    const updateData = {
      avatar: result.url
    };
    
    // If requires review, mark it
    if (nsfwCheck.requiresReview) {
      updateData.avatarNeedsReview = true;
    }
    
    await User.findByIdAndUpdate(req.user._id, updateData);
    
    // Log safety check
    await logContentSafetyCheck(req.user._id, result.url, nsfwCheck);
    
    res.json({
      message: 'Avatar uploaded successfully',
      url: result.url,
      requiresReview: nsfwCheck.requiresReview,
      note: nsfwCheck.requiresReview ? 'Image is pending master admin review' : null
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
    
    // NSFW detection
    const nsfwCheck = await detectNSFW({
      filename: req.file.originalname,
      mimetype: req.file.mimetype,
      buffer: req.file.buffer
    });
    
    // Block if flagged as unsafe
    if (!nsfwCheck.safe && nsfwCheck.confidence > 0.7) {
      await logContentSafetyCheck(req.user._id, null, nsfwCheck);
      return res.status(400).json({ 
        error: 'Image rejected by content filter',
        reason: 'Content appears to violate community guidelines'
      });
    }
    
    // Upload to GitHub
    const result = await uploadFile(
      req.file.buffer,
      req.file.originalname,
      req.file.mimetype,
      'banners'
    );
    
    // Update user banner (marked for review if needed)
    const updateData = {
      banner: result.url
    };
    
    if (nsfwCheck.requiresReview) {
      updateData.bannerNeedsReview = true;
    }
    
    await User.findByIdAndUpdate(req.user._id, updateData);
    
    // Log safety check
    await logContentSafetyCheck(req.user._id, result.url, nsfwCheck);
    
    res.json({
      message: 'Banner uploaded successfully',
      url: result.url,
      requiresReview: nsfwCheck.requiresReview,
      note: nsfwCheck.requiresReview ? 'Image is pending master admin review' : null
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
    
    // NSFW detection for images/videos
    const nsfwCheck = await detectNSFW({
      filename: req.file.originalname,
      mimetype: req.file.mimetype,
      buffer: req.file.buffer
    });
    
    // Block if flagged as unsafe with high confidence
    if (!nsfwCheck.safe && nsfwCheck.confidence > 0.8) {
      await logContentSafetyCheck(req.user._id, null, nsfwCheck);
      return res.status(400).json({ 
        error: 'File rejected by content filter',
        reason: 'Content appears to violate community guidelines'
      });
    }
    
    // Upload to GitHub
    const result = await uploadFile(
      req.file.buffer,
      req.file.originalname,
      req.file.mimetype,
      'messages'
    );
    
    // Log safety check
    await logContentSafetyCheck(req.user._id, result.url, nsfwCheck);
    
    // Return with blur/review indicator if needed
    const response = {
      message: 'File uploaded successfully',
      url: result.url,
      fileName: req.file.originalname,
      fileType: req.file.mimetype,
      fileSize: req.file.size,
      requiresReview: nsfwCheck.requiresReview,
      blurred: nsfwCheck.requiresReview // Display blurred until reviewed
    };
    
    if (nsfwCheck.requiresReview) {
      response.reviewNote = 'File is pending master admin review';
      response.displayIcon = '🔞';
    }
    
    res.json(response);
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
