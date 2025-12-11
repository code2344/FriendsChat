const { Octokit } = require('@octokit/rest');
const crypto = require('crypto');

// Initialize Octokit with token from environment
const octokit = new Octokit({
  auth: process.env.GITHUB_STORAGE_TOKEN
});

// Configuration
const GITHUB_OWNER = process.env.GITHUB_STORAGE_OWNER || 'code2344';
const GITHUB_REPO = process.env.GITHUB_STORAGE_REPO || 'friendschat-storage';
const GITHUB_BRANCH = process.env.GITHUB_STORAGE_BRANCH || 'main';

/**
 * Upload a file to GitHub repository
 * @param {Buffer} fileBuffer - File data as buffer
 * @param {string} fileName - Original filename
 * @param {string} mimeType - File MIME type
 * @param {string} folder - Folder in repo (e.g., 'avatars', 'messages', 'banners')
 * @returns {Promise<string>} - URL to the uploaded file
 */
async function uploadFile(fileBuffer, fileName, mimeType, folder = 'uploads') {
  try {
    // Generate unique filename to prevent collisions
    const timestamp = Date.now();
    const hash = crypto.createHash('md5').update(fileBuffer).digest('hex').substring(0, 8);
    const ext = fileName.split('.').pop();
    const uniqueFileName = `${timestamp}-${hash}.${ext}`;
    const filePath = `${folder}/${uniqueFileName}`;
    
    // Convert buffer to base64
    const content = fileBuffer.toString('base64');
    
    // Upload to GitHub
    const response = await octokit.repos.createOrUpdateFileContents({
      owner: GITHUB_OWNER,
      repo: GITHUB_REPO,
      path: filePath,
      message: `Upload ${fileName}`,
      content: content,
      branch: GITHUB_BRANCH
    });
    
    // Return the GitHub Pages URL
    const githubPagesUrl = `https://${GITHUB_OWNER}.github.io/${GITHUB_REPO}/${filePath}`;
    
    return {
      url: githubPagesUrl,
      path: filePath,
      sha: response.data.content.sha,
      fileName: uniqueFileName
    };
  } catch (error) {
    console.error('Error uploading file to GitHub:', error);
    throw new Error('Failed to upload file to storage');
  }
}

/**
 * Delete a file from GitHub repository
 * @param {string} filePath - Path to file in repo
 * @returns {Promise<boolean>}
 */
async function deleteFile(filePath) {
  try {
    // Get current file to get SHA
    const { data: currentFile } = await octokit.repos.getContent({
      owner: GITHUB_OWNER,
      repo: GITHUB_REPO,
      path: filePath,
      ref: GITHUB_BRANCH
    });
    
    // Delete file
    await octokit.repos.deleteFile({
      owner: GITHUB_OWNER,
      repo: GITHUB_REPO,
      path: filePath,
      message: `Delete ${filePath}`,
      sha: currentFile.sha,
      branch: GITHUB_BRANCH
    });
    
    return true;
  } catch (error) {
    console.error('Error deleting file from GitHub:', error);
    return false;
  }
}

/**
 * Check if file exists in GitHub repository
 * @param {string} filePath - Path to file in repo
 * @returns {Promise<boolean>}
 */
async function fileExists(filePath) {
  try {
    await octokit.repos.getContent({
      owner: GITHUB_OWNER,
      repo: GITHUB_REPO,
      path: filePath,
      ref: GITHUB_BRANCH
    });
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Validate file type and size
 * @param {string} mimeType - File MIME type
 * @param {number} size - File size in bytes
 * @param {string} type - Type of upload ('avatar', 'message', 'banner')
 * @returns {Object} - { valid: boolean, error: string }
 */
function validateFile(mimeType, size, type = 'message') {
  const MAX_SIZES = {
    avatar: 5 * 1024 * 1024, // 5MB
    banner: 8 * 1024 * 1024, // 8MB
    message: 512 * 1024 * 1024 // 512MB
  };
  
  const ALLOWED_TYPES = {
    avatar: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    banner: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    message: [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'video/mp4', 'video/webm', 'video/quicktime',
      'audio/mpeg', 'audio/wav', 'audio/ogg',
      'application/pdf', 'application/zip',
      'text/plain', 'application/json'
    ]
  };
  
  const maxSize = MAX_SIZES[type] || MAX_SIZES.message;
  const allowedTypes = ALLOWED_TYPES[type] || ALLOWED_TYPES.message;
  
  if (size > maxSize) {
    return {
      valid: false,
      error: `File too large. Maximum size: ${Math.round(maxSize / 1024 / 1024)}MB`
    };
  }
  
  if (!allowedTypes.includes(mimeType)) {
    return {
      valid: false,
      error: `File type not allowed: ${mimeType}`
    };
  }
  
  return { valid: true };
}

module.exports = {
  uploadFile,
  deleteFile,
  fileExists,
  validateFile
};
