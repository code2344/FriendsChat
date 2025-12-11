/**
 * Ban Animation Module
 * Creates dramatic full-screen animation sequence when non-admins access authorization codes
 */

// Global variable for testing
window.testBanAnimation = testBanAnimation;

/**
 * Show the ban animation sequence
 * @param {string} username - The username of the banned user
 * @param {boolean} actualBan - Whether to actually ban the user (false for testing)
 */
async function showBanAnimation(username, actualBan = true) {
    // Create full-screen overlay
    const overlay = document.createElement('div');
    overlay.id = 'ban-animation-overlay';
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background: #000;
        z-index: 999999;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        color: #fff;
        font-family: 'Courier New', monospace;
        overflow: hidden;
    `;
    
    document.body.appendChild(overlay);
    
    // Disclaimer note in corner
    const disclaimer = document.createElement('div');
    disclaimer.style.cssText = `
        position: absolute;
        top: 20px;
        right: 20px;
        background: rgba(255, 255, 255, 0.1);
        padding: 10px 15px;
        border-radius: 5px;
        font-size: 12px;
        color: #888;
        max-width: 250px;
        text-align: center;
        animation: fadeOut 5s forwards;
    `;
    disclaimer.textContent = 'No, this is not an accident and your computer has not crashed.';
    overlay.appendChild(disclaimer);
    
    // Add CSS animations
    const style = document.createElement('style');
    style.textContent = `
        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }
        @keyframes fadeOut {
            from { opacity: 1; }
            to { opacity: 0; }
        }
        @keyframes shake {
            0%, 100% { transform: translateX(0); }
            10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
            20%, 40%, 60%, 80% { transform: translateX(5px); }
        }
        @keyframes pulse {
            0%, 100% { transform: scale(1); opacity: 1; }
            50% { transform: scale(1.05); opacity: 0.8; }
        }
        @keyframes glowRed {
            0%, 100% { text-shadow: 0 0 10px #ff0000; }
            50% { text-shadow: 0 0 20px #ff0000, 0 0 30px #ff0000; }
        }
        .fade-line {
            opacity: 0;
            animation: fadeIn 2s forwards;
            margin: 15px 0;
            font-size: 20px;
            line-height: 1.6;
        }
        .shake-text {
            animation: shake 0.5s;
        }
        .pulse-text {
            animation: pulse 2s infinite;
            color: #ff0000;
            font-weight: bold;
            font-size: 24px;
        }
        .glow-text {
            animation: glowRed 1.5s infinite;
            color: #ff0000;
            font-weight: bold;
        }
        .law-item {
            margin: 10px 0;
            padding: 10px;
            border-left: 3px solid #ff0000;
            opacity: 0;
            transform: translateX(-20px);
            animation: slideIn 1s forwards;
        }
        @keyframes slideIn {
            to {
                opacity: 1;
                transform: translateX(0);
            }
        }
        .username-highlight {
            color: #ff0000;
            font-weight: bold;
            text-decoration: line-through;
            animation: glowRed 1s infinite;
        }
    `;
    document.head.appendChild(style);
    
    // Content container
    const content = document.createElement('div');
    content.style.cssText = `
        max-width: 800px;
        padding: 40px;
        text-align: center;
    `;
    overlay.appendChild(content);
    
    // Helper function to add text with delay
    async function addLine(text, className = 'fade-line', delay = 2000) {
        return new Promise(resolve => {
            const line = document.createElement('div');
            line.className = className;
            line.textContent = text;
            content.appendChild(line);
            setTimeout(resolve, delay);
        });
    }
    
    // Helper function to clear content
    function clearContent() {
        content.innerHTML = '';
    }
    
    // Wait for disclaimer to fade
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Section 1: The Introduction
    await addLine("So, maybe your curiosity got the better of you.", 'fade-line', 2500);
    await addLine("Maybe you thought it was harmless, or maybe you just couldn't resist.", 'fade-line', 2500);
    await addLine("Perhaps you stole this document out of someone's locker, bag, or desk.", 'fade-line', 2500);
    await addLine("Or maybe you found it on the ground and decided to take a little peek inside.", 'fade-line', 2500);
    await addLine("Bad move.", 'fade-line glow-text', 3000);
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    clearContent();
    
    // Section 2: The Severity
    content.style.animation = 'shake 0.5s';
    await new Promise(resolve => setTimeout(resolve, 500));
    
    await addLine("What you just did isn't funny.", 'fade-line', 2000);
    await addLine("It isn't daring. It isn't just a cheeky 'oops.'", 'fade-line', 2000);
    await addLine("What you just did is serious.", 'fade-line glow-text', 3000);
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    clearContent();
    
    // Section 3: Breaking the Seal
    await addLine("By breaking the seal on this document...", 'fade-line', 2000);
    await addLine("Clearly marked Confidential and For Internal Use Only...", 'fade-line', 2000);
    await addLine("You've crossed a line.", 'fade-line glow-text', 3000);
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    clearContent();
    
    // Section 4: The Laws
    await addLine("In Tasmania, this act alone could fall under:", 'fade-line', 2000);
    
    const lawsContainer = document.createElement('div');
    lawsContainer.style.cssText = 'margin: 30px 0; text-align: left;';
    content.appendChild(lawsContainer);
    
    const laws = [
        'State Privacy Laws',
        'Breach of Duty of Confidence',
        'Personal Information Protection Act 2004 (Tas)'
    ];
    
    for (let i = 0; i < laws.length; i++) {
        await new Promise(resolve => setTimeout(resolve, 1500));
        const lawItem = document.createElement('div');
        lawItem.className = 'law-item';
        lawItem.style.animationDelay = `${i * 0.3}s`;
        lawItem.textContent = laws[i];
        lawsContainer.appendChild(lawItem);
    }
    
    await new Promise(resolve => setTimeout(resolve, 3000));
    clearContent();
    
    // Section 5: Personalization
    const personalLine = document.createElement('div');
    personalLine.className = 'fade-line';
    personalLine.style.fontSize = '24px';
    personalLine.innerHTML = `You, <span class="username-highlight">${username}</span>, were not authorised to open this document.`;
    content.appendChild(personalLine);
    
    await new Promise(resolve => setTimeout(resolve, 4000));
    clearContent();
    
    // Section 6: Final Threat
    await addLine("You will face the consequences.", 'fade-line pulse-text', 2000);
    await addLine("This breach has been logged.", 'fade-line', 2000);
    await addLine("It will be reported for further review.", 'fade-line', 2000);
    await addLine("It's only a matter of time before you are held fully accountable for your actions.", 'fade-line pulse-text', 4000);
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    clearContent();
    
    // Section 7: Lockout
    const lockout = document.createElement('div');
    lockout.style.cssText = `
        font-size: 48px;
        font-weight: bold;
        animation: fadeIn 2s, pulse 1s infinite;
        color: #ff0000;
    `;
    lockout.textContent = 'ACCESS DENIED';
    content.appendChild(lockout);
    
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    if (actualBan) {
        // Redirect to ban appeal page
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/banned';
    } else {
        // For testing, just remove the overlay
        overlay.remove();
        style.remove();
    }
}

/**
 * Test function for the ban animation (doesn't actually ban)
 * Can be called from browser console: testBanAnimation()
 */
function testBanAnimation() {
    const user = JSON.parse(localStorage.getItem('user') || '{"username": "TestUser"}');
    showBanAnimation(user.username, false);
}

// Export functions
window.showBanAnimation = showBanAnimation;
