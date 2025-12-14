/**
 * NSFW Detection and Content Safety System
 * Basic implementation with hooks for AI service integration
 */

// Known NSFW file hashes (example - would be populated with actual hashes)
const KNOWN_NSFW_HASHES = new Set([
    // SHA-256 hashes of known NSFW content
    // This would be populated from a database of known NSFW content hashes
]);

// Suspicious filename patterns
const NSFW_FILENAME_PATTERNS = [
    /\b(porn|xxx|sex|nude|naked|nsfw|18\+|adult|explicit)\b/i,
    /\b(hentai|ecchi|loli|shota)\b/i,
    /\b(onlyfans|fansly|patreon)\b/i
];

// File extensions that require extra scrutiny
const SCRUTINY_EXTENSIONS = [
    '.jpg', '.jpeg', '.png', '.gif', '.webp', '.mp4', '.mov', '.avi', '.webm'
];

/**
 * Calculate file hash (SHA-256)
 */
async function calculateFileHash(buffer) {
    const crypto = require('crypto');
    const hash = crypto.createHash('sha256');
    hash.update(buffer);
    return hash.digest('hex');
}

/**
 * Check filename for NSFW indicators
 */
function checkFilename(filename) {
    if (!filename) return { suspicious: false };
    
    const lowerFilename = filename.toLowerCase();
    
    for (const pattern of NSFW_FILENAME_PATTERNS) {
        if (pattern.test(lowerFilename)) {
            return {
                suspicious: true,
                reason: 'filename_pattern',
                pattern: pattern.source
            };
        }
    }
    
    return { suspicious: false };
}

/**
 * Check file extension
 */
function requiresScrutiny(filename) {
    if (!filename) return false;
    
    const extension = filename.substring(filename.lastIndexOf('.')).toLowerCase();
    return SCRUTINY_EXTENSIONS.includes(extension);
}

/**
 * Check if file hash matches known NSFW content
 */
async function checkKnownContent(buffer) {
    const hash = await calculateFileHash(buffer);
    
    if (KNOWN_NSFW_HASHES.has(hash)) {
        return {
            flagged: true,
            reason: 'known_nsfw_hash',
            hash
        };
    }
    
    return { flagged: false, hash };
}

/**
 * Basic image analysis (pixel-based heuristics)
 * This is a placeholder for more sophisticated AI-based detection
 */
function analyzeImageBasic(buffer, mimetype) {
    // This is a very basic check
    // In production, this would call an AI service like:
    // - AWS Rekognition
    // - Google Cloud Vision API
    // - Azure Content Moderator
    // - Open-source models like NudeNet
    
    // For now, we'll just check file size and return a placeholder
    const sizeMB = buffer.length / (1024 * 1024);
    
    // Files over 50MB or under 1KB are suspicious
    if (sizeMB > 50 || sizeMB < 0.001) {
        return {
            flagged: true,
            reason: 'suspicious_file_size',
            confidence: 0.3
        };
    }
    
    return {
        flagged: false,
        confidence: 0,
        note: 'basic_check_only'
    };
}

/**
 * Analyze video content (basic checks)
 */
function analyzeVideoBasic(buffer, mimetype) {
    // Basic video checks
    // In production, would use video analysis API
    
    const sizeMB = buffer.length / (1024 * 1024);
    
    // Very large videos are flagged for manual review
    if (sizeMB > 500) {
        return {
            flagged: true,
            reason: 'large_video_file',
            requiresReview: true
        };
    }
    
    return {
        flagged: false,
        requiresReview: sizeMB > 100 // Videos over 100MB need review
    };
}

/**
 * Comprehensive NSFW detection
 */
async function detectNSFW(file, options = {}) {
    const { filename, mimetype, buffer } = file;
    
    const result = {
        safe: true,
        flagged: false,
        requiresReview: false,
        reasons: [],
        confidence: 0
    };
    
    // Check 1: Filename patterns
    const filenameCheck = checkFilename(filename);
    if (filenameCheck.suspicious) {
        result.reasons.push(filenameCheck.reason);
        result.flagged = true;
        result.confidence += 0.3;
    }
    
    // Check 2: Known NSFW content hash
    const hashCheck = await checkKnownContent(buffer);
    if (hashCheck.flagged) {
        result.safe = false;
        result.flagged = true;
        result.reasons.push(hashCheck.reason);
        result.confidence = 1.0; // 100% confidence on known hash
        result.shouldBlock = true;
        return result;
    }
    
    // Check 3: Requires manual scrutiny?
    if (requiresScrutiny(filename)) {
        result.requiresReview = true;
    }
    
    // Check 4: Content analysis (basic)
    if (mimetype && mimetype.startsWith('image/')) {
        const imageAnalysis = analyzeImageBasic(buffer, mimetype);
        if (imageAnalysis.flagged) {
            result.flagged = true;
            result.reasons.push(imageAnalysis.reason);
            result.confidence = Math.max(result.confidence, imageAnalysis.confidence);
        }
        // All images require review for now (until AI integration)
        result.requiresReview = true;
    }
    
    if (mimetype && mimetype.startsWith('video/')) {
        const videoAnalysis = analyzeVideoBasic(buffer, mimetype);
        if (videoAnalysis.flagged) {
            result.flagged = true;
            result.reasons.push(videoAnalysis.reason);
        }
        if (videoAnalysis.requiresReview) {
            result.requiresReview = true;
        }
    }
    
    // Determine if safe
    result.safe = !result.flagged || result.confidence < 0.5;
    
    return result;
}

/**
 * Log content safety check
 */
async function logContentSafetyCheck(userId, fileId, result) {
    const AuditLog = require('../models/AuditLog');
    
    try {
        await AuditLog.create({
            action: 'content_safety_check',
            severity: result.flagged ? 'warning' : 'info',
            performedBy: userId,
            details: `File ${fileId} safety check: ${JSON.stringify(result)}`
        });
    } catch (error) {
        console.error('Error logging content safety check:', error);
    }
}

/**
 * Blur/mark content for review
 */
function markForReview(fileUrl) {
    // In the database, we'd mark this file as requiring review
    // The frontend would display it blurred with a 🔞 icon
    return {
        url: fileUrl,
        blurred: true,
        requiresReview: true,
        icon: '🔞',
        message: 'This content is pending master admin review'
    };
}

/**
 * Integration hook for AI services
 * This can be replaced with actual API calls
 */
async function analyzeWithAI(buffer, mimetype) {
    // Placeholder for AI service integration
    // Example integrations:
    
    /*
    // AWS Rekognition
    const AWS = require('aws-sdk');
    const rekognition = new AWS.Rekognition();
    const result = await rekognition.detectModerationLabels({
        Image: { Bytes: buffer }
    }).promise();
    
    // Google Cloud Vision
    const vision = require('@google-cloud/vision');
    const client = new vision.ImageAnnotatorClient();
    const [result] = await client.safeSearchDetection(buffer);
    
    // Azure Content Moderator
    const { ContentModeratorClient } = require('@azure/cognitiveservices-contentmoderator');
    const result = await client.imageModeration.evaluateFileInput(buffer);
    */
    
    return {
        analyzed: false,
        reason: 'ai_integration_pending'
    };
}

module.exports = {
    detectNSFW,
    checkFilename,
    checkKnownContent,
    logContentSafetyCheck,
    markForReview,
    analyzeWithAI,
    calculateFileHash
};
