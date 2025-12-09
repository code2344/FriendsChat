// Check authentication and admin role
const token = localStorage.getItem('token');
const user = JSON.parse(localStorage.getItem('user') || '{}');

if (!token || !user.id || (user.role !== 'admin' && user.role !== 'master_admin')) {
    window.location.href = '/login';
}

// Show master admin sections
if (user.role === 'master_admin') {
    document.querySelectorAll('.master-admin-only').forEach(el => {
        el.style.display = 'block';
    });
}

// Logout
document.getElementById('logoutBtn').addEventListener('click', () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
});

// Navigation
document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const section = btn.dataset.section;
        
        // Update active button
        document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        // Show section
        document.querySelectorAll('.admin-section').forEach(s => s.classList.remove('active'));
        document.getElementById(section).classList.add('active');
        
        // Load section data
        loadSectionData(section);
    });
});

async function loadSectionData(section) {
    switch(section) {
        case 'pending-users':
            loadPendingUsers();
            break;
        case 'reports':
            loadReports();
            break;
        case 'banned-users':
            loadBannedUsers();
            break;
        case 'teacher-requests':
            loadTeacherRequests();
            break;
        case 'all-messages':
            loadAllMessages();
            break;
    }
}

// Pending Users
async function loadPendingUsers() {
    try {
        const response = await fetch('/api/auth/pending-users', {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
            const users = await response.json();
            displayPendingUsers(users);
        }
    } catch (error) {
        console.error('Error loading pending users:', error);
    }
}

function displayPendingUsers(users) {
    const list = document.getElementById('pendingUsersList');
    list.innerHTML = '';

    if (users.length === 0) {
        list.innerHTML = '<p>No pending users</p>';
        return;
    }

    users.forEach(user => {
        const card = document.createElement('div');
        card.className = 'admin-card';
        card.innerHTML = `
            <h3>${user.firstName} ${user.lastName}</h3>
            <p><strong>Username:</strong> ${user.username}</p>
            <p><strong>Email:</strong> ${user.email}</p>
            <p><strong>Student ID:</strong> ${user.studentId}</p>
            <p><strong>Registered:</strong> ${new Date(user.createdAt).toLocaleString()}</p>
            <div>
                <label>Grade Level: <input type="number" id="grade-${user._id}" value="9" min="1" max="12"></label>
            </div>
            <div style="margin-top: 10px;">
                <button class="btn btn-primary" onclick="approveUser('${user._id}')">Approve</button>
                <button class="btn btn-danger" onclick="denyUser('${user._id}')">Deny</button>
            </div>
        `;
        list.appendChild(card);
    });
}

async function approveUser(userId) {
    const gradeLevel = document.getElementById(`grade-${userId}`).value;
    
    try {
        const response = await fetch(`/api/auth/approve/${userId}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ gradeLevel: parseInt(gradeLevel) })
        });

        if (response.ok) {
            alert('User approved successfully');
            loadPendingUsers();
        }
    } catch (error) {
        console.error('Error approving user:', error);
        alert('Failed to approve user');
    }
}

async function denyUser(userId) {
    if (!confirm('Are you sure you want to deny this registration?')) return;
    
    try {
        const response = await fetch(`/api/auth/deny/${userId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
            alert('User registration denied');
            loadPendingUsers();
        }
    } catch (error) {
        console.error('Error denying user:', error);
        alert('Failed to deny user');
    }
}

// Reports
async function loadReports() {
    const status = document.getElementById('reportStatusFilter').value;
    const url = status ? `/api/admin/reports?status=${status}` : '/api/admin/reports';
    
    try {
        const response = await fetch(url, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
            const reports = await response.json();
            displayReports(reports);
        }
    } catch (error) {
        console.error('Error loading reports:', error);
    }
}

document.getElementById('reportStatusFilter').addEventListener('change', loadReports);

function displayReports(reports) {
    const list = document.getElementById('reportsList');
    list.innerHTML = '';

    if (reports.length === 0) {
        list.innerHTML = '<p>No reports found</p>';
        return;
    }

    reports.forEach(report => {
        const card = document.createElement('div');
        card.className = 'admin-card';
        card.innerHTML = `
            <h3>Report #${report._id.slice(-6)}</h3>
            <p><strong>Reported User:</strong> ${report.reportedUser?.username || 'Unknown'}</p>
            <p><strong>Reported By:</strong> ${report.reportedBy?.username || 'Unknown'}</p>
            <p><strong>Reason:</strong> ${report.reason}</p>
            <p><strong>Status:</strong> ${report.status}</p>
            <p><strong>Created:</strong> ${new Date(report.createdAt).toLocaleString()}</p>
            ${report.status === 'pending' ? `
                <div style="margin-top: 10px;">
                    <button class="btn btn-primary" onclick="resolveReport('${report._id}', 'resolved')">Resolve</button>
                    <button class="btn btn-secondary" onclick="resolveReport('${report._id}', 'dismissed')">Dismiss</button>
                </div>
            ` : ''}
        `;
        list.appendChild(card);
    });
}

async function resolveReport(reportId, status) {
    const resolution = prompt('Enter resolution notes:');
    
    try {
        const response = await fetch(`/api/admin/reports/${reportId}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ status, resolution })
        });

        if (response.ok) {
            alert('Report resolved successfully');
            loadReports();
        }
    } catch (error) {
        console.error('Error resolving report:', error);
        alert('Failed to resolve report');
    }
}

// Banned Users
async function loadBannedUsers() {
    try {
        const response = await fetch('/api/admin/banned', {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
            const users = await response.json();
            displayBannedUsers(users);
        }
    } catch (error) {
        console.error('Error loading banned users:', error);
    }
}

function displayBannedUsers(users) {
    const list = document.getElementById('bannedUsersList');
    list.innerHTML = '';

    if (users.length === 0) {
        list.innerHTML = '<p>No banned users</p>';
        return;
    }

    users.forEach(ban => {
        const card = document.createElement('div');
        card.className = 'admin-card';
        card.innerHTML = `
            <h3>${ban.user?.username || 'Unknown'}</h3>
            <p><strong>Name:</strong> ${ban.user?.firstName} ${ban.user?.lastName}</p>
            <p><strong>MAC Address:</strong> ${ban.macAddress}</p>
            <p><strong>Reason:</strong> ${ban.reason}</p>
            <p><strong>Banned By:</strong> ${ban.bannedBy?.username || 'Unknown'}</p>
            <p><strong>Banned At:</strong> ${new Date(ban.bannedAt).toLocaleString()}</p>
        `;
        list.appendChild(card);
    });
}

// Teacher Requests
async function loadTeacherRequests() {
    const status = document.getElementById('teacherRequestStatusFilter').value;
    const url = status ? `/api/teacher-access?status=${status}` : '/api/teacher-access';
    
    try {
        const response = await fetch(url, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
            const requests = await response.json();
            displayTeacherRequests(requests);
        }
    } catch (error) {
        console.error('Error loading teacher requests:', error);
    }
}

document.getElementById('teacherRequestStatusFilter').addEventListener('change', loadTeacherRequests);

function displayTeacherRequests(requests) {
    const list = document.getElementById('teacherRequestsList');
    list.innerHTML = '';

    if (requests.length === 0) {
        list.innerHTML = '<p>No teacher access requests found</p>';
        return;
    }

    requests.forEach(request => {
        const card = document.createElement('div');
        card.className = 'admin-card';
        card.innerHTML = `
            <h3>Request #${request._id.slice(-6)}</h3>
            <p><strong>Teacher:</strong> ${request.teacher.name} (${request.teacher.email})</p>
            <p><strong>Student:</strong> ${request.student?.username || 'Unknown'}</p>
            <p><strong>Reason:</strong> ${request.teacher.reason}</p>
            <p><strong>Status:</strong> ${request.status}</p>
            <p><strong>Approvals:</strong> ${request.approvals.length}/3</p>
            <p><strong>Created:</strong> ${new Date(request.createdAt).toLocaleString()}</p>
            ${request.status === 'pending' ? `
                <div style="margin-top: 10px;">
                    <button class="btn btn-primary" onclick="approveTeacherRequest('${request._id}')">Approve</button>
                    <button class="btn btn-danger" onclick="denyTeacherRequest('${request._id}')">Deny</button>
                </div>
            ` : ''}
        `;
        list.appendChild(card);
    });
}

async function approveTeacherRequest(requestId) {
    try {
        const response = await fetch(`/api/teacher-access/${requestId}/approve`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
            const data = await response.json();
            alert(data.message);
            loadTeacherRequests();
        }
    } catch (error) {
        console.error('Error approving request:', error);
        alert('Failed to approve request');
    }
}

async function denyTeacherRequest(requestId) {
    const reason = prompt('Enter reason for denial:');
    if (!reason) return;
    
    try {
        const response = await fetch(`/api/teacher-access/${requestId}/deny`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ reason })
        });

        if (response.ok) {
            alert('Request denied successfully');
            loadTeacherRequests();
        }
    } catch (error) {
        console.error('Error denying request:', error);
        alert('Failed to deny request');
    }
}

// All Messages (Master Admin Only)
async function loadAllMessages() {
    const type = document.getElementById('messageTypeFilter').value;
    
    try {
        const response = await fetch(`/api/messages/all?type=${type}&limit=50`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
            const messages = await response.json();
            displayAllMessages(messages);
        }
    } catch (error) {
        console.error('Error loading messages:', error);
    }
}

document.getElementById('messageTypeFilter')?.addEventListener('change', loadAllMessages);

function displayAllMessages(messages) {
    const list = document.getElementById('allMessagesList');
    list.innerHTML = '';

    if (messages.length === 0) {
        list.innerHTML = '<p>No messages found</p>';
        return;
    }

    messages.forEach(msg => {
        const card = document.createElement('div');
        card.className = 'admin-card';
        const isChannel = msg.author;
        card.innerHTML = `
            <p><strong>${isChannel ? 'From' : 'Sender'}:</strong> ${isChannel ? msg.author?.username : msg.sender?.username || 'Unknown'}</p>
            ${!isChannel ? `<p><strong>To:</strong> ${msg.recipient?.username || 'Unknown'}</p>` : ''}
            ${isChannel ? `<p><strong>Channel:</strong> ${msg.channel?.name || 'Unknown'}</p>` : ''}
            <p><strong>Content:</strong> ${msg.content}</p>
            <p><strong>Time:</strong> ${new Date(msg.createdAt).toLocaleString()}</p>
        `;
        list.appendChild(card);
    });
}

// Load initial data
loadPendingUsers();
