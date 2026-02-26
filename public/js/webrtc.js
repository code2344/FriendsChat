/**
 * WebRTC Manager for Voice and Video Calls
 */
class WebRTCManager {
    constructor(socket) {
        this.socket = socket;
        this.peerConnections = new Map();
        this.localStream = null;
        this.iceServers = null;
        this.mediaQuality = null;
        this.currentChannelId = null;
        this.isVideoEnabled = false;
        
        this.setupSocketListeners();
    }
    
    /**
     * Initialize WebRTC configuration
     */
    async initialize() {
        try {
            // Get ICE servers
            const iceResponse = await fetch('/api/webrtc/ice-servers', {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            const iceData = await iceResponse.json();
            this.iceServers = iceData.iceServers;
            
            // Get media quality settings
            const qualityResponse = await fetch('/api/webrtc/quality', {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            this.mediaQuality = await qualityResponse.json();
            
            console.log('WebRTC initialized with quality:', this.mediaQuality);
        } catch (error) {
            console.error('Error initializing WebRTC:', error);
        }
    }
    
    /**
     * Join a voice/video channel
     */
    async joinVoiceChannel(channelId, enableVideo = false) {
        try {
            this.currentChannelId = channelId;
            this.isVideoEnabled = enableVideo;
            
            // Get user media with quality constraints
            const constraints = this.getMediaConstraints(enableVideo);
            this.localStream = await navigator.mediaDevices.getUserMedia(constraints);
            
            // Join the voice channel via socket
            const user = JSON.parse(localStorage.getItem('user'));
            this.socket.emit('join-voice-channel', {
                channelId,
                userId: user.id
            });
            
            // Display local stream
            this.displayLocalStream();
            
            return true;
        } catch (error) {
            console.error('Error joining voice channel:', error);
            alert('Failed to access microphone/camera. Please check permissions.');
            return false;
        }
    }
    
    /**
     * Leave voice/video channel
     */
    leaveVoiceChannel() {
        if (this.localStream) {
            this.localStream.getTracks().forEach(track => track.stop());
            this.localStream = null;
        }
        
        // Close all peer connections
        this.peerConnections.forEach(pc => pc.close());
        this.peerConnections.clear();
        
        if (this.currentChannelId) {
            const user = JSON.parse(localStorage.getItem('user'));
            this.socket.emit('leave-voice-channel', {
                channelId: this.currentChannelId,
                userId: user.id
            });
            this.currentChannelId = null;
        }
        
        // Clear video elements
        this.clearVideoElements();
    }
    
    /**
     * Toggle video on/off
     */
    async toggleVideo() {
        if (!this.localStream) return;
        
        const videoTrack = this.localStream.getVideoTracks()[0];
        if (videoTrack) {
            videoTrack.enabled = !videoTrack.enabled;
            this.isVideoEnabled = videoTrack.enabled;
        } else if (!this.isVideoEnabled) {
            // Add video track
            try {
                const videoConstraints = this.getVideoConstraints();
                const videoStream = await navigator.mediaDevices.getUserMedia({
                    video: videoConstraints
                });
                const videoTrack = videoStream.getVideoTracks()[0];
                this.localStream.addTrack(videoTrack);
                this.isVideoEnabled = true;
                
                // Add track to all peer connections
                this.peerConnections.forEach(pc => {
                    pc.addTrack(videoTrack, this.localStream);
                });
                
                this.displayLocalStream();
            } catch (error) {
                console.error('Error enabling video:', error);
                alert('Failed to enable video');
            }
        }
        
        return this.isVideoEnabled;
    }
    
    /**
     * Toggle audio mute
     */
    toggleMute() {
        if (!this.localStream) return false;
        
        const audioTrack = this.localStream.getAudioTracks()[0];
        if (audioTrack) {
            audioTrack.enabled = !audioTrack.enabled;
            return !audioTrack.enabled; // Return true if muted
        }
        return false;
    }
    
    /**
     * Get media constraints based on quality settings
     */
    getMediaConstraints(includeVideo) {
        const constraints = {
            audio: {
                echoCancellation: true,
                noiseSuppression: true,
                autoGainControl: true
            }
        };
        
        if (includeVideo) {
            constraints.video = this.getVideoConstraints();
        }
        
        return constraints;
    }
    
    /**
     * Get video constraints based on donor tier
     */
    getVideoConstraints() {
        if (!this.mediaQuality) {
            return { width: 640, height: 480, frameRate: 15 };
        }
        
        const resolution = this.mediaQuality.video.maxResolution;
        const frameRate = this.mediaQuality.video.maxFramerate;
        
        const resolutions = {
            '480p': { width: 640, height: 480 },
            '720p': { width: 1280, height: 720 },
            '1080p': { width: 1920, height: 1080 }
        };
        
        return {
            ...resolutions[resolution] || resolutions['480p'],
            frameRate: { ideal: frameRate, max: frameRate }
        };
    }
    
    /**
     * Setup socket event listeners
     */
    setupSocketListeners() {
        this.socket.on('user-joined-voice', async (data) => {
            console.log('User joined voice:', data);
            await this.createPeerConnection(data.socketId, true);
        });
        
        this.socket.on('user-left-voice', (data) => {
            console.log('User left voice:', data);
            this.closePeerConnection(data.socketId);
        });
        
        this.socket.on('webrtc-offer', async (data) => {
            await this.handleOffer(data);
        });
        
        this.socket.on('webrtc-answer', async (data) => {
            await this.handleAnswer(data);
        });
        
        this.socket.on('webrtc-ice-candidate', async (data) => {
            await this.handleIceCandidate(data);
        });
    }
    
    /**
     * Create peer connection
     */
    async createPeerConnection(socketId, createOffer) {
        const pc = new RTCPeerConnection({ iceServers: this.iceServers });
        
        // Add local stream tracks
        if (this.localStream) {
            this.localStream.getTracks().forEach(track => {
                pc.addTrack(track, this.localStream);
            });
        }
        
        // Handle remote stream
        pc.ontrack = (event) => {
            this.handleRemoteStream(socketId, event.streams[0]);
        };
        
        // Handle ICE candidates
        pc.onicecandidate = (event) => {
            if (event.candidate) {
                this.socket.emit('webrtc-ice-candidate', {
                    to: socketId,
                    candidate: event.candidate
                });
            }
        };
        
        this.peerConnections.set(socketId, pc);
        
        if (createOffer) {
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            
            this.socket.emit('webrtc-offer', {
                to: socketId,
                offer: offer,
                channelId: this.currentChannelId
            });
        }
        
        return pc;
    }
    
    /**
     * Handle incoming offer
     */
    async handleOffer(data) {
        const pc = await this.createPeerConnection(data.from, false);
        await pc.setRemoteDescription(new RTCSessionDescription(data.offer));
        
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        
        this.socket.emit('webrtc-answer', {
            to: data.from,
            answer: answer
        });
    }
    
    /**
     * Handle incoming answer
     */
    async handleAnswer(data) {
        const pc = this.peerConnections.get(data.from);
        if (pc) {
            await pc.setRemoteDescription(new RTCSessionDescription(data.answer));
        }
    }
    
    /**
     * Handle ICE candidate
     */
    async handleIceCandidate(data) {
        const pc = this.peerConnections.get(data.from);
        if (pc) {
            await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
        }
    }
    
    /**
     * Close peer connection
     */
    closePeerConnection(socketId) {
        const pc = this.peerConnections.get(socketId);
        if (pc) {
            pc.close();
            this.peerConnections.delete(socketId);
        }
        this.removeRemoteVideo(socketId);
    }
    
    /**
     * Display local stream
     */
    displayLocalStream() {
        const localVideo = document.getElementById('localVideo');
        if (localVideo && this.localStream) {
            localVideo.srcObject = this.localStream;
            localVideo.muted = true; // Mute local audio to prevent feedback
        }
    }
    
    /**
     * Handle remote stream
     */
    handleRemoteStream(socketId, stream) {
        // Create or update remote video element
        let remoteVideo = document.getElementById(`remoteVideo-${socketId}`);
        if (!remoteVideo) {
            const container = document.getElementById('remoteVideosContainer');
            if (container) {
                remoteVideo = document.createElement('video');
                remoteVideo.id = `remoteVideo-${socketId}`;
                remoteVideo.className = 'remote-video';
                remoteVideo.autoplay = true;
                remoteVideo.playsinline = true;
                container.appendChild(remoteVideo);
            }
        }
        if (remoteVideo) {
            remoteVideo.srcObject = stream;
        }
    }
    
    /**
     * Remove remote video element
     */
    removeRemoteVideo(socketId) {
        const remoteVideo = document.getElementById(`remoteVideo-${socketId}`);
        if (remoteVideo) {
            remoteVideo.remove();
        }
    }
    
    /**
     * Clear all video elements
     */
    clearVideoElements() {
        const localVideo = document.getElementById('localVideo');
        if (localVideo) {
            localVideo.srcObject = null;
        }
        
        const container = document.getElementById('remoteVideosContainer');
        if (container) {
            container.innerHTML = '';
        }
    }
    
    /**
     * Join a channel (alias for voiceUI.js compatibility)
     */
    async joinChannel(channelId, localStream) {
        this.currentChannelId = channelId;
        this.localStream = localStream;
        
        // Socket emit is handled by voiceUI
        return true;
    }
    
    /**
     * Leave channel (alias for voiceUI.js compatibility)
     */
    async leaveChannel() {
        this.leaveVoiceChannel();
    }
    
    /**
     * Get quality settings (for voiceUI.js)
     */
    async getQualitySettings() {
        if (!this.mediaQuality) {
            await this.initialize();
        }
        return this.mediaQuality;
    }
    
    /**
     * Add track to all peer connections
     */
    async addTrackToAllPeers(track) {
        if (!this.localStream) return;
        
        this.peerConnections.forEach(pc => {
            pc.addTrack(track, this.localStream);
        });
    }
}

// Export for use in chat.js
window.WebRTCManager = WebRTCManager;
