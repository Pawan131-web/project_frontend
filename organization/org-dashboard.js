/* ===== ORGANIZATION DASHBOARD INTERACTIVITY ===== */

document.addEventListener('DOMContentLoaded', function() {
    console.log('🏢 Organization Dashboard Loading...');
    
    if (checkAuth()) {
        initializeOrganizationDashboard();
    }
});

// ===== AUTH CHECK =====
function checkAuth() {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const isLoggedIn = localStorage.getItem('isLoggedIn');
    
    // Check if user is ORGANIZATION type
    if (!user || !isLoggedIn || isLoggedIn !== 'true' || !user.isVerified) {
        console.log('🚫 User not authenticated, redirecting...');
        localStorage.setItem('redirectUrl', window.location.pathname);
        window.location.href = '../index.html';
        return false;
    }
    
    // Check if user is actually an organization
    if (user.userType !== 'organization') {
        console.log('❌ This page is for organizations only');
        alert('This dashboard is for organizations only. Redirecting to student dashboard...');
        window.location.href = '../student/std-dashboard.html';
        return false;
    }
    
    console.log(`✅ Organization authenticated: ${user.fullName}`);
    return true;
}

function initializeOrganizationDashboard() {
    console.log('🏢 Initializing Organization Dashboard...');
    
    setupUserData();
    setupDropdowns();
    setupSearch();
    setupNavigation();
    setupQuickActions();
    setupInteractions();
    setupLogout();
    
    loadOrganizationData();
}

// ===== USER DATA =====
function setupUserData() {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const defaultOrg = {
        fullName: 'TechCorp Solutions',
        email: 'hr@techcorp.com',
        avatar: 'TC'
    };
    
    const orgData = Object.keys(user).length ? user : defaultOrg;
    
    // Update organization info
    updateOrgInfo(orgData);
}

function updateOrgInfo(org) {
    const initials = getInitials(org.fullName || org.companyName);
    
    // Update avatar elements
    const avatarElements = ['userAvatar', 'dropdownAvatar'];
    avatarElements.forEach(id => {
        const element = document.getElementById(id);
        if (element) element.textContent = initials;
    });
    
    // Update name and email
    const orgNameElement = document.getElementById('userName');
    const orgEmailElement = document.getElementById('userEmail');
    
    if (orgNameElement) orgNameElement.textContent = org.fullName || org.companyName || 'Organization';
    if (orgEmailElement) orgEmailElement.textContent = org.email || 'No email';
}

function getInitials(name) {
    if (!name) return 'OC';
    return name
        .split(' ')
        .map(word => word[0])
        .join('')
        .toUpperCase()
        .substring(0, 2);
}

// ===== SEARCH FUNCTIONALITY =====
function setupSearch() {
    const searchBar = document.querySelector('.search-bar');
    const searchSuggestions = document.getElementById('searchSuggestions');
    
    if (!searchBar || !searchSuggestions) return;
    
    // Show suggestions on focus
    searchBar.addEventListener('focus', function() {
        showDefaultSuggestions();
    });
    
    // Live search for students
    let debounceTimer;
    searchBar.addEventListener('input', function() {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            const query = this.value.trim();
            if (query && query.length >= 2) {
                searchStudents(query);
            } else {
                showDefaultSuggestions();
            }
        }, 300);
    });
    
    // Search on Enter
    searchBar.addEventListener('keydown', function(event) {
        if (event.key === 'Enter') {
            const query = this.value.trim();
            if (query) {
                window.location.href = `candidates.html?search=${encodeURIComponent(query)}`;
            }
            searchSuggestions.style.display = 'none';
        }
    });
    
    // Close suggestions on outside click
    document.addEventListener('click', function(event) {
        if (!searchBar.contains(event.target) && !searchSuggestions.contains(event.target)) {
            searchSuggestions.style.display = 'none';
        }
    });
}

function showDefaultSuggestions() {
    const searchSuggestions = document.getElementById('searchSuggestions');
    const suggestions = [
        { icon: 'user-graduate', text: 'Search students by name' },
        { icon: 'code', text: 'Find students by skills' },
        { icon: 'university', text: 'Browse by university' },
        { icon: 'map-marker-alt', text: 'Search by location' },
        { icon: 'briefcase', text: 'View all candidates' }
    ];
    
    const html = suggestions.map(item => `
        <div class="suggestion-item">
            <i class="fas fa-${item.icon}"></i>
            <span>${item.text}</span>
        </div>
    `).join('');
    
    searchSuggestions.innerHTML = html;
    searchSuggestions.style.display = 'block';
}

async function searchStudents(query) {
    const searchSuggestions = document.getElementById('searchSuggestions');
    
    // Show loading
    searchSuggestions.innerHTML = `
        <div class="suggestion-item">
            <i class="fas fa-spinner fa-spin"></i>
            <span>Searching students for "${query}"...</span>
        </div>
    `;
    searchSuggestions.style.display = 'block';
    
    try {
        // In real app: fetch from /api/users/search?query=${query}&type=student
        // For now, simulate search results
        setTimeout(() => {
            const mockResults = [
                { name: 'John Doe', username: 'johndoe', skills: 'React, Node.js', type: 'student' },
                { name: 'Sarah Chen', username: 'sarahc', skills: 'Python, Data Science', type: 'student' },
                { name: 'Alex Kim', username: 'alexk', skills: 'UI/UX, Figma', type: 'student' }
            ];
            
            displayStudentSearchResults(mockResults, query);
        }, 500);
        
    } catch (error) {
        console.error('Search error:', error);
        searchSuggestions.innerHTML = `
            <div class="suggestion-item">
                <i class="fas fa-exclamation-triangle"></i>
                <span>Search temporarily unavailable</span>
            </div>
        `;
    }
}

function displayStudentSearchResults(students, query) {
    const searchSuggestions = document.getElementById('searchSuggestions');
    
    let html = `
        <div class="suggestion-header">
            <i class="fas fa-user-graduate"></i>
            <span>Found ${students.length} student${students.length === 1 ? '' : 's'}</span>
        </div>
    `;
    
    students.forEach(student => {
        const initials = getInitials(student.name);
        html += `
            <div class="suggestion-item user-result" data-username="${student.username}">
                <div class="user-avatar-small">${initials}</div>
                <div class="user-info">
                    <div class="user-name">${student.name}</div>
                    <div class="user-details">
                        <span class="username">@${student.username}</span>
                        <span class="skills">${student.skills}</span>
                    </div>
                </div>
                <i class="fas fa-chevron-right"></i>
            </div>
        `;
    });
    
    html += `
        <div class="suggestion-footer">
            <a href="candidates.html?search=${encodeURIComponent(query)}" class="view-all-link">
                View all results for "${query}"
            </a>
        </div>
    `;
    
    searchSuggestions.innerHTML = html;
    searchSuggestions.style.display = 'block';
    
    // Add click handlers
    searchSuggestions.querySelectorAll('.user-result').forEach(item => {
        item.addEventListener('click', function() {
            const username = this.getAttribute('data-username');
            window.location.href = `student-profile.html?username=${username}`;
        });
    });
}

// ===== QUICK ACTIONS =====
function setupQuickActions() {
    // Post New Internship button
    const postInternshipBtn = document.querySelector('.action-btn.primary');
    if (postInternshipBtn) {
        postInternshipBtn.addEventListener('click', function() {
            window.location.href = 'post-internship.html';
        });
    }
    
    // Browse Students button
    const browseStudentsBtn = document.querySelectorAll('.action-btn.secondary')[0];
    if (browseStudentsBtn) {
        browseStudentsBtn.addEventListener('click', function() {
            window.location.href = 'candidates.html';
        });
    }
    
    // Message Candidates button
    const messageBtn = document.querySelectorAll('.action-btn.secondary')[1];
    if (messageBtn) {
        messageBtn.addEventListener('click', function() {
            window.location.href = 'messages.html';
        });
    }
    
    // Schedule Interview button
    const scheduleBtn = document.querySelectorAll('.action-btn.secondary')[2];
    if (scheduleBtn) {
        scheduleBtn.addEventListener('click', function() {
            // In real app: open calendar/scheduling modal
            alert('Interview scheduling feature coming soon!');
        });
    }
}

// ===== APPLICATION INTERACTIONS =====
function setupInteractions() {
    // Application status clicks
    document.querySelectorAll('.application-status').forEach(status => {
        status.addEventListener('click', function() {
            const currentStatus = this.textContent.trim();
            const studentName = this.closest('.application-item').querySelector('h4').textContent;
            
            // Show status change options
            const newStatus = prompt(`Change status for ${studentName} (Current: ${currentStatus})\n\nEnter: Pending, Review, Shortlisted, Rejected`);
            
            if (newStatus && ['Pending', 'Review', 'Shortlisted', 'Rejected'].includes(newStatus)) {
                this.textContent = newStatus;
                this.className = `application-status ${newStatus.toLowerCase()}`;
                
                showNotification(`Status updated to: ${newStatus}`, 'success');
            }
        });
    });
    
    // Student avatar clicks
    document.querySelectorAll('.student-avatar, .student-avatar-small').forEach(avatar => {
        avatar.addEventListener('click', function() {
            const studentName = this.textContent;
            alert(`Viewing ${studentName}'s profile\n(In real app: redirect to student profile)`);
        });
    });
}

// ===== LOAD ORGANIZATION DATA =====
async function loadOrganizationData() {
    try {
        // In real app: fetch organization data from backend
        // For now, simulate loading
        console.log('📊 Loading organization data...');
        
        // Update stats in real-time
        updateDashboardStats();
        
    } catch (error) {
        console.error('Error loading organization data:', error);
    }
}

function updateDashboardStats() {
    // In real app: fetch from backend API
    // For now, use mock data
    const stats = {
        totalApplications: 25,
        pendingReview: 8,
        interviewsScheduled: 3,
        hired: 2
    };
    
    // Update pipeline stats
    document.querySelectorAll('.stage-count')[0].textContent = stats.totalApplications;
    document.querySelectorAll('.stage-count')[1].textContent = stats.pendingReview;
    document.querySelectorAll('.stage-count')[2].textContent = stats.interviewsScheduled;
    document.querySelectorAll('.stage-count')[3].textContent = stats.hired;
}

// ===== DROPDOWNS (reuse from student dashboard) =====
function setupDropdowns() {
    // Similar to student dashboard but with organization-specific content
    setupDropdownToggle('profileDropdown', 'profileMenu');
    setupDropdownToggle('notificationIcon', 'notificationDropdown');
    setupDropdownToggle('messageIcon', 'messageDropdown');
    
    document.addEventListener('click', function(event) {
        if (!event.target.closest('.dropdown-menu') && 
            !event.target.closest('.icon-container') && 
            !event.target.closest('.profile-container')) {
            closeAllDropdowns();
        }
    });
}

function setupDropdownToggle(triggerId, dropdownId) {
    const trigger = document.getElementById(triggerId);
    const dropdown = document.getElementById(dropdownId);
    
    if (!trigger || !dropdown) return;
    
    trigger.addEventListener('click', function(event) {
        event.stopPropagation();
        event.preventDefault();
        
        closeAllDropdowns();
        
        const isVisible = dropdown.style.display === 'block';
        dropdown.style.display = isVisible ? 'none' : 'block';
        
        if (!isVisible) {
            positionDropdown(dropdown, trigger);
        }
    });
}

function positionDropdown(dropdown, trigger) {
    const triggerRect = trigger.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    
    if (viewportWidth <= 768) {
        dropdown.style.position = 'fixed';
        dropdown.style.top = '70px';
        dropdown.style.left = '16px';
        dropdown.style.right = '16px';
        dropdown.style.width = 'auto';
    } else {
        dropdown.style.position = 'absolute';
        dropdown.style.top = `${triggerRect.bottom + 8}px`;
        dropdown.style.right = `${viewportWidth - triggerRect.right}px`;
    }
}

function closeAllDropdowns() {
    document.querySelectorAll('.dropdown-menu').forEach(dropdown => {
        dropdown.style.display = 'none';
    });
}

// ===== LOGOUT =====
function setupLogout() {
    const logoutBtn = document.querySelector('.logout-btn');
    
    if (!logoutBtn) return;
    
    logoutBtn.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        
        if (confirm('Are you sure you want to log out?')) {
            // Clear organization data
            localStorage.removeItem('user');
            localStorage.removeItem('isLoggedIn');
            localStorage.removeItem('userType');
            
            showNotification('Logged out successfully!', 'success');
            
            setTimeout(() => {
                window.location.href = '../../index.html';
            }, 1000);
        }
    });
}

// ===== NOTIFICATION FUNCTION =====
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = 'notification-toast';
    
    const icons = {
        success: 'fa-check-circle',
        error: 'fa-exclamation-circle',
        info: 'fa-info-circle'
    };
    
    const colors = {
        success: '#38a169',
        error: '#e53e3e',
        info: '#3182ce'
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
            max-width: 400px;
            animation: slideInRight 0.3s ease;
        ">
            <i class="fas ${icons[type]}" style="color: ${colors[type]}; font-size: 20px;"></i>
            <span style="color: #191919; font-size: 14px; flex: 1;">${message}</span>
            <button onclick="this.parentElement.parentElement.remove()" style="
                background: none;
                border: none;
                color: #a0aec0;
                cursor: pointer;
                font-size: 20px;
                padding: 0;
                line-height: 1;
            ">×</button>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
        }
    }, 4000);
}

// ===== NAVIGATION =====
function setupNavigation() {
    const tabs = document.querySelectorAll('.nav-tab');
    
    tabs.forEach(tab => {
        tab.addEventListener('click', function(event) {
            if (this.getAttribute('href') === '#') {
                event.preventDefault();
                
                tabs.forEach(t => t.classList.remove('active'));
                this.classList.add('active');
                
                const tabName = this.getAttribute('data-tab');
                console.log(`Switched to ${tabName} tab`);
                
                // In real app: load tab content dynamically
                showNotification(`Loading ${tabName}...`, 'info');
            }
        });
    });
}