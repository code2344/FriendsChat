/**
 * Voice/Video Chat UI Controller
 * Manages voice channel controls, video grid, and participant display
 */

class VoiceUIManager {
    constructor(webrtcManager) {
        this.webrtcManager = webrtcManager;
        this.currentVoiceChannel = null;
        this.participants = new Map();
        this.localStream = null;
        this.isInVoice = false;
        
        this.initializeUI();
        this.setupEventListeners();
    }

    initializeUI() {
        // Create voice control panel
        const controlPanel = document.createElement('div');
        controlPanel.id = 'voiceControlPanel';
        controlPanel.className = 'voice-control-panel hidden';
        controlPanel.innerHTML = `
            <div class="voice-panel-header">
                <span id="voiceChannelName">Voice Channel</span>
                <button class="btn-minimize" onclick="voiceUI.minimizePanel()">−</button>
            </div>
            <div class="voice-panel-body">
                <div class="video-grid" id="videoGrid"></div>
                <div class="voice-controls">
                    <button class="voice-btn" id="muteBtn" onclick="voiceUI.toggleMute()">
                        <span class="icon">🎤</span>
                        <span class="label">Mute</span>
                    </button>
                    <button class="voice-btn" id="videoBtn" onclick="voiceUI.toggleVideo()">
                        <span class="icon">📹</span>
                        <span class="label">Video</span>
                    </button>
                    <button class="voice-btn" id="shareScreenBtn" onclick="voiceUI.toggleScreenShare()">
                        <span class="icon">🖥️</span>
                        <span class="label">Share</span>
                    </button>
                    <button class="voice-btn btn-danger" id="leaveBtn" onclick="voiceUI.leaveVoice()">
                        <span class="icon">📞</span>
                        <span class="label">Leave</span>
                    </button>
                </div>
                <div class="participants-list">
                    <h4>Participants (<span id="participantCount">0</span>)</h4>
                    <div id="participantsList"></div>
                </div>
            </div>
        `;
        document.body.appendChild(controlPanel);
    }

    setupEventListeners() {
        // Socket.io events for voice channel
        socket.on('user-joined-voice', (data) => {
            this.onUserJoinedVoice(data);
        });

        socket.on('user-left-voice', (data) => {
            this.onUserLeftVoice(data);
        });

        socket.on('user-muted', (data) => {
            this.onUserMuted(data);
        });

        socket.on('user-unmuted', (data) => {
            this.onUserUnmuted(data);
        });

        socket.on('video-enabled', (data) => {
            this.onVideoEnabled(data);
        });

        socket.on('video-disabled', (data) => {
            this.onVideoDisabled(data);
        });
    }

    async joinVoiceChannel(channelId, channelName) {
        if (this.isInVoice) {
            await this.leaveVoice();
        }

        try {
            this.currentVoiceChannel = channelId;
            this.isInVoice = true;

            // Get media quality based on donor tier
            const qualitySettings = await this.webrtcManager.getQualitySettings();

            // Get user media
            this.localStream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true,
                    sampleRate: qualitySettings.audio.sampleRate
                },
                video: false // Start with audio only
            });

            // Join voice channel via socket
            socket.emit('join-voice-channel', {
                channelId,
                userId: user.id,
                username: user.username
            });

            // Show control panel
            document.getElementById('voiceChannelName').textContent = channelName;
            document.getElementById('voiceControlPanel').classList.remove('hidden');

            // Add local video tile (audio only initially)
            this.addVideoTile(user.id, user.username, this.localStream, true);

            // Initialize WebRTC connections
            await this.webrtcManager.joinChannel(channelId, this.localStream);

        } catch (error) {
            console.error('Error joining voice channel:', error);
            alert('Failed to join voice channel. Please check your microphone permissions.');
            this.isInVoice = false;
        }
    }

    async leaveVoice() {
        if (!this.isInVoice) return;

        // Stop all media tracks
        if (this.localStream) {
            this.localStream.getTracks().forEach(track => track.stop());
            this.localStream = null;
        }

        // Leave channel via socket
        socket.emit('leave-voice-channel', {
            channelId: this.currentVoiceChannel,
            userId: user.id
        });

        // Close all WebRTC connections
        await this.webrtcManager.leaveChannel();

        // Hide control panel
        document.getElementById('voiceControlPanel').classList.add('hidden');

        // Clear participants
        this.participants.clear();
        document.getElementById('videoGrid').innerHTML = '';
        document.getElementById('participantsList').innerHTML = '';

        this.currentVoiceChannel = null;
        this.isInVoice = false;
    }

    async toggleMute() {
        if (!this.localStream) return;

        const audioTrack = this.localStream.getAudioTracks()[0];
        if (audioTrack) {
            audioTrack.enabled = !audioTrack.enabled;
            const muteBtn = document.getElementById('muteBtn');
            
            if (audioTrack.enabled) {
                muteBtn.classList.remove('active');
                muteBtn.querySelector('.label').textContent = 'Mute';
                muteBtn.querySelector('.icon').textContent = '🎤';
                socket.emit('user-unmuted', { channelId: this.currentVoiceChannel, userId: user.id });
            } else {
                muteBtn.classList.add('active');
                muteBtn.querySelector('.label').textContent = 'Unmute';
                muteBtn.querySelector('.icon').textContent = '🔇';
                socket.emit('user-muted', { channelId: this.currentVoiceChannel, userId: user.id });
            }
        }
    }

    async toggleVideo() {
        if (!this.localStream) return;

        const videoTrack = this.localStream.getVideoTracks()[0];
        
        if (videoTrack) {
            // Turn off video
            videoTrack.stop();
            this.localStream.removeTrack(videoTrack);
            this.updateVideoButton(false);
            socket.emit('video-disabled', { channelId: this.currentVoiceChannel, userId: user.id });
        } else {
            // Turn on video
            try {
                const qualitySettings = await this.webrtcManager.getQualitySettings();
                const videoStream = await navigator.mediaDevices.getUserMedia({
                    video: {
                        width: { ideal: qualitySettings.video.width },
                        height: { ideal: qualitySettings.video.height },
                        frameRate: { ideal: qualitySettings.video.frameRate }
                    }
                });

                const newVideoTrack = videoStream.getVideoTracks()[0];
                this.localStream.addTrack(newVideoTrack);
                
                // Update local video tile
                const localVideo = document.querySelector(`#video-${user.id} video`);
                if (localVideo) {
                    localVideo.srcObject = this.localStream;
                }

                this.updateVideoButton(true);
                socket.emit('video-enabled', { channelId: this.currentVoiceChannel, userId: user.id });

                // Update all peer connections with new video track
                await this.webrtcManager.addTrackToAllPeers(newVideoTrack);

            } catch (error) {
                console.error('Error enabling video:', error);
                alert('Failed to enable video. Please check your camera permissions.');
            }
        }
    }

    async toggleScreenShare() {
        // Placeholder for screen sharing functionality
        alert('Screen sharing will be implemented in a future update');
    }

    updateVideoButton(enabled) {
        const videoBtn = document.getElementById('videoBtn');
        if (enabled) {
            videoBtn.classList.add('active');
            videoBtn.querySelector('.label').textContent = 'Stop Video';
            videoBtn.querySelector('.icon').textContent = '📹';
        } else {
            videoBtn.classList.remove('active');
            videoBtn.querySelector('.label').textContent = 'Video';
            videoBtn.querySelector('.icon').textContent = '📷';
        }
    }

    minimizePanel() {
        const panel = document.getElementById('voiceControlPanel');
        panel.classList.toggle('minimized');
    }

    addVideoTile(userId, username, stream, isLocal = false) {
        const videoGrid = document.getElementById('videoGrid');
        
        // Check if tile already exists
        if (document.getElementById(`video-${userId}`)) {
            return;
        }

        const tile = document.createElement('div');
        tile.className = 'video-tile';
        tile.id = `video-${userId}`;
        
        const hasVideo = stream && stream.getVideoTracks().length > 0 && stream.getVideoTracks()[0].enabled;
        
        tile.innerHTML = `
            <video autoplay playsinline ${isLocal ? 'muted' : ''}></video>
            <div class="video-overlay ${hasVideo ? '' : 'audio-only'}">
                <span class="username">${username}${isLocal ? ' (You)' : ''}</span>
                <span class="audio-indicator">🔇</span>
            </div>
        `;

        const video = tile.querySelector('video');
        if (stream) {
            video.srcObject = stream;
        }

        videoGrid.appendChild(tile);
        this.updateGridLayout();

        // Add to participants list
        this.addParticipant(userId, username);
    }

    removeVideoTile(userId) {
        const tile = document.getElementById(`video-${userId}`);
        if (tile) {
            tile.remove();
            this.updateGridLayout();
        }

        this.removeParticipant(userId);
    }

    updateGridLayout() {
        const grid = document.getElementById('videoGrid');
        const tileCount = grid.children.length;

        // Determine grid layout based on participant count
        if (tileCount <= 1) {
            grid.className = 'video-grid grid-1';
        } else if (tileCount <= 4) {
            grid.className = 'video-grid grid-2x2';
        } else if (tileCount <= 9) {
            grid.className = 'video-grid grid-3x3';
        } else {
            grid.className = 'video-grid grid-4x4';
        }
    }

    addParticipant(userId, username) {
        this.participants.set(userId, { username, muted: false });
        this.updateParticipantsList();
    }

    removeParticipant(userId) {
        this.participants.delete(userId);
        this.updateParticipantsList();
    }

    updateParticipantsList() {
        const list = document.getElementById('participantsList');
        const count = document.getElementById('participantCount');
        
        count.textContent = this.participants.size;

        list.innerHTML = Array.from(this.participants.entries()).map(([userId, data]) => `
            <div class="participant-item">
                <span>${data.username}</span>
                <span class="participant-status">${data.muted ? '🔇' : '🎤'}</span>
            </div>
        `).join('');
    }

    onUserJoinedVoice(data) {
        console.log('User joined voice:', data);
        // Will be handled when WebRTC connection is established
    }

    onUserLeftVoice(data) {
        console.log('User left voice:', data);
        this.removeVideoTile(data.userId);
    }

    onUserMuted(data) {
        const participant = this.participants.get(data.userId);
        if (participant) {
            participant.muted = true;
            this.updateParticipantsList();
        }
    }

    onUserUnmuted(data) {
        const participant = this.participants.get(data.userId);
        if (participant) {
            participant.muted = false;
            this.updateParticipantsList();
        }
    }

    onVideoEnabled(data) {
        const tile = document.getElementById(`video-${data.userId}`);
        if (tile) {
            tile.querySelector('.video-overlay').classList.remove('audio-only');
        }
    }

    onVideoDisabled(data) {
        const tile = document.getElementById(`video-${data.userId}`);
        if (tile) {
            tile.querySelector('.video-overlay').classList.add('audio-only');
        }
    }

    // Add "Join Voice" button to voice channels
    addJoinButtonToChannel(channelElement, channelId, channelName) {
        if (channelElement.querySelector('.join-voice-btn')) {
            return; // Already has button
        }

        const button = document.createElement('button');
        button.className = 'join-voice-btn';
        button.innerHTML = '🔊 Join';
        button.onclick = (e) => {
            e.stopPropagation();
            this.joinVoiceChannel(channelId, channelName);
        };

        channelElement.appendChild(button);
    }
}

// Initialize voice UI (will be called from chat.js after webrtc manager is ready)
let voiceUI;

function initializeVoiceUI(webrtcManager) {
    voiceUI = new VoiceUIManager(webrtcManager);
    window.voiceUI = voiceUI; // Make available globally
}
