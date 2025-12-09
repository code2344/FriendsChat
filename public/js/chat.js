// Check authentication
const token = localStorage.getItem('token');
const user = JSON.parse(localStorage.getItem('user') || '{}');

if (!token || !user.id) {
    window.location.href = '/login';
}

// Initialize Socket.IO
const socket = io();

let currentServer = null;
let currentChannel = null;

// Display user info
document.getElementById('userInfo').innerHTML = `
    <p><strong>${user.username}</strong></p>
    <p>${user.role === 'master_admin' ? 'Master Admin' : user.role === 'admin' ? 'Admin' : 'User'}</p>
`;

// Show admin panel button for admins
if (user.role === 'admin' || user.role === 'master_admin') {
    document.getElementById('adminPanelBtn').style.display = 'block';
    document.getElementById('adminPanelBtn').addEventListener('click', () => {
        window.location.href = '/admin';
    });
}

// Logout
document.getElementById('logoutBtn').addEventListener('click', () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
});

// Load servers
async function loadServers() {
    try {
        const response = await fetch('/api/servers', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            const servers = await response.json();
            displayServers(servers);
        }
    } catch (error) {
        console.error('Error loading servers:', error);
    }
}

function displayServers(servers) {
    const serversList = document.getElementById('serversList');
    serversList.innerHTML = '';

    servers.forEach(server => {
        const serverDiv = document.createElement('div');
        serverDiv.className = 'server-item';
        serverDiv.innerHTML = `
            <button class="btn btn-small" onclick="selectServer('${server._id}')">${server.name}</button>
        `;
        serversList.appendChild(serverDiv);
    });
}

// Select server
async function selectServer(serverId) {
    currentServer = serverId;
    
    try {
        const response = await fetch(`/api/channels/server/${serverId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            const channels = await response.json();
            displayChannels(channels);
            
            // Show create channel button if user has permissions
            document.getElementById('createChannelBtn').style.display = 'block';
        }
    } catch (error) {
        console.error('Error loading channels:', error);
    }
}

function displayChannels(channels) {
    const channelList = document.getElementById('channelList');
    channelList.innerHTML = '';

    channels.forEach(channel => {
        const channelDiv = document.createElement('div');
        channelDiv.className = 'channel-item';
        channelDiv.innerHTML = `
            <button class="btn btn-small" onclick="selectChannel('${channel._id}', '${channel.name}')"># ${channel.name}</button>
        `;
        channelList.appendChild(channelDiv);
    });
}

// Select channel
async function selectChannel(channelId, channelName) {
    currentChannel = channelId;
    
    // Update header
    document.getElementById('channelName').textContent = `# ${channelName}`;
    
    // Join channel via socket
    socket.emit('join-channel', channelId);
    
    // Enable message input
    document.getElementById('messageInput').disabled = false;
    document.querySelector('#messageForm button').disabled = false;
    
    // Load messages
    loadMessages(channelId);
}

async function loadMessages(channelId) {
    try {
        const response = await fetch(`/api/messages/channel/${channelId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            const messages = await response.json();
            displayMessages(messages.reverse());
        }
    } catch (error) {
        console.error('Error loading messages:', error);
    }
}

function displayMessages(messages) {
    const messageArea = document.getElementById('messageArea');
    messageArea.innerHTML = '';

    messages.forEach(message => {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message';
        messageDiv.innerHTML = `
            <div class="message-author">${message.author?.username || 'Unknown'}</div>
            <div class="message-content">${message.content}</div>
            <div class="message-time">${new Date(message.createdAt).toLocaleString()}</div>
        `;
        messageArea.appendChild(messageDiv);
    });

    messageArea.scrollTop = messageArea.scrollHeight;
}

// Send message
document.getElementById('messageForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const content = document.getElementById('messageInput').value.trim();
    
    if (!content || !currentChannel) return;

    try {
        const response = await fetch('/api/messages', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                channelId: currentChannel,
                content
            })
        });

        if (response.ok) {
            const message = await response.json();
            
            // Emit via socket
            socket.emit('send-message', {
                channelId: currentChannel,
                message
            });
            
            // Clear input
            document.getElementById('messageInput').value = '';
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

// Create server modal
document.getElementById('createServerBtn').addEventListener('click', () => {
    document.getElementById('createServerModal').style.display = 'block';
});

document.querySelector('#createServerModal .close').addEventListener('click', () => {
    document.getElementById('createServerModal').style.display = 'none';
});

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
            document.getElementById('createServerModal').style.display = 'none';
            document.getElementById('createServerForm').reset();
            loadServers();
        }
    } catch (error) {
        console.error('Error creating server:', error);
    }
});

// Create channel modal
document.getElementById('createChannelBtn').addEventListener('click', () => {
    document.getElementById('createChannelModal').style.display = 'block';
});

document.querySelector('#createChannelModal .close').addEventListener('click', () => {
    document.getElementById('createChannelModal').style.display = 'none';
});

document.getElementById('createChannelForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    if (!currentServer) return;

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
            document.getElementById('createChannelModal').style.display = 'none';
            document.getElementById('createChannelForm').reset();
            selectServer(currentServer);
        }
    } catch (error) {
        console.error('Error creating channel:', error);
    }
});

// Load initial data
loadServers();
