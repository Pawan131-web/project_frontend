/*organization/org-dashboard.js*/
/* ===== ORGANIZATION DASHBOARD INTERACTIVITY ===== */

// ===== AUTH CHECK =====
function checkOrgAuth() {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const isLoggedIn = localStorage.getItem('isLoggedIn');
    
    // Check if user is organization type
    if (!user || !isLoggedIn || isLoggedIn !== 'true' || !user.isVerified || user.userType !== 'organization') {
        console.log('🚫 Organization not authenticated, redirecting...');
        
        // Store where they tried to go
        localStorage.setItem('redirectUrl', window.location.pathname);
        
        // Redirect to organization login
        window.location.href = '../organization/login-org.html';
        return false;
    }
    
    console.log(`✅ Organization authenticated: ${user.companyName} (${user.userType})`);
    return true;
}

// ===== LOGOUT FUNCTIONALITY =====
function setupOrgLogout() {
    const logoutBtn = document.querySelector('.logout-btn');
    
    if (!logoutBtn) {
        console.log('⚠️ Logout button not found');
        return;
    }
    
    logoutBtn.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        
        console.log('👋 Logging out organization...');
        logoutOrg();
    });
}

function logoutOrg() {
    // Show confirmation dialog
    if (confirm('Are you sure you want to log out?')) {
        // Clear all user data from localStorage
        localStorage.removeItem('user');
        localStorage.removeItem('isLoggedIn');
        localStorage.removeItem('userType');
        
        console.log('✅ Organization data cleared from localStorage');
        
        // Show logout notification
        showNotification('Logged out successfully!', 'success');
        
        // Close any open dropdowns
        closeAllDropdowns();
        
        // Redirect to homepage after a brief delay
        setTimeout(() => {
            console.log('🔀 Redirecting to homepage...');
            window.location.href = '../../index.html';
        }, 1000);
    }
}

function initializeOrgDashboard() {
    console.log('🏢 Organization Dashboard Loaded');
    
    // Initialize all components
    setupOrgData();
    setupDropdowns();
    setupOrgSearch();
    setupNavigation();
    setupCreateOrgPost();
    setupOrgInteractions();
    setupOrgNotifications();
    setupOrgLogout();
}

// ===== 1. ORGANIZATION DATA INITIALIZATION =====
function setupOrgData() {
    // Get organization data from localStorage or use defaults
    const org = JSON.parse(localStorage.getItem('user') || '{}');
    const defaultOrg = {
        companyName: 'TechCorp Inc.',
        email: 'hr@techcorp.com',
        avatar: 'TC',
        userType: 'organization',
        industry: 'Technology',
        location: 'San Francisco, CA',
        website: 'https://techcorp.com',
        description: 'Leading technology company specializing in software solutions.'
    };
    
    const orgData = Object.keys(org).length ? org : defaultOrg;
    
    // Update organization information
    updateOrgInfo(orgData);
    
    // Save org data if not exists
    if (!localStorage.getItem('user')) {
        localStorage.setItem('user', JSON.stringify(orgData));
    }
}

function updateOrgInfo(org) {
    const initials = getOrgInitials(org.companyName);
    
    // Update all avatar elements
    const avatarElements = ['userAvatar', 'dropdownAvatar', 'postAvatar'];
    avatarElements.forEach(id => {
        const element = document.getElementById(id);
        if (element) element.textContent = initials;
    });
    
    // Update name and email
    const userNameElement = document.getElementById('userName');
    const userEmailElement = document.getElementById('userEmail');
    
    if (userNameElement) userNameElement.textContent = org.companyName;
    if (userEmailElement) userEmailElement.textContent = org.email;
}

function getOrgInitials(companyName) {
    if (!companyName) return 'TC';
    return companyName
        .split(' ')
        .map(word => word[0])
        .join('')
        .toUpperCase()
        .substring(0, 2);
}

// ===== 2. DROPDOWN FUNCTIONALITY (Same as student) =====
function setupDropdowns() {
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
    
    document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape') {
            closeAllDropdowns();
        }
    });
    
    window.addEventListener('scroll', function() {
        closeAllDropdowns();
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
        
        if (dropdownId === 'notificationDropdown') {
            clearNotificationCount();
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

// ===== 3. SEARCH FUNCTIONALITY (Search Students) =====
function setupOrgSearch() {
    const searchBar = document.querySelector('.search-bar');
    const searchSuggestions = document.getElementById('searchSuggestions');
    
    if (!searchBar || !searchSuggestions) return;
    
    searchBar.addEventListener('focus', function() {
        showDefaultStudentSuggestions();
    });
    
    let debounceTimer;
    searchBar.addEventListener('input', function() {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            const query = this.value.trim();
            if (query) {
                searchStudents(query);
            } else {
                showDefaultStudentSuggestions();
            }
        }, 300);
    });
    
    document.addEventListener('click', function(event) {
        if (!searchBar.contains(event.target) && !searchSuggestions.contains(event.target)) {
            searchSuggestions.style.display = 'none';
        }
    });
    
    searchBar.addEventListener('keydown', function(event) {
        if (event.key === 'Enter') {
            performStudentSearch(this.value);
            searchSuggestions.style.display = 'none';
        }
    });
}

function showDefaultStudentSuggestions() {
    const searchSuggestions = document.getElementById('searchSuggestions');
    const suggestions = [
        { icon: 'user-graduate', text: 'Search students by skill' },
        { icon: 'code', text: 'React developers available' },
        { icon: 'database', text: 'Data science students' },
        { icon: 'map-marker-alt', text: 'Students in San Francisco' },
        { icon: 'star', text: 'Top rated portfolios' }
    ];
    
    const html = suggestions.map(item => `
        <div class="suggestion-item">
            <i class="fas fa-${item.icon}"></i>
            <span>${item.text}</span>
        </div>
    `).join('');
    
    searchSuggestions.innerHTML = html;
    searchSuggestions.style.display = 'block';
    
    searchSuggestions.querySelectorAll('.suggestion-item').forEach(item => {
        item.addEventListener('click', function() {
            const searchBar = document.querySelector('.search-bar');
            searchBar.value = this.querySelector('span').textContent;
            performStudentSearch(searchBar.value);
            searchSuggestions.style.display = 'none';
        });
    });
}

function searchStudents(query) {
    const searchSuggestions = document.getElementById('searchSuggestions');
    
    if (query.length < 2) {
        searchSuggestions.style.display = 'none';
        return;
    }
    
    searchSuggestions.innerHTML = `
        <div class="suggestion-item">
            <i class="fas fa-spinner fa-spin"></i>
            <span>Searching students for "${query}"...</span>
        </div>
    `;
    searchSuggestions.style.display = 'block';
    
    // Simulate API call for students
    setTimeout(() => {
        const mockStudents = [
            { name: 'Alex Johnson', skills: ['React', 'Node.js'], match: 95 },
            { name: 'Sarah Chen', skills: ['Python', 'ML'], match: 92 },
            { name: 'Michael Lee', skills: ['AWS', 'DevOps'], match: 88 }
        ];
        
        if (mockStudents.length > 0) {
            displayStudentSuggestions(mockStudents, query);
        } else {
            displayNoStudentResults(query);
        }
    }, 500);
}

function displayStudentSuggestions(students, query) {
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
            <div class="suggestion-item user-result" data-student="${student.name}">
                <div class="user-avatar-small">${initials}</div>
                <div class="user-info">
                    <div class="user-name">${student.name}</div>
                    <div class="user-details">
                        <span class="username">${student.skills.slice(0, 2).join(', ')}</span>
                        <span class="user-type">
                            <i class="fas fa-percentage"></i> ${student.match}% match
                        </span>
                    </div>
                </div>
                <i class="fas fa-chevron-right"></i>
            </div>
        `;
    });
    
    html += `
        <div class="suggestion-footer">
            <a href="browse-students.html?search=${encodeURIComponent(query)}" class="view-all-link">
                View all students for "${query}"
            </a>
        </div>
    `;
    
    searchSuggestions.innerHTML = html;
    searchSuggestions.style.display = 'block';
    
    searchSuggestions.querySelectorAll('.user-result').forEach(item => {
        item.addEventListener('click', function() {
            const studentName = this.getAttribute('data-student');
            viewStudentProfile(studentName);
        });
    });
}

function displayNoStudentResults(query) {
    const searchSuggestions = document.getElementById('searchSuggestions');
    
    const html = `
        <div class="suggestion-item">
            <i class="fas fa-search"></i>
            <span>No students found for "${query}"</span>
        </div>
    `;
    
    searchSuggestions.innerHTML = html;
    searchSuggestions.style.display = 'block';
}

function performStudentSearch(query) {
    if (!query.trim()) return;
    
    console.log(`Searching students: ${query}`);
    showNotification(`Searching students for "${query}"...`, 'info');
    
    setTimeout(() => {
        showNotification(`Found students matching "${query}"`, 'success');
    }, 800);
}

function viewStudentProfile(studentName) {
    console.log(`Viewing student: ${studentName}`);
    
    const searchSuggestions = document.getElementById('searchSuggestions');
    if (searchSuggestions) {
        searchSuggestions.style.display = 'none';
    }
    
    const searchBar = document.querySelector('.search-bar');
    if (searchBar) {
        searchBar.value = '';
    }
    
    showNotification(`Viewing ${studentName}'s profile...`, 'info');
    
    // In real app, would fetch and show student profile
    setTimeout(() => {
        showNotification(`Profile loaded for ${studentName}`, 'success');
    }, 1000);
}

// ===== 4. NAVIGATION =====
function setupNavigation() {
    const tabs = document.querySelectorAll('.nav-tab');
    
    tabs.forEach(tab => {
        tab.addEventListener('click', function(event) {
            if (this.getAttribute('href') === '#') {
                event.preventDefault();
                
                tabs.forEach(t => t.classList.remove('active'));
                this.classList.add('active');
                
                const tabName = this.getAttribute('data-tab');
                loadOrgTabContent(tabName);
            }
        });
    });
}

function loadOrgTabContent(tabName) {
    console.log(`Loading ${tabName} content...`);
    showNotification(`Loading ${tabName}...`, 'info');
    
    // In real app, would load content dynamically
    if (tabName === 'analytics') {
        showNotification('Analytics dashboard loading...', 'info');
    }
}

// ===== 5. CREATE ORGANIZATION POST =====
function setupCreateOrgPost() {
    const postInput = document.querySelector('.post-input');
    const postButton = document.querySelector('.post-submit-btn');
    const actionButtons = document.querySelectorAll('.post-action-btn');
    
    if (!postInput || !postButton) return;
    
    actionButtons.forEach(button => {
        button.addEventListener('click', function() {
            const type = this.getAttribute('data-type');
            handleOrgPostAction(type, postInput);
        });
    });
    
    postButton.addEventListener('click', () => createOrgPost(postInput, postButton));
    
    postInput.addEventListener('keydown', function(event) {
        if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
            createOrgPost(postInput, postButton);
        }
    });
}

function handleOrgPostAction(type, postInput) {
    const placeholders = {
        internship: 'Describe the internship opportunity...',
        event: 'Share event details...',
        article: 'Write company news or article...'
    };
    
    if (placeholders[type]) {
        postInput.placeholder = placeholders[type];
    }
    
    if (type === 'internship') {
        // Redirect to full internship posting page
        window.location.href = 'post-internship.html';
        return;
    }
    
    postInput.focus();
}

function createOrgPost(postInput, postButton) {
    const content = postInput.value.trim();
    
    if (!content) {
        showNotification('Please enter some content', 'error');
        postInput.focus();
        return;
    }
    
    const originalText = postButton.textContent;
    postButton.textContent = 'Posting...';
    postButton.disabled = true;
    
    setTimeout(() => {
        postButton.textContent = originalText;
        postButton.disabled = false;
        postInput.value = '';
        postInput.placeholder = 'Share company updates, hiring news, or events...';
        
        showNotification('Company update published!', 'success');
        
        addOrgPostToFeed(content);
    }, 1000);
}

function addOrgPostToFeed(content) {
    const feed = document.querySelector('.feed-posts');
    if (!feed) return;
    
    const org = JSON.parse(localStorage.getItem('user') || {});
    const initials = getOrgInitials(org.companyName || 'Company');
    
    const post = document.createElement('div');
    post.className = 'card feed-post';
    post.innerHTML = `
        <div class="post-header">
            <div class="company-logo">${initials}</div>
            <div class="post-info">
                <h4>${org.companyName || 'Your Company'}</h4>
                <p>Just now • Company Update</p>
            </div>
        </div>
        <div class="post-content">
            <p>${content}</p>
        </div>
        <div class="post-actions">
            <button class="action-btn like-btn" data-post-id="new">
                <i class="far fa-heart"></i> <span>Like</span>
            </button>
            <button class="action-btn comment-btn">
                <i class="far fa-comment"></i> <span>Comment</span>
            </button>
            <button class="action-btn share-btn">
                <i class="fas fa-share"></i> <span>Share</span>
            </button>
            <button class="action-btn stats-btn">
                <i class="fas fa-chart-bar"></i> <span>0 Views</span>
            </button>
        </div>
    `;
    
    feed.insertBefore(post, feed.firstChild);
    
    setupPostInteractions(post);
}

// ===== 6. ORGANIZATION INTERACTIONS =====
function setupOrgInteractions() {
    setupPostInteractions();
    setupOrgActionButtons();
    setupQuickActions();
}

function setupPostInteractions(container = document) {
    container.querySelectorAll('.like-btn').forEach(button => {
        button.addEventListener('click', function() {
            const icon = this.querySelector('i');
            const isLiked = icon.classList.contains('fas');
            
            if (isLiked) {
                icon.classList.remove('fas');
                icon.classList.add('far');
                this.classList.remove('active');
            } else {
                icon.classList.remove('far');
                icon.classList.add('fas');
                this.classList.add('active');
                
                icon.style.animation = 'heartBeat 0.3s ease';
                setTimeout(() => {
                    icon.style.animation = '';
                }, 300);
            }
        });
    });
    
    container.querySelectorAll('.comment-btn').forEach(button => {
        button.addEventListener('click', function() {
            showNotification('Comment feature coming soon!', 'info');
        });
    });
    
    container.querySelectorAll('.share-btn').forEach(button => {
        button.addEventListener('click', function() {
            showNotification('Share feature coming soon!', 'info');
        });
    });
}

function setupOrgActionButtons() {
    // Edit post button
    document.querySelectorAll('.apply-btn').forEach(button => {
        if (button.textContent.includes('Edit')) {
            button.addEventListener('click', function() {
                showNotification('Redirecting to edit internship...', 'info');
                setTimeout(() => {
                    window.location.href = 'post-internship.html?edit=true';
                }, 500);
            });
        }
    });
    
    // Invite to apply buttons
    document.querySelectorAll('.connect-btn').forEach(button => {
        if (button.textContent.includes('Invite')) {
            button.addEventListener('click', function() {
                showNotification('Invitation sent to student!', 'success');
                this.innerHTML = '<i class="fas fa-check"></i> Invited';
                this.disabled = true;
                this.style.opacity = '0.7';
            });
        }
    });
    
    // Save profile buttons
    document.querySelectorAll('.save-btn').forEach(button => {
        button.addEventListener('click', function() {
            showNotification('Student profile saved to favorites!', 'success');
            const icon = this.querySelector('i');
            icon.classList.remove('far');
            icon.classList.add('fas');
            icon.style.color = '#FFD600';
        });
    });
    
    // Message buttons
    document.querySelectorAll('.message-btn').forEach(button => {
        button.addEventListener('click', function() {
            showNotification('Opening message window...', 'info');
            setTimeout(() => {
                window.location.href = 'org-messages.html';
            }, 500);
        });
    });
    
    // View portfolio buttons
    document.querySelectorAll('.view-btn').forEach(button => {
        button.addEventListener('click', function() {
            showNotification('Opening student portfolio...', 'info');
        });
    });
    
    // Download report buttons
    document.querySelectorAll('.download-btn').forEach(button => {
        button.addEventListener('click', function() {
            showNotification('Downloading report...', 'info');
            // Simulate download
            setTimeout(() => {
                showNotification('Report downloaded successfully!', 'success');
            }, 1500);
        });
    });
}

function setupQuickActions() {
    document.querySelectorAll('.card-btn').forEach(button => {
        button.addEventListener('click', function() {
            if (this.textContent.includes('Update Skill')) {
                window.location.href = 'post-internship.html?skills=true';
            }
        });
    });
    
    // Quick action items
    document.querySelectorAll('.trending-item').forEach(item => {
        if (item.onclick) return; // Already has onclick
        
        item.addEventListener('click', function() {
            const title = this.querySelector('h4').textContent;
            showNotification(`Opening ${title}...`, 'info');
        });
    });
}

// ===== 7. NOTIFICATIONS =====
function setupOrgNotifications() {
    // Simulate new organization notifications
    setInterval(() => {
        if (Math.random() > 0.8) {
            addRandomOrgNotification();
        }
    }, 45000);
}

function clearNotificationCount() {
    const notificationCount = document.querySelector('#notificationIcon .notification-count');
    if (notificationCount) {
        notificationCount.style.display = 'none';
    }
}

function addRandomOrgNotification() {
    const notifications = [
        {
            icon: 'user-plus',
            title: 'New Application',
            message: 'High-match student applied to your internship',
            time: 'Just now'
        },
        {
            icon: 'eye',
            title: 'Increased Views',
            message: 'Your internship post got 50+ new views',
            time: '10 min ago'
        },
        {
            icon: 'star',
            title: 'Student Achievement',
            message: 'Saved student completed a new certification',
            time: '1 hour ago'
        }
    ];
    
    const randomNotification = notifications[Math.floor(Math.random() * notifications.length)];
    showNotification(`${randomNotification.title}: ${randomNotification.message}`, 'info');
}

// ===== UTILITY FUNCTIONS =====
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

// Helper function from student dashboard
function getInitials(name) {
    if (!name) return 'US';
    return name
        .split(' ')
        .map(word => word[0])
        .join('')
        .toUpperCase()
        .substring(0, 2);
}

// ===== START ORGANIZATION DASHBOARD =====
document.addEventListener('DOMContentLoaded', function() {
    console.log('🏢 Organization Dashboard Loading...');
    
    if (checkOrgAuth()) {
        initializeOrgDashboard();
    }
});