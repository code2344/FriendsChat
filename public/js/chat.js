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
document.getElementById('addCategoryBtn')?.addEventListener('click', () => openCreateCategoryModal());

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

// Load channels for server with categories
async function loadChannels(serverId) {
    try {
        // Fetch both categories and channels
        const [categoriesResponse, channelsResponse] = await Promise.all([
            fetch(`/api/categories/server/${serverId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            }),
            fetch(`/api/channels/server/${serverId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            })
        ]);

        const categories = categoriesResponse.ok ? await categoriesResponse.json() : { categories: [], uncategorizedChannels: [] };
        const allChannels = channelsResponse.ok ? await channelsResponse.json() : [];

        displayChannelsWithCategories(categories, allChannels);
    } catch (error) {
        console.error('Error loading channels:', error);
        // Fallback to showing channels without categories
        displayChannelsWithCategories({ categories: [], uncategorizedChannels: [] }, []);
    }
}

// Display channels organized by categories
function displayChannelsWithCategories(categoryData, allChannels) {
    const container = document.getElementById('categoriesContainer');
    if (!container) {
        console.error('Categories container not found');
        return;
    }
    
    container.innerHTML = '';

    // Display categorized channels
    if (categoryData.categories && categoryData.categories.length > 0) {
        categoryData.categories.forEach(category => {
            const categoryDiv = createCategorySection(category, category.channels || []);
            container.appendChild(categoryDiv);
        });
    }

    // Display uncategorized channels
    const uncategorized = categoryData.uncategorizedChannels || allChannels.filter(ch => !ch.category);
    if (uncategorized.length > 0) {
        const uncategorizedDiv = createCategorySection(
            { name: 'TEXT CHANNELS', _id: null, collapsed: false },
            uncategorized
        );
        container.appendChild(uncategorizedDiv);
    }

    // If no channels at all, show a message
    if ((!categoryData.categories || categoryData.categories.length === 0) && uncategorized.length === 0) {
        container.innerHTML = '<div style="padding: 20px; text-align: center; color: var(--text-muted);">No channels yet. Create one to get started!</div>';
    }
}

// Create a category section with channels
function createCategorySection(category, channels) {
    const categoryDiv = document.createElement('div');
    categoryDiv.className = 'channel-category';
    categoryDiv.dataset.categoryId = category._id || 'uncategorized';

    const header = document.createElement('div');
    header.className = 'category-header';
    header.innerHTML = `
        <span class="category-arrow">${category.collapsed ? '▶' : '▼'}</span>
        <span class="category-name">${category.name.toUpperCase()}</span>
        ${category._id ? '<span class="category-add" title="Add Channel">+</span>' : ''}
    `;
    
    // Toggle collapse on header click
    header.onclick = (e) => {
        if (e.target.classList.contains('category-add')) {
            e.stopPropagation();
            openCreateChannelInCategory(category._id);
        } else {
            toggleCategory(category._id, channelsDiv);
        }
    };

    categoryDiv.appendChild(header);

    const channelsDiv = document.createElement('div');
    channelsDiv.className = 'category-channels';
    channelsDiv.style.display = category.collapsed ? 'none' : 'block';

    channels.forEach(channel => {
        const channelItem = document.createElement('div');
        channelItem.className = 'channel-item';
        channelItem.dataset.channelId = channel._id;
        
        const icon = getChannelIcon(channel.type);
        channelItem.innerHTML = `
            <span class="channel-icon">${icon}</span>
            <span class="channel-name">${channel.name}</span>
        `;
        channelItem.onclick = () => selectChannel(channel._id, channel.name);
        channelsDiv.appendChild(channelItem);
    });

    categoryDiv.appendChild(channelsDiv);
    return categoryDiv;
}

// Get icon for channel type
function getChannelIcon(type) {
    const icons = {
        'text': '#',
        'voice': '🔊',
        'announcement': '📢',
        'stage': '🎙️',
        'forum': '💬'
    };
    return icons[type] || '#';
}

// Toggle category collapse
function toggleCategory(categoryId, channelsDiv) {
    const isHidden = channelsDiv.style.display === 'none';
    channelsDiv.style.display = isHidden ? 'block' : 'none';
    
    const arrow = channelsDiv.previousElementSibling.querySelector('.category-arrow');
    if (arrow) {
        arrow.textContent = isHidden ? '▼' : '▶';
    }
    
    // TODO: Save collapsed state to server if needed
    if (categoryId) {
        // Could save to localStorage or API
    }
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
        messageGroup.setAttribute('data-message-id', msg._id);
        
        const initials = (msg.author?.firstName?.[0] || '') + (msg.author?.lastName?.[0] || '');
        const avatar = document.createElement('div');
        avatar.className = 'message-avatar';
        avatar.textContent = initials || msg.author?.username[0].toUpperCase();

        const contentWrapper = document.createElement('div');
        contentWrapper.className = 'message-content-wrapper';
        
        const isOwnMessage = msg.author?._id === user.id;
        
        contentWrapper.innerHTML = `
            <div class="message-header">
                <span class="message-author">${msg.author?.username || 'Unknown'}</span>
                <span class="message-timestamp">${new Date(msg.createdAt).toLocaleString()}</span>
                ${msg.isEdited ? '<span class="message-edited-label">(edited)</span>' : ''}
            </div>
            <div class="message-text" data-message-id="${msg._id}">${msg.content}</div>
            <div class="message-actions" style="display: none;">
                <button class="message-action-btn" onclick="showEmojiPicker('${msg._id}', this)" title="Add Reaction">😊</button>
                ${isOwnMessage ? `
                    <button class="message-action-btn" onclick="enableMessageEdit('${msg._id}')" title="Edit Message">✏️</button>
                    <button class="message-action-btn" onclick="deleteMessage('${msg._id}')" title="Delete Message">🗑️</button>
                ` : ''}
                <button class="message-action-btn" onclick="showReportModal('${msg._id}')" title="Report Message">🚩</button>
            </div>
            <div class="message-reactions" id="reactions-${msg._id}"></div>
        `;

        // Add context menu handler
        contentWrapper.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            showContextMenu(e, msg._id, msg);
        });
        
        // Show actions on hover
        messageGroup.addEventListener('mouseenter', () => {
            const actions = contentWrapper.querySelector('.message-actions');
            if (actions) actions.style.display = 'flex';
        });
        
        messageGroup.addEventListener('mouseleave', () => {
            const actions = contentWrapper.querySelector('.message-actions');
            if (actions) actions.style.display = 'none';
        });

        messageGroup.appendChild(avatar);
        messageGroup.appendChild(contentWrapper);
        messageArea.appendChild(messageGroup);
        
        // Load reactions if they exist
        if (msg.reactions && msg.reactions.length > 0) {
            displayMessageReactions(msg._id, msg.reactions);
        }
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
        messageGroup.setAttribute('data-message-id', msg._id);
        
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
                ${msg.isEdited ? '<span class="message-edited-label">(edited)</span>' : ''}
            </div>
            <div class="message-text" data-message-id="${msg._id}">${msg.content}</div>
            <div class="message-actions" style="display: none;">
                <button class="message-action-btn" onclick="showEmojiPicker('${msg._id}', this)" title="Add Reaction">😊</button>
                ${isOwn ? `<button class="message-action-btn" onclick="enableMessageEdit('${msg._id}')" title="Edit Message">✏️</button>` : ''}
                <button class="message-action-btn" onclick="showReportModal('${msg._id}')" title="Report Message">🚩</button>
            </div>
            <div class="message-reactions" id="reactions-${msg._id}"></div>
        `;

        // Add context menu handler
        contentWrapper.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            showContextMenu(e, msg._id, msg);
        });
        
        // Show actions on hover
        messageGroup.addEventListener('mouseenter', () => {
            const actions = contentWrapper.querySelector('.message-actions');
            if (actions) actions.style.display = 'flex';
        });
        
        messageGroup.addEventListener('mouseleave', () => {
            const actions = contentWrapper.querySelector('.message-actions');
            if (actions) actions.style.display = 'none';
        });

        messageGroup.appendChild(avatar);
        messageGroup.appendChild(contentWrapper);
        messageArea.appendChild(messageGroup);
        
        // Load reactions if they exist
        if (msg.reactions && msg.reactions.length > 0) {
            displayMessageReactions(msg._id, msg.reactions);
        }
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
    const categoryId = document.getElementById('channelCategorySelect').value;
    const type = document.getElementById('channelTypeSelect').value;

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
                type,
                categoryId: categoryId || undefined
            })
        });

        if (response.ok) {
            closeModal('createChannelModal');
            document.getElementById('createChannelForm').reset();
            await loadChannels(currentServer);
            showNotification('Channel created successfully!');
        } else {
            const error = await response.json();
            alert('Failed to create channel: ' + (error.error || 'Unknown error'));
        }
    } catch (error) {
        console.error('Error creating channel:', error);
        alert('Failed to create channel');
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

// Open create category modal
function openCreateCategoryModal() {
    if (!currentServer) {
        alert('Please select a server first');
        return;
    }
    
    const categoryName = prompt('Enter category name (e.g., "TEXT CHANNELS", "VOICE CHANNELS"):');
    if (categoryName && categoryName.trim()) {
        createCategory(categoryName.trim());
    }
}

// Create a new category
async function createCategory(name) {
    try {
        const response = await fetch(`/api/categories/server/${currentServer}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name })
        });

        if (response.ok) {
            // Reload channels to show new category
            await loadChannels(currentServer);
            showNotification('Category created successfully!');
        } else {
            const error = await response.json();
            alert('Failed to create category: ' + (error.error || 'Unknown error'));
        }
    } catch (error) {
        console.error('Error creating category:', error);
        alert('Failed to create category');
    }
}

// Open create channel modal with category pre-selected
async function openCreateChannelInCategory(categoryId) {
    if (!currentServer) return;
    
    // Load categories into selector first
    await loadCategoriesIntoSelector();
    
    // Pre-select the category
    document.getElementById('channelCategorySelect').value = categoryId;
    
    // Open the modal
    openModal('createChannelModal');
}
window.openCreateChannelInCategory = openCreateChannelInCategory;

// Load categories into the channel creation selector
async function loadCategoriesIntoSelector() {
    try {
        const response = await fetch(`/api/categories/server/${currentServer}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
            const categories = await response.json();
            const selector = document.getElementById('channelCategorySelect');
            
            // Clear existing options except "No Category"
            selector.innerHTML = '<option value="">No Category</option>';
            
            // Add categories
            categories.forEach(category => {
                const option = document.createElement('option');
                option.value = category._id;
                option.textContent = category.name;
                selector.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Error loading categories:', error);
    }
}

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

// ==================== REACTIONS SYSTEM ====================

let currentEmojiPickerMessageId = null;
const availableEmojis = ['👍', '❤️', '😂', '😮', '😢', '😡', '🎉', '🔥', '✅', '❌', '⭐', '💯', '👏', '🙏', '💪', '🤔', '😎', '🤩', '🥳', '✨'];

function showEmojiPicker(messageId, buttonElement) {
    currentEmojiPickerMessageId = messageId;
    
    // Create emoji picker if doesn't exist
    let picker = document.getElementById('emojiPicker');
    if (!picker) {
        picker = document.createElement('div');
        picker.id = 'emojiPicker';
        picker.className = 'emoji-picker';
        picker.innerHTML = `
            <div class="emoji-grid">
                ${availableEmojis.map(emoji => `<span class="emoji-item" onclick="selectEmoji('${emoji}')">${emoji}</span>`).join('')}
            </div>
        `;
        document.body.appendChild(picker);
    }
    
    // Position near button with proper scroll offset
    const rect = buttonElement.getBoundingClientRect();
    picker.style.display = 'block';
    picker.style.top = (rect.bottom + window.scrollY + 5) + 'px';
    picker.style.left = (rect.left + window.scrollX) + 'px';
    
    // Close on click outside
    setTimeout(() => {
        document.addEventListener('click', closeEmojiPicker);
    }, 100);
}

function closeEmojiPicker() {
    const picker = document.getElementById('emojiPicker');
    if (picker) picker.style.display = 'none';
    document.removeEventListener('click', closeEmojiPicker);
}

async function selectEmoji(emoji) {
    if (!currentEmojiPickerMessageId) return;
    
    try {
        const response = await fetch(`/api/messages/${currentEmojiPickerMessageId}/react`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ emoji })
        });
        
        if (response.ok) {
            const data = await response.json();
            updateMessageReactions(currentEmojiPickerMessageId, data.reactions);
        }
    } catch (error) {
        console.error('Error adding reaction:', error);
    }
    
    closeEmojiPicker();
}

function updateMessageReactions(messageId, reactions) {
    const messageElement = document.querySelector(`[data-message-id="${messageId}"]`);
    if (!messageElement) return;
    
    let reactionsContainer = messageElement.querySelector('.message-reactions');
    if (!reactionsContainer) {
        reactionsContainer = document.createElement('div');
        reactionsContainer.className = 'message-reactions';
        messageElement.querySelector('.message-content-wrapper').appendChild(reactionsContainer);
    }
    
    reactionsContainer.innerHTML = reactions.map(reaction => {
        const isReacted = reaction.users.some(u => u._id === user.id || u === user.id);
        const reactionClass = isReacted ? 'reaction reacted' : 'reaction';
        const usersList = reaction.users.map(u => u.username || 'User').join(', ');
        
        return `
            <div class="${reactionClass}" onclick="toggleReaction('${messageId}', '${reaction.emoji}')" title="${usersList}">
                <span>${reaction.emoji}</span>
                <span class="reaction-count">${reaction.count}</span>
            </div>
        `;
    }).join('');
}

async function toggleReaction(messageId, emoji) {
    try {
        const response = await fetch(`/api/messages/${messageId}/react`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ emoji })
        });
        
        if (response.ok) {
            const data = await response.json();
            updateMessageReactions(messageId, data.reactions);
        }
    } catch (error) {
        console.error('Error toggling reaction:', error);
    }
}

window.showEmojiPicker = showEmojiPicker;
window.selectEmoji = selectEmoji;
window.toggleReaction = toggleReaction;

// Alias for displaying reactions on initial load
function displayMessageReactions(messageId, reactions) {
    updateMessageReactions(messageId, reactions);
}
window.displayMessageReactions = displayMessageReactions;

// ==================== MESSAGE EDITING ====================

let editingMessageId = null;
let originalMessageContent = null;

function enableMessageEdit(messageId) {
    const messageElement = document.querySelector(`[data-message-id="${messageId}"]`);
    if (!messageElement) return;
    
    const contentElement = messageElement.querySelector('.message-text');
    if (!contentElement) return;
    
    editingMessageId = messageId;
    originalMessageContent = contentElement.textContent;
    
    const editContainer = document.createElement('div');
    editContainer.className = 'message-editing';
    editContainer.innerHTML = `
        <textarea class="message-edit-input" id="editInput-${messageId}">${originalMessageContent}</textarea>
        <div class="message-edit-actions">
            <span>Press <strong>Enter</strong> to save • <strong>Esc</strong> to cancel</span>
            <div>
                <button class="btn btn-small btn-primary" onclick="saveMessageEdit('${messageId}')">✓ Save</button>
                <button class="btn btn-small btn-secondary" onclick="cancelMessageEdit('${messageId}')">× Cancel</button>
            </div>
        </div>
    `;
    
    contentElement.replaceWith(editContainer);
    
    const textarea = document.getElementById(`editInput-${messageId}`);
    textarea.focus();
    textarea.setSelectionRange(textarea.value.length, textarea.value.length);
    
    textarea.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            saveMessageEdit(messageId);
        } else if (e.key === 'Escape') {
            e.preventDefault();
            cancelMessageEdit(messageId);
        }
    });
}

async function saveMessageEdit(messageId) {
    const textarea = document.getElementById(`editInput-${messageId}`);
    if (!textarea) return;
    
    const newContent = textarea.value.trim();
    if (!newContent || newContent === originalMessageContent) {
        cancelMessageEdit(messageId);
        return;
    }
    
    try {
        const response = await fetch(`/api/messages/${messageId}/edit`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ content: newContent })
        });
        
        if (response.ok) {
            const data = await response.json();
            const messageElement = document.querySelector(`[data-message-id="${messageId}"]`);
            const editContainer = messageElement.querySelector('.message-editing');
            
            const newContentElement = document.createElement('div');
            newContentElement.className = 'message-text';
            newContentElement.textContent = data.message.content;
            
            if (data.message.isEdited) {
                const editedLabel = document.createElement('span');
                editedLabel.className = 'message-edited-label';
                editedLabel.textContent = '(edited)';
                newContentElement.appendChild(editedLabel);
            }
            
            editContainer.replaceWith(newContentElement);
            editingMessageId = null;
            originalMessageContent = null;
        } else {
            alert('Failed to edit message');
        }
    } catch (error) {
        console.error('Error editing message:', error);
        alert('Failed to edit message');
    }
}

function cancelMessageEdit(messageId) {
    const messageElement = document.querySelector(`[data-message-id="${messageId}"]`);
    if (!messageElement) return;
    
    const editContainer = messageElement.querySelector('.message-editing');
    if (!editContainer) return;
    
    const contentElement = document.createElement('div');
    contentElement.className = 'message-text';
    contentElement.textContent = originalMessageContent;
    
    editContainer.replaceWith(contentElement);
    editingMessageId = null;
    originalMessageContent = null;
}

window.enableMessageEdit = enableMessageEdit;
window.saveMessageEdit = saveMessageEdit;
window.cancelMessageEdit = cancelMessageEdit;

// ==================== CONTEXT MENU ====================

function showContextMenu(event, messageId, message) {
    event.preventDefault();
    
    // Remove existing context menu
    const existing = document.getElementById('contextMenu');
    if (existing) existing.remove();
    
    const isOwnMessage = message.sender._id === user.id || message.sender === user.id;
    const isAdmin = user.role === 'admin' || user.role === 'master_admin';
    
    const contextMenu = document.createElement('div');
    contextMenu.id = 'contextMenu';
    contextMenu.className = 'context-menu';
    
    let menuItems = '';
    
    if (isOwnMessage) {
        menuItems += `<div class="context-item" onclick="enableMessageEdit('${messageId}')">✏️ Edit Message</div>`;
        menuItems += `<div class="context-item danger" onclick="deleteMessage('${messageId}')">🗑️ Delete Message</div>`;
    }
    
    menuItems += `<div class="context-item" onclick="setReplyTo('${messageId}')">💬 Reply</div>`;
    
    if (!isOwnMessage) {
        menuItems += `<div class="context-item" onclick="showReportModal('${messageId}')">🚩 Report Message</div>`;
        menuItems += `<div class="context-item" onclick="showUserProfile('${message.sender._id || message.sender}')">👤 View Profile</div>`;
    }
    
    menuItems += `<div class="context-item" onclick="copyMessageId('${messageId}')">📋 Copy Message ID</div>`;
    
    if (isAdmin) {
        menuItems += `<div class="context-separator"></div>`;
        menuItems += `<div class="context-item" onclick="quickMuteUser('${message.sender._id || message.sender}')">🔇 Mute User</div>`;
        menuItems += `<div class="context-item danger" onclick="quickBanUser('${message.sender._id || message.sender}')">🔨 Ban User</div>`;
    }
    
    contextMenu.innerHTML = menuItems;
    
    // Position context menu
    contextMenu.style.left = event.pageX + 'px';
    contextMenu.style.top = event.pageY + 'px';
    
    document.body.appendChild(contextMenu);
    
    // Close on click outside
    setTimeout(() => {
        document.addEventListener('click', hideContextMenu);
        document.addEventListener('contextmenu', hideContextMenu);
    }, 100);
}

function hideContextMenu() {
    const contextMenu = document.getElementById('contextMenu');
    if (contextMenu) contextMenu.remove();
    document.removeEventListener('click', hideContextMenu);
    document.removeEventListener('contextmenu', hideContextMenu);
}

function copyMessageId(messageId) {
    navigator.clipboard.writeText(messageId);
    showNotification('Message ID copied!');
    hideContextMenu();
}

function showNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'notification-toast';
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: var(--success-color);
        color: white;
        padding: 12px 20px;
        border-radius: 4px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        z-index: 10000;
        animation: slideIn 0.3s ease;
    `;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

window.showContextMenu = showContextMenu;
window.copyMessageId = copyMessageId;

// ==================== FRIENDS SYSTEM ====================

async function loadFriends() {
    try {
        const response = await fetch('/api/friends', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
            const friends = await response.json();
            displayFriends(friends);
        }
    } catch (error) {
        console.error('Error loading friends:', error);
    }
}

async function loadFriendRequests() {
    try {
        const response = await fetch('/api/friends/requests', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
            const requests = await response.json();
            displayFriendRequests(requests);
        }
    } catch (error) {
        console.error('Error loading friend requests:', error);
    }
}

async function sendFriendRequest(username) {
    if (!username || !username.trim()) {
        alert('Please enter a username');
        return;
    }
    
    try {
        // First find user by username
        const searchResponse = await fetch(`/api/users/search?username=${encodeURIComponent(username)}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!searchResponse.ok) {
            alert('User not found');
            return;
        }
        
        const users = await searchResponse.json();
        if (!users || users.length === 0) {
            alert('User not found');
            return;
        }
        
        const targetUser = users[0];
        
        const response = await fetch('/api/friends/request', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ recipientId: targetUser._id })
        });
        
        if (response.ok) {
            showNotification('Friend request sent!');
            document.getElementById('addFriendUsername').value = '';
        } else {
            const error = await response.json();
            alert(error.error || 'Failed to send friend request');
        }
    } catch (error) {
        console.error('Error sending friend request:', error);
        alert('Failed to send friend request');
    }
}

async function acceptFriendRequest(requestId) {
    try {
        const response = await fetch(`/api/friends/accept/${requestId}`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
            showNotification('Friend request accepted!');
            loadFriendRequests();
            loadFriends();
        }
    } catch (error) {
        console.error('Error accepting friend request:', error);
    }
}

async function declineFriendRequest(requestId) {
    try {
        const response = await fetch(`/api/friends/decline/${requestId}`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
            showNotification('Friend request declined');
            loadFriendRequests();
        }
    } catch (error) {
        console.error('Error declining friend request:', error);
    }
}

async function removeFriend(friendId) {
    if (!confirm('Remove this friend?')) return;
    
    try {
        const response = await fetch(`/api/friends/${friendId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
            showNotification('Friend removed');
            loadFriends();
        }
    } catch (error) {
        console.error('Error removing friend:', error);
    }
}

window.sendFriendRequest = sendFriendRequest;
window.acceptFriendRequest = acceptFriendRequest;
window.declineFriendRequest = declineFriendRequest;
window.removeFriend = removeFriend;

// ==================== REPORT MESSAGE ====================

function showReportModal(messageId) {
    currentReportMessageId = messageId;
    openModal('reportModal');
    hideContextMenu();
}

async function submitReport() {
    const reason = document.getElementById('reportReason').value;
    const details = document.getElementById('reportDetails').value;
    
    if (!reason) {
        alert('Please select a reason');
        return;
    }
    
    try {
        const response = await fetch('/api/reports', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                messageId: currentReportMessageId,
                reason,
                details
            })
        });
        
        if (response.ok) {
            showNotification('Report submitted. Admins will review it.');
            closeModal('reportModal');
            document.getElementById('reportReason').value = '';
            document.getElementById('reportDetails').value = '';
        } else {
            alert('Failed to submit report');
        }
    } catch (error) {
        console.error('Error submitting report:', error);
        alert('Failed to submit report');
    }
}

window.showReportModal = showReportModal;
window.submitReport = submitReport;

// ==================== SOCKET.IO EVENTS ====================

socket.on('reactionAdded', (data) => {
    updateMessageReactions(data.messageId, data.reactions);
});

socket.on('reactionRemoved', (data) => {
    updateMessageReactions(data.messageId, data.reactions);
});

socket.on('messageEdited', (data) => {
    const messageElement = document.querySelector(`[data-message-id="${data.messageId}"]`);
    if (messageElement) {
        const textElement = messageElement.querySelector('.message-text');
        if (textElement) {
            textElement.textContent = data.content;
            if (data.isEdited) {
                const editedLabel = document.createElement('span');
                editedLabel.className = 'message-edited-label';
                editedLabel.textContent = '(edited)';
                textElement.appendChild(editedLabel);
            }
        }
    }
});

socket.on('friendRequestReceived', (data) => {
    showNotification(`Friend request from ${data.requester.username}`);
    // Update friend requests badge if visible
    loadFriendRequests();
});

socket.on('friendRequestAccepted', (data) => {
    showNotification(`${data.accepter.username} accepted your friend request!`);
    loadFriends();
});

console.log('Frontend integrations loaded successfully!');


// ==================== FRIENDS MODAL HELPERS ====================

let currentFriendsTab = 'all';

function switchFriendsTab(tab) {
    currentFriendsTab = tab;
    
    // Update tab styling
    document.querySelectorAll('.friends-tab').forEach(t => t.classList.remove('active'));
    event.target.classList.add('active');
    
    // Hide all tab contents
    document.querySelectorAll('.friends-tab-content').forEach(c => c.style.display = 'none');
    
    // Show selected tab
    if (tab === 'all') {
        document.getElementById('friendsAllTab').style.display = 'block';
        loadFriends();
    } else if (tab === 'online') {
        document.getElementById('friendsOnlineTab').style.display = 'block';
        loadOnlineFriends();
    } else if (tab === 'pending') {
        document.getElementById('friendsPendingTab').style.display = 'block';
        loadFriendRequests();
    } else if (tab === 'add') {
        document.getElementById('friendsAddTab').style.display = 'block';
    }
}

function displayFriends(friends) {
    const container = document.getElementById('friendsList');
    if (!friends || friends.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: var(--text-muted); padding: 20px;">No friends yet. Add some friends to get started!</p>';
        return;
    }
    
    container.innerHTML = friends.map(friendData => {
        const friend = friendData.friend || friendData;
        const initials = (friend.firstName?.[0] || '') + (friend.lastName?.[0] || '');
        const isOnline = false; // TODO: Implement online status
        
        return `
            <div class="friend-card">
                <div class="friend-avatar">
                    ${initials}
                    <div class="friend-status ${isOnline ? 'online' : 'offline'}"></div>
                </div>
                <div class="friend-info">
                    <div class="friend-name">${friend.firstName} ${friend.lastName}</div>
                    <div class="friend-username">@${friend.username}</div>
                </div>
                <div class="friend-actions">
                    <button class="btn btn-small btn-primary" onclick="startDm('${friend._id}')">💬 Message</button>
                    <button class="btn btn-small btn-danger" onclick="removeFriend('${friend._id}')">Remove</button>
                </div>
            </div>
        `;
    }).join('');
}

function displayFriendRequests(requests) {
    const container = document.getElementById('friendsRequestsList');
    if (!requests || requests.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: var(--text-muted); padding: 20px;">No pending requests</p>';
        return;
    }
    
    container.innerHTML = requests.map(request => {
        const requester = request.requester;
        const initials = (requester.firstName?.[0] || '') + (requester.lastName?.[0] || '');
        
        return `
            <div class="friend-card">
                <div class="friend-avatar">${initials}</div>
                <div class="friend-info">
                    <div class="friend-name">${requester.firstName} ${requester.lastName}</div>
                    <div class="friend-username">@${requester.username}</div>
                </div>
                <div class="friend-actions">
                    <button class="btn btn-small btn-success" onclick="acceptFriendRequest('${request._id}')">Accept</button>
                    <button class="btn btn-small btn-secondary" onclick="declineFriendRequest('${request._id}')">Decline</button>
                </div>
            </div>
        `;
    }).join('');
}

async function loadOnlineFriends() {
    // Load all friends and filter for online
    try {
        const response = await fetch('/api/friends', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
            const friends = await response.json();
            // TODO: Filter by online status when implemented
            const container = document.getElementById('friendsOnlineList');
            container.innerHTML = '<p style="text-align: center; color: var(--text-muted); padding: 20px;">Online status coming soon!</p>';
        }
    } catch (error) {
        console.error('Error loading online friends:', error);
    }
}

function startDm(userId) {
    // TODO: Implement starting DM with friend
    closeModal('friendsModal');
    // This would open DM with the user
}

window.switchFriendsTab = switchFriendsTab;
window.displayFriends = displayFriends;
window.displayFriendRequests = displayFriendRequests;
window.startDm = startDm;

// Initialize friends modal when friends button is clicked
document.getElementById('friendsBtn')?.addEventListener('click', () => {
    openModal('friendsModal');
    loadFriends();
});

// Global variable for report
let currentReportMessageId = null;

// ==================== AUTHORIZATION CODE LOOKUP ====================

async function lookupAuthCode() {
    const codeInput = document.getElementById('authCodeInput');
    const code = codeInput.value.trim();
    const resultDiv = document.getElementById('authCodeResult');
    
    if (!code || !/^\d{8}$/.test(code)) {
        resultDiv.style.display = 'block';
        resultDiv.style.borderLeftColor = 'var(--error-color)';
        resultDiv.innerHTML = '<p style="color: var(--error-color); margin: 0;">Please enter a valid 8-digit code.</p>';
        return;
    }
    
    try {
        const response = await fetch(`/api/authorization-codes/${code}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        const data = await response.json();
        
        if (response.ok) {
            // Display code information
            resultDiv.style.display = 'block';
            resultDiv.style.borderLeftColor = 'var(--success-color)';
            resultDiv.innerHTML = `
                <h4 style="margin-top: 0; color: var(--text-bright);">Authorization Code Information</h4>
                <div style="margin-bottom: 8px;">
                    <strong>Code:</strong> <span style="font-family: monospace; font-size: 16px;">${data.code}</span>
                </div>
                <div style="margin-bottom: 8px;">
                    <strong>Description:</strong> ${data.description}
                </div>
                <div style="margin-bottom: 8px;">
                    <strong>Created By:</strong> ${data.createdBy.name} (@${data.createdBy.username})
                </div>
                <div style="margin-bottom: 8px;">
                    <strong>Created:</strong> ${new Date(data.createdAt).toLocaleString()}
                </div>
                <div style="margin-bottom: 8px;">
                    <strong>Status:</strong> 
                    <span style="color: ${data.isExpired ? 'var(--error-color)' : data.isUsed ? 'var(--warning-color)' : 'var(--success-color)'};">
                        ${data.isExpired ? 'EXPIRED' : data.isUsed ? 'USED' : 'ACTIVE'}
                    </span>
                </div>
                ${data.isUsed ? `
                    <div style="margin-bottom: 8px;">
                        <strong>Used By:</strong> ${data.usedBy.name} (@${data.usedBy.username})
                    </div>
                    <div style="margin-bottom: 8px;">
                        <strong>Used On:</strong> ${new Date(data.usedAt).toLocaleString()}
                    </div>
                ` : ''}
                ${data.securityWarning ? `
                    <div style="margin-top: 12px; padding: 12px; background: var(--error-color); color: white; border-radius: 4px;">
                        <strong>⚠️ Security Warning:</strong><br>
                        ${data.securityWarning}
                    </div>
                ` : ''}
                ${!data.isUsed && !data.isExpired ? `
                    <button class="btn btn-primary" style="width: 100%; margin-top: 12px;" onclick="markCodeAsUsed('${code}')">
                        Mark as Used
                    </button>
                ` : ''}
            `;
        } else if (response.status === 403 && data.contactAdmin) {
            // Account has been disabled for security violation
            resultDiv.style.display = 'block';
            resultDiv.style.borderLeftColor = 'var(--error-color)';
            resultDiv.innerHTML = `
                <h4 style="margin-top: 0; color: var(--error-color);">⚠️ SECURITY VIOLATION DETECTED</h4>
                <p style="color: var(--error-color); margin-bottom: 12px;">
                    ${data.error}
                </p>
                <p style="margin: 0; color: var(--text-muted);">
                    Your account has been flagged for attempting to access restricted authorization codes. 
                    A master administrator will review your account. Do not attempt to log in again.
                </p>
            `;
            // Force logout after 3 seconds
            setTimeout(() => {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                window.location.href = '/login';
            }, 3000);
        } else {
            resultDiv.style.display = 'block';
            resultDiv.style.borderLeftColor = 'var(--error-color)';
            resultDiv.innerHTML = `<p style="color: var(--error-color); margin: 0;">${data.error || 'Failed to lookup code'}</p>`;
        }
    } catch (error) {
        console.error('Error looking up authorization code:', error);
        resultDiv.style.display = 'block';
        resultDiv.style.borderLeftColor = 'var(--error-color)';
        resultDiv.innerHTML = '<p style="color: var(--error-color); margin: 0;">An error occurred while looking up the code.</p>';
    }
}

async function markCodeAsUsed(code) {
    if (!confirm('Mark this code as used? This action cannot be undone.')) {
        return;
    }
    
    try {
        const response = await fetch(`/api/authorization-codes/${code}/use`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showNotification('Code marked as used successfully');
            // Refresh the lookup to show updated status
            lookupAuthCode();
        } else {
            alert(`Error: ${data.error || 'Failed to mark code as used'}`);
        }
    } catch (error) {
        console.error('Error marking code as used:', error);
        alert('Failed to mark code as used');
    }
}

window.lookupAuthCode = lookupAuthCode;
window.markCodeAsUsed = markCodeAsUsed;

console.log('All frontend features successfully integrated!');

