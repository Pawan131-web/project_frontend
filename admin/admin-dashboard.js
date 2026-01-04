/*admin/admin-dashboard.js*/
/* ===== ADMIN DASHBOARD FUNCTIONALITY ===== */

// ===== AUTH CHECK =====
// function checkAdminAuth() {
//     const user = JSON.parse(localStorage.getItem('user') || '{}');
//     const isLoggedIn = localStorage.getItem('isLoggedIn');
    
//     // Check if user is admin type
//     if (!user || !isLoggedIn || isLoggedIn !== 'true' || user.userType !== 'admin') {
//         console.log('🚫 Admin not authenticated, redirecting...');
//         window.location.href = '../index.html';
//         return false;
//     }
    
//     console.log(`✅ Admin authenticated: ${user.fullName || 'Admin'}`);
//     return true;
// }

// ===== INITIALIZATION =====
function initializeAdminDashboard() {
    console.log('🛡️ Admin Dashboard Initializing...');
    
    if (!checkAdminAuth()) return;
    
    // Initialize all components
    setupAdminNavigation();
    setupAdminDropdown();
    setupCharts();
    setupSearch();
    setupModals();
    setupQuickActions();
    loadUsersTable();
    
    console.log('✅ Admin Dashboard Ready');
}

// ===== NAVIGATION =====
function setupAdminNavigation() {
    const navItems = document.querySelectorAll('.nav-item[data-page]');
    const pages = document.querySelectorAll('.page-content');
    
    navItems.forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Remove active class from all items
            navItems.forEach(nav => nav.classList.remove('active'));
            // Add active class to clicked item
            this.classList.add('active');
            
            // Get page to show
            const pageId = this.getAttribute('data-page') + 'Page';
            
            // Hide all pages
            pages.forEach(page => page.classList.add('hidden'));
            // Show selected page
            const targetPage = document.getElementById(pageId);
            if (targetPage) {
                targetPage.classList.remove('hidden');
                
                // Update page title
                const pageTitle = document.querySelector('.page-title');
                if (pageTitle) {
                    pageTitle.textContent = this.querySelector('span').textContent;
                }
                
                // Load page content if needed
                loadPageContent(pageId);
            }
        });
    });
}

function loadPageContent(pageId) {
    console.log(`Loading page: ${pageId}`);
    
    switch(pageId) {
        case 'usersPage':
            loadUsersTable();
            break;
        case 'verificationsPage':
            loadVerifications();
            break;
        case 'reportedPage':
            loadReportedContent();
            break;
        // Add more cases as needed
    }
}

// ===== ADMIN DROPDOWN =====
function setupAdminDropdown() {
    const adminDropdown = document.getElementById('adminDropdown');
    const adminMenu = document.getElementById('adminMenu');
    
    if (!adminDropdown || !adminMenu) return;
    
    adminDropdown.addEventListener('click', function(e) {
        e.stopPropagation();
        
        const isVisible = adminMenu.style.display === 'block';
        adminMenu.style.display = isVisible ? 'none' : 'block';
        
        if (!isVisible) {
            positionDropdown(adminMenu, adminDropdown);
        }
    });
    
    // Close dropdown on outside click
    document.addEventListener('click', function() {
        adminMenu.style.display = 'none';
    });
    
    // Close on escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            adminMenu.style.display = 'none';
        }
    });
}

function positionDropdown(dropdown, trigger) {
    const rect = trigger.getBoundingClientRect();
    dropdown.style.position = 'fixed';
    dropdown.style.top = `${rect.bottom + 8}px`;
    dropdown.style.right = `${window.innerWidth - rect.right}px`;
}

// ===== CHARTS =====
function setupCharts() {
    // User Growth Chart
    const userCtx = document.getElementById('userGrowthChart');
    if (userCtx) {
        new Chart(userCtx, {
            type: 'line',
            data: {
                labels: ['Jan 1', 'Jan 5', 'Jan 10', 'Jan 15', 'Jan 20', 'Jan 25', 'Jan 30'],
                datasets: [{
                    label: 'New Users',
                    data: [120, 150, 180, 210, 240, 280, 320],
                    borderColor: '#667eea',
                    backgroundColor: 'rgba(102, 126, 234, 0.1)',
                    tension: 0.4,
                    fill: true
                }, {
                    label: 'Active Users',
                    data: [800, 850, 900, 950, 1000, 1050, 1100],
                    borderColor: '#764ba2',
                    backgroundColor: 'rgba(118, 75, 162, 0.1)',
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            drawBorder: false
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        }
                    }
                }
            }
        });
    }
    
    // Internship Chart
    const internCtx = document.getElementById('internshipChart');
    if (internCtx) {
        new Chart(internCtx, {
            type: 'bar',
            data: {
                labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                datasets: [{
                    label: 'Internship Posts',
                    data: [120, 150, 180, 200, 240, 280],
                    backgroundColor: 'rgba(255, 152, 0, 0.6)',
                    borderColor: '#FF9800',
                    borderWidth: 1
                }, {
                    label: 'Applications',
                    data: [800, 950, 1100, 1250, 1400, 1600],
                    backgroundColor: 'rgba(76, 175, 80, 0.6)',
                    borderColor: '#4CAF50',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            drawBorder: false
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        }
                    }
                }
            }
        });
    }
}

// ===== SEARCH FUNCTIONALITY =====
function setupSearch() {
    const searchInput = document.getElementById('adminSearch');
    if (!searchInput) return;
    
    let debounceTimer;
    searchInput.addEventListener('input', function() {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            const query = this.value.trim();
            if (query.length >= 2) {
                performAdminSearch(query);
            }
        }, 500);
    });
    
    searchInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
            performAdminSearch(this.value.trim());
        }
    });
}

function performAdminSearch(query) {
    if (!query) return;
    
    console.log(`Admin searching: ${query}`);
    showNotification(`Searching for "${query}"...`, 'info');
    
    // In real app, would search across users, internships, posts
    setTimeout(() => {
        showNotification(`Found results for "${query}"`, 'success');
    }, 800);
}

// ===== MODALS =====
function setupModals() {
    const announcementModal = document.getElementById('announcementModal');
    const modalCloseButtons = document.querySelectorAll('.modal-close');
    
    // Quick Announcement Button
    const quickAnnounce = document.getElementById('quickAnnounce');
    if (quickAnnounce) {
        quickAnnounce.addEventListener('click', function() {
            announcementModal.classList.remove('hidden');
        });
    }
    
    // Close modal buttons
    modalCloseButtons.forEach(button => {
        button.addEventListener('click', function() {
            announcementModal.classList.add('hidden');
        });
    });
    
    // Close modal on outside click
    announcementModal.addEventListener('click', function(e) {
        if (e.target === this) {
            this.classList.add('hidden');
        }
    });
    
    // Close on escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            announcementModal.classList.add('hidden');
        }
    });
}

// ===== QUICK ACTIONS =====
function setupQuickActions() {
    const quickVerify = document.getElementById('quickVerify');
    const quickAlert = document.getElementById('quickAlert');
    const refreshData = document.getElementById('refreshData');
    
    if (quickVerify) {
        quickVerify.addEventListener('click', function() {
            showNotification('Loading next organization for verification...', 'info');
            // Would navigate to verifications page
            document.querySelector('[data-page="verifications"]').click();
        });
    }
    
    if (quickAlert) {
        quickAlert.addEventListener('click', function() {
            showNotification('Showing platform alerts...', 'info');
        });
    }
    
    if (refreshData) {
        refreshData.addEventListener('click', function() {
            const icon = this.querySelector('i');
            icon.classList.add('fa-spin');
            
            showNotification('Refreshing dashboard data...', 'info');
            
            setTimeout(() => {
                icon.classList.remove('fa-spin');
                showNotification('Dashboard data refreshed!', 'success');
                
                // Simulate data refresh
                updateStats();
            }, 1500);
        });
    }
}

function updateStats() {
    // Simulate updating stats
    const statValues = document.querySelectorAll('.stat-value');
    statValues.forEach(stat => {
        const current = parseInt(stat.textContent.replace(/,/g, ''));
        const change = Math.floor(Math.random() * 50) - 10;
        const newValue = Math.max(100, current + change);
        stat.textContent = newValue.toLocaleString();
    });
}

// ===== USERS TABLE =====
function loadUsersTable() {
    const tableBody = document.getElementById('usersTableBody');
    if (!tableBody) return;
    
    // Mock user data
    const mockUsers = [
        {
            id: 1,
            name: 'Alex Johnson',
            email: 'alex@example.com',
            type: 'Student',
            status: 'Active',
            joined: '2024-01-15',
            lastActive: '2 hours ago',
            verified: true
        },
        {
            id: 2,
            name: 'TechCorp Inc.',
            email: 'hr@techcorp.com',
            type: 'Organization',
            status: 'Pending',
            joined: '2024-01-20',
            lastActive: '1 day ago',
            verified: false
        },
        {
            id: 3,
            name: 'Sarah Chen',
            email: 'sarah@example.com',
            type: 'Student',
            status: 'Active',
            joined: '2024-01-10',
            lastActive: '5 minutes ago',
            verified: true
        },
        {
            id: 4,
            name: 'Innovate Labs',
            email: 'contact@innovatelabs.com',
            type: 'Organization',
            status: 'Verified',
            joined: '2024-01-05',
            lastActive: '3 hours ago',
            verified: true
        },
        {
            id: 5,
            name: 'Michael Brown',
            email: 'michael@example.com',
            type: 'Student',
            status: 'Blocked',
            joined: '2023-12-20',
            lastActive: '1 week ago',
            verified: true
        }
    ];
    
    tableBody.innerHTML = mockUsers.map(user => `
        <tr>
            <td><input type="checkbox" class="user-checkbox" data-id="${user.id}"></td>
            <td>
                <div class="user-cell">
                    <div class="user-avatar-small">${getInitials(user.name)}</div>
                    <div>
                        <div class="user-name">${user.name}</div>
                        <div class="user-email">${user.email}</div>
                    </div>
                </div>
            </td>
            <td>
                <span class="user-type-badge ${user.type.toLowerCase()}">${user.type}</span>
            </td>
            <td>
                <span class="status-badge status-${user.status.toLowerCase()}">${user.status}</span>
            </td>
            <td>${user.joined}</td>
            <td>${user.lastActive}</td>
            <td>
                <div class="action-buttons">
                    <button class="action-btn view-btn" data-id="${user.id}">
                        <i class="fas fa-eye"></i>
                    </button>
                    ${user.type === 'Organization' && !user.verified ? 
                        `<button class="action-btn verify-btn" data-id="${user.id}">
                            <i class="fas fa-check"></i>
                        </button>` : ''}
                    ${user.status === 'Blocked' ? 
                        `<button class="action-btn unblock-btn" data-id="${user.id}">
                            <i class="fas fa-user-check"></i>
                        </button>` : 
                        `<button class="action-btn block-btn" data-id="${user.id}">
                            <i class="fas fa-ban"></i>
                        </button>`}
                    <button class="action-btn delete-btn" data-id="${user.id}">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
    
    // Add event listeners to action buttons
    setupUserActions();
}

function setupUserActions() {
    // Select All checkbox
    const selectAll = document.getElementById('selectAll');
    if (selectAll) {
        selectAll.addEventListener('change', function() {
            const checkboxes = document.querySelectorAll('.user-checkbox');
            checkboxes.forEach(cb => cb.checked = this.checked);
        });
    }
    
    // Action buttons
    document.querySelectorAll('.view-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const userId = this.getAttribute('data-id');
            showNotification(`Viewing user ${userId}...`, 'info');
        });
    });
    
    document.querySelectorAll('.verify-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const userId = this.getAttribute('data-id');
            showNotification(`Verifying organization ${userId}...`, 'info');
            // Update UI
            this.closest('tr').querySelector('.status-badge').textContent = 'Verified';
            this.closest('tr').querySelector('.status-badge').className = 'status-badge status-verified';
            this.remove();
        });
    });
    
    document.querySelectorAll('.block-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const userId = this.getAttribute('data-id');
            if (confirm('Are you sure you want to block this user?')) {
                showNotification(`User ${userId} blocked`, 'success');
                // Update UI
                const statusBadge = this.closest('tr').querySelector('.status-badge');
                statusBadge.textContent = 'Blocked';
                statusBadge.className = 'status-badge status-blocked';
                
                this.className = 'action-btn unblock-btn';
                this.innerHTML = '<i class="fas fa-user-check"></i>';
                setupUserActions(); // Re-bind event listeners
            }
        });
    });
    
    document.querySelectorAll('.unblock-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const userId = this.getAttribute('data-id');
            showNotification(`User ${userId} unblocked`, 'success');
            // Update UI
            const statusBadge = this.closest('tr').querySelector('.status-badge');
            statusBadge.textContent = 'Active';
            statusBadge.className = 'status-badge status-active';
            
            this.className = 'action-btn block-btn';
            this.innerHTML = '<i class="fas fa-ban"></i>';
            setupUserActions(); // Re-bind event listeners
        });
    });
    
    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const userId = this.getAttribute('data-id');
            if (confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
                showNotification(`User ${userId} deleted`, 'success');
                this.closest('tr').remove();
            }
        });
    });
}

function getInitials(name) {
    return name.split(' ').map(word => word[0]).join('').toUpperCase().substring(0, 2);
}

// ===== OTHER PAGE LOADERS =====
function loadVerifications() {
    console.log('Loading verifications...');
    // Would load verification queue
}

function loadReportedContent() {
    console.log('Loading reported content...');
    // Would load reported items
}

// ===== NOTIFICATION SYSTEM =====
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = 'admin-notification';
    
    const icons = {
        success: 'fa-check-circle',
        error: 'fa-exclamation-circle',
        info: 'fa-info-circle',
        warning: 'fa-exclamation-triangle'
    };
    
    const colors = {
        success: '#10b981',
        error: '#ef4444',
        info: '#3b82f6',
        warning: '#f59e0b'
    };
    
    notification.innerHTML = `
        <div style="
            position: fixed;
            top: 24px;
            right: 24px;
            background: white;
            border-left: 4px solid ${colors[type]};
            border-radius: 8px;
            padding: 16px 20px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 9999;
            display: flex;
            align-items: center;
            gap: 12px;
            min-width: 300px;
            animation: slideInRight 0.3s ease;
        ">
            <i class="fas ${icons[type]}" style="color: ${colors[type]}; font-size: 20px;"></i>
            <span style="color: #1f2937; font-size: 14px; flex: 1;">${message}</span>
            <button onclick="this.parentElement.parentElement.remove()" style="
                background: none;
                border: none;
                color: #9ca3af;
                cursor: pointer;
                font-size: 20px;
                padding: 0;
                line-height: 1;
            ">×</button>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    // Add CSS animation
    if (!document.querySelector('#notificationStyles')) {
        const style = document.createElement('style');
        style.id = 'notificationStyles';
        style.textContent = `
            @keyframes slideInRight {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            
            .user-cell { display: flex; align-items: center; gap: 12px; }
            .user-avatar-small { width: 36px; height: 36px; border-radius: 50%; background: #667eea; color: white; display: flex; align-items: center; justify-content: center; font-weight: 600; }
            .user-name { font-weight: 600; color: #1f2937; }
            .user-email { font-size: 12px; color: #6b7280; }
            .user-type-badge { padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 600; }
            .user-type-badge.student { background: rgba(59, 130, 246, 0.1); color: #3b82f6; }
            .user-type-badge.organization { background: rgba(156, 39, 176, 0.1); color: #9c27b0; }
            .status-badge { padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 600; }
            .status-active { background: rgba(16, 185, 129, 0.1); color: #10b981; }
            .status-pending { background: rgba(245, 158, 11, 0.1); color: #d97706; }
            .status-verified { background: rgba(59, 130, 246, 0.1); color: #3b82f6; }
            .status-blocked { background: rgba(239, 68, 68, 0.1); color: #dc2626; }
            .action-buttons { display: flex; gap: 8px; }
            .action-btn { width: 32px; height: 32px; border-radius: 6px; border: none; background: #f3f4f6; color: #6b7280; cursor: pointer; transition: all 0.2s ease; }
            .action-btn:hover { background: #e5e7eb; }
            .view-btn:hover { color: #3b82f6; }
            .verify-btn:hover { color: #10b981; }
            .block-btn:hover { color: #dc2626; }
            .unblock-btn:hover { color: #10b981; }
            .delete-btn:hover { color: #dc2626; }
        `;
        document.head.appendChild(style);
    }
    
    // Auto-remove after 4 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
        }
    }, 4000);
}

// ===== LOGOUT =====
function setupLogout() {
    const logoutButtons = document.querySelectorAll('.logout-btn');
    logoutButtons.forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            
            if (confirm('Are you sure you want to log out?')) {
                // Clear admin session
                localStorage.removeItem('user');
                localStorage.removeItem('isLoggedIn');
                localStorage.removeItem('userType');
                
                showNotification('Logged out successfully', 'success');
                
                setTimeout(() => {
                    window.location.href = '../index.html';
                }, 1000);
            }
        });
    });
}

// ===== INITIALIZE ON LOAD =====
document.addEventListener('DOMContentLoaded', function() {
    console.log('🛡️ Admin Dashboard Loading...');
    
    // Check if we're on admin dashboard
    if (window.location.pathname.includes('admin-dashboard')) {
        initializeAdminDashboard();
        setupLogout();
    }
});