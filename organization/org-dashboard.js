/*organization/org-dashboard.js*/

/* ===== ORGANIZATION DASHBOARD INTERACTIVITY ===== */
/* Mirror of student dashboard with org-specific logic */

// ===== AUTH CHECK =====
function checkOrgAuth() {
    const org = JSON.parse(localStorage.getItem('org') || '{}');
    const isOrgLoggedIn = localStorage.getItem('isOrgLoggedIn');
    
    if (!org || isOrgLoggedIn !== 'true') {
        console.log('🚫 Organization not authenticated, redirecting...');
        localStorage.setItem('redirectUrl', window.location.pathname);
        window.location.href = '../login-org.html';
        return false;
    }
    
    console.log(`✅ Organization authenticated: ${org.companyName} (${org.userType})`);
    return true;
}

// ===== LOGOUT FUNCTIONALITY =====
function setupOrgLogout() {
    const logoutBtn = document.querySelector('.logout-btn');
    
    if (!logoutBtn) return;
    
    logoutBtn.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        
        if (confirm('Are you sure you want to log out?')) {
            localStorage.removeItem('org');
            localStorage.removeItem('isOrgLoggedIn');
            localStorage.removeItem('orgType');
            
            console.log('✅ Organization data cleared');
            showNotification('Logged out successfully!', 'success');
            closeAllDropdowns();
            
            setTimeout(() => {
                window.location.href = '../../index.html';
            }, 1000);
        }
    });
}

// ===== INITIALIZATION =====
function initializeOrgDashboard() {
    console.log('🏢 Organization Dashboard Loaded');
    
    if (!checkOrgAuth()) return;
    
    setupOrgData();
    setupDropdowns();
    setupOrgSearch();
    setupOrgNavigation();
    setupOrgPostCreation();
    setupOrgInteractions();
    setupOrgNotifications();
    setupOrgLogout();
    setupSkillRequirements();
}

// ===== 1. ORG DATA INITIALIZATION =====
function setupOrgData() {
    const org = JSON.parse(localStorage.getItem('org') || '{}');
    const defaultOrg = {
        companyName: 'Google Careers',
        email: 'careers@google.com',
        avatar: 'GC',
        userType: 'organization'
    };
    
    const orgData = Object.keys(org).length ? org : defaultOrg;
    
    updateOrgInfo(orgData);
    
    if (!localStorage.getItem('org')) {
        localStorage.setItem('org', JSON.stringify(orgData));
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
    const orgNameElement = document.getElementById('userName');
    const orgEmailElement = document.getElementById('userEmail');
    
    if (orgNameElement) orgNameElement.textContent = org.companyName;
    if (orgEmailElement) orgEmailElement.textContent = org.email;
}

function getOrgInitials(name) {
    if (!name) return 'OC';
    return name
        .split(' ')
        .map(word => word[0])
        .join('')
        .toUpperCase()
        .substring(0, 2);
}

// ===== 2. DROPDOWN FUNCTIONALITY (SAME AS STUDENT) =====
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
        if (event.key === 'Escape') closeAllDropdowns();
    });
    
    window.addEventListener('scroll', closeAllDropdowns);
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

// ===== 3. ORG SEARCH FUNCTIONALITY =====
function setupOrgSearch() {
    const searchBar = document.querySelector('.search-bar');
    const searchSuggestions = document.getElementById('searchSuggestions');
    
    if (!searchBar || !searchSuggestions) return;
    
    // Show student-focused suggestions
    searchBar.addEventListener('focus', function() {
        showOrgDefaultSuggestions();
    });
    
    let debounceTimer;
    searchBar.addEventListener('input', function() {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            const query = this.value.trim();
            if (query) {
                searchStudents(query);
            } else {
                showOrgDefaultSuggestions();
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
            performOrgSearch(this.value);
            searchSuggestions.style.display = 'none';
        }
    });
}

function showOrgDefaultSuggestions() {
    const searchSuggestions = document.getElementById('searchSuggestions');
    const suggestions = [
        { icon: 'user-graduate', text: 'Search Students by Name' },
        { icon: 'code', text: 'Find by Skill (React, Python, etc.)' },
        { icon: 'university', text: 'Search by University' },
        { icon: 'map-marker-alt', text: 'Find Students by Location' },
        { icon: 'star', text: 'Top Rated Portfolios' }
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
            performOrgSearch(searchBar.value);
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
    
    // Simulate API call
    setTimeout(() => {
        const mockStudents = [
            { fullName: 'Anup Shrestha', username: 'anup_s', skills: ['React', 'Python', 'AWS'], university: 'Carnegie Mellon' },
            { fullName: 'Sarah Chen', username: 'sarah_c', skills: ['ML', 'Python', 'SQL'], university: 'MIT' },
            { fullName: 'Alex Johnson', username: 'alex_j', skills: ['JavaScript', 'Node.js', 'MongoDB'], university: 'Stanford' }
        ];
        
        displayStudentSuggestions(mockStudents, query);
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
        html += `
            <div class="suggestion-item user-result" data-username="${student.username}">
                <div class="user-avatar-small">${getInitials(student.fullName)}</div>
                <div class="user-info">
                    <div class="user-name">${student.fullName}</div>
                    <div class="user-details">
                        <span class="username">@${student.username}</span>
                        <span style="color: #666; font-size: 12px;">${student.university}</span>
                    </div>
                    <div class="applicant-skills" style="margin-top: 4px;">
                        ${student.skills.map(skill => `<span>${skill}</span>`).join('')}
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
            const username = this.getAttribute('data-username');
            viewStudentProfile(username);
        });
    });
}

function getInitials(name) {
    if (!name) return 'SU';
    return name.split(' ').map(word => word[0]).join('').toUpperCase().substring(0, 2);
}

function performOrgSearch(query) {
    if (!query.trim()) return;
    
    console.log(`Organization searching: ${query}`);
    showNotification(`Searching students for "${query}"...`, 'info');
}

// ===== 4. ORG POST CREATION =====
function setupOrgPostCreation() {
    const postInput = document.querySelector('.post-input');
    const postButton = document.querySelector('.post-submit-btn');
    const postTypeButtons = document.querySelectorAll('.post-type-btn');
    const actionButtons = document.querySelectorAll('.post-action-btn');
    
    if (!postInput || !postButton) return;
    
    // Post type selection
    postTypeButtons.forEach(button => {
        button.addEventListener('click', function() {
            postTypeButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            
            const type = this.getAttribute('data-type');
            updateOrgPostPlaceholder(type, postInput);
        });
    });
    
    // Action buttons
    actionButtons.forEach(button => {
        button.addEventListener('click', function() {
            const type = this.getAttribute('data-type');
            handleOrgPostAction(type);
        });
    });
    
    // Post submission
    postButton.addEventListener('click', () => createOrgPost(postInput, postButton));
    
    // Submit on Ctrl+Enter
    postInput.addEventListener('keydown', function(event) {
        if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
            createOrgPost(postInput, postButton);
        }
    });
}

function updateOrgPostPlaceholder(type, postInput) {
    const placeholders = {
        update: 'Share company news, achievements, or announcements...',
        hiring: 'Announce new openings, describe roles, list requirements...',
        article: 'Write industry insights, career advice, or tech trends...'
    };
    
    postInput.placeholder = placeholders[type] || 'Share company updates...';
}

function handleOrgPostAction(type) {
    if (type === 'photo') {
        showNotification('Upload company photos, office pics, or event images', 'info');
    } else if (type === 'poll') {
        showNotification('Create a poll for students (e.g., "Which skill is most important?")', 'info');
    } else if (type === 'event') {
        showNotification('Add career fair, webinar, or recruitment event details', 'info');
    }
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
    
    // Get active post type
    const activeType = document.querySelector('.post-type-btn.active').getAttribute('data-type');
    const badgeType = {
        update: '🏢 COMPANY UPDATE',
        hiring: '🚀 HIRING ALERT',
        article: '📊 INDUSTRY INSIGHTS'
    }[activeType] || '📝 POST';
    
    setTimeout(() => {
        postButton.textContent = originalText;
        postButton.disabled = false;
        postInput.value = '';
        postInput.placeholder = 'Share company news, internship opportunities, or industry insights...';
        
        showNotification('Company post published successfully!', 'success');
        addOrgPostToFeed(content, badgeType);
    }, 1000);
}

function addOrgPostToFeed(content, badge) {
    const feed = document.querySelector('.feed-posts');
    if (!feed) return;
    
    const org = JSON.parse(localStorage.getItem('org') || '{}');
    const initials = getOrgInitials(org.companyName || 'Company');
    
    const post = document.createElement('div');
    post.className = 'card feed-post';
    post.innerHTML = `
        <div class="post-header">
            <div class="company-logo">${initials}</div>
            <div class="post-info">
                <h4>${org.companyName || 'Your Company'}</h4>
                <p>Just now • Company Post</p>
            </div>
        </div>
        <div class="post-content">
            <div class="org-post-badge">${badge}</div>
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
    
    feed.insertBefore(post, feed.firstChild);
    setupPostInteractions(post);
}

// ===== 5. ORG INTERACTIONS =====
function setupOrgInteractions() {
    setupPostInteractions();
    setupApplicantButtons();
    setupCardButtons();
    setupQuickInternship();
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
            showNotification('Commenting feature coming soon!', 'info');
        });
    });
    
    container.querySelectorAll('.share-btn').forEach(button => {
        button.addEventListener('click', function() {
            showNotification('Share this post with other organizations or students', 'info');
        });
    });
}

function setupApplicantButtons() {
    // View Applicant buttons
    document.querySelectorAll('.btn-view').forEach(button => {
        button.addEventListener('click', function() {
            const applicantCard = this.closest('.applicant-card');
            const applicantName = applicantCard.querySelector('h4').textContent;
            showNotification(`Viewing ${applicantName}'s profile...`, 'info');
        });
    });
    
    // Accept/Reject buttons
    document.querySelectorAll('.btn-accept').forEach(button => {
        button.addEventListener('click', function() {
            const applicantCard = this.closest('.applicant-card');
            const applicantName = applicantCard.querySelector('h4').textContent;
            showNotification(`Interview invitation sent to ${applicantName}!`, 'success');
            this.textContent = 'Invited ✓';
            this.disabled = true;
        });
    });
    
    document.querySelectorAll('.btn-reject').forEach(button => {
        button.addEventListener('click', function() {
            const applicantCard = this.closest('.applicant-card');
            const applicantName = applicantCard.querySelector('h4').textContent;
            if (confirm(`Reject ${applicantName}'s application?`)) {
                showNotification(`Application from ${applicantName} rejected`, 'info');
                applicantCard.remove();
            }
        });
    });
}

function setupCardButtons() {
    document.querySelectorAll('.card-btn').forEach(button => {
        button.addEventListener('click', function() {
            if (this.textContent.includes('Quick Post')) {
                window.location.href = 'post-internship.html';
            } else if (this.textContent.includes('View Applicants')) {
                const count = this.closest('.active-internship').querySelector('.count').textContent;
                showNotification(`Showing ${count} applicants for this internship`, 'info');
            }
        });
    });
}

function setupQuickInternship() {
    const quickPostBtn = document.querySelector('.card-btn[style*="background: #38a169"]');
    if (quickPostBtn) {
        quickPostBtn.addEventListener('click', function() {
            const titleInput = this.closest('.sidebar-card').querySelector('.form-input');
            const deptSelect = this.closest('.sidebar-card').querySelector('.form-select');
            
            if (!titleInput.value.trim()) {
                showNotification('Please enter an internship title', 'error');
                titleInput.focus();
                return;
            }
            
            showNotification(`Quick internship posted: ${titleInput.value}`, 'success');
            titleInput.value = '';
            deptSelect.selectedIndex = 0;
        });
    }
}

// ===== 6. SKILL REQUIREMENTS =====
function setupSkillRequirements() {
    const addSkillBtn = document.querySelector('.add-skill-btn');
    if (addSkillBtn) {
        addSkillBtn.addEventListener('click', function() {
            const skillInput = this.previousElementSibling;
            const skillValue = skillInput.value.trim();
            
            if (!skillValue) {
                showNotification('Please enter a skill', 'error');
                return;
            }
            
            addSkillTag(skillValue);
            skillInput.value = '';
            skillInput.focus();
        });
    }
    
    // Allow Enter key to add skill
    const skillInput = document.querySelector('.skill-tag-input input');
    if (skillInput) {
        skillInput.addEventListener('keydown', function(event) {
            if (event.key === 'Enter') {
                event.preventDefault();
                const addBtn = this.nextElementSibling;
                if (addBtn) addBtn.click();
            }
        });
    }
}

function addSkillTag(skill) {
    const skillsContainer = document.querySelector('.required-skills');
    if (!skillsContainer) return;
    
    const skillTag = document.createElement('div');
    skillTag.className = 'skill-tag';
    skillTag.innerHTML = `
        ${skill}
        <span class="remove-skill" onclick="this.parentElement.remove()">×</span>
    `;
    
    skillsContainer.appendChild(skillTag);
}

// ===== 7. NOTIFICATIONS =====
function setupOrgNotifications() {
    setInterval(() => {
        if (Math.random() > 0.8) {
            addOrgNotification();
        }
    }, 45000);
}

function clearNotificationCount() {
    const notificationCount = document.querySelector('#notificationIcon .notification-count');
    if (notificationCount) {
        notificationCount.style.display = 'none';
    }
}

function addOrgNotification() {
    const notifications = [
        {
            icon: 'user-plus',
            title: 'New Applicant',
            message: 'Student applied to your Frontend Developer internship',
            time: 'Just now'
        },
        {
            icon: 'star',
            title: 'Top Match',
            message: 'A student with 95% skill match viewed your profile',
            time: '10 min ago'
        }
    ];
    
    const randomNotification = notifications[Math.floor(Math.random() * notifications.length)];
    showNotification(`${randomNotification.title}: ${randomNotification.message}`, 'info');
}

// ===== 8. UTILITY FUNCTIONS =====
function showNotification(message, type = 'info') {
    // Remove existing notifications
    document.querySelectorAll('.notification-toast').forEach(n => n.remove());
    
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
    
    // Add CSS animation if not exists
    if (!document.querySelector('#notification-animation')) {
        const style = document.createElement('style');
        style.id = 'notification-animation';
        style.textContent = `
            @keyframes slideInRight {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
        `;
        document.head.appendChild(style);
    }
    
    setTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
        }
    }, 4000);
}

function viewStudentProfile(username) {
    console.log(`Viewing student profile: ${username}`);
    showNotification(`Loading student profile: @${username}`, 'info');
    
    // In real app, fetch student profile
    setTimeout(() => {
        showNotification(`Profile loaded! Would redirect to student page in real app.`, 'success');
    }, 800);
}

// ===== START DASHBOARD =====
document.addEventListener('DOMContentLoaded', function() {
    console.log('🏢 Organization Dashboard Loading...');
    initializeOrgDashboard();
});