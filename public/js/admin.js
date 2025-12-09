// Authentication check
const token = localStorage.getItem('token');
const user = JSON.parse(localStorage.getItem('user') || '{}');

if (!token || !user.id) {
    window.location.href = '/login';
}

if (user.role !== 'admin' && user.role !== 'master_admin') {
    alert('Unauthorized access');
    window.location.href = '/chat';
}

// Show master admin sections if master admin
if (user.role === 'master_admin') {
    document.getElementById('masterAdminNav').style.display = 'block';
}

// Section navigation
function showSection(section) {
    document.querySelectorAll('.admin-section').forEach(s => s.style.display = 'none');
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    
    const sectionElement = document.getElementById(`${section}-section`);
    if (sectionElement) {
        sectionElement.style.display = 'block';
        event.target.classList.add('active');
    }

    // Load data for section
    switch(section) {
        case 'dashboard':
            refreshDashboard();
            break;
        case 'users':
            loadUsers();
            break;
        case 'servers':
            loadServers();
            break;
        case 'reports':
            loadReports();
            break;
        case 'bans':
            loadBans();
            break;
        case 'database':
            loadDatabaseStats();
            break;
        case 'archive':
            loadArchiveStats();
            break;
        case 'health':
            loadSystemHealth();
            break;
    }
}

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
}

// Dashboard
async function refreshDashboard() {
    try {
        // Load basic stats for all admins
        const response = await fetch('/api/auth/pending-users', {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        const reportsResponse = await fetch('/api/admin/reports', {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok && reportsResponse.ok) {
            const pendingUsers = await response.json();
            const reports = await reportsResponse.json();
            const pendingReports = reports.filter(r => r.status === 'pending');

            const statCards = document.getElementById('statCards');
            statCards.innerHTML = `
                <div class="stat-card warning">
                    <div class="stat-label">Pending Approvals</div>
                    <div class="stat-value">${pendingUsers.length}</div>
                    <div class="stat-subtitle">User registrations</div>
                </div>
                <div class="stat-card danger">
                    <div class="stat-label">Pending Reports</div>
                    <div class="stat-value">${pendingReports.length}</div>
                    <div class="stat-subtitle">Requires attention</div>
                </div>
            `;
        }

        // Load system health if master admin
        if (user.role === 'master_admin') {
            const healthResponse = await fetch('/api/admin/stats/health', {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (healthResponse.ok) {
                const health = await healthResponse.json();
                
                const overview = document.getElementById('systemOverview');
                overview.innerHTML = `
                    <div class="stat-cards">
                        <div class="stat-card ${health.health.status === 'healthy' ? 'success' : 'warning'}">
                            <div class="stat-label">System Status</div>
                            <div class="stat-value">${health.health.status.toUpperCase()}</div>
                            <div class="stat-subtitle">DB: ${health.health.databaseUsage}</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-label">Messages (24h)</div>
                            <div class="stat-value">${health.activity.last24h.messages}</div>
                            <div class="stat-subtitle">+${health.activity.last24h.directMessages} DMs</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-label">New Users (24h)</div>
                            <div class="stat-value">${health.activity.last24h.newUsers}</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-label">Uptime</div>
                            <div class="stat-value">${Math.floor(health.health.uptime / 3600)}h</div>
                            <div class="stat-subtitle">${Math.floor((health.health.uptime % 3600) / 60)}m</div>
                        </div>
                    </div>
                `;
            }
        }
    } catch (error) {
        console.error('Error loading dashboard:', error);
    }
}

// Users Management
async function loadUsers() {
    try {
        const response = await fetch('/api/auth/pending-users', {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
            const users = await response.json();
            const pendingDiv = document.getElementById('pendingUsers');

            if (users.length === 0) {
                pendingDiv.innerHTML = '<p style="color: var(--text-muted); padding: 20px;">No pending approvals</p>';
                return;
            }

            pendingDiv.innerHTML = users.map(u => `
                <div class="table-row">
                    <div>
                        <div style="font-weight: 600; color: var(--text-bright);">${u.username}</div>
                        <div style="font-size: 14px; color: var(--text-muted);">
                            ${u.firstName} ${u.lastName} - ${u.email}
                        </div>
                        <div style="font-size: 12px; color: var(--text-muted); margin-top: 4px;">
                            Student ID: ${u.studentId}
                        </div>
                    </div>
                    <div class="action-buttons">
                        <button class="btn btn-small btn-primary" onclick="approveUser('${u._id}')">✓ Approve</button>
                        <button class="btn btn-small btn-danger" onclick="denyUser('${u._id}')">✗ Deny</button>
                    </div>
                </div>
            `).join('');
        }
    } catch (error) {
        console.error('Error loading users:', error);
    }
}

async function approveUser(userId) {
    try {
        const response = await fetch(`/api/auth/approve/${userId}`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
            alert('User approved successfully');
            loadUsers();
            refreshDashboard();
        }
    } catch (error) {
        console.error('Error approving user:', error);
    }
}

async function denyUser(userId) {
    if (!confirm('Are you sure you want to deny this user?')) return;

    try {
        const response = await fetch(`/api/auth/deny/${userId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
            alert('User denied and removed');
            loadUsers();
            refreshDashboard();
        }
    } catch (error) {
        console.error('Error denying user:', error);
    }
}

// Servers
async function loadServers() {
    try {
        const response = await fetch('/api/servers/all', {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
            const servers = await response.json();
            const serversList = document.getElementById('serversList');

            serversList.innerHTML = servers.map(s => `
                <div class="table-row">
                    <div>
                        <div style="font-weight: 600; color: var(--text-bright);">${s.name}</div>
                        <div style="font-size: 14px; color: var(--text-muted);">
                            Owner: ${s.owner?.username} | Members: ${s.members?.length || 0}
                        </div>
                        <div style="font-size: 12px; color: var(--text-muted); margin-top: 4px;">
                            ${s.isPublic ? '<span class="user-badge badge-approved">PUBLIC</span>' : '<span class="user-badge">PRIVATE</span>'}
                        </div>
                    </div>
                </div>
            `).join('');
        }
    } catch (error) {
        console.error('Error loading servers:', error);
    }
}

// Reports
async function loadReports() {
    try {
        const response = await fetch('/api/admin/reports', {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
            const reports = await response.json();
            const reportsList = document.getElementById('reportsList');

            if (reports.length === 0) {
                reportsList.innerHTML = '<p style="color: var(--text-muted); padding: 20px;">No reports</p>';
                return;
            }

            reportsList.innerHTML = reports.map(r => `
                <div class="table-row">
                    <div>
                        <div style="font-weight: 600; color: var(--text-bright);">
                            ${r.reportedUser?.username || 'Unknown'}
                            <span class="user-badge ${r.status === 'pending' ? 'badge-pending' : 'badge-approved'}">
                                ${r.status.toUpperCase()}
                            </span>
                        </div>
                        <div style="font-size: 14px; color: var(--text-muted);">
                            Reported by: ${r.reportedBy?.username} | ${r.reason}
                        </div>
                        <div style="font-size: 12px; color: var(--text-muted); margin-top: 4px;">
                            ${new Date(r.createdAt).toLocaleString()}
                        </div>
                    </div>
                    ${r.status === 'pending' ? `
                        <div class="action-buttons">
                            <button class="btn btn-small btn-primary" onclick="resolveReport('${r._id}', 'resolved')">✓ Resolve</button>
                            <button class="btn btn-small btn-danger" onclick="resolveReport('${r._id}', 'dismissed')">✗ Dismiss</button>
                        </div>
                    ` : ''}
                </div>
            `).join('');
        }
    } catch (error) {
        console.error('Error loading reports:', error);
    }
}

async function resolveReport(reportId, status) {
    try {
        const response = await fetch(`/api/admin/reports/${reportId}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ status, resolution: 'Handled by admin' })
        });

        if (response.ok) {
            alert('Report updated');
            loadReports();
            refreshDashboard();
        }
    } catch (error) {
        console.error('Error resolving report:', error);
    }
}

// Bans
async function loadBans() {
    try {
        const response = await fetch('/api/admin/banned', {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
            const bans = await response.json();
            const bansList = document.getElementById('bansList');

            if (bans.length === 0) {
                bansList.innerHTML = '<p style="color: var(--text-muted); padding: 20px;">No banned users</p>';
                return;
            }

            bansList.innerHTML = bans.map(b => `
                <div class="table-row">
                    <div>
                        <div style="font-weight: 600; color: var(--error-color);">
                            ${b.user?.username || 'Unknown'}
                            <span class="user-badge badge-banned">BANNED</span>
                        </div>
                        <div style="font-size: 14px; color: var(--text-muted);">
                            Reason: ${b.reason}
                        </div>
                        <div style="font-size: 12px; color: var(--text-muted); margin-top: 4px;">
                            By: ${b.bannedBy?.username} | ${new Date(b.bannedAt).toLocaleString()}
                        </div>
                    </div>
                </div>
            `).join('');
        }
    } catch (error) {
        console.error('Error loading bans:', error);
    }
}

// Database Stats (Master Admin)
async function loadDatabaseStats() {
    if (user.role !== 'master_admin') return;

    try {
        const response = await fetch('/api/admin/stats/database', {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
            const stats = await response.json();
            const dbStatCards = document.getElementById('dbStatCards');

            const usagePercent = stats.database.percentUsed;
            const progressClass = usagePercent > 75 ? 'danger' : usagePercent > 50 ? 'warning' : '';

            dbStatCards.innerHTML = `
                <div class="stat-card ${usagePercent > 75 ? 'danger' : usagePercent > 50 ? 'warning' : 'success'}">
                    <div class="stat-label">Database Usage</div>
                    <div class="stat-value">${usagePercent}%</div>
                    <div class="progress-bar">
                        <div class="progress-fill ${progressClass}" style="width: ${usagePercent}%"></div>
                    </div>
                    <div class="stat-subtitle">${(stats.database.dataSize / 1024 / 1024).toFixed(2)} MB / 512 MB</div>
                </div>
                <div class="stat-card">
                    <div class="stat-label">Total Objects</div>
                    <div class="stat-value">${stats.database.objects.toLocaleString()}</div>
                    <div class="stat-subtitle">${stats.database.collections} collections</div>
                </div>
                <div class="stat-card">
                    <div class="stat-label">Messages</div>
                    <div class="stat-value">${stats.counts.messages.toLocaleString()}</div>
                    <div class="stat-subtitle">+${stats.counts.directMessages} DMs</div>
                </div>
                <div class="stat-card">
                    <div class="stat-label">Users & Servers</div>
                    <div class="stat-value">${stats.counts.users}</div>
                    <div class="stat-subtitle">${stats.counts.servers} servers, ${stats.counts.channels} channels</div>
                </div>
            `;
        }
    } catch (error) {
        console.error('Error loading database stats:', error);
    }
}

async function triggerArchive() {
    if (!confirm('This will archive messages older than 30 days. Continue?')) return;

    try {
        const response = await fetch('/api/admin/archive/trigger', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ daysOld: 30 })
        });

        if (response.ok) {
            const result = await response.json();
            alert(`Archive complete!\nMessages archived: ${result.messagesArchived}\nReports archived: ${result.reportsArchived}`);
            loadDatabaseStats();
            loadArchiveStats();
        }
    } catch (error) {
        console.error('Error triggering archive:', error);
    }
}

// Archive Stats (Master Admin)
async function loadArchiveStats() {
    if (user.role !== 'master_admin') return;

    try {
        const response = await fetch('/api/admin/stats/database', {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
            const stats = await response.json();
            const archiveStatCards = document.getElementById('archiveStatCards');

            if (stats.archive) {
                archiveStatCards.innerHTML = `
                    <div class="stat-card success">
                        <div class="stat-label">Archived Items</div>
                        <div class="stat-value">${stats.archive.totalArchived}</div>
                        <div class="stat-subtitle">Total items archived</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-label">Space Saved</div>
                        <div class="stat-value">${(stats.archive.spaceSaved / 1024 / 1024).toFixed(2)}</div>
                        <div class="stat-subtitle">MB saved</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-label">Compression</div>
                        <div class="stat-value">${stats.archive.averageCompression}%</div>
                        <div class="stat-subtitle">Average compression ratio</div>
                    </div>
                `;
            }
        }
    } catch (error) {
        console.error('Error loading archive stats:', error);
    }
}

async function searchArchive() {
    const query = document.getElementById('archiveSearchInput').value;
    if (!query) return;

    try {
        const response = await fetch(`/api/admin/archive/search?username=${encodeURIComponent(query)}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
            const results = await response.json();
            const resultsDiv = document.getElementById('archiveResults');

            if (results.length === 0) {
                resultsDiv.innerHTML = '<p style="color: var(--text-muted);">No archived data found</p>';
                return;
            }

            resultsDiv.innerHTML = `
                <h4 style="margin-bottom: 12px;">Found ${results.length} results</h4>
                ${results.map(r => `
                    <div class="table-row">
                        <div>
                            <div style="font-weight: 600; color: var(--text-bright);">
                                ${r.author?.username || r.sender?.username || 'Unknown'}
                                <span class="user-badge">ARCHIVED</span>
                            </div>
                            <div style="font-size: 14px; color: var(--text-muted);">
                                ${r.content ? r.content.substring(0, 100) + '...' : 'No content'}
                            </div>
                            <div style="font-size: 12px; color: var(--text-muted); margin-top: 4px;">
                                Archived: ${new Date(r._archivedAt).toLocaleString()}
                            </div>
                        </div>
                    </div>
                `).join('')}
            `;
        }
    } catch (error) {
        console.error('Error searching archive:', error);
    }
}

// System Health (Master Admin)
async function loadSystemHealth() {
    if (user.role !== 'master_admin') return;

    try {
        const response = await fetch('/api/admin/stats/health', {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
            const health = await response.json();
            const healthStatCards = document.getElementById('healthStatCards');

            healthStatCards.innerHTML = `
                <div class="stat-card ${health.health.status === 'healthy' ? 'success' : 'warning'}">
                    <div class="stat-label">System Status</div>
                    <div class="stat-value">${health.health.status.toUpperCase()}</div>
                    <div class="stat-subtitle">Database: ${health.health.databaseUsage}</div>
                </div>
                <div class="stat-card">
                    <div class="stat-label">Memory Usage</div>
                    <div class="stat-value">${(health.health.memoryUsage.heapUsed / 1024 / 1024).toFixed(0)}</div>
                    <div class="stat-subtitle">MB used</div>
                </div>
                <div class="stat-card">
                    <div class="stat-label">Uptime</div>
                    <div class="stat-value">${Math.floor(health.health.uptime / 3600)}</div>
                    <div class="stat-subtitle">hours</div>
                </div>
                <div class="stat-card">
                    <div class="stat-label">Messages (24h)</div>
                    <div class="stat-value">${health.activity.last24h.messages}</div>
                    <div class="stat-subtitle">+${health.activity.last24h.directMessages} DMs</div>
                </div>
            `;

            const activityChart = document.getElementById('activityChart');
            activityChart.innerHTML = `
                <div class="stat-cards">
                    <div class="stat-card">
                        <div class="stat-label">New Users</div>
                        <div class="stat-value">${health.activity.last24h.newUsers}</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-label">Messages (7d)</div>
                        <div class="stat-value">${health.activity.last7d.messages}</div>
                    </div>
                </div>
            `;
        }
    } catch (error) {
        console.error('Error loading system health:', error);
    }
}

// Initialize
refreshDashboard();
