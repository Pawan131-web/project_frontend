/* ===== ADMIN DASHBOARD FUNCTIONALITY ===== */

// Check admin authentication
function checkAdminAuth() {
    const token = localStorage.getItem('adminToken');
    const adminDataRaw = localStorage.getItem('adminData');
    const adminData = adminDataRaw ? JSON.parse(adminDataRaw) : null;
    
    if (!token || !adminData || !adminData.email) {
        // Clean up legacy flags to avoid redirect loops
        localStorage.removeItem('adminLoggedIn');
        localStorage.removeItem('adminEmail');
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminData');
        window.location.href = 'login-admin.html';
        return false;
    }
    
    // Display admin info from current session
    const emailEl = document.getElementById('adminEmailDisplay');
    if (emailEl) emailEl.textContent = adminData.email;
    
    const nameEl = document.getElementById('adminName');
    if (nameEl && adminData.fullName) {
        nameEl.textContent = adminData.fullName;
    }
    
    return true;
}

// Initialize dashboard
function initializeDashboard() {
    console.log('🚀 Admin Dashboard Initialized');
    
    // Setup navigation
    setupNavigation();
    
    // Initialize charts
    initializeCharts();
    
    // Setup event listeners
    setupEventListeners();
    
    // Load default section
    loadSection('dashboard');
    
    // Update last login time
    updateLastLogin();
}

// Navigation setup
function setupNavigation() {
    const navLinks = document.querySelectorAll('.nav-link');
    
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Remove active class from all links
            navLinks.forEach(l => l.classList.remove('active'));
            
            // Add active class to clicked link
            this.classList.add('active');
            
            // Load the section
            const section = this.getAttribute('data-section');
            loadSection(section);
        });
    });
}

// Load section content
function loadSection(section) {
    console.log(`Loading section: ${section}`);
    
    // Hide all sections
    document.querySelectorAll('.section-content').forEach(div => {
        div.classList.add('hidden');
    });
    
    // Show selected section
    const sectionElement = document.getElementById(`${section}Section`);
    if (sectionElement) {
        sectionElement.classList.remove('hidden');
    }
    
    // Update title
    updateSectionTitle(section);
    
    // Load section data
    loadSectionData(section);
}

// Update section title
function updateSectionTitle(section) {
    const titles = {
        dashboard: 'Dashboard',
        users: 'User Management',
        organizations: 'Organizations',
        reports: 'Reports & Moderation',
        content: 'Content Management',
        analytics: 'Analytics',
        skills: 'Skill Management',
        announcements: 'Announcements',
        settings: 'Platform Settings'
    };
    
    const subtitles = {
        dashboard: 'Admin overview and quick actions',
        users: 'Manage students and organizations',
        organizations: 'Verify and manage organizations',
        reports: 'Review reported content and users',
        content: 'Manage posts and internships',
        analytics: 'Platform analytics and insights',
        skills: 'Add/edit skills and categories',
        announcements: 'Send notifications to users',
        settings: 'Configure platform settings and preferences'
    };
    
    document.getElementById('sectionTitle').textContent = titles[section] || section;
    document.getElementById('sectionSubtitle').textContent = subtitles[section] || '';
}

// Load section data dynamically
function loadSectionData(section) {
    switch(section) {
        case 'dashboard':
            loadDashboardData();
            break;
        case 'users':
            loadUsersSection();
            break;
        case 'organizations':
            loadOrganizationsSection();
            break;
        case 'reports':
            loadReportsSection();
            break;
        case 'content':
            loadContentSection();
            break;
        case 'analytics':
            loadAnalyticsSection();
            break;
        case 'skills':
            loadSkillsSection();
            break;
        case 'announcements':
            loadAnnouncementsSection();
            break;
        case 'settings':
            loadSettingsSection();
            break;
    }
}

// Load real-time dashboard data from backend
async function loadDashboardData() {
    const adminToken = localStorage.getItem('adminToken');
    
    try {
        // Fetch platform overview
        const overviewRes = await fetch('http://localhost:5000/api/admin/analytics/overview', {
            headers: { 'Authorization': `Bearer ${adminToken}` }
        });
        const overviewData = await overviewRes.json();
        
        if (overviewData.success && overviewData.overview) {
            const o = overviewData.overview;
            
            // Update stat cards
            const statCards = document.querySelectorAll('.stat-card');
            if (statCards[0]) statCards[0].querySelector('.stat-number').textContent = o.totalUsers?.toLocaleString() || '0';
            if (statCards[1]) statCards[1].querySelector('.stat-number').textContent = o.totalOrganizations?.toLocaleString() || '0';
            if (statCards[2]) statCards[2].querySelector('.stat-number').textContent = o.activeInternships?.toLocaleString() || '0';
            if (statCards[3]) statCards[3].querySelector('.stat-number').textContent = o.pendingVerifications?.toLocaleString() || '0';
        }

        // Fetch recent activity
        const activityRes = await fetch('http://localhost:5000/api/admin/analytics/activity-logs?limit=5', {
            headers: { 'Authorization': `Bearer ${adminToken}` }
        });
        const activityData = await activityRes.json();
        
        if (activityData.success && activityData.logs) {
            updateRecentActivity(activityData.logs);
        }

    } catch (error) {
        console.error('Error loading dashboard data:', error);
    }
}

function updateRecentActivity(logs) {
    const activityContainer = document.getElementById('recentActivityList');
    if (!activityContainer) return;

    if (logs.length === 0) {
        activityContainer.innerHTML = '<p class="text-gray-500 text-center py-4">No recent activity</p>';
        return;
    }

    const getActionIcon = (action) => {
        const icons = {
            'user_blocked': 'fa-ban text-red-500',
            'user_unblocked': 'fa-unlock text-green-500',
            'org_verified': 'fa-check-circle text-green-500',
            'org_rejected': 'fa-times-circle text-red-500',
            'post_removed': 'fa-trash text-orange-500',
            'announcement_sent': 'fa-bullhorn text-blue-500',
            'login': 'fa-sign-in-alt text-purple-500'
        };
        return icons[action] || 'fa-circle text-gray-500';
    };

    activityContainer.innerHTML = logs.map(log => `
        <div class="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg">
            <div class="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                <i class="fas ${getActionIcon(log.action)}"></i>
            </div>
            <div class="flex-1">
                <p class="text-sm font-medium text-gray-800">${log.details || log.action}</p>
                <p class="text-xs text-gray-500">${new Date(log.createdAt).toLocaleString()}</p>
            </div>
        </div>
    `).join('');
}

// Initialize charts
function initializeCharts() {
    // User Growth Chart
    const userCtx = document.getElementById('userGrowthChart').getContext('2d');
    new Chart(userCtx, {
        type: 'line',
        data: {
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
            datasets: [{
                label: 'Students',
                data: [1200, 1900, 3000, 3800, 4200, 5100],
                borderColor: '#d32f2f',
                backgroundColor: 'rgba(211, 47, 47, 0.1)',
                tension: 0.4
            }, {
                label: 'Organizations',
                data: [300, 500, 800, 1100, 1300, 1500],
                borderColor: '#1a237e',
                backgroundColor: 'rgba(26, 35, 126, 0.1)',
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'top',
                }
            }
        }
    });
    
    // Internship Chart
    const internCtx = document.getElementById('internshipChart').getContext('2d');
    new Chart(internCtx, {
        type: 'bar',
        data: {
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
            datasets: [{
                label: 'Internship Posts',
                data: [45, 60, 75, 90, 110, 130],
                backgroundColor: '#1a237e',
                borderColor: '#1a237e',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

// Setup event listeners
function setupEventListeners() {
    // Logout button
    document.getElementById('logoutBtn').addEventListener('click', function(e) {
        e.preventDefault();
        logoutAdmin();
    });
    
    // Search functionality
    const searchInput = document.querySelector('input[type="text"]');
    searchInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            performSearch(this.value);
        }
    });

    const notificationsBtn = document.getElementById('adminNotificationsBtn');
    const notificationsPanel = document.getElementById('adminNotificationsPanel');
    const notificationsOverlay = document.getElementById('adminNotificationsOverlay');
    const notificationsCloseBtn = document.getElementById('adminNotificationsCloseBtn');

    if (notificationsBtn && notificationsPanel && notificationsOverlay) {
        const closePanel = () => {
            notificationsPanel.classList.add('translate-x-full');
            notificationsOverlay.classList.add('hidden');
        };

        const openPanel = async () => {
            notificationsOverlay.classList.remove('hidden');
            notificationsPanel.classList.remove('translate-x-full');
            await loadAdminNotifications();
        };

        notificationsBtn.addEventListener('click', (e) => {
            e.preventDefault();
            openPanel();
        });

        notificationsOverlay.addEventListener('click', closePanel);
        if (notificationsCloseBtn) notificationsCloseBtn.addEventListener('click', closePanel);

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') closePanel();
        });
    }
}

async function loadAdminNotifications() {
    const list = document.getElementById('adminNotificationsList');
    if (!list) return;

    list.innerHTML = `
        <div class="flex items-center justify-center py-10 text-gray-500">
            <i class="fas fa-spinner fa-spin mr-3"></i> Loading...
        </div>
    `;

    try {
        const admin = JSON.parse(localStorage.getItem('adminData') || '{}');
        const adminId = admin?.id || admin?._id;

        if (!adminId) {
            list.innerHTML = `<p class="text-sm text-gray-600">No admin session found.</p>`;
            return;
        }

        const res = await fetch(`http://localhost:5000/api/notifications/${adminId}`);
        const data = await res.json();

        const notifications = data?.success && Array.isArray(data.notifications) ? data.notifications : [];

        if (notifications.length === 0) {
            list.innerHTML = `
                <div class="text-center py-10 text-gray-500">
                    <i class="fas fa-bell-slash text-3xl mb-3"></i>
                    <p>No notifications</p>
                </div>
            `;
            return;
        }

        list.innerHTML = notifications.slice(0, 20).map(n => `
            <div class="border rounded-lg p-4 mb-3 ${n.isRead ? 'bg-white' : 'bg-red-50 border-red-200'}">
                <div class="flex items-start justify-between gap-3">
                    <div>
                        <p class="font-semibold text-gray-800">${n.title || 'Notification'}</p>
                        <p class="text-sm text-gray-600 mt-1">${n.message || ''}</p>
                        <p class="text-xs text-gray-400 mt-2">${n.createdAt ? new Date(n.createdAt).toLocaleString() : ''}</p>
                    </div>
                    <button class="text-gray-400 hover:text-gray-600" onclick="markAdminNotificationRead('${n._id || n.id}')">
                        <i class="fas fa-check"></i>
                    </button>
                </div>
            </div>
        `).join('');

    } catch (error) {
        console.error('Error loading admin notifications:', error);
        list.innerHTML = `<p class="text-sm text-gray-600">Notifications are unavailable right now.</p>`;
    }
}

async function markAdminNotificationRead(notificationId) {
    try {
        await fetch(`http://localhost:5000/api/notifications/${notificationId}/read`, { method: 'PUT' });
        loadAdminNotifications();
    } catch (error) {
        console.error('Error marking admin notification read:', error);
    }
}
window.markAdminNotificationRead = markAdminNotificationRead;

// Update last login time
function updateLastLogin() {
    const now = new Date();
    const options = { 
        weekday: 'short', 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    };
    const formattedTime = now.toLocaleTimeString('en-US', options);
    document.getElementById('lastLogin').textContent = formattedTime;
}

// Perform search - search users and organizations
async function performSearch(query) {
    if (!query.trim()) return;
    
    console.log(`Searching: ${query}`);
    showNotification(`Searching for "${query}"...`, 'info');
    
    try {
        // Search users from backend
        const response = await window.AdminAPIs.User.getAll({ search: query, limit: 20 });
        
        if (response.success && response.users.length > 0) {
            showNotification(`Found ${response.users.length} result(s) for "${query}"`, 'success');
            displaySearchResults(response.users, query);
        } else {
            showNotification(`No results found for "${query}"`, 'info');
        }
    } catch (error) {
        console.error('Search error:', error);
        showNotification('Search failed. Please try again.', 'error');
    }
}

// Display search results in a modal
function displaySearchResults(users, query) {
    // Create modal
    const modal = document.createElement('div');
    modal.id = 'searchResultsModal';
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
    modal.innerHTML = `
        <div class="bg-white rounded-lg w-full max-w-2xl max-h-[80vh] overflow-hidden">
            <div class="p-4 border-b flex justify-between items-center">
                <h3 class="text-lg font-bold">Search Results for "${query}"</h3>
                <button onclick="document.getElementById('searchResultsModal').remove()" class="text-gray-500 hover:text-gray-700">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="p-4 overflow-y-auto max-h-[60vh]">
                ${users.map(user => `
                    <div class="flex items-center justify-between p-3 border-b hover:bg-gray-50">
                        <div class="flex items-center gap-3">
                            <div class="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
                                ${user.fullName.charAt(0)}
                            </div>
                            <div>
                                <p class="font-medium">${user.fullName}</p>
                                <p class="text-sm text-gray-500">@${user.username} • ${user.email}</p>
                            </div>
                        </div>
                        <div class="flex items-center gap-2">
                            <span class="px-2 py-1 text-xs rounded-full ${user.userType === 'student' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'}">
                                ${user.userType}
                            </span>
                            <span class="px-2 py-1 text-xs rounded-full ${user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}">
                                ${user.isActive ? 'Active' : 'Blocked'}
                            </span>
                        </div>
                    </div>
                `).join('')}
            </div>
            <div class="p-4 border-t bg-gray-50">
                <p class="text-sm text-gray-600">Showing ${users.length} result(s)</p>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    
    // Close on background click
    modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.remove();
    });
}

// Show notification
function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg ${
        type === 'success' ? 'bg-green-100 text-green-800 border border-green-200' :
        type === 'error' ? 'bg-red-100 text-red-800 border border-red-200' :
        'bg-blue-100 text-blue-800 border border-blue-200'
    }`;
    
    notification.innerHTML = `
        <div class="flex items-center gap-3">
            <i class="fas ${
                type === 'success' ? 'fa-check-circle' :
                type === 'error' ? 'fa-exclamation-circle' :
                'fa-info-circle'
            }"></i>
            <span>${message}</span>
            <button onclick="this.parentElement.parentElement.remove()" class="ml-4 text-gray-500 hover:text-gray-700">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
        }
    }, 5000);
}

// Logout admin
function logoutAdmin() {
    if (confirm('Are you sure you want to log out?')) {
        localStorage.removeItem('adminLoggedIn');
        localStorage.removeItem('adminEmail');
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminData');

        showNotification('Logged out successfully', 'success');

        setTimeout(() => {
            window.location.href = 'login-admin.html';
        }, 1000);
    }
}

// ===== SECTION DATA LOADERS =====

// Current page state for users
let currentUsersPage = 1;
let currentUsersFilter = { userType: '', status: '' };

// Load users section
async function loadUsersSection() {
    const usersSection = document.getElementById('usersSection');
    
    usersSection.innerHTML = `
        <div class="flex justify-center items-center h-64">
            <div class="text-center">
                <i class="fas fa-spinner fa-spin text-3xl text-[#d32f2f] mb-4"></i>
                <p class="text-gray-600">Loading users...</p>
            </div>
        </div>
    `;
    
    try {
        const response = await window.AdminAPIs.User.getAll({
            page: currentUsersPage,
            limit: 10,
            userType: currentUsersFilter.userType,
            status: currentUsersFilter.status
        });
        
        if (!response.success) {
            throw new Error(response.message || 'Failed to load users');
        }
        
        displayUsersSection(response);
        
    } catch (error) {
        console.error('Error loading users:', error);
        usersSection.innerHTML = `
            <div class="text-center py-10">
                <i class="fas fa-exclamation-triangle text-3xl text-red-500 mb-4"></i>
                <h3 class="text-xl font-bold text-gray-800 mb-2">Failed to Load Users</h3>
                <p class="text-gray-600 mb-4">${error.message}</p>
                <button onclick="loadUsersSection()" class="px-4 py-2 bg-[#d32f2f] text-white rounded-lg hover:bg-[#b71c1c]">
                    <i class="fas fa-redo mr-2"></i> Try Again
                </button>
            </div>
        `;
    }
}

// Display users section with data
function displayUsersSection(data) {
    const usersSection = document.getElementById('usersSection');
    
    usersSection.innerHTML = `
        <div class="mb-6">
            <div class="flex justify-between items-center">
                <h2 class="text-xl font-bold text-gray-800">User Management</h2>
                <div class="flex gap-3">
                    <button onclick="loadUsersSection()" class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                        <i class="fas fa-sync-alt mr-2"></i> Refresh
                    </button>
                </div>
            </div>
            <p class="text-gray-600 mt-2">Manage all student and organization accounts (${data.total} total)</p>
        </div>
        
        <!-- Filters -->
        <div class="flex flex-wrap gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">User Type</label>
                <select id="userTypeFilter" class="border rounded-lg px-3 py-2 w-40">
                    <option value="">All Users</option>
                    <option value="student" ${currentUsersFilter.userType === 'student' ? 'selected' : ''}>Students</option>
                    <option value="organization" ${currentUsersFilter.userType === 'organization' ? 'selected' : ''}>Organizations</option>
                </select>
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select id="userStatusFilter" class="border rounded-lg px-3 py-2 w-40">
                    <option value="">All Status</option>
                    <option value="active" ${currentUsersFilter.status === 'active' ? 'selected' : ''}>Active</option>
                    <option value="blocked" ${currentUsersFilter.status === 'blocked' ? 'selected' : ''}>Blocked</option>
                    <option value="verified" ${currentUsersFilter.status === 'verified' ? 'selected' : ''}>Verified</option>
                    <option value="unverified" ${currentUsersFilter.status === 'unverified' ? 'selected' : ''}>Unverified</option>
                </select>
            </div>
            <div class="flex items-end">
                <button onclick="applyUserFilters()" class="px-4 py-2 bg-[#d32f2f] text-white rounded-lg hover:bg-[#b71c1c]">
                    <i class="fas fa-filter mr-2"></i> Filter
                </button>
            </div>
        </div>
        
        <!-- Users Table -->
        <div class="bg-white border rounded-lg overflow-hidden">
            <div class="overflow-x-auto">
                <table class="w-full">
                    <thead class="bg-gray-50">
                        <tr>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Joined</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-gray-200">
                        ${generateRealUsersTable(data.users)}
                    </tbody>
                </table>
            </div>
        </div>
        
        <!-- Pagination -->
        <div class="flex justify-between items-center mt-6">
            <div class="text-gray-600">
                Showing ${((data.page - 1) * 10) + 1}-${Math.min(data.page * 10, data.total)} of ${data.total} users
            </div>
            <div class="flex gap-2">
                <button onclick="changeUsersPage(${data.page - 1})" 
                        class="px-3 py-2 border rounded-lg hover:bg-gray-50 ${data.page <= 1 ? 'opacity-50 cursor-not-allowed' : ''}"
                        ${data.page <= 1 ? 'disabled' : ''}>
                    Previous
                </button>
                ${generatePaginationButtons(data.page, data.pages)}
                <button onclick="changeUsersPage(${data.page + 1})" 
                        class="px-3 py-2 border rounded-lg hover:bg-gray-50 ${data.page >= data.pages ? 'opacity-50 cursor-not-allowed' : ''}"
                        ${data.page >= data.pages ? 'disabled' : ''}>
                    Next
                </button>
            </div>
        </div>
    `;
    
    // Setup action buttons
    setTimeout(() => {
        setupUserActionButtons();
    }, 100);
}

// Generate real users table from API data
function generateRealUsersTable(users) {
    if (!users || users.length === 0) {
        return `
            <tr>
                <td colspan="6" class="px-6 py-8 text-center text-gray-500">
                    <i class="fas fa-users text-3xl mb-3"></i>
                    <p class="text-lg">No users found</p>
                </td>
            </tr>
        `;
    }
    
    return users.map(user => `
        <tr class="hover:bg-gray-50">
            <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 bg-gradient-to-br ${user.userType === 'student' ? 'from-blue-500 to-cyan-500' : 'from-purple-500 to-pink-500'} rounded-full flex items-center justify-center text-white font-bold">
                        ${user.fullName.charAt(0)}
                    </div>
                    <div>
                        <p class="font-medium text-gray-900">${user.fullName}</p>
                        <p class="text-sm text-gray-500">@${user.username}</p>
                    </div>
                </div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                <span class="px-3 py-1 rounded-full text-xs font-medium ${
                    user.userType === 'student' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                }">
                    ${user.userType.charAt(0).toUpperCase() + user.userType.slice(1)}
                </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-gray-700">${user.email}</td>
            <td class="px-6 py-4 whitespace-nowrap text-gray-700">${formatDate(user.createdAt)}</td>
            <td class="px-6 py-4 whitespace-nowrap">
                <span class="px-3 py-1 rounded-full text-xs font-medium ${
                    user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }">
                    ${user.isActive ? 'Active' : 'Blocked'}
                </span>
                ${user.isVerified ? '<span class="ml-1 px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">Verified</span>' : ''}
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex gap-2">
                    <button class="btn-view-user px-3 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700" 
                            data-user-id="${user.id}">
                        <i class="fas fa-eye mr-1"></i> View
                    </button>
                    <button class="btn-block-user px-3 py-1 ${user.isActive ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'} text-white rounded text-xs" 
                            data-user-id="${user.id}"
                            data-user-name="${user.fullName}"
                            data-is-active="${user.isActive}">
                        ${user.isActive ? '<i class="fas fa-ban mr-1"></i> Block' : '<i class="fas fa-unlock mr-1"></i> Unblock'}
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

// Generate pagination buttons
function generatePaginationButtons(currentPage, totalPages) {
    let buttons = '';
    const maxButtons = 5;
    let startPage = Math.max(1, currentPage - 2);
    let endPage = Math.min(totalPages, startPage + maxButtons - 1);
    
    if (endPage - startPage < maxButtons - 1) {
        startPage = Math.max(1, endPage - maxButtons + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
        buttons += `
            <button onclick="changeUsersPage(${i})" 
                    class="px-3 py-2 rounded-lg ${i === currentPage ? 'bg-[#d32f2f] text-white' : 'border hover:bg-gray-50'}">
                ${i}
            </button>
        `;
    }
    return buttons;
}

// Change users page
function changeUsersPage(page) {
    if (page < 1) return;
    currentUsersPage = page;
    loadUsersSection();
}

// Apply user filters
function applyUserFilters() {
    currentUsersFilter.userType = document.getElementById('userTypeFilter').value;
    currentUsersFilter.status = document.getElementById('userStatusFilter').value;
    currentUsersPage = 1;
    loadUsersSection();
}

// Setup user action buttons
function setupUserActionButtons() {
    document.querySelectorAll('.btn-block-user').forEach(btn => {
        btn.addEventListener('click', async function() {
            const userId = this.getAttribute('data-user-id');
            const userName = this.getAttribute('data-user-name');
            const isActive = this.getAttribute('data-is-active') === 'true';
            await toggleUserBlockReal(userId, userName, isActive, this);
        });
    });
    
    document.querySelectorAll('.btn-view-user').forEach(btn => {
        btn.addEventListener('click', async function() {
            const userId = this.getAttribute('data-user-id');
            await viewUserDetailsReal(userId);
        });
    });
}

// Toggle user block with real API
async function toggleUserBlockReal(userId, userName, isActive, button) {
    const action = isActive ? 'block' : 'unblock';
    
    if (!confirm(`Are you sure you want to ${action} ${userName}?`)) return;
    
    const originalText = button.innerHTML;
    button.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
    button.disabled = true;
    
    try {
        const response = await window.AdminAPIs.User.updateStatus(userId, { action });
        
        if (response.success) {
            showNotification(`${userName} ${action}ed successfully`, 'success');
            loadUsersSection();
        } else {
            showNotification(`Failed to ${action}: ${response.message}`, 'error');
            button.innerHTML = originalText;
            button.disabled = false;
        }
    } catch (error) {
        console.error(`Error ${action}ing user:`, error);
        showNotification(`Network error ${action}ing user`, 'error');
        button.innerHTML = originalText;
        button.disabled = false;
    }
}

// View user details with real API
async function viewUserDetailsReal(userId) {
    showNotification('Loading user details...', 'info');
    
    try {
        const response = await window.AdminAPIs.User.getById(userId);
        
        if (response.success) {
            displayUserModal(response.user);
        } else {
            showNotification('Failed to load user details', 'error');
        }
    } catch (error) {
        console.error('Error loading user:', error);
        showNotification('Network error loading user', 'error');
    }
}

// Display user details modal
function displayUserModal(user) {
    const modal = document.createElement('div');
    modal.id = 'userDetailsModal';
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
    modal.innerHTML = `
        <div class="bg-white rounded-lg w-full max-w-md p-6">
            <div class="flex justify-between items-center mb-4">
                <h3 class="text-lg font-bold">User Details</h3>
                <button onclick="document.getElementById('userDetailsModal').remove()" class="text-gray-500 hover:text-gray-700">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="text-center mb-4">
                <div class="w-16 h-16 mx-auto mb-3 bg-gradient-to-br ${user.userType === 'student' ? 'from-blue-500 to-cyan-500' : 'from-purple-500 to-pink-500'} rounded-full flex items-center justify-center text-white text-2xl font-bold">
                    ${user.fullName.charAt(0)}
                </div>
                <h4 class="font-bold text-lg">${user.fullName}</h4>
                <p class="text-gray-500">@${user.username}</p>
            </div>
            <div class="space-y-3 bg-gray-50 p-4 rounded-lg">
                <div class="flex justify-between">
                    <span class="text-gray-600">Email:</span>
                    <span class="font-medium">${user.email}</span>
                </div>
                <div class="flex justify-between">
                    <span class="text-gray-600">Type:</span>
                    <span class="font-medium">${user.userType}</span>
                </div>
                <div class="flex justify-between">
                    <span class="text-gray-600">Status:</span>
                    <span class="font-medium ${user.isActive ? 'text-green-600' : 'text-red-600'}">${user.isActive ? 'Active' : 'Blocked'}</span>
                </div>
                <div class="flex justify-between">
                    <span class="text-gray-600">Verified:</span>
                    <span class="font-medium">${user.isVerified ? 'Yes' : 'No'}</span>
                </div>
                <div class="flex justify-between">
                    <span class="text-gray-600">Joined:</span>
                    <span class="font-medium">${formatDate(user.createdAt)}</span>
                </div>
            </div>
            <div class="mt-4 flex gap-2">
                <button onclick="document.getElementById('userDetailsModal').remove()" class="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300">
                    Close
                </button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.remove();
    });
}

// Load organizations section
async function loadOrganizationsSection() {
    const orgsSection = document.getElementById('organizationsSection');
    
    orgsSection.innerHTML = `
        <div class="flex justify-center items-center h-64">
            <div class="text-center">
                <i class="fas fa-spinner fa-spin text-3xl text-[#d32f2f] mb-4"></i>
                <p class="text-gray-600">Loading organizations...</p>
            </div>
        </div>
    `;
    
    try {
        const response = await window.AdminAPIs.Organization.getPending();
        
        if (!response.success) {
            throw new Error(response.message || 'Failed to load organizations');
        }
        
        displayOrganizationsSection(response);
        
    } catch (error) {
        console.error('Error loading organizations:', error);
        orgsSection.innerHTML = `
            <div class="text-center py-10">
                <i class="fas fa-exclamation-triangle text-3xl text-red-500 mb-4"></i>
                <h3 class="text-xl font-bold text-gray-800 mb-2">Failed to Load Organizations</h3>
                <p class="text-gray-600 mb-4">${error.message}</p>
                <button onclick="loadOrganizationsSection()" class="px-4 py-2 bg-[#d32f2f] text-white rounded-lg hover:bg-[#b71c1c]">
                    <i class="fas fa-redo mr-2"></i> Try Again
                </button>
            </div>
        `;
    }
}

// Display organizations section with data
function displayOrganizationsSection(data) {
    const orgsSection = document.getElementById('organizationsSection');
    
    orgsSection.innerHTML = `
        <div class="mb-6">
            <div class="flex justify-between items-center">
                <h2 class="text-xl font-bold text-gray-800">Organization Management</h2>
                <div class="flex gap-3">
                    <button onclick="loadAllOrganizations()" class="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">
                        <i class="fas fa-list mr-2"></i> View All
                    </button>
                    <button onclick="refreshOrganizations()" class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                        <i class="fas fa-sync-alt mr-2"></i> Refresh
                    </button>
                </div>
            </div>
            <p class="text-gray-600 mt-2">Verify organizations and manage company accounts</p>
        </div>
        
        <!-- Stats -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div class="bg-white p-6 rounded-lg border">
                <div class="text-3xl font-bold text-[#d32f2f]">${data.count}</div>
                <div class="text-gray-600">Pending Verification</div>
            </div>
            <div class="bg-white p-6 rounded-lg border">
                <div class="text-3xl font-bold text-green-600">${data.count > 0 ? Math.floor(data.count / 2) : 0}</div>
                <div class="text-gray-600">Avg. Response Time</div>
                <div class="text-sm text-gray-500">2-4 hours</div>
            </div>
            <div class="bg-white p-6 rounded-lg border">
                <div class="text-3xl font-bold text-blue-600">95%</div>
                <div class="text-gray-600">Verification Rate</div>
                <div class="text-sm text-gray-500">This month</div>
            </div>
        </div>
        
        <!-- Verification Queue -->
        <div class="mb-8">
            <div class="flex justify-between items-center mb-4">
                <h3 class="text-lg font-bold text-gray-800">Pending Verification (${data.count})</h3>
                <div class="text-sm text-gray-600">
                    <i class="fas fa-info-circle mr-1"></i>
                    Organizations waiting for approval
                </div>
            </div>
            
            ${data.count === 0 ? `
                <div class="bg-white border rounded-lg p-8 text-center">
                    <i class="fas fa-check-circle text-4xl text-green-500 mb-4"></i>
                    <h4 class="text-xl font-bold text-gray-800 mb-2">All Caught Up!</h4>
                    <p class="text-gray-600 mb-4">No pending organization verifications.</p>
                    <p class="text-sm text-gray-500">New organization registrations will appear here.</p>
                </div>
            ` : `
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    ${generateOrgVerificationCards(data.organizations)}
                </div>
            `}
        </div>
        
        <!-- All Organizations Table -->
        <div class="mt-8">
            <h3 class="text-lg font-bold text-gray-800 mb-4">All Organizations</h3>
            <div class="bg-white border rounded-lg overflow-hidden">
                <div class="overflow-x-auto">
                    <table class="w-full">
                        <thead class="bg-gray-50">
                            <tr>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Company</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Username</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-gray-200">
                            ${generateOrgsTable(data.organizations)}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `;
    
    // Add event listeners to verify/reject buttons
    setTimeout(() => {
        setupOrgActionButtons();
    }, 100);
}

// Load reports section
async function loadReportsSection() {
    const reportsSection = document.getElementById('reportsSection');
    
    reportsSection.innerHTML = `
        <div class="flex justify-center items-center h-64">
            <div class="text-center">
                <i class="fas fa-spinner fa-spin text-3xl text-[#d32f2f] mb-4"></i>
                <p class="text-gray-600">Loading appeals & reports...</p>
            </div>
        </div>
    `;
    
    try {
        const [appealsRes, reportsRes] = await Promise.all([
            window.AdminAPIs.Appeal.getAll(),
            window.AdminAPIs.Content.getReports({ limit: 50 })
        ]);

        const appeals = appealsRes && appealsRes.success ? (appealsRes.appeals || []) : [];
        const reports = reportsRes && reportsRes.success ? (reportsRes.reports || []) : [];

        const pendingAppeals = appeals.filter(a => a.status === 'pending').length;
        const resolvedAppeals = appeals.filter(a => a.status !== 'pending').length;

        const pendingReports = reports.filter(r => r.status === 'pending').length;
        const resolvedReports = reports.filter(r => r.status !== 'pending').length;
        
        reportsSection.innerHTML = `
            <div class="mb-6">
                <div class="flex justify-between items-center">
                    <h2 class="text-xl font-bold text-gray-800">Appeals & Reports</h2>
                    <button onclick="loadReportsSection()" class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                        <i class="fas fa-sync-alt mr-2"></i> Refresh
                    </button>
                </div>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div class="bg-white p-6 rounded-lg border"><div class="text-3xl font-bold text-red-600">${pendingAppeals + pendingReports}</div><div class="text-gray-600">Pending</div></div>
                <div class="bg-white p-6 rounded-lg border"><div class="text-3xl font-bold text-green-600">${resolvedAppeals + resolvedReports}</div><div class="text-gray-600">Resolved</div></div>
                <div class="bg-white p-6 rounded-lg border"><div class="text-3xl font-bold text-blue-600">${appeals.length + reports.length}</div><div class="text-gray-600">Total</div></div>
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div class="bg-white border rounded-lg overflow-hidden">
                    <div class="px-6 py-4 border-b flex items-center justify-between">
                        <h3 class="font-bold text-gray-800">User Appeals</h3>
                        <span class="text-xs text-gray-500">${appeals.length} total</span>
                    </div>
                    <table class="w-full"><thead class="bg-gray-50"><tr>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Subject</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr></thead><tbody class="divide-y divide-gray-200">
                        ${appeals.length === 0 ? '<tr><td colspan="4" class="px-6 py-8 text-center text-gray-500">No appeals found</td></tr>' :
                        appeals.map(a => `
                            <tr class="hover:bg-gray-50">
                                <td class="px-6 py-4">${a.user?.fullName || 'Unknown'}</td>
                                <td class="px-6 py-4">
                                    <div class="font-medium text-gray-900">${a.subject || ''}</div>
                                    <div class="text-xs text-gray-500 mt-1">${a.message ? (a.message.length > 60 ? a.message.substring(0, 60) + '...' : a.message) : ''}</div>
                                </td>
                                <td class="px-6 py-4"><span class="px-2 py-1 text-xs rounded-full ${a.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}">${a.status}</span></td>
                                <td class="px-6 py-4">
                                    <div class="flex gap-2">
                                        <button class="appeal-view-btn px-3 py-1 bg-blue-600 text-white rounded text-xs" data-appeal-id="${a.id}">View</button>
                                        ${a.status === 'pending' ? `<button onclick="respondToAppeal('${a.id}','${a.user?.id}')" class="px-3 py-1 bg-green-600 text-white rounded text-xs">Respond</button>` : ''}
                                    </div>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody></table>
                </div>

                <div class="bg-white border rounded-lg overflow-hidden">
                    <div class="px-6 py-4 border-b flex items-center justify-between">
                        <h3 class="font-bold text-gray-800">Content Reports</h3>
                        <span class="text-xs text-gray-500">${reports.length} total</span>
                    </div>
                    <table class="w-full"><thead class="bg-gray-50"><tr>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reason</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr></thead><tbody class="divide-y divide-gray-200">
                        ${reports.length === 0 ? '<tr><td colspan="4" class="px-6 py-8 text-center text-gray-500">No reports found</td></tr>' :
                        reports.map(r => `
                            <tr class="hover:bg-gray-50">
                                <td class="px-6 py-4 text-sm text-gray-700">${r.reportedType}</td>
                                <td class="px-6 py-4">
                                    <div class="font-medium text-gray-900">${r.reason || ''}</div>
                                    <div class="text-xs text-gray-500 mt-1">${r.description ? (r.description.length > 60 ? r.description.substring(0, 60) + '...' : r.description) : ''}</div>
                                </td>
                                <td class="px-6 py-4"><span class="px-2 py-1 text-xs rounded-full ${r.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}">${r.status}</span></td>
                                <td class="px-6 py-4">
                                    <div class="flex gap-2">
                                        <button class="report-view-btn px-3 py-1 bg-blue-600 text-white rounded text-xs" data-report-id="${r.id}">View</button>
                                        ${r.status === 'pending' ? `<button class="report-resolve-btn px-3 py-1 bg-green-600 text-white rounded text-xs" data-report-id="${r.id}">Resolve</button>` : ''}
                                    </div>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody></table>
                </div>
            </div>
        `;

        setTimeout(() => {
            document.querySelectorAll('.appeal-view-btn').forEach(btn => {
                btn.addEventListener('click', async () => {
                    const id = btn.getAttribute('data-appeal-id');
                    const a = appeals.find(x => String(x.id) === String(id));
                    if (!a) return;
                    viewFullAppeal(a.id, a.subject || '', a.message || '', a.user?.fullName || 'Unknown');
                });
            });

            document.querySelectorAll('.report-view-btn').forEach(btn => {
                btn.addEventListener('click', async () => {
                    const id = btn.getAttribute('data-report-id');
                    await viewFullReport(id);
                });
            });

            document.querySelectorAll('.report-resolve-btn').forEach(btn => {
                btn.addEventListener('click', async () => {
                    const id = btn.getAttribute('data-report-id');
                    await resolveContentReport(id);
                });
            });
        }, 0);
    } catch (error) {
        reportsSection.innerHTML = `<div class="text-center py-10"><p class="text-red-500">Failed to load appeals</p><button onclick="loadReportsSection()" class="mt-4 px-4 py-2 bg-[#d32f2f] text-white rounded-lg">Retry</button></div>`;
    }
}

function viewFullAppeal(appealId, subject, message, userName) {
    const existing = document.getElementById('appealModal');
    if (existing) existing.remove();

    const modal = document.createElement('div');
    modal.id = 'appealModal';
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4';
    modal.innerHTML = `
        <div class="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div class="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
                <h3 class="text-lg font-bold">Appeal Details</h3>
                <button onclick="document.getElementById('appealModal').remove()" class="text-gray-500 hover:text-gray-700">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="p-6">
                <div class="flex items-center gap-3 mb-4">
                    <div class="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                        ${(userName || 'U').charAt(0)}
                    </div>
                    <div>
                        <h4 class="font-bold text-gray-800">${userName || 'Unknown'}</h4>
                        <p class="text-sm text-gray-500">Appeal ID: ${appealId}</p>
                    </div>
                </div>
                <div class="bg-gray-50 p-4 rounded-lg mb-4">
                    <p class="text-xs font-medium text-gray-500 uppercase mb-2">Subject</p>
                    <p class="font-medium text-gray-900">${subject || ''}</p>
                </div>
                <div class="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                    <p class="text-xs font-medium text-blue-800 uppercase mb-2"><i class="fas fa-message mr-1"></i> Full Message</p>
                    <p class="text-gray-900 whitespace-pre-wrap">${message || 'No message provided'}</p>
                </div>
            </div>
            <div class="border-t px-6 py-4 flex gap-2 justify-end">
                <button onclick="document.getElementById('appealModal').remove()" class="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300">
                    Close
                </button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.remove();
    });
}

async function viewFullReport(reportId) {
    try {
        const data = await window.AdminAPIs.Content.getReport(reportId);
        if (!data || !data.success || !data.report) {
            showNotification(data?.message || 'Failed to load report', 'error');
            return;
        }

        const report = data.report;
        const reportedItem = data.reportedItem;

        const existing = document.getElementById('reportModal');
        if (existing) existing.remove();

        const modal = document.createElement('div');
        modal.id = 'reportModal';
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4';
        modal.innerHTML = `
            <div class="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
                <div class="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
                    <div>
                        <h3 class="text-lg font-bold">Report Details</h3>
                        <p class="text-xs text-gray-500">Report ID: ${report.id}</p>
                    </div>
                    <button onclick="document.getElementById('reportModal').remove()" class="text-gray-500 hover:text-gray-700">
                        <i class="fas fa-times"></i>
                    </button>
                </div>

                <div class="p-6">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div class="bg-gray-50 p-4 rounded-lg">
                            <p class="text-xs font-medium text-gray-500 uppercase mb-2">Reported Type</p>
                            <p class="font-medium text-gray-900">${report.reportedType}</p>
                        </div>
                        <div class="bg-gray-50 p-4 rounded-lg">
                            <p class="text-xs font-medium text-gray-500 uppercase mb-2">Status</p>
                            <p class="font-medium text-gray-900">${report.status}</p>
                        </div>
                    </div>

                    <div class="bg-red-50 border border-red-200 p-4 rounded-lg mb-4">
                        <p class="text-xs font-medium text-red-800 uppercase mb-2">Reason</p>
                        <p class="text-gray-900">${report.reason || ''}</p>
                        ${report.description ? `<p class="text-sm text-gray-700 mt-2 whitespace-pre-wrap">${report.description}</p>` : ''}
                    </div>

                    ${reportedItem ? `
                        <div class="bg-blue-50 border border-blue-200 p-4 rounded-lg mb-4">
                            <p class="text-xs font-medium text-blue-800 uppercase mb-2">Reported Item</p>
                            <pre class="text-xs text-gray-800 whitespace-pre-wrap">${JSON.stringify(reportedItem, null, 2)}</pre>
                        </div>
                    ` : ''}

                    <div class="bg-gray-50 p-4 rounded-lg">
                        <p class="text-xs font-medium text-gray-500 uppercase mb-2">Action</p>
                        <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <select id="reportActionSelect" class="border rounded-lg px-3 py-2">
                                <option value="none">Resolve (no action)</option>
                                <option value="warning">Warning</option>
                                <option value="content_removed">Remove Content</option>
                                <option value="user_blocked">Block User</option>
                                <option value="account_suspended">Suspend Account</option>
                            </select>
                            <input id="reportActionNote" class="border rounded-lg px-3 py-2 md:col-span-2" placeholder="Optional note..." />
                        </div>
                    </div>
                </div>

                <div class="border-t px-6 py-4 flex gap-2 justify-end">
                    ${report.status === 'pending' ? `<button onclick="applyReportAction('${report.id}')" class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">Apply</button>` : ''}
                    <button onclick="document.getElementById('reportModal').remove()" class="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300">Close</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.remove();
        });
    } catch (error) {
        console.error('Error loading report:', error);
        showNotification('Error loading report', 'error');
    }
}

async function resolveContentReport(reportId) {
    try {
        const ok = confirm('Resolve this report?');
        if (!ok) return;

        const result = await window.AdminAPIs.Content.resolveReport(reportId, 'none');
        if (result && result.success) {
            showNotification('Report resolved', 'success');
            const modal = document.getElementById('reportModal');
            if (modal) modal.remove();
            loadReportsSection();
        } else {
            showNotification(result?.message || 'Failed to resolve report', 'error');
        }
    } catch (error) {
        console.error('Error resolving report:', error);
        showNotification('Error resolving report', 'error');
    }
}

async function applyReportAction(reportId) {
    const action = document.getElementById('reportActionSelect')?.value || 'none';
    const note = document.getElementById('reportActionNote')?.value || '';

    if (action === 'none') {
        await resolveContentReport(reportId);
        return;
    }

    try {
        const result = await window.AdminAPIs.Content.takeAction(reportId, action, note);
        if (result && result.success) {
            showNotification('Action applied', 'success');
            const modal = document.getElementById('reportModal');
            if (modal) modal.remove();
            loadReportsSection();
        } else {
            showNotification(result?.message || 'Failed to apply action', 'error');
        }
    } catch (error) {
        console.error('Error applying report action:', error);
        showNotification('Error applying action', 'error');
    }
}

async function respondToAppeal(appealId, userId) {
    const adminResponse = prompt('Enter your response to the user:');
    if (!adminResponse) return;
    const unblock = confirm('Do you want to unblock this user?');
    const status = unblock ? 'approved' : 'rejected';
    
    const admin = JSON.parse(localStorage.getItem('adminData') || '{}');
    
    try {
        const result = await window.AdminAPIs.Appeal.respond(appealId, { 
            adminResponse: adminResponse, 
            status,
            unblockUser: unblock,
            adminId: admin.id || admin._id
        });
        if (result.success) { 
            showNotification('Appeal responded successfully' + (unblock ? ' - User unblocked' : ''), 'success'); 
            loadReportsSection(); 
        } else { 
            showNotification(result.message || 'Failed to respond to appeal', 'error'); 
        }
    } catch (e) { 
        console.error('Appeal response error:', e);
        showNotification('Error responding to appeal', 'error'); 
    }
}

function toggleUserBlock(userId, userName, button) {
    const isBlocked = button.innerHTML.includes('Unblock');
    const action = isBlocked ? 'unblock' : 'block';
    
    if (confirm(`Are you sure you want to ${action} ${userName}?`)) {
        // Simulate API call
        showNotification(`${userName} ${action}ed successfully`, 'success');
        
        // Update button text
        button.innerHTML = isBlocked ? 
            '<i class="fas fa-ban"></i> Block' : 
            '<i class="fas fa-unlock"></i> Unblock';
        
        // Update status badge in table
        const row = button.closest('tr');
        const statusBadge = row.querySelector('.status-badge');
        if (statusBadge) {
            statusBadge.className = `status-badge status-${isBlocked ? 'active' : 'blocked'}`;
            statusBadge.textContent = isBlocked ? 'Active' : 'Blocked';
        }
    }
}

// View user details
function viewUserDetails(userId) {
    showNotification(`Loading details for user ${userId}...`, 'info');
    // In real app, would open modal with user details
}

// Generate organization verification cards
// Generate organization verification cards with real data
function generateOrgVerificationCards(organizations) {
    return organizations.map(org => `
        <div class="bg-white border rounded-lg p-6 hover:shadow-md transition-shadow" id="org-card-${org.id}">
            <div class="flex items-center gap-4 mb-4">
                <div class="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                    <span class="text-white font-bold text-lg">${org.fullName.charAt(0)}</span>
                </div>
                <div>
                    <h4 class="font-bold text-gray-800">${org.fullName}</h4>
                    <p class="text-sm text-gray-600">@${org.username}</p>
                    <p class="text-xs text-gray-500">${org.email}</p>
                </div>
            </div>
            
            <!-- Submitted Verification Data -->
            <div class="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                <p class="text-xs font-medium text-blue-800 mb-1"><i class="fas fa-file-alt mr-1"></i> Submitted Documents:</p>
                <p class="text-sm text-blue-900 font-mono mb-2">
                    ${org.orgRegistrationNumber ? `Reg #: ${org.orgRegistrationNumber}` : '<span class="text-gray-500 italic">No registration number submitted</span>'}
                </p>
                ${org.verificationDocuments && org.verificationDocuments.length > 0 ? `
                    <div class="mt-2 pt-2 border-t border-blue-200">
                        <p class="text-xs text-blue-700 mb-2"><i class="fas fa-paperclip mr-1"></i> Attached Files:</p>
                        <div class="flex flex-wrap gap-2">
                            ${org.verificationDocuments.map((doc, idx) => `
                                <button onclick="viewOrgDocument('${org.id}', ${idx})" class="px-2 py-1 bg-white border border-blue-300 rounded text-xs text-blue-700 hover:bg-blue-100 flex items-center gap-1">
                                    <i class="fas ${doc.type?.includes('pdf') ? 'fa-file-pdf text-red-500' : 'fa-file-image text-green-500'}"></i>
                                    ${doc.name || `Document ${idx + 1}`}
                                </button>
                            `).join('')}
                        </div>
                    </div>
                ` : ''}
            </div>
            
            <div class="flex justify-between text-sm text-gray-600 mb-4">
                <span><i class="fas fa-calendar mr-1"></i> ${formatDate(org.createdAt)}</span>
                <span><i class="fas fa-clock mr-1"></i> ${org.waitingDays || 0} days waiting</span>
            </div>
            <div class="flex gap-2">
                <button class="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors verify-org-btn" 
                        data-org-id="${org.id}"
                        data-org-name="${org.fullName}">
                    <i class="fas fa-check mr-2"></i> Verify
                </button>
                <button class="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors reject-org-btn"
                        data-org-id="${org.id}"
                        data-org-name="${org.fullName}">
                    <i class="fas fa-times mr-2"></i> Reject
                </button>
                <button class="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors view-org-btn"
                        data-org-id="${org.id}">
                    <i class="fas fa-eye"></i>
                </button>
            </div>
        </div>
    `).join('');
}

// Generate reports list
function generateReportsList() {
    const reports = [
        { id: 1, type: 'Spam Content', reporter: 'Alex Johnson', reported: 'TechCorp', time: '2 hours ago' },
        { id: 2, type: 'Fake Account', reporter: 'Sarah Chen', reported: 'John Doe', time: '5 hours ago' },
        { id: 3, type: 'Harassment', reporter: 'Mike Brown', reported: 'Emma Watson', time: '1 day ago' }
    ];
    
    return reports.map(report => `
        <div class="bg-white border rounded-lg p-6">
            <div class="flex justify-between items-start mb-4">
                <div>
                    <div class="flex items-center gap-2 mb-2">
                        <span class="px-3 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">
                            ${report.type}
                        </span>
                        <span class="text-sm text-gray-600">Report #${report.id}</span>
                    </div>
                    <p class="text-gray-800">
                        <span class="font-medium">${report.reporter}</span> reported 
                        <span class="font-medium">${report.reported}</span>
                    </p>
                    <p class="text-sm text-gray-600 mt-1">${report.time}</p>
                </div>
                <div class="flex gap-2">
                    <button class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                        <i class="fas fa-check mr-2"></i> Resolve
                    </button>
                    <button class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
                        <i class="fas fa-ban mr-2"></i> Dismiss
                    </button>
                    <button class="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">
                        <i class="fas fa-eye"></i>
                    </button>
                </div>
            </div>
            <div class="bg-gray-50 p-4 rounded-lg text-sm text-gray-700">
                <p class="font-medium mb-1">Report Details:</p>
                <p>User reported inappropriate content in internship post. Contains spam links and misleading information.</p>
            </div>
        </div>
    `).join('');
}

// Format date helper
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    });
}

// Setup organization action buttons
function setupOrgActionButtons() {
    // Verify buttons
    document.querySelectorAll('.verify-org-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const orgId = this.getAttribute('data-org-id');
            const orgName = this.getAttribute('data-org-name');
            verifyOrganization(orgId, orgName, this);
        });
    });
    
    // Reject buttons
    document.querySelectorAll('.reject-org-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const orgId = this.getAttribute('data-org-id');
            const orgName = this.getAttribute('data-org-name');
            rejectOrganization(orgId, orgName, this);
        });
    });
}

// Verify organization function
async function verifyOrganization(orgId, orgName, button) {
    if (!confirm(`Verify ${orgName}? This will give them full access to the platform.`)) {
        return;
    }
    
    const originalText = button.innerHTML;
    button.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> Verifying...';
    button.disabled = true;
    
    try {
        // Use the API service
        const result = await window.AdminAPIs.Organization.verify(orgId);
        
        if (result.success) {
            showNotification(`✅ ${orgName} verified successfully!`, 'success');
            
            // Remove the card from UI
            const card = document.getElementById(`org-card-${orgId}`);
            if (card) {
                card.style.opacity = '0.5';
                card.style.pointerEvents = 'none';
                card.innerHTML = `
                    <div class="text-center py-4">
                        <i class="fas fa-check-circle text-3xl text-green-500 mb-2"></i>
                        <p class="font-medium text-gray-800">Verified</p>
                        <p class="text-sm text-gray-600">Just now</p>
                    </div>
                `;
            }
            
            // Update stats
            setTimeout(() => {
                if (card) card.remove();
                loadOrganizationsSection(); // Refresh the list
            }, 2000);
            
        } else {
            showNotification(`❌ Failed to verify: ${result.message}`, 'error');
            button.innerHTML = originalText;
            button.disabled = false;
        }
        
    } catch (error) {
        console.error('Error verifying organization:', error);
        showNotification('❌ Network error verifying organization', 'error');
        button.innerHTML = originalText;
        button.disabled = false;
    }
}

// Reject organization function
async function rejectOrganization(orgId, orgName, button) {
    const reason = prompt(`Enter rejection reason for ${orgName}:`, "Document verification failed");
    
    if (!reason) return;
    
    if (!confirm(`Reject ${orgName}? This will remove their account.\nReason: ${reason}`)) {
        return;
    }
    
    const originalText = button.innerHTML;
    button.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> Rejecting...';
    button.disabled = true;
    
    try {
        // Use the API service with deleteAccount=true to remove the account
        const result = await window.AdminAPIs.Organization.reject(orgId, reason, true);
        
        if (result.success) {
            showNotification(`❌ ${orgName} rejected and removed.`, 'success');
            
            // Remove the card from UI
            const card = document.getElementById(`org-card-${orgId}`);
            if (card) {
                card.style.opacity = '0.5';
                card.innerHTML = `
                    <div class="text-center py-4">
                        <i class="fas fa-times-circle text-3xl text-red-500 mb-2"></i>
                        <p class="font-medium text-gray-800">Rejected</p>
                        <p class="text-sm text-gray-600">${reason}</p>
                    </div>
                `;
                setTimeout(() => card.remove(), 2000);
            }
            
            // Refresh the list
            setTimeout(() => {
                loadOrganizationsSection();
            }, 1000);
            
        } else {
            showNotification(`❌ Failed to reject: ${result.message}`, 'error');
            button.innerHTML = originalText;
            button.disabled = false;
        }
        
    } catch (error) {
        console.error('Error rejecting organization:', error);
        showNotification('❌ Network error rejecting organization', 'error');
        button.innerHTML = originalText;
        button.disabled = false;
    }
}

// View organization document in modal
function viewOrgDocument(orgId, docIndex) {
    // Fetch org data (authenticated) to get document
    window.AdminAPIs.Organization.getById(orgId)
        .then(data => {
            if (data.success && data.organization) {
                const docs = data.organization.verificationDocuments || [];
                const doc = docs[docIndex];

                if (!doc) {
                    showNotification('Document not found', 'error');
                    return;
                }

                const fileUrl = doc.url
                    ? (doc.url.startsWith('http') ? doc.url : `http://localhost:5000${doc.url}`)
                    : (doc.data || '');

                const modal = document.createElement('div');
                modal.id = 'docViewModal';
                modal.className = 'fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4';

                const lowerType = (doc.type || '').toLowerCase();
                const isImage = lowerType.includes('image') || fileUrl.startsWith('data:image') || /\.(png|jpe?g)$/i.test(fileUrl);
                const isPdf = lowerType.includes('pdf') || fileUrl.startsWith('data:application/pdf') || /\.pdf$/i.test(fileUrl);

                modal.innerHTML = `
                    <div class="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                        <div class="bg-gray-100 px-6 py-4 flex justify-between items-center border-b">
                            <div>
                                <h3 class="text-lg font-bold text-gray-800">${doc.name || 'Verification Document'}</h3>
                                <p class="text-sm text-gray-500">${doc.type || 'Document'} • ${doc.size ? (doc.size / 1024).toFixed(1) + ' KB' : ''}</p>
                            </div>
                            <button onclick="document.getElementById('docViewModal').remove()" class="text-gray-500 hover:text-gray-700 text-2xl">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                        <div class="flex-1 overflow-auto p-4 bg-gray-50 flex items-center justify-center" style="min-height: 400px;">
                            ${isImage ? `
                                <img src="${fileUrl}" alt="${doc.name}" class="max-w-full max-h-full object-contain rounded shadow-lg" style="max-height: 70vh;">
                            ` : isPdf ? `
                                <iframe src="${fileUrl}" class="w-full h-full" style="min-height: 500px; border: none;"></iframe>
                            ` : `
                                <div class="text-center text-gray-500">
                                    <i class="fas fa-file text-6xl mb-4"></i>
                                    <p>Preview not available for this file type</p>
                                    ${fileUrl ? `
                                        <a href="${fileUrl}" target="_blank" class="mt-4 inline-block px-4 py-2 bg-blue-600 text-white rounded-lg">
                                            <i class="fas fa-external-link-alt mr-2"></i> Open
                                        </a>
                                    ` : ''}
                                </div>
                            `}
                        </div>
                        <div class="border-t px-6 py-4 flex justify-between items-center bg-white">
                            <span class="text-sm text-gray-500">Document ${docIndex + 1} of ${docs.length}</span>
                            <div class="flex gap-2">
                                ${fileUrl ? `
                                    <a href="${fileUrl}" download="${doc.name || 'document'}" class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                                        <i class="fas fa-download mr-2"></i> Download
                                    </a>
                                ` : ''}
                                <button onclick="document.getElementById('docViewModal').remove()" class="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300">
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                `;
                document.body.appendChild(modal);
                modal.addEventListener('click', (e) => {
                    if (e.target === modal) modal.remove();
                });
            } else {
                showNotification('Failed to load document', 'error');
            }
        })
        .catch(err => {
            console.error('Error loading document:', err);
            showNotification('Error loading document', 'error');
        });
}
window.viewOrgDocument = viewOrgDocument;

// Refresh organizations
function refreshOrganizations() {
    showNotification('Refreshing organizations...', 'info');
    loadOrganizationsSection();
}

// Load all organizations (verified + pending)
async function loadAllOrganizations() {
    const orgsSection = document.getElementById('organizationsSection');
    orgsSection.innerHTML = `<div class="flex justify-center py-10"><i class="fas fa-spinner fa-spin text-3xl text-[#d32f2f]"></i></div>`;
    
    try {
        const response = await fetch('http://localhost:5000/api/admin/organizations');
        const data = await response.json();
        
        if (data.success) {
            const orgs = data.organizations || [];
            orgsSection.innerHTML = `
                <div class="mb-6">
                    <div class="flex justify-between items-center">
                        <h2 class="text-xl font-bold text-gray-800">All Organizations (${orgs.length})</h2>
                        <button onclick="loadOrganizationsSection()" class="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">
                            <i class="fas fa-arrow-left mr-2"></i> Back to Pending
                        </button>
                    </div>
                </div>
                <div class="bg-white border rounded-lg overflow-hidden">
                    <table class="w-full">
                        <thead class="bg-gray-50">
                            <tr>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Company</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-gray-200">
                            ${orgs.length === 0 ? '<tr><td colspan="4" class="px-6 py-8 text-center text-gray-500">No organizations found</td></tr>' :
                            orgs.map(org => `
                                <tr class="hover:bg-gray-50">
                                    <td class="px-6 py-4"><div class="font-medium">${org.fullName}</div><div class="text-sm text-gray-500">@${org.username}</div></td>
                                    <td class="px-6 py-4">${org.email}</td>
                                    <td class="px-6 py-4">
                                        <span class="px-2 py-1 text-xs rounded-full ${org.isBlocked ? 'bg-red-100 text-red-800' : org.isVerified ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}">
                                            ${org.isBlocked ? 'Blocked' : org.isVerified ? 'Verified' : 'Pending'}
                                        </span>
                                    </td>
                                    <td class="px-6 py-4">
                                        ${org.isBlocked ? 
                                            `<button onclick="unblockOrgFromList('${org.id}')" class="px-3 py-1 bg-green-600 text-white rounded text-xs">Unblock</button>` :
                                            `<button onclick="blockOrgFromList('${org.id}')" class="px-3 py-1 bg-red-600 text-white rounded text-xs">Block</button>`
                                        }
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            `;
        } else {
            throw new Error(data.message);
        }
    } catch (error) {
        console.error('Load all orgs error:', error);
        orgsSection.innerHTML = `<div class="text-center py-10 text-red-500">Failed to load organizations<br><button onclick="loadAllOrganizations()" class="mt-4 px-4 py-2 bg-[#d32f2f] text-white rounded-lg">Retry</button></div>`;
    }
}

async function blockOrgFromList(orgId) {
    const reason = prompt('Enter reason for blocking:');
    if (!reason) return;
    const admin = JSON.parse(localStorage.getItem('adminData') || '{}');
    try {
        const res = await fetch(`http://localhost:5000/api/admin/users/${orgId}/block`, {
            method: 'PUT', headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ reason, adminId: admin.id || admin._id })
        });
        const data = await res.json();
        if (data.success) { showNotification('Organization blocked', 'success'); loadAllOrganizations(); }
        else { showNotification(data.message || 'Failed', 'error'); }
    } catch(e) { showNotification('Error blocking', 'error'); }
}

async function unblockOrgFromList(orgId) {
    const admin = JSON.parse(localStorage.getItem('adminData') || '{}');
    try {
        const res = await fetch(`http://localhost:5000/api/admin/users/${orgId}/unblock`, {
            method: 'PUT', headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ adminId: admin.id || admin._id })
        });
        const data = await res.json();
        if (data.success) { showNotification('Organization unblocked', 'success'); loadAllOrganizations(); }
        else { showNotification(data.message || 'Failed', 'error'); }
    } catch(e) { showNotification('Error unblocking', 'error'); }
}

// Generate organizations table with real data
function generateOrgsTable(organizations) {
    if (!organizations || organizations.length === 0) {
        return `
            <tr>
                <td colspan="5" class="px-6 py-8 text-center text-gray-500">
                    <i class="fas fa-inbox text-3xl mb-3"></i>
                    <p class="text-lg">No organizations found</p>
                </td>
            </tr>
        `;
    }
    
    return organizations.map(org => `
        <tr>
            <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-center">
                    <div class="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold mr-3">
                        ${org.fullName.charAt(0)}
                    </div>
                    <div>
                        <div class="font-medium text-gray-900">${org.fullName}</div>
                        <div class="text-sm text-gray-500">ID: ${org.id.substring(0, 8)}...</div>
                    </div>
                </div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-gray-900">@${org.username}</div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-gray-900">
                ${org.email}
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                <span class="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${org.isVerified ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}">
                    ${org.isVerified ? 'Verified' : 'Pending'}
                </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <div class="flex gap-2">
                    ${!org.isVerified ? `
                        <button class="verify-org-btn px-3 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700"
                                data-org-id="${org.id}"
                                data-org-name="${org.fullName}">
                            <i class="fas fa-check mr-1"></i> Verify
                        </button>
                    ` : ''}
                    <button class="px-3 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 view-org-btn"
                            data-org-id="${org.id}">
                        <i class="fas fa-eye mr-1"></i> View
                    </button>
                    <button class="reject-org-btn px-3 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700"
                            data-org-id="${org.id}"
                            data-org-name="${org.fullName}">
                        <i class="fas fa-times mr-1"></i> Remove
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

// Load Announcements Section
async function loadAnnouncementsSection() {
    const announcementsSection = document.getElementById('announcementsSection');
    if (!announcementsSection) return;
    
    announcementsSection.innerHTML = `
        <div class="mb-6">
            <div class="flex justify-between items-center">
                <h2 class="text-xl font-bold text-gray-800">Announcements</h2>
                <button onclick="showCreateAnnouncementModal()" class="px-4 py-2 bg-[#d32f2f] text-white rounded-lg hover:bg-[#b71c1c]">
                    <i class="fas fa-plus mr-2"></i> New Announcement
                </button>
            </div>
        </div>
        
        <!-- Create Announcement Form -->
        <div class="bg-white border rounded-lg p-6 mb-6">
            <h3 class="text-lg font-bold mb-4"><i class="fas fa-bullhorn text-[#d32f2f] mr-2"></i>Send Announcement</h3>
            <div class="mb-4">
                <label class="block text-sm font-medium text-gray-700 mb-2">Title</label>
                <input type="text" id="announcementTitle" placeholder="Announcement title..." class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#d32f2f] focus:border-transparent">
            </div>
            <div class="mb-4">
                <label class="block text-sm font-medium text-gray-700 mb-2">Message</label>
                <textarea id="announcementMessage" rows="4" placeholder="Write your announcement message..." class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#d32f2f] focus:border-transparent"></textarea>
            </div>
            <div class="mb-4">
                <label class="block text-sm font-medium text-gray-700 mb-2">Target Audience</label>
                <select id="announcementTarget" class="w-full px-4 py-2 border rounded-lg">
                    <option value="all">All Users</option>
                    <option value="students">Students Only</option>
                    <option value="organizations">Organizations Only</option>
                </select>
            </div>
            <button onclick="sendAnnouncement()" class="px-6 py-2 bg-[#d32f2f] text-white rounded-lg hover:bg-[#b71c1c]">
                <i class="fas fa-paper-plane mr-2"></i> Send Announcement
            </button>
        </div>
        
        <!-- Recent Announcements -->
        <div class="bg-white border rounded-lg p-6">
            <h3 class="text-lg font-bold mb-4">Recent Announcements</h3>
            <div id="announcementsList">
                <p class="text-gray-500 text-center py-8">No announcements sent yet.</p>
            </div>
        </div>
    `;
}

async function sendAnnouncement() {
    const title = document.getElementById('announcementTitle')?.value.trim();
    const message = document.getElementById('announcementMessage')?.value.trim();
    const target = document.getElementById('announcementTarget')?.value || 'all';
    const adminToken = localStorage.getItem('adminToken');
    
    if (!title || !message) {
        showNotification('Please fill in both title and message', 'error');
        return;
    }
    
    try {
        // First create the announcement
        const createRes = await fetch('http://localhost:5000/api/admin/announcements', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${adminToken}`
            },
            body: JSON.stringify({ 
                title, 
                message, 
                target,
                type: 'info',
                priority: 'medium'
            })
        });
        
        const createResult = await createRes.json();
        
        if (createResult.success && createResult.announcement) {
            // Now send the announcement to create notifications
            const sendRes = await fetch(`http://localhost:5000/api/admin/announcements/${createResult.announcement._id}/send`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${adminToken}`
                }
            });
            
            const sendResult = await sendRes.json();
            
            if (sendResult.success) {
                showNotification(`Announcement sent to ${sendResult.notificationsSent || 'all'} users!`, 'success');
                document.getElementById('announcementTitle').value = '';
                document.getElementById('announcementMessage').value = '';
                loadAnnouncementsSection(); // Refresh the list
            } else {
                showNotification(sendResult.message || 'Failed to send announcement', 'error');
            }
        } else {
            showNotification(createResult.message || 'Failed to create announcement', 'error');
        }
    } catch (error) {
        console.error('Announcement error:', error);
        showNotification('Error sending announcement', 'error');
    }
}
window.sendAnnouncement = sendAnnouncement;

// Load Skills Section placeholder
function loadSkillsSection() {
    const skillsSection = document.getElementById('skillsSection');
    if (skillsSection) {
        skillsSection.innerHTML = '<p class="text-center py-8 text-gray-500">Skills management coming soon...</p>';
    }
}

// Load Settings Section placeholder
function loadSettingsSection() {
    const settingsSection = document.getElementById('settingsSection');
    if (settingsSection) {
        settingsSection.innerHTML = '<p class="text-center py-8 text-gray-500">Settings coming soon...</p>';
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    if (checkAdminAuth()) {
        initializeDashboard();
    }
});