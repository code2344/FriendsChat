const User = require('../models/User');
const Donation = require('../models/Donation');

/**
 * Get user's media quality settings based on donor tier
 */
async function getMediaQuality(req, res) {
  try {
    const userId = req.user._id;
    
    // Check if user has active donation
    const donation = await Donation.findOne({
      user: userId,
      status: 'verified'
    }).sort({ verifiedAt: -1 });
    
    let quality = {
      video: {
        maxResolution: '480p',
        maxBitrate: 500000, // 500kbps
        maxFramerate: 15
      },
      audio: {
        maxBitrate: 32000 // 32kbps
      }
    };
    
    if (donation) {
      const tier = donation.donorTier;
      
      if (tier === 'silver') {
        quality = {
          video: {
            maxResolution: '480p',
            maxBitrate: 800000, // 800kbps
            maxFramerate: 24
          },
          audio: {
            maxBitrate: 128000 // 128kbps HD audio
          }
        };
      } else if (tier === 'gold') {
        quality = {
          video: {
            maxResolution: '720p',
            maxBitrate: 1500000, // 1.5Mbps
            maxFramerate: 30
          },
          audio: {
            maxBitrate: 128000 // 128kbps HD audio
          }
        };
      } else if (tier === 'platinum') {
        quality = {
          video: {
            maxResolution: '1080p',
            maxBitrate: 3000000, // 3Mbps
            maxFramerate: 30
          },
          audio: {
            maxBitrate: 192000 // 192kbps HD audio
          }
        };
      }
    }
    
    res.json(quality);
  } catch (error) {
    console.error('Error getting media quality:', error);
    res.status(500).json({ error: 'Failed to get media quality settings' });
  }
}

/**
 * Generate STUN/TURN server configuration
 */
async function getIceServers(req, res) {
  try {
    // Free STUN servers (no authentication required)
    const iceServers = [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:stun2.l.google.com:19302' },
      { urls: 'stun:stun3.l.google.com:19302' },
      { urls: 'stun:stun4.l.google.com:19302' }
    ];
    
    // Note: For production, consider adding TURN servers with authentication
    // Example with environment variables:
    // if (process.env.TURN_SERVER_URL && process.env.TURN_USERNAME && process.env.TURN_CREDENTIAL) {
    //   iceServers.push({
    //     urls: process.env.TURN_SERVER_URL,
    //     username: process.env.TURN_USERNAME,
    //     credential: process.env.TURN_CREDENTIAL
    //   });
    // }
    
    res.json({ iceServers });
  } catch (error) {
    console.error('Error getting ICE servers:', error);
    res.status(500).json({ error: 'Failed to get ICE servers' });
  }
}

module.exports = {
  getMediaQuality,
  getIceServers
};
