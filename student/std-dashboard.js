/* ===== STUDENT DASHBOARD INTERACTIVITY ===== */

// ===== AUTH CHECK =====
function checkAuth() {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const isLoggedIn = localStorage.getItem('isLoggedIn');
    
    if (!user || !isLoggedIn || isLoggedIn !== 'true' || !user.isVerified) {
        console.log('🚫 User not authenticated, redirecting...');
        
        // Store where they tried to go
        localStorage.setItem('redirectUrl', window.location.pathname);
        
        // Redirect to login
        window.location.href = '../login-std.html';
        return false;
    }
    
    console.log(`✅ User authenticated: ${user.fullName} (${user.userType})`);
    return true;
}

// ===== LOGOUT FUNCTIONALITY =====
function setupLogout() {
    const logoutBtn = document.querySelector('.logout-btn');
    
    if (!logoutBtn) {
        console.log('⚠️ Logout button not found');
        return;
    }
    
    logoutBtn.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        
        console.log('👋 Logging out user...');
        logoutUser();
    });
}

function logoutUser() {
    // Show confirmation dialog
    if (confirm('Are you sure you want to log out?')) {
        // Clear all user data from localStorage
        localStorage.removeItem('user');
        localStorage.removeItem('isLoggedIn');
        localStorage.removeItem('userType');
        localStorage.removeItem('pendingVerificationEmail');
        localStorage.removeItem('signupEmail');
        localStorage.removeItem('signupUsername');
        
        console.log('✅ User data cleared from localStorage');
        
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

function initializeDashboard() {
    console.log('🚀 Professional Dashboard Loaded');
    
    // Initialize all components
    setupUserData();
    setupDropdowns();
    setupSearch();
    setupNavigation();
    setupCreatePost();
    setupInteractions();
    setupNotifications();
    setupLogout();
}

// ===== 1. USER DATA INITIALIZATION =====
function setupUserData() {
    // Get user data from localStorage or use defaults
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const defaultUser = {
        fullName: 'John Doe',
        email: 'john@skilllaunch.com',
        avatar: 'JD'
    };
    
    const userData = Object.keys(user).length ? user : defaultUser;
    
    // Update user information
    updateUserInfo(userData);
    
    // Save user data if not exists
    if (!localStorage.getItem('user')) {
        localStorage.setItem('user', JSON.stringify(userData));
    }
}

function updateUserInfo(user) {
    const initials = getInitials(user.fullName);
    
    // Update all avatar elements
    const avatarElements = ['userAvatar', 'dropdownAvatar', 'postAvatar'];
    avatarElements.forEach(id => {
        const element = document.getElementById(id);
        if (element) element.textContent = initials;
    });
    
    // Update name and email
    const userNameElement = document.getElementById('userName');
    const userEmailElement = document.getElementById('userEmail');
    
    if (userNameElement) userNameElement.textContent = user.fullName;
    if (userEmailElement) userEmailElement.textContent = user.email;
}

function getInitials(name) {
    if (!name) return 'JD';
    return name
        .split(' ')
        .map(word => word[0])
        .join('')
        .toUpperCase()
        .substring(0, 2);
}

// ===== 2. DROPDOWN FUNCTIONALITY =====
function setupDropdowns() {
    // Setup dropdown toggles
    setupDropdownToggle('profileDropdown', 'profileMenu');
    setupDropdownToggle('notificationIcon', 'notificationDropdown');
    setupDropdownToggle('messageIcon', 'messageDropdown');
    
    // Close dropdowns on outside click
    document.addEventListener('click', function(event) {
        if (!event.target.closest('.dropdown-menu') && !event.target.closest('.icon-container') && !event.target.closest('.profile-container')) {
            closeAllDropdowns();
        }
    });
    
    // Close on escape key
    document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape') {
            closeAllDropdowns();
        }
    });
    
    // Close on scroll
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
        
        // Close all other dropdowns
        closeAllDropdowns();
        
        // Toggle current dropdown
        const isVisible = dropdown.style.display === 'block';
        dropdown.style.display = isVisible ? 'none' : 'block';
        
        // Position dropdown
        if (!isVisible) {
            positionDropdown(dropdown, trigger);
        }
        
        // Clear notifications if notification dropdown
        if (dropdownId === 'notificationDropdown') {
            clearNotificationCount();
        }
    });
}

function positionDropdown(dropdown, trigger) {
    const triggerRect = trigger.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    
    if (viewportWidth <= 768) {
        // Mobile positioning
        dropdown.style.position = 'fixed';
        dropdown.style.top = '70px';
        dropdown.style.left = '16px';
        dropdown.style.right = '16px';
        dropdown.style.width = 'auto';
    } else {
        // Desktop positioning
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

// ===== 3. SEARCH FUNCTIONALITY (UPDATED) =====
function setupSearch() {
    const searchBar = document.querySelector('.search-bar');
    const searchSuggestions = document.getElementById('searchSuggestions');
    
    if (!searchBar || !searchSuggestions) return;
    
    // Show suggestions on focus
    searchBar.addEventListener('focus', function() {
        showDefaultSuggestions();
    });
    
    // Live search
    let debounceTimer;
    searchBar.addEventListener('input', function() {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            const query = this.value.trim();
            if (query) {
                updateSearchSuggestions(query);
            } else {
                showDefaultSuggestions();
            }
        }, 300);
    });
    
    // Close suggestions on outside click
    document.addEventListener('click', function(event) {
        if (!searchBar.contains(event.target) && !searchSuggestions.contains(event.target)) {
            searchSuggestions.style.display = 'none';
        }
    });
    
    // Search on Enter
    searchBar.addEventListener('keydown', function(event) {
        if (event.key === 'Enter') {
            performSearch(this.value);
            searchSuggestions.style.display = 'none';
        }
    });
}

function showDefaultSuggestions() {
    const searchSuggestions = document.getElementById('searchSuggestions');
    const suggestions = [
        { icon: 'building', text: 'Software Engineering Internships' },
        { icon: 'code', text: 'React Developer Jobs' },
        { icon: 'database', text: 'Data Science Roles' },
        { icon: 'users', text: 'Find Students & Organizations' },
        { icon: 'graduation-cap', text: 'Student Success Stories' }
    ];
    
    const html = suggestions.map(item => `
        <div class="suggestion-item">
            <i class="fas fa-${item.icon}"></i>
            <span>${item.text}</span>
        </div>
    `).join('');
    
    searchSuggestions.innerHTML = html;
    searchSuggestions.style.display = 'block';
    
    // Add click handlers
    searchSuggestions.querySelectorAll('.suggestion-item').forEach(item => {
        item.addEventListener('click', function() {
            const searchBar = document.querySelector('.search-bar');
            searchBar.value = this.querySelector('span').textContent;
            performSearch(searchBar.value);
            searchSuggestions.style.display = 'none';
        });
    });
}

function updateSearchSuggestions(query) {
    const searchSuggestions = document.getElementById('searchSuggestions');
    
    if (query.length < 2) {
        searchSuggestions.style.display = 'none';
        return;
    }
    
    // Show loading
    searchSuggestions.innerHTML = `
        <div class="suggestion-item">
            <i class="fas fa-spinner fa-spin"></i>
            <span>Searching users for "${query}"...</span>
        </div>
    `;
    searchSuggestions.style.display = 'block';
    
    // Debounce search
    clearTimeout(window.searchDebounce);
    window.searchDebounce = setTimeout(async () => {
        try {
            const response = await fetch(`http://localhost:5000/api/users/search?query=${encodeURIComponent(query)}`);
            const result = await response.json();
            
            if (result.success && result.users.length > 0) {
                displayUserSuggestions(result.users, query);
            } else {
                displayNoResults(query);
            }
        } catch (error) {
            console.error('Search error:', error);
            displaySearchError();
        }
    }, 500);
}

function displayUserSuggestions(users, query) {
    const searchSuggestions = document.getElementById('searchSuggestions');
    
    let html = `
        <div class="suggestion-header">
            <i class="fas fa-users"></i>
            <span>Found ${users.length} user${users.length === 1 ? '' : 's'}</span>
        </div>
    `;
    
    users.forEach(user => {
        const userTypeIcon = user.userType === 'student' ? 'fa-user-graduate' : 'fa-building';
        const userTypeLabel = user.userType === 'student' ? 'Student' : 'Organization';
        
        html += `
            <div class="suggestion-item user-result" data-username="${user.username}">
                <div class="user-avatar-small">${getInitials(user.fullName)}</div>
                <div class="user-info">
                    <div class="user-name">${user.fullName}</div>
                    <div class="user-details">
                        <span class="username">@${user.username}</span>
                        <span class="user-type">
                            <i class="fas ${userTypeIcon}"></i> ${userTypeLabel}
                        </span>
                    </div>
                </div>
                <i class="fas fa-chevron-right"></i>
            </div>
        `;
    });
    
    html += `
        <div class="suggestion-footer">
            <a href="explore.html?search=${encodeURIComponent(query)}" class="view-all-link">
                View all results for "${query}"
            </a>
        </div>
    `;
    
    searchSuggestions.innerHTML = html;
    searchSuggestions.style.display = 'block';
    
    // Add click handlers for user results
    searchSuggestions.querySelectorAll('.user-result').forEach(item => {
        item.addEventListener('click', function() {
            const username = this.getAttribute('data-username');
            viewUserProfile(username);
        });
    });
}

function displayNoResults(query) {
    const searchSuggestions = document.getElementById('searchSuggestions');
    
    const html = `
        <div class="suggestion-item">
            <i class="fas fa-search"></i>
            <span>No users found for "${query}"</span>
        </div>
        <div class="suggestion-item">
            <i class="fas fa-lightbulb"></i>
            <span>Try searching by name or username</span>
        </div>
    `;
    
    searchSuggestions.innerHTML = html;
    searchSuggestions.style.display = 'block';
}

function displaySearchError() {
    const searchSuggestions = document.getElementById('searchSuggestions');
    
    const html = `
        <div class="suggestion-item">
            <i class="fas fa-exclamation-triangle"></i>
            <span>Search temporarily unavailable</span>
        </div>
    `;
    
    searchSuggestions.innerHTML = html;
    searchSuggestions.style.display = 'block';
}

function performSearch(query) {
    if (!query.trim()) return;
    
    console.log(`Searching: ${query}`);
    showNotification(`Searching for "${query}"...`, 'info');
    
    // In real app, this would redirect to search results
    setTimeout(() => {
        showNotification(`Found results for "${query}"`, 'success');
    }, 800);
}

// ===== USER PROFILE VIEWING =====
function viewUserProfile(username) {
    console.log(`Viewing profile: ${username}`);
    
    // Close search suggestions
    const searchSuggestions = document.getElementById('searchSuggestions');
    if (searchSuggestions) {
        searchSuggestions.style.display = 'none';
    }
    
    // Clear search bar
    const searchBar = document.querySelector('.search-bar');
    if (searchBar) {
        searchBar.value = '';
    }
    
    // Show loading notification
    showNotification(`Loading @${username}'s profile...`, 'info');
    
    // Fetch user profile
    fetch(`http://localhost:5000/api/users/profile/${username}`)
        .then(response => response.json())
        .then(result => {
            if (result.success) {
                // Store profile data temporarily
                sessionStorage.setItem('viewingProfile', JSON.stringify(result.user));
                
                // Show profile modal
                showUserProfileModal(result.user);
            } else {
                showNotification(`User @${username} not found`, 'error');
            }
        })
        .catch(error => {
            console.error('Profile fetch error:', error);
            showNotification('Failed to load profile', 'error');
        });
}

function showUserProfileModal(user) {
    // Create modal HTML
    const modalHTML = `
        <div class="profile-modal" style="
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.5);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 9999;
        ">
            <div style="
                background: white;
                border-radius: 12px;
                width: 90%;
                max-width: 500px;
                padding: 30px;
                box-shadow: 0 10px 40px rgba(0,0,0,0.2);
            ">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                    <h3 style="margin: 0; color: #d32f2f;">User Profile</h3>
                    <button onclick="closeProfileModal()" style="
                        background: none;
                        border: none;
                        font-size: 24px;
                        cursor: pointer;
                        color: #666;
                    ">×</button>
                </div>
                
                <div style="text-align: center; margin-bottom: 30px;">
                    <div style="
                        width: 80px;
                        height: 80px;
                        background: linear-gradient(135deg, #667eea, #764ba2);
                        border-radius: 50%;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        color: white;
                        font-size: 24px;
                        font-weight: bold;
                        margin: 0 auto 15px;
                    ">
                        ${getInitials(user.fullName)}
                    </div>
                    <h4 style="margin: 0 0 5px 0;">${user.fullName}</h4>
                    <div style="color: #666; margin-bottom: 5px;">@${user.username}</div>
                    <div style="
                        display: inline-block;
                        background: ${user.userType === 'student' ? '#e3f2fd' : '#f3e5f5'};
                        color: ${user.userType === 'student' ? '#1976d2' : '#7b1fa2'};
                        padding: 4px 12px;
                        border-radius: 12px;
                        font-size: 12px;
                        font-weight: 600;
                    ">
                        <i class="fas ${user.userType === 'student' ? 'fa-user-graduate' : 'fa-building'}"></i>
                        ${user.userType === 'student' ? 'Student' : 'Organization'}
                    </div>
                </div>
                
                <div style="
                    background: #f8f9fa;
                    padding: 20px;
                    border-radius: 8px;
                    margin-bottom: 20px;
                ">
                    <div style="
                        display: grid;
                        grid-template-columns: 1fr 1fr;
                        gap: 15px;
                    ">
                        <div>
                            <div style="color: #666; font-size: 12px;">Member Since</div>
                            <div style="font-weight: 600;">${user.joined || 'Recently'}</div>
                        </div>
                        <div>
                            <div style="color: #666; font-size: 12px;">Account Type</div>
                            <div style="font-weight: 600;">${user.userType === 'student' ? 'Student Account' : 'Organization Account'}</div>
                        </div>
                    </div>
                </div>
                
                <div style="display: flex; gap: 10px;">
                    <button onclick="connectWithUser('${user.username}')" style="
                        flex: 1;
                        background: #d32f2f;
                        color: white;
                        border: none;
                        padding: 12px;
                        border-radius: 8px;
                        cursor: pointer;
                        font-weight: 600;
                    ">
                        <i class="fas fa-handshake"></i> Connect
                    </button>
                    <button onclick="closeProfileModal()" style="
                        flex: 1;
                        background: #f1f3f4;
                        color: #333;
                        border: none;
                        padding: 12px;
                        border-radius: 8px;
                        cursor: pointer;
                    ">
                        Close
                    </button>
                </div>
            </div>
        </div>
    `;
    
    // Add modal to page
    const modalContainer = document.createElement('div');
    modalContainer.innerHTML = modalHTML;
    document.body.appendChild(modalContainer);
    
    // Prevent body scroll
    document.body.style.overflow = 'hidden';
}

function closeProfileModal() {
    const modal = document.querySelector('.profile-modal');
    if (modal) {
        modal.remove();
        document.body.style.overflow = 'auto';
    }
}

function connectWithUser(username) {
    showNotification(`Connection request sent to @${username}!`, 'success');
    closeProfileModal();
    
    // In real app, you would send API request here
    setTimeout(() => {
        showNotification(`@${username} will be notified of your connection request`, 'info');
    }, 1000);
}

// Make these functions globally available
window.closeProfileModal = closeProfileModal;
window.connectWithUser = connectWithUser;

// ===== 4. NAVIGATION =====
function setupNavigation() {
    const tabs = document.querySelectorAll('.nav-tab');
    
    tabs.forEach(tab => {
        tab.addEventListener('click', function(event) {
            if (this.getAttribute('href') === '#') {
                event.preventDefault();
                
                // Update active state
                tabs.forEach(t => t.classList.remove('active'));
                this.classList.add('active');
                
                // Load content for tab
                const tabName = this.getAttribute('data-tab');
                loadTabContent(tabName);
            }
        });
    });
}

function loadTabContent(tabName) {
    console.log(`Loading ${tabName} content...`);
    showNotification(`Loading ${tabName}...`, 'info');
}

// ===== 5. CREATE POST =====
function setupCreatePost() {
    const postInput = document.querySelector('.post-input');
    const postButton = document.querySelector('.post-submit-btn');
    const actionButtons = document.querySelectorAll('.post-action-btn');
    
    if (!postInput || !postButton) return;
    
    // Action buttons
    actionButtons.forEach(button => {
        button.addEventListener('click', function() {
            const type = this.getAttribute('data-type');
            handlePostAction(type, postInput);
        });
    });
    
    // Post submission
    postButton.addEventListener('click', () => createPost(postInput, postButton));
    
    // Submit on Ctrl+Enter
    postInput.addEventListener('keydown', function(event) {
        if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
            createPost(postInput, postButton);
        }
    });
}

function handlePostAction(type, postInput) {
    const placeholders = {
        photo: 'Share a photo or screenshot...',
        project: 'Describe your project...',
        article: 'Write an article...'
    };
    
    if (placeholders[type]) {
        postInput.placeholder = placeholders[type];
    }
    
    if (type === 'photo') {
        simulateFileUpload();
    }
    
    postInput.focus();
}

function simulateFileUpload() {
    // In real app, this would open file picker
    showNotification('Select a photo to upload', 'info');
}

function createPost(postInput, postButton) {
    const content = postInput.value.trim();
    
    if (!content) {
        showNotification('Please enter some content', 'error');
        postInput.focus();
        return;
    }
    
    // Show loading state
    const originalText = postButton.textContent;
    postButton.textContent = 'Posting...';
    postButton.disabled = true;
    
    // Simulate API call
    setTimeout(() => {
        // Reset button
        postButton.textContent = originalText;
        postButton.disabled = false;
        
        // Clear input
        postInput.value = '';
        postInput.placeholder = 'Share an update, project, or internship interest...';
        
        // Show success
        showNotification('Post published successfully!', 'success');
        
        // Add to feed
        addPostToFeed(content);
    }, 1000);
}

function addPostToFeed(content) {
    const feed = document.querySelector('.feed-posts');
    if (!feed) return;
    
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const initials = getInitials(user.fullName || 'User');
    
    const post = document.createElement('div');
    post.className = 'card feed-post';
    post.innerHTML = `
        <div class="post-header">
            <div class="student-avatar">${initials}</div>
            <div class="post-info">
                <h4>${user.fullName || 'You'}</h4>
                <p>Just now</p>
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
        </div>
    `;
    
    // Add to top of feed
    feed.insertBefore(post, feed.firstChild);
    
    // Setup interactions for new post
    setupPostInteractions(post);
}

// ===== 6. INTERACTIONS =====
function setupInteractions() {
    setupPostInteractions();
    setupApplyButtons();
    setupCardButtons();
}

function setupPostInteractions(container = document) {
    // Like buttons
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
                
                // Heart animation
                icon.style.animation = 'heartBeat 0.3s ease';
                setTimeout(() => {
                    icon.style.animation = '';
                }, 300);
            }
        });
    });
    
    // Comment buttons
    container.querySelectorAll('.comment-btn').forEach(button => {
        button.addEventListener('click', function() {
            showNotification('Comment feature coming soon!', 'info');
        });
    });
    
    // Share buttons
    container.querySelectorAll('.share-btn').forEach(button => {
        button.addEventListener('click', function() {
            showNotification('Share feature coming soon!', 'info');
        });
    });
}

function setupApplyButtons() {
    document.querySelectorAll('.apply-btn').forEach(button => {
        button.addEventListener('click', function() {
            showNotification('Application submitted successfully!', 'success');
            this.textContent = 'Applied ✓';
            this.disabled = true;
            this.style.opacity = '0.7';
        });
    });
    
    document.querySelectorAll('.connect-btn').forEach(button => {
        button.addEventListener('click', function() {
            if (this.textContent.includes('Connect')) {
                showNotification('Connection request sent!', 'success');
                this.innerHTML = '<i class="fas fa-check"></i> Connected';
            } else if (this.textContent.includes('Save')) {
                showNotification('Post saved to bookmarks!', 'success');
                this.innerHTML = '<i class="fas fa-check"></i> Saved';
            }
        });
    });
}

function setupCardButtons() {
    document.querySelectorAll('.card-btn').forEach(button => {
        button.addEventListener('click', function() {
            if (this.textContent.includes('Upgrade')) {
                window.location.href = 'skill-map.html';
            }
        });
    });
}

// ===== 7. NOTIFICATIONS =====
function setupNotifications() {
    // Simulate new notifications
    setInterval(() => {
        if (Math.random() > 0.7) {
            addRandomNotification();
        }
    }, 30000);
}

function clearNotificationCount() {
    const notificationCount = document.querySelector('#notificationIcon .notification-count');
    if (notificationCount) {
        notificationCount.style.display = 'none';
    }
}

function addRandomNotification() {
    const notifications = [
        {
            icon: 'briefcase',
            title: 'New Internship Alert',
            message: 'Apple posted new iOS Developer internship',
            time: 'Just now'
        },
        {
            icon: 'user-check',
            title: 'Profile Viewed',
            message: 'Amazon recruiters viewed your profile',
            time: '5 min ago'
        }
    ];
    
    const randomNotification = notifications[Math.floor(Math.random() * notifications.length)];
    showNotification(`${randomNotification.title}: ${randomNotification.message}`, 'info');
}

// ===== UTILITY FUNCTIONS =====
function showNotification(message, type = 'info') {
    // Create notification element
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
    
    // Auto-remove after 4 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
        }
    }, 4000);
}

// ===== START DASHBOARD =====
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Professional Dashboard Loading...');
    
    if (checkAuth()) {
        initializeDashboard();
    }
});