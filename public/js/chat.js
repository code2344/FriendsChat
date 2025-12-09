// Authentication check
const token = localStorage.getItem('token');
const user = JSON.parse(localStorage.getItem('user') || '{}');

if (!token || !user.id) {
    window.location.href = '/login';
}

// Initialize Socket.IO
const socket = io();

// Global state
let currentServer = null;
let currentChannel = null;
let currentDmUser = null;
let currentView = 'home'; // 'home' or 'server'
let servers = [];
let dmConversations = [];

// Initialize UI
function initializeUI() {
    // Set user info
    const initials = (user.firstName?.[0] || '') + (user.lastName?.[0] || '');
    document.getElementById('userAvatar').textContent = initials;
    document.getElementById('userName').textContent = user.username;
    
    const roleText = user.role === 'master_admin' ? 'Master Admin' : 
                     user.role === 'admin' ? 'Admin' : 'Online';
    document.getElementById('userStatus').textContent = roleText;

    // Show admin panel button for admins
    if (user.role === 'admin' || user.role === 'master_admin') {
        document.getElementById('adminPanelBtn').style.display = 'flex';
    }

    // Load servers
    loadServers();
    
    // Load DM conversations
    loadDmConversations();
}

// Event Listeners
document.getElementById('homeServerIcon').addEventListener('click', () => switchToHome());
document.getElementById('addServerIcon').addEventListener('click', () => openModal('createServerModal'));
document.getElementById('newDmBtn').addEventListener('click', () => openModal('newDmModal'));
document.getElementById('logoutBtn').addEventListener('click', logout);
document.getElementById('adminPanelBtn')?.addEventListener('click', () => window.location.href = '/admin');
document.getElementById('inviteBtn').addEventListener('click', () => createServerInvite());
document.getElementById('serverHeader').addEventListener('click', toggleServerMenu);

// Modal functions
function openModal(modalId) {
    document.getElementById(modalId).style.display = 'flex';
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

// Make closeModal global for HTML onclick
window.closeModal = closeModal;

// Logout
function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
}

// Load servers
async function loadServers() {
    try {
        const response = await fetch('/api/servers', {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
            servers = await response.json();
            displayServerIcons();
        }
    } catch (error) {
        console.error('Error loading servers:', error);
    }
}

// Display server icons
function displayServerIcons() {
    const serverIconsList = document.getElementById('serverIconsList');
    serverIconsList.innerHTML = '';

    servers.forEach(server => {
        const icon = document.createElement('div');
        icon.className = 'server-icon';
        icon.title = server.name;
        icon.textContent = server.name.substring(0, 2).toUpperCase();
        icon.onclick = () => switchToServer(server._id);
        serverIconsList.appendChild(icon);
    });
}

// Switch to home view
function switchToHome() {
    currentView = 'home';
    currentServer = null;
    currentChannel = null;
    currentDmUser = null;

    document.querySelectorAll('.server-icon').forEach(icon => icon.classList.remove('active'));
    document.getElementById('homeServerIcon').classList.add('active');
    document.getElementById('currentServerName').textContent = 'Home';
    document.getElementById('homeView').style.display = 'block';
    document.getElementById('serverChannelsView').style.display = 'none';
    document.getElementById('inviteBtn').style.display = 'none';

    updateChatHeader('Welcome', 'Select a channel or DM');
    clearMessages();
}

// Switch to server view
async function switchToServer(serverId) {
    currentView = 'server';
    currentServer = serverId;
    currentChannel = null;
    currentDmUser = null;

    document.querySelectorAll('.server-icon').forEach(icon => icon.classList.remove('active'));
    
    const server = servers.find(s => s._id === serverId);
    if (!server) return;

    document.getElementById('currentServerName').textContent = server.name;
    document.getElementById('homeView').style.display = 'none';
    document.getElementById('serverChannelsView').style.display = 'block';
    document.getElementById('inviteBtn').style.display = 'block';

    // Show server settings if owner/co-owner
    const isOwner = server.owner._id === user.id || server.owner === user.id;
    const isCoOwner = server.coOwners && server.coOwners.some(co => co._id === user.id || co === user.id);
    
    if (isOwner || isCoOwner) {
        document.getElementById('serverSettingsBtn').style.display = 'block';
        document.getElementById('manageMembersBtn').style.display = 'block';
    } else {
        document.getElementById('serverSettingsBtn').style.display = 'none';
        document.getElementById('manageMembersBtn').style.display = 'none';
    }

    // Load channels
    await loadChannels(serverId);
}

// Load channels for server
async function loadChannels(serverId) {
    try {
        const response = await fetch(`/api/channels/server/${serverId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
            const channels = await response.json();
            displayChannels(channels);
        }
    } catch (error) {
        console.error('Error loading channels:', error);
    }
}

// Display channels
function displayChannels(channels) {
    const channelsList = document.getElementById('channelsList');
    channelsList.innerHTML = '';

    channels.forEach(channel => {
        const channelItem = document.createElement('div');
        channelItem.className = 'channel-item';
        channelItem.innerHTML = `
            <span class="channel-icon">#</span>
            <span class="channel-name">${channel.name}</span>
        `;
        channelItem.onclick = () => selectChannel(channel._id, channel.name);
        channelsList.appendChild(channelItem);
    });
}

// Select channel
async function selectChannel(channelId, channelName) {
    currentChannel = channelId;
    currentDmUser = null;

    document.querySelectorAll('.channel-item').forEach(item => item.classList.remove('active'));
    event.currentTarget.classList.add('active');

    socket.emit('join-channel', channelId);

    updateChatHeader(channelName, 'Channel messages', true);
    enableMessageInput();
    await loadMessages(channelId);
}

// Load messages for channel
async function loadMessages(channelId) {
    try {
        const response = await fetch(`/api/messages/channel/${channelId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
            const messages = await response.json();
            displayMessages(messages.reverse());
        }
    } catch (error) {
        console.error('Error loading messages:', error);
    }
}

// Load DM conversations
async function loadDmConversations() {
    // This would need backend support to track DM conversations
    // For now, display empty state
    document.getElementById('dmChannelsList').innerHTML = '<div style="padding: 8px; color: var(--text-muted); font-size: 12px;">No conversations yet</div>';
}

// Start DM with user
function startDm(userId, username) {
    currentDmUser = userId;
    currentChannel = null;
    currentView = 'dm';

    closeModal('newDmModal');

    updateChatHeader(username, 'Direct Message', false);
    enableMessageInput();
    loadDirectMessages(userId);

    // Add to DM list if not exists
    addToDmList(userId, username);
}

// Add user to DM list
function addToDmList(userId, username) {
    const dmList = document.getElementById('dmChannelsList');
    
    // Check if already exists
    if (document.getElementById(`dm-${userId}`)) return;

    const dmItem = document.createElement('div');
    dmItem.className = 'channel-item dm-item';
    dmItem.id = `dm-${userId}`;
    dmItem.innerHTML = `
        <div class="dm-avatar">${username[0].toUpperCase()}</div>
        <span class="dm-user-name">${username}</span>
    `;
    dmItem.onclick = () => startDm(userId, username);
    
    dmList.innerHTML = ''; // Clear "no conversations" message
    dmList.appendChild(dmItem);
}

// Load direct messages
async function loadDirectMessages(userId) {
    try {
        const response = await fetch(`/api/messages/direct/${userId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
            const messages = await response.json();
            displayDirectMessages(messages.reverse());
        }
    } catch (error) {
        console.error('Error loading direct messages:', error);
    }
}

// Display messages
function displayMessages(messages) {
    const messageArea = document.getElementById('messageArea');
    messageArea.innerHTML = '';

    messages.forEach(msg => {
        const messageGroup = document.createElement('div');
        messageGroup.className = 'message-group';
        
        const initials = (msg.author?.firstName?.[0] || '') + (msg.author?.lastName?.[0] || '');
        const avatar = document.createElement('div');
        avatar.className = 'message-avatar';
        avatar.textContent = initials || msg.author?.username[0].toUpperCase();

        const contentWrapper = document.createElement('div');
        contentWrapper.className = 'message-content-wrapper';
        contentWrapper.innerHTML = `
            <div class="message-header">
                <span class="message-author">${msg.author?.username || 'Unknown'}</span>
                <span class="message-timestamp">${new Date(msg.createdAt).toLocaleString()}</span>
            </div>
            <div class="message-text">${msg.content}</div>
        `;

        messageGroup.appendChild(avatar);
        messageGroup.appendChild(contentWrapper);
        messageArea.appendChild(messageGroup);
    });

    scrollToBottom();
}

// Display direct messages
function displayDirectMessages(messages) {
    const messageArea = document.getElementById('messageArea');
    messageArea.innerHTML = '';

    messages.forEach(msg => {
        const isOwn = msg.sender._id === user.id;
        const displayUser = isOwn ? msg.sender : msg.recipient;
        
        const messageGroup = document.createElement('div');
        messageGroup.className = 'message-group';
        
        const initials = displayUser.username[0].toUpperCase();
        const avatar = document.createElement('div');
        avatar.className = 'message-avatar';
        avatar.textContent = initials;

        const contentWrapper = document.createElement('div');
        contentWrapper.className = 'message-content-wrapper';
        contentWrapper.innerHTML = `
            <div class="message-header">
                <span class="message-author">${displayUser.username}</span>
                <span class="message-timestamp">${new Date(msg.createdAt).toLocaleString()}</span>
            </div>
            <div class="message-text">${msg.content}</div>
        `;

        messageGroup.appendChild(avatar);
        messageGroup.appendChild(contentWrapper);
        messageArea.appendChild(messageGroup);
    });

    scrollToBottom();
}

// Update chat header
function updateChatHeader(title, topic, isChannel = false) {
    document.getElementById('channelHash').style.display = isChannel ? 'inline' : 'none';
    document.getElementById('channelTitle').textContent = title;
    document.getElementById('channelTopic').textContent = topic;
}

// Enable message input
function enableMessageInput() {
    document.getElementById('messageInput').disabled = false;
    document.querySelector('.message-send-btn').disabled = false;
}

// Clear messages
function clearMessages() {
    document.getElementById('messageArea').innerHTML = `
        <div class="welcome-message">
            <h2>Welcome to FriendsChat!</h2>
            <p>Select a channel or start a direct message to begin chatting.</p>
        </div>
    `;
    document.getElementById('messageInput').disabled = true;
    document.querySelector('.message-send-btn').disabled = true;
}

// Scroll to bottom
function scrollToBottom() {
    const messageArea = document.getElementById('messageArea');
    messageArea.scrollTop = messageArea.scrollHeight;
}

// Send message
document.getElementById('messageForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const content = document.getElementById('messageInput').value.trim();
    if (!content) return;

    try {
        if (currentChannel) {
            // Send channel message
            const response = await fetch('/api/messages', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ channelId: currentChannel, content })
            });

            if (response.ok) {
                const message = await response.json();
                socket.emit('send-message', { channelId: currentChannel, message });
                document.getElementById('messageInput').value = '';
            }
        } else if (currentDmUser) {
            // Send direct message
            const response = await fetch('/api/messages/direct', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ recipientId: currentDmUser, content })
            });

            if (response.ok) {
                document.getElementById('messageInput').value = '';
                loadDirectMessages(currentDmUser);
            }
        }
    } catch (error) {
        console.error('Error sending message:', error);
    }
});

// Listen for new messages
socket.on('new-message', (data) => {
    if (data.channelId === currentChannel) {
        loadMessages(currentChannel);
    }
});

// Create Server Modal
document.getElementById('createServerForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const name = document.getElementById('serverNameInput').value;
    const description = document.getElementById('serverDescription').value;

    try {
        const response = await fetch('/api/servers', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name, description })
        });

        if (response.ok) {
            closeModal('createServerModal');
            document.getElementById('createServerForm').reset();
            await loadServers();
        }
    } catch (error) {
        console.error('Error creating server:', error);
    }
});

// Create Channel Modal
document.getElementById('addChannelBtn')?.addEventListener('click', () => {
    if (currentServer) {
        openModal('createChannelModal');
    }
});

document.getElementById('createChannelForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const name = document.getElementById('channelNameInput').value;

    try {
        const response = await fetch('/api/channels', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                serverId: currentServer,
                name,
                type: 'text'
            })
        });

        if (response.ok) {
            closeModal('createChannelModal');
            document.getElementById('createChannelForm').reset();
            await loadChannels(currentServer);
        }
    } catch (error) {
        console.error('Error creating channel:', error);
    }
});

// User Search for DM
document.getElementById('userSearchInput').addEventListener('input', async (e) => {
    const query = e.target.value.trim();
    
    if (query.length < 2) {
        document.getElementById('userSearchResults').innerHTML = '';
        return;
    }

    try {
        const response = await fetch(`/api/auth/search-users?query=${encodeURIComponent(query)}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
            const users = await response.json();
            displayUserSearchResults(users);
        }
    } catch (error) {
        console.error('Error searching users:', error);
    }
});

function displayUserSearchResults(users) {
    const resultsDiv = document.getElementById('userSearchResults');
    resultsDiv.innerHTML = '';

    users.forEach(u => {
        const userItem = document.createElement('div');
        userItem.className = 'user-search-item';
        userItem.innerHTML = `
            <div class="search-user-avatar">${u.username[0].toUpperCase()}</div>
            <div class="search-user-info">
                <div class="search-user-name">${u.username}</div>
                <div class="search-user-id">${u.firstName} ${u.lastName}</div>
            </div>
        `;
        userItem.onclick = () => startDm(u._id, u.username);
        resultsDiv.appendChild(userItem);
    });
}

// Server Invite
async function createServerInvite() {
    if (!currentServer) return;
    openModal('inviteUserModal');
    await generateNewInviteCode();
}

async function generateNewInviteCode() {
    if (!currentServer) return;

    try {
        const response = await fetch(`/api/servers/${currentServer}/invite`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
            const data = await response.json();
            document.getElementById('inviteCodeDisplay2').textContent = data.code;
        }
    } catch (error) {
        console.error('Error creating invite:', error);
    }
}

function copyInviteCode() {
    const code = document.getElementById('inviteCodeDisplay').textContent;
    navigator.clipboard.writeText(code).then(() => {
        alert('Invite code copied to clipboard!');
    });
}

function copyInviteCode2() {
    const code = document.getElementById('inviteCodeDisplay2').textContent;
    if (code === 'Click to generate code') {
        generateNewInviteCode();
        return;
    }
    navigator.clipboard.writeText(code).then(() => {
        alert('Invite code copied to clipboard!');
    });
}

window.copyInviteCode = copyInviteCode;
window.copyInviteCode2 = copyInviteCode2;
window.generateNewInviteCode = generateNewInviteCode;

// Individual user invite search
document.getElementById('inviteUserSearchInput')?.addEventListener('input', async (e) => {
    const query = e.target.value.trim();
    
    if (query.length < 2) {
        document.getElementById('inviteUserSearchResults').innerHTML = '';
        return;
    }

    try {
        const response = await fetch(`/api/auth/search-users?query=${encodeURIComponent(query)}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
            const users = await response.json();
            displayInviteUserSearchResults(users);
        }
    } catch (error) {
        console.error('Error searching users:', error);
    }
});

function displayInviteUserSearchResults(users) {
    const resultsDiv = document.getElementById('inviteUserSearchResults');
    resultsDiv.innerHTML = '';

    users.forEach(u => {
        const userItem = document.createElement('div');
        userItem.className = 'user-search-item';
        userItem.innerHTML = `
            <div class="search-user-avatar">${u.username[0].toUpperCase()}</div>
            <div class="search-user-info">
                <div class="search-user-name">${u.username}</div>
                <div class="search-user-id">${u.firstName} ${u.lastName}</div>
            </div>
        `;
        userItem.onclick = () => inviteUserToServer(u._id, u.username);
        resultsDiv.appendChild(userItem);
    });
}

async function inviteUserToServer(userId, username) {
    if (!currentServer) return;

    try {
        const response = await fetch(`/api/servers/${currentServer}/invite-user`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ userId })
        });

        if (response.ok) {
            alert(`${username} has been invited to the server!`);
            closeModal('inviteUserModal');
            document.getElementById('inviteUserSearchInput').value = '';
            document.getElementById('inviteUserSearchResults').innerHTML = '';
        } else {
            const error = await response.json();
            alert(error.error || 'Failed to invite user');
        }
    } catch (error) {
        console.error('Error inviting user:', error);
        alert('Failed to invite user');
    }
}

// Join Server with Invite
document.getElementById('joinServerForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const code = document.getElementById('inviteCodeInput').value;

    try {
        const response = await fetch('/api/servers/join/invite', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ code })
        });

        if (response.ok) {
            closeModal('joinServerModal');
            document.getElementById('joinServerForm').reset();
            await loadServers();
            alert('Successfully joined the server!');
        } else {
            const error = await response.json();
            alert(error.error || 'Failed to join server');
        }
    } catch (error) {
        console.error('Error joining server:', error);
        alert('Failed to join server');
    }
});

// Server Menu
function toggleServerMenu() {
    const menu = document.getElementById('serverMenu');
    if (currentView === 'server') {
        menu.style.display = menu.style.display === 'none' ? 'block' : 'none';
    }
}

document.getElementById('inviteMenuBtn')?.addEventListener('click', () => {
    document.getElementById('serverMenu').style.display = 'none';
    createServerInvite();
});

// Close menu when clicking outside
document.addEventListener('click', (e) => {
    const menu = document.getElementById('serverMenu');
    const header = document.getElementById('serverHeader');
    if (!header.contains(e.target) && !menu.contains(e.target)) {
        menu.style.display = 'none';
    }
});

// Initialize on load
initializeUI();

// Server Settings and Member Management
document.getElementById('serverSettingsBtn')?.addEventListener('click', () => {
    document.getElementById('serverMenu').style.display = 'none';
    openServerSettings();
});

document.getElementById('manageMembersBtn')?.addEventListener('click', () => {
    document.getElementById('serverMenu').style.display = 'none';
    openManageMembers();
});

async function openServerSettings() {
    if (!currentServer) return;

    try {
        const response = await fetch(`/api/servers/${currentServer}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
            const server = await response.json();
            document.getElementById('settingsServerName').value = server.name;
            document.getElementById('settingsServerDescription').value = server.description || '';
            document.getElementById('settingsServerIcon').value = server.icon || '';
            document.getElementById('settingsServerBanner').value = server.banner || '';
            document.getElementById('settingsThemeColor').value = server.theme?.primaryColor || '#5865f2';
            openModal('serverSettingsModal');
        }
    } catch (error) {
        console.error('Error loading server settings:', error);
    }
}

document.getElementById('serverSettingsForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (!currentServer) return;

    const settings = {
        description: document.getElementById('settingsServerDescription').value,
        icon: document.getElementById('settingsServerIcon').value,
        banner: document.getElementById('settingsServerBanner').value,
        theme: {
            primaryColor: document.getElementById('settingsThemeColor').value
        }
    };

    try {
        const response = await fetch(`/api/servers/${currentServer}/settings`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(settings)
        });

        if (response.ok) {
            alert('Server settings updated!');
            closeModal('serverSettingsModal');
            await loadServers();
        } else {
            const error = await response.json();
            alert(error.error || 'Failed to update settings');
        }
    } catch (error) {
        console.error('Error updating server settings:', error);
        alert('Failed to update settings');
    }
});

async function openManageMembers() {
    if (!currentServer) return;
    openModal('manageMembersModal');
    await loadServerMembers();
}

async function loadServerMembers() {
    if (!currentServer) return;

    try {
        const response = await fetch(`/api/servers/${currentServer}/members`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
            const data = await response.json();
            displayServerMembers(data.members);
        }
    } catch (error) {
        console.error('Error loading members:', error);
    }
}

function displayServerMembers(members) {
    const membersList = document.getElementById('membersList');
    
    if (members.length === 0) {
        membersList.innerHTML = '<p style="color: var(--text-muted); padding: 20px;">No members</p>';
        return;
    }

    membersList.innerHTML = members.map(member => {
        const roleColor = member.role === 'Owner' ? 'var(--error-color)' : 
                         member.role === 'Co-Owner' ? 'var(--warning-color)' : 
                         member.role === 'Moderator' ? 'var(--primary-color)' : 
                         'var(--text-muted)';

        return `
            <div class="table-row" style="padding: 12px; margin-bottom: 8px;">
                <div style="display: flex; align-items: center; gap: 12px; flex: 1;">
                    <div class="user-avatar" style="width: 36px; height: 36px;">
                        ${member.username[0].toUpperCase()}
                    </div>
                    <div>
                        <div style="font-weight: 600; color: var(--text-bright);">
                            ${member.username}
                        </div>
                        <div style="font-size: 12px; color: ${roleColor};">
                            ${member.role}
                        </div>
                    </div>
                </div>
                ${member.role !== 'Owner' ? `
                    <div class="action-buttons">
                        ${member.role === 'Member' ? `
                            <button class="btn btn-small btn-primary" onclick="promoteMember('${member.id}', 'promote-moderator')">
                                👮 Make Moderator
                            </button>
                        ` : ''}
                        ${member.role === 'Moderator' ? `
                            <button class="btn btn-small btn-primary" onclick="promoteMember('${member.id}', 'promote-coowner')">
                                ⭐ Make Co-Owner
                            </button>
                            <button class="btn btn-small btn-secondary" onclick="promoteMember('${member.id}', 'demote')">
                                ⬇️ Demote
                            </button>
                        ` : ''}
                        ${member.role === 'Co-Owner' ? `
                            <button class="btn btn-small btn-secondary" onclick="promoteMember('${member.id}', 'demote')">
                                ⬇️ Demote
                            </button>
                        ` : ''}
                        <button class="btn btn-small btn-danger" onclick="removeMemberFromServer('${member.id}', '${member.username}')">
                            ✗ Remove
                        </button>
                    </div>
                ` : ''}
            </div>
        `;
    }).join('');
}

async function promoteMember(userId, action) {
    if (!currentServer) return;

    try {
        const response = await fetch(`/api/servers/${currentServer}/member/${userId}/role`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ action })
        });

        if (response.ok) {
            alert('Member role updated!');
            await loadServerMembers();
        } else {
            const error = await response.json();
            alert(error.error || 'Failed to update role');
        }
    } catch (error) {
        console.error('Error updating member role:', error);
        alert('Failed to update role');
    }
}

async function removeMemberFromServer(userId, username) {
    if (!confirm(`Remove ${username} from the server?`)) return;

    try {
        const response = await fetch(`/api/servers/${currentServer}/member/${userId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
            alert('Member removed');
            await loadServerMembers();
        } else {
            const error = await response.json();
            alert(error.error || 'Failed to remove member');
        }
    } catch (error) {
        console.error('Error removing member:', error);
        alert('Failed to remove member');
    }
}

window.promoteMember = promoteMember;
window.removeMemberFromServer = removeMemberFromServer;
window.loadServerMembers = loadServerMembers;
