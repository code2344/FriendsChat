/**
 * Text Moderation and Swear Filtering System
 */

// Comprehensive swear word list (censored for code)
const SWEAR_WORDS = [
    // Tier 1: Mild (warnings)
    'damn', 'hell', 'crap', 'piss', 'ass', 'arse', 'dick', 'cock', 'prick',
    'bastard', 'bitch', 'shit', 'fuck', 'cunt', 'twat', 'bollocks', 'wanker',
    
    // Tier 2: Moderate (auto-filter)
    'motherfucker', 'asshole', 'arsehole', 'dickhead', 'shithead', 'fuckface',
    'bitchass', 'dumbass', 'jackass', 'dipshit', 'bullshit', 'horseshit',
    
    // Tier 3: Severe (auto-report + filter)
    'nigger', 'nigga', 'faggot', 'fag', 'tranny', 'retard', 'spastic', 'spaz',
    'chink', 'gook', 'wetback', 'beaner', 'kike', 'dyke', 'whore', 'slut',
    
    // Variations with numbers/special chars
    'f*ck', 'fck', 'fuk', 'sh!t', 'sh1t', 'b!tch', 'b1tch', '@ss', 'a$$',
    'd1ck', 'd!ck', 'c0ck', 'c*nt', 'cnt', 'fck', 'fcking', 'fking'
];

// Slurs and hate speech (always severe)
const HATE_SPEECH = [
    'nigger', 'nigga', 'faggot', 'fag', 'tranny', 'retard', 'chink', 'gook',
    'wetback', 'beaner', 'kike', 'spastic', 'spaz', 'coon', 'paki'
];

// Toxic phrases (context-aware)
const TOXIC_PHRASES = [
    'kill yourself', 'kys', 'die in a fire', 'neck yourself', 'end yourself',
    'should die', 'hope you die', 'go die', 'commit suicide', 'hang yourself'
];

// Spam indicators
const SPAM_INDICATORS = [
    'free money', 'click here', 'buy now', 'limited offer', 'act now',
    'check this out', 'dm me for', 'visit my profile', 'follow me',
    'http://', 'https://', '.com', '.net', '.org', 'bit.ly', 'tinyurl'
];

/**
 * Check if text contains profanity
 */
function containsProfanity(text) {
    if (!text) return { found: false };
    
    const lowerText = text.toLowerCase();
    const words = lowerText.split(/\W+/);
    
    for (const swear of SWEAR_WORDS) {
        // Check exact word match
        if (words.includes(swear)) {
            const severity = HATE_SPEECH.includes(swear) ? 'severe' : 
                            swear.length > 10 ? 'moderate' : 'mild';
            
            return {
                found: true,
                word: swear,
                severity,
                shouldReport: severity === 'severe'
            };
        }
        
        // Check if swear is part of the text (with word boundaries)
        const regex = new RegExp(`\\b${swear}\\b`, 'i');
        if (regex.test(lowerText)) {
            const severity = HATE_SPEECH.includes(swear) ? 'severe' : 
                            swear.length > 10 ? 'moderate' : 'mild';
            
            return {
                found: true,
                word: swear,
                severity,
                shouldReport: severity === 'severe'
            };
        }
    }
    
    return { found: false };
}

/**
 * Check for hate speech
 */
function containsHateSpeech(text) {
    if (!text) return false;
    
    const lowerText = text.toLowerCase();
    
    for (const slur of HATE_SPEECH) {
        const regex = new RegExp(`\\b${slur}\\b`, 'i');
        if (regex.test(lowerText)) {
            return {
                found: true,
                word: slur,
                severity: 'severe',
                shouldReport: true,
                shouldAutoMute: true
            };
        }
    }
    
    return { found: false };
}

/**
 * Check for toxic phrases
 */
function containsToxicPhrases(text) {
    if (!text) return false;
    
    const lowerText = text.toLowerCase();
    
    for (const phrase of TOXIC_PHRASES) {
        if (lowerText.includes(phrase)) {
            return {
                found: true,
                phrase,
                severity: 'severe',
                shouldReport: true
            };
        }
    }
    
    return { found: false };
}

/**
 * Check for spam
 */
function containsSpam(text) {
    if (!text) return false;
    
    const lowerText = text.toLowerCase();
    
    // Check for spam indicators
    let spamScore = 0;
    const foundIndicators = [];
    
    for (const indicator of SPAM_INDICATORS) {
        if (lowerText.includes(indicator)) {
            spamScore++;
            foundIndicators.push(indicator);
        }
    }
    
    // Check for excessive caps
    const capsCount = (text.match(/[A-Z]/g) || []).length;
    const totalLetters = (text.match(/[A-Za-z]/g) || []).length;
    if (totalLetters > 10 && capsCount / totalLetters > 0.7) {
        spamScore++;
        foundIndicators.push('excessive caps');
    }
    
    // Check for repeated characters
    if (/(.)\1{4,}/.test(text)) {
        spamScore++;
        foundIndicators.push('repeated characters');
    }
    
    return {
        found: spamScore >= 2,
        score: spamScore,
        indicators: foundIndicators,
        severity: spamScore >= 3 ? 'moderate' : 'mild'
    };
}

/**
 * Filter/censor profanity in text
 */
function filterProfanity(text) {
    if (!text) return text;
    
    let filtered = text;
    
    for (const swear of SWEAR_WORDS) {
        const regex = new RegExp(`\\b${swear}\\b`, 'gi');
        const replacement = swear[0] + '*'.repeat(swear.length - 1);
        filtered = filtered.replace(regex, replacement);
    }
    
    return filtered;
}

/**
 * Comprehensive text moderation check
 */
function moderateText(text, options = {}) {
    if (!text) {
        return {
            allowed: true,
            filtered: text,
            violations: []
        };
    }
    
    const violations = [];
    let filtered = text;
    
    // Check for hate speech (highest priority)
    const hateCheck = containsHateSpeech(text);
    if (hateCheck.found) {
        violations.push({
            type: 'hate_speech',
            severity: 'severe',
            word: hateCheck.word,
            shouldReport: true,
            shouldAutoMute: true
        });
        // Block message entirely
        return {
            allowed: false,
            filtered: '[Message blocked: Hate speech detected]',
            violations,
            autoMute: true
        };
    }
    
    // Check for toxic phrases
    const toxicCheck = containsToxicPhrases(text);
    if (toxicCheck.found) {
        violations.push({
            type: 'toxic_phrase',
            severity: 'severe',
            phrase: toxicCheck.phrase,
            shouldReport: true
        });
        // Block message entirely
        return {
            allowed: false,
            filtered: '[Message blocked: Harmful content detected]',
            violations
        };
    }
    
    // Check for profanity
    const profanityCheck = containsProfanity(text);
    if (profanityCheck.found) {
        violations.push({
            type: 'profanity',
            severity: profanityCheck.severity,
            word: profanityCheck.word,
            shouldReport: profanityCheck.shouldReport
        });
        
        // Filter profanity based on settings
        if (options.filterProfanity !== false) {
            filtered = filterProfanity(text);
        }
    }
    
    // Check for spam
    const spamCheck = containsSpam(text);
    if (spamCheck.found) {
        violations.push({
            type: 'spam',
            severity: spamCheck.severity,
            score: spamCheck.score,
            indicators: spamCheck.indicators,
            shouldReport: spamCheck.score >= 3
        });
        
        if (spamCheck.score >= 3) {
            // Block high spam score messages
            return {
                allowed: false,
                filtered: '[Message blocked: Spam detected]',
                violations
            };
        }
    }
    
    return {
        allowed: true,
        filtered,
        violations,
        original: text
    };
}

/**
 * Log moderation action
 */
async function logModerationAction(userId, messageId, violations) {
    const AuditLog = require('../models/AuditLog');
    
    try {
        await AuditLog.create({
            action: 'message_moderation',
            severity: violations.some(v => v.severity === 'severe') ? 'critical' : 'warning',
            performedBy: userId,
            details: `Message ${messageId} flagged for: ${violations.map(v => v.type).join(', ')}. Violations: ${JSON.stringify(violations)}`
        });
    } catch (error) {
        console.error('Error logging moderation action:', error);
    }
}

module.exports = {
    containsProfanity,
    containsHateSpeech,
    containsToxicPhrases,
    containsSpam,
    filterProfanity,
    moderateText,
    logModerationAction
};
