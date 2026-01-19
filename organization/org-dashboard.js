/* ===== ORGANIZATION DASHBOARD INTERACTIVITY ===== */

// ===== USER-SPECIFIC STORAGE HELPERS =====
// These functions ensure each organization has isolated data in localStorage

function getOrgStorageKey(baseKey) {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const userId = user.id || 'guest';
    return `${baseKey}_${userId}`;
}

function getOrgProfileKey() {
    return getOrgStorageKey('orgProfile');
}

function setOrgProfileData(data) {
    const key = getOrgProfileKey();
    localStorage.setItem(key, JSON.stringify(data));
    console.log(` Saved org profile data with key: ${key}`);
}

function getOrgProfileData() {
    const key = getOrgProfileKey();
    const data = localStorage.getItem(key);

    if (!data) {
        // Check for legacy global data but don't auto-migrate
        const oldData = localStorage.getItem('orgProfileData');
        if (oldData) {
            console.log(' Legacy org profile data found but not migrated');
            return null;
        }
    }

    return data ? JSON.parse(data) : null;
}

// ===== AUTH CHECK =====
function checkOrgAuth() {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const isLoggedIn = localStorage.getItem('isLoggedIn');
    const userId = user._id || user.id;

    if (!isLoggedIn || !userId || !user || user.userType !== 'organization') {
        console.log(' Organization not authenticated, redirecting...');

        // Store where they tried to go
        localStorage.setItem('redirectUrl', window.location.pathname);

        // Redirect to organization login
        window.location.href = '../organization/login-org.html';
        return false;
    }

    console.log(` Organization authenticated: ${user.fullName} (${user.userType})`);
    return true;
}

function getAuthHeaders() {
    const token = localStorage.getItem('token');
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return headers;
}

// ===== LOGOUT FUNCTIONALITY =====
function setupOrgLogout() {
    const logoutBtn = document.querySelector('.logout-btn');

    if (!logoutBtn) {
        console.log(' Logout button not found');
        return;
    }

    logoutBtn.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();

        console.log(' Logging out organization...');
        logoutOrg();
    });
}

function logoutOrg() {
    // Show confirmation dialog
    if (confirm('Are you sure you want to log out?')) {
        // Clear legacy global data that may be shared across users
        localStorage.removeItem('orgProfileData');
        localStorage.removeItem('portfolioDraftV2');
        localStorage.removeItem('portfolioFormData');

        // Clear all user data from localStorage
        localStorage.removeItem('user');
        localStorage.removeItem('isLoggedIn');
        localStorage.removeItem('userType');

        console.log(' Organization data cleared from localStorage');

        // Show logout notification
        showNotification('Logged out successfully!', 'success');

        // Close any open dropdowns
        closeAllDropdowns();

        // Redirect to homepage after a brief delay
        setTimeout(() => {
            console.log(' Redirecting to homepage...');
            window.location.href = '../../index.html';
        }, 1000);
    }
}

function initializeOrgDashboard() {
    console.log(' Organization Dashboard Loaded');

    // Initialize all components
    setupOrgData();
    setupDropdowns();
    setupOrgSearch();
    setupNavigation();
    setupCreateOrgPost();
    setupOrgInteractions();
    setupOrgNotifications();
    setupOrgLogout();
    setupVerificationBanner();
    setupPostInternshipSection();
    if (typeof loadTopApplicants === 'function') {
        loadTopApplicants();
    }

    // Check verification status and load notifications
    checkAndUpdateVerificationStatus();
    loadOrgNotifications();

    // Check if user is blocked
    checkBlockedStatus();

    const params = new URLSearchParams(window.location.search);
    const urlTab = params.get('tab');
    if (urlTab === 'profile') {
        loadOrgTabContent('profile');
    } else if (urlTab === 'post') {
        loadOrgTabContent('post');
    }
}

// ===== CHECK BLOCKED STATUS =====
async function checkBlockedStatus() {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const userId = user._id || user.id;
    if (!user || !userId) return;

    try {
        const result = await window.OrgAPIs.Notifications.getStatus(userId);

        if (result.success && result.user && result.user.isBlocked) {
            // Update localStorage
            const updatedUser = { ...user, isBlocked: true, blockReason: result.user.blockReason };
            localStorage.setItem('user', JSON.stringify(updatedUser));

            // Show blocked banner
            showBlockedBanner(result.user.blockReason);
        }
    } catch (error) {
        console.error('Error checking blocked status:', error);
    }
}

function showBlockedBanner(reason) {
    // Remove existing banner if any
    const existing = document.getElementById('blockedUserBanner');
    if (existing) existing.remove();

    const banner = document.createElement('div');
    banner.id = 'blockedUserBanner';
    banner.innerHTML = `
        <div style="
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            background: linear-gradient(135deg, #e53e3e, #c53030);
            color: white;
            padding: 16px 24px;
            z-index: 10000;
            display: flex;
            align-items: center;
            justify-content: space-between;
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        ">
            <div style="display: flex; align-items: center; gap: 12px;">
                <i class="fas fa-ban" style="font-size: 24px;"></i>
                <div>
                    <strong style="font-size: 16px;">Your account has been blocked</strong>
                    <p style="margin: 4px 0 0; font-size: 13px; opacity: 0.9;">
                        Reason: ${reason || 'Violation of platform guidelines'}. You can view your dashboard but cannot perform any actions.
                    </p>
                </div>
            </div>
            <button onclick="openAppealModal()" style="
                background: white;
                color: #c53030;
                border: none;
                padding: 10px 20px;
                border-radius: 8px;
                font-weight: 600;
                cursor: pointer;
                display: flex;
                align-items: center;
                gap: 8px;
            ">
                <i class="fas fa-envelope"></i> Send Appeal
            </button>
        </div>
    `;
    document.body.prepend(banner);

    // Adjust main content
    document.body.style.paddingTop = '80px';
}

function openAppealModal() {
    const modal = document.createElement('div');
    modal.id = 'appealModal';
    modal.innerHTML = `
        <div style="
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.6);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 10001;
        ">
            <div style="
                background: white;
                border-radius: 16px;
                width: 90%;
                max-width: 500px;
                padding: 30px;
                box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            ">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                    <h3 style="margin: 0; color: #1a1a2e;">
                        <i class="fas fa-gavel" style="color: #d32f2f; margin-right: 8px;"></i>
                        Submit Appeal
                    </h3>
                    <button onclick="closeAppealModal()" style="background: none; border: none; font-size: 24px; cursor: pointer; color: #666;">×</button>
                </div>
                
                <p style="color: #666; margin-bottom: 20px; font-size: 14px;">
                    Explain why you believe this block is a mistake. Admin will review your appeal and respond.
                </p>
                
                <form id="appealForm">
                    <div style="margin-bottom: 16px;">
                        <label style="display: block; font-weight: 600; margin-bottom: 6px;">Subject</label>
                        <input type="text" id="appealSubject" placeholder="Brief subject of your appeal" required style="
                            width: 100%;
                            padding: 12px;
                            border: 1px solid #ddd;
                            border-radius: 8px;
                            font-size: 14px;
                        ">
                    </div>
                    
                    <div style="margin-bottom: 20px;">
                        <label style="display: block; font-weight: 600; margin-bottom: 6px;">Your Message</label>
                        <textarea id="appealMessage" rows="5" placeholder="Explain your situation in detail..." required style="
                            width: 100%;
                            padding: 12px;
                            border: 1px solid #ddd;
                            border-radius: 8px;
                            font-size: 14px;
                            resize: vertical;
                        "></textarea>
                    </div>
                    
                    <div style="display: flex; gap: 12px;">
                        <button type="submit" style="
                            flex: 1;
                            background: #d32f2f;
                            color: white;
                            border: none;
                            padding: 14px;
                            border-radius: 8px;
                            font-weight: 600;
                            cursor: pointer;
                        ">
                            <i class="fas fa-paper-plane"></i> Submit Appeal
                        </button>
                        <button type="button" onclick="closeAppealModal()" style="
                            flex: 1;
                            background: #f1f3f4;
                            color: #333;
                            border: none;
                            padding: 14px;
                            border-radius: 8px;
                            cursor: pointer;
                        ">Cancel</button>
                    </div>
                </form>
            </div>
        </div>
    `;
    document.body.appendChild(modal);

    document.getElementById('appealForm').addEventListener('submit', submitAppeal);
}

function closeAppealModal() {
    const modal = document.getElementById('appealModal');
    if (modal) modal.remove();
}

async function submitAppeal(e) {
    e.preventDefault();

    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const userId = user._id || user.id;
    const subject = document.getElementById('appealSubject').value.trim();
    const message = document.getElementById('appealMessage').value.trim();

    if (!subject || !message) {
        showNotification('Please fill in all fields', 'error');
        return;
    }

    try {
        const result = await window.OrgAPIs.Appeals.create({
            userId: userId,
            type: 'block_appeal',
            subject,
            message
        });

        if (result.success) {
            showNotification('Appeal submitted successfully! Admin will review it.', 'success');
            closeAppealModal();
        } else {
            showNotification(result.message || 'Failed to submit appeal', 'error');
        }
    } catch (error) {
        console.error('Appeal submit error:', error);
        showNotification('Network error. Please try again.', 'error');
    }
}

// Make functions globally available
window.openAppealModal = openAppealModal;
window.closeAppealModal = closeAppealModal;

// ===== BLOCK ACTIONS FOR BLOCKED USERS =====
function isUserBlocked() {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    return user.isBlocked === true;
}

function blockActionIfBlocked(actionName) {
    if (isUserBlocked()) {
        showNotification(`You cannot ${actionName} while your account is blocked. Please submit an appeal.`, 'error');
        return true;
    }
    return false;
}

// ===== SETUP ORGANIZATION DATA =====
function setupOrgData() {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const userId = user._id || user.id;
    if (!user || !userId) {
        console.log(' No user data found');
        return;
    }

    console.log(' Setting up organization data for:', user.fullName);

    // Update UI with organization info
    updateOrgInfo(user);

    // Load feed data
    loadOrgFeed();
}

// ===== LOAD ORGANIZATION'S POSTED INTERNSHIPS =====
async function loadOrgInternships() {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const userId = user._id || user.id;
    if (!user || !userId) return;

    const feedPosts = document.querySelector('.feed-posts');
    if (!feedPosts) return;

    try {
        const result = await window.OrgAPIs.Posts.getOrgInternships(userId);

        if (result.success && result.internships && result.internships.length > 0) {
            // Clear existing posts and add real ones
            feedPosts.innerHTML = '';

            result.internships.forEach(internship => {
                const postElement = createInternshipPostElement(internship, user);
                feedPosts.appendChild(postElement);
            });

            // Update stats
            updateOrgStats(result.total);
        } else if (result.internships && result.internships.length === 0) {
            // Show no internships message
            feedPosts.innerHTML = `
                <div class="card feed-post" style="text-align: center; padding: 40px;">
                    <i class="fas fa-briefcase" style="font-size: 48px; color: #ccc; margin-bottom: 16px;"></i>
                    <h3 style="margin-bottom: 8px;">No Internships Posted Yet</h3>
                    <p style="color: #666; margin-bottom: 16px;">Start attracting talent by posting your first internship opportunity.</p>
                    <button onclick="openPostInternshipSection()" class="apply-btn" style="background: #d32f2f; padding: 12px 24px;">
                        <i class="fas fa-plus"></i> Post Your First Internship
                    </button>
                </div>
            `;
        }
    } catch (error) {
        console.error('Error loading internships:', error);
    }
}

function createInternshipPostElement(internship, org) {
    const post = document.createElement('div');
    post.className = 'card feed-post';
    post.setAttribute('data-internship-id', internship.id);

    const initials = getOrgInitials(org.fullName || org.companyName || 'Company');
    const postedDate = new Date(internship.createdAt);
    const timeAgo = getTimeAgo(postedDate);

    // Calculate deadline status with proper logic
    const deadline = internship.deadline ? new Date(internship.deadline) : null;
    const now = new Date();
    let statusBadge = ' Hiring Now';
    let statusColor = 'linear-gradient(135deg, #4CAF50, #45a049)';

    if (deadline) {
        const daysUntilDeadline = Math.ceil((deadline - now) / (1000 * 60 * 60 * 24));

        if (daysUntilDeadline < 0) {
            // Deadline has passed
            statusBadge = ' Closed';
            statusColor = 'linear-gradient(135deg, #888, #666)';
        } else if (daysUntilDeadline <= 3) {
            // Closing soon (3 days or less)
            statusBadge = ' Closing Soon';
            statusColor = 'linear-gradient(135deg, #ff9800, #f57c00)';
        } else if (daysUntilDeadline <= 7) {
            // Closing within a week
            statusBadge = ' Closing in ' + daysUntilDeadline + ' days';
            statusColor = 'linear-gradient(135deg, #2196F3, #1976D2)';
        }
    }

    // Profile picture HTML - show image if available, otherwise initials
    const profilePicHTML = org.profilePicture
        ? `<img src="${org.profilePicture}" alt="${org.fullName || 'Company'}" style="width:100%;height:100%;object-fit:cover;border-radius:12px;">`
        : initials;

    // Deadline display text
    const deadlineText = deadline
        ? `Deadline: ${deadline.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
        : '';

    post.innerHTML = `
        <div class="post-header">
            <div class="company-logo" style="overflow:hidden;">${profilePicHTML}</div>
            <div class="post-info">
                <h4>${org.fullName || org.companyName || 'Your Company'}</h4>
                <p>${internship.location || 'Location not specified'} • ${internship.mode || 'Not specified'}</p>
                <small>Posted ${timeAgo}${deadlineText ? ' • ' + deadlineText : ''}</small>
            </div>
        </div>
        <div class="post-content">
            <div class="post-badge" style="background:${statusColor};color:white;padding:4px 12px;border-radius:20px;font-size:12px;font-weight:600;display:inline-block;margin-bottom:8px;">${statusBadge}</div>
            <h3>${internship.title}</h3>
            <p>${(internship.description || '').substring(0, 200)}${(internship.description || '').length > 200 ? '...' : ''}</p>
            ${internship.skills && internship.skills.length > 0 ? `
                <div class="post-tags">
                    ${internship.skills.map(skill => `<span class="tag">${skill}</span>`).join('')}
                    ${internship.stipend ? `<span class="tag">${internship.stipend}</span>` : ''}
                    ${internship.duration ? `<span class="tag">${internship.duration}</span>` : ''}
                </div>
            ` : ''}
            ${internship.requirements ? `
                <div class="skills-list">
                    <span class="skill-tag">Requirements: ${internship.requirements.substring(0, 100)}${internship.requirements.length > 100 ? '...' : ''}</span>
                </div>
            ` : ''}
        </div>
        <div class="post-actions">
            <button class="action-btn like-btn" data-post-id="${internship.id}">
                <i class="far fa-heart"></i> <span>${internship.likes || 0} Likes</span>
            </button>
            <button class="action-btn stats-btn">
                <i class="fas fa-chart-bar"></i> <span>${internship.views || 0} Views</span>
            </button>
            <button class="action-btn edit-btn" onclick="editInternship('${internship.id}')" style="background: #4CAF50; color: white; border-radius: 20px; padding: 8px 16px;">
                <i class="fas fa-edit"></i> Edit
            </button>
            <button class="action-btn delete-btn" onclick="deleteInternship('${internship.id}')" style="background: #f44336; color: white; border-radius: 20px; padding: 8px 16px;">
                <i class="fas fa-trash"></i> Delete
            </button>
        </div>
    `;

    return post;
}

// ===== DELETE INTERNSHIP =====
async function deleteInternship(internshipId, title) {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const userId = user._id || user.id;

    if (!user || !userId) {
        showNotification('Please log in to delete internships', 'error');
        return;
    }

    // Confirmation dialog
    if (!confirm(`Are you sure you want to delete "${title || 'this internship'}"?\n\nThis action cannot be undone.`)) {
        return;
    }

    try {
        const result = await window.OrgAPIs.Profile.deleteInternship(internshipId, userId);

        if (result.success) {
            showNotification('Internship deleted successfully', 'success');

            // Remove the card from UI immediately
            const card = document.querySelector(`[data-internship-id="${internshipId}"]`) || document.querySelector(`.internship-card[data-id="${internshipId}"]`);
            if (card) {
                card.style.opacity = '0.5';
                card.style.pointerEvents = 'none';
                setTimeout(() => card.remove(), 500);
            }

            // Reload the list
            setTimeout(() => loadMyInternships(), 600);
        } else {
            showNotification(result.message || 'Failed to delete internship', 'error');
        }
    } catch (error) {
        console.error('Delete internship error:', error);
        showNotification('Network error. Please try again.', 'error');
    }
}

// ===== EDIT INTERNSHIP =====
function editInternship(internshipId) {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const userId = user._id || user.id;

    if (!user || !userId) {
        showNotification('Please log in to edit internships', 'error');
        return;
    }

    // Navigate to Post Internship section and load the internship data for editing
    openPostInternshipSection();

    // Show editing form with a slight delay
    setTimeout(() => {
        // Try to find and populate the form with existing data
        showNotification('Loading internship for editing...', 'info');

        // Store the editing ID
        localStorage.setItem('editingInternshipId', internshipId);

        // Trigger the create form to show
        if (typeof toggleCreateForm === 'function') {
            toggleCreateForm();
        }

        // Load internship data into form
        loadInternshipForEditing(internshipId);
    }, 300);
}

// Load internship data into form for editing
async function loadInternshipForEditing(internshipId) {
    try {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        const userId = user._id || user.id;
        const result = await window.OrgAPIs.Posts.getOrgInternships(userId);

        if (result.success && result.internships) {
            const internship = result.internships.find(i => i.id === internshipId);

            if (internship) {
                // Populate form fields
                const setVal = (id, val) => {
                    const el = document.getElementById(id);
                    if (el) el.value = val || '';
                };

                setVal('internshipTitle', internship.title);
                setVal('internshipDescription', internship.description);
                setVal('internshipLocation', internship.location);
                setVal('internshipMode', internship.mode);
                setVal('internshipType', internship.type);
                setVal('internshipDuration', internship.duration);
                setVal('internshipStipend', internship.stipend);
                setVal('internshipOpenings', internship.openings);
                setVal('internshipRequirements', internship.requirements);

                if (internship.deadline) {
                    const deadlineDate = new Date(internship.deadline);
                    setVal('internshipDeadline', deadlineDate.toISOString().split('T')[0]);
                }

                // Handle skills
                if (internship.skills && internship.skills.length > 0) {
                    const skillsContainer = document.getElementById('skillsWithLevels');
                    if (skillsContainer) {
                        skillsContainer.innerHTML = internship.skills.map(skill => `
                            <span class="skill-badge" style="background: #e3f2fd; color: #1976d2; padding: 6px 12px; border-radius: 20px; font-size: 13px; display: inline-flex; align-items: center; gap: 6px;">
                                ${skill}
                                <button type="button" onclick="this.parentElement.remove()" style="background: none; border: none; color: #999; cursor: pointer;">×</button>
                            </span>
                        `).join('');
                    }
                }

                // Change submit button text
                const submitBtn = document.getElementById('postInternshipSubmit');
                if (submitBtn) {
                    submitBtn.innerHTML = '<i class="fas fa-save"></i> Update Internship';
                }

                showNotification('Internship loaded for editing', 'success');
            }
        }
    } catch (error) {
        console.error('Error loading internship for editing:', error);
        showNotification('Failed to load internship data', 'error');
    }
}

function getTimeAgo(date) {
    const seconds = Math.floor((new Date() - date) / 1000);

    const intervals = {
        year: 31536000,
        month: 2592000,
        week: 604800,
        day: 86400,
        hour: 3600,
        minute: 60
    };

    for (const [unit, secondsInUnit] of Object.entries(intervals)) {
        const interval = Math.floor(seconds / secondsInUnit);
        if (interval >= 1) {
            return `${interval} ${unit}${interval > 1 ? 's' : ''} ago`;
        }
    }
    return 'Just now';
}

function updateOrgStats(totalInternships) {
    const statsElements = document.querySelectorAll('.stat-value');
    if (statsElements.length > 0) {
        // Update the first stat (usually total posts/internships)
        statsElements[0].textContent = totalInternships || 0;
    }
}

// ===== LOAD GLOBAL FEED FOR ORGANIZATION =====
async function loadOrgFeed() {
    const feedPosts = document.querySelector('.feed-posts');
    if (!feedPosts) return;

    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const userId = user._id || user.id;

    try {
        const result = await window.OrgAPIs.Posts.getFeed(20);

        if (result.success && result.posts && result.posts.length > 0) {
            feedPosts.innerHTML = '';

            result.posts.forEach(post => {
                const postElement = createFeedPostElement(post, user);
                feedPosts.appendChild(postElement);
            });
        }
    } catch (error) {
        console.error('Error loading feed:', error);
    }
}

function createFeedPostElement(post, currentUser) {
    const postEl = document.createElement('div');
    postEl.className = 'card feed-post';
    postEl.setAttribute('data-post-id', post.id);

    const author = post.author || {};
    const isOwner = Boolean(currentUser && currentUser.id && author && author.id && String(currentUser.id) === String(author.id));
    const initials = getOrgInitials(author.fullName || 'User');
    const timeAgo = getTimeAgo(new Date(post.createdAt));
    const isOrg = author.userType === 'organization';
    const profilePic = author.profilePicture || '';
    const coverPhoto = author.coverPhoto || '';

    // Avatar HTML - show image if available, otherwise initials
    const avatarHTML = profilePic
        ? `<img src="${profilePic}" alt="${author.fullName || 'User'}" style="width: 100%; height: 100%; object-fit: cover; border-radius: ${isOrg ? '12px' : '50%'};">`
        : initials;

    // Cover banner for org posts (optional branding)
    const coverBannerHTML = isOrg && coverPhoto ? `
        <div class="post-cover-banner" style="height: 120px; background: linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.5)), url('${coverPhoto}') center/cover no-repeat; border-radius: 12px 12px 0 0; margin: -16px -16px 16px -16px;"></div>
    ` : '';

    postEl.innerHTML = `
        ${coverBannerHTML}
        <div class="post-header" style="display: flex; justify-content: space-between; align-items: flex-start;">
            <div style="display: flex; gap: 12px; align-items: center;">
                <div class="${isOrg ? 'company-logo' : 'student-avatar'}" style="width: 48px; height: 48px; border-radius: ${isOrg ? '12px' : '50%'}; background: linear-gradient(135deg, ${isOrg ? '#667eea, #764ba2' : '#f093fb, #f5576c'}); display: flex; align-items: center; justify-content: center; color: white; font-weight: 600; font-size: 16px; overflow: hidden;">
                    ${avatarHTML}
                </div>
                <div class="post-info">
                    <h4 style="margin: 0; font-weight: 700; color: #1a1a2e;">${author.fullName || 'Unknown User'}</h4>
                    <p style="margin: 2px 0; font-size: 13px; color: #666;">${isOrg ? 'Organization' : 'Student'}${post.type === 'internship' ? ' • Hiring' : ''}</p>
                    <small style="color: #999; font-size: 12px;">${timeAgo}</small>
                </div>
            </div>
            <div class="post-menu-container" style="position: relative;">
                <button class="post-menu-btn" onclick="toggleOrgPostMenu('${post.id}')" style="background: none; border: none; cursor: pointer; padding: 8px; border-radius: 50%; color: #666;">
                    <i class="fas fa-ellipsis-h"></i>
                </button>
                <div id="orgPostMenu-${post.id}" class="post-menu-dropdown" style="display: none; position: absolute; right: 0; top: 100%; background: white; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.15); min-width: 180px; z-index: 100; overflow: hidden;">
                    <button onclick="saveOrgPost('${post.id}')" style="display: flex; align-items: center; gap: 10px; width: 100%; padding: 12px 16px; border: none; background: none; cursor: pointer; text-align: left; font-size: 14px; color: #333;">
                        <i class="far fa-bookmark"></i> Save post
                    </button>
                    ${isOwner ? `
                    <button onclick="openEditOrgFeedPost('${post.id}')" style="display: flex; align-items: center; gap: 10px; width: 100%; padding: 12px 16px; border: none; background: none; cursor: pointer; text-align: left; font-size: 14px; color: #2196F3;">
                        <i class="fas fa-edit"></i> Edit post
                    </button>
                    <button onclick="deleteOrgFeedPost('${post.id}')" style="display: flex; align-items: center; gap: 10px; width: 100%; padding: 12px 16px; border: none; background: none; cursor: pointer; text-align: left; font-size: 14px; color: #e53e3e;">
                        <i class="fas fa-trash"></i> Delete post
                    </button>
                    ` : `
                    <button onclick="reportOrgPost('${post.id}')" style="display: flex; align-items: center; gap: 10px; width: 100%; padding: 12px 16px; border: none; background: none; cursor: pointer; text-align: left; font-size: 14px; color: #333;">
                        <i class="far fa-flag"></i> Report post
                    </button>
                    `}
                    <button onclick="copyOrgPostLink('${post.id}')" style="display: flex; align-items: center; gap: 10px; width: 100%; padding: 12px 16px; border: none; background: none; cursor: pointer; text-align: left; font-size: 14px; color: #333;">
                        <i class="fas fa-link"></i> Copy link
                    </button>
                </div>
            </div>
        </div>
        <div class="post-content" style="margin-top: 12px;">

            ${post.type === 'internship' ? '<div class="post-badge" style="display: inline-block; background: linear-gradient(135deg, #d32f2f, #b71c1c); color: white; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; margin-bottom: 8px;"> Hiring</div>' : ''}
            ${post.title ? `<h3 style="margin: 8px 0; font-size: 18px; font-weight: 700; color: #1a1a2e;">${post.title}</h3>` : ''}
            <p style="color: #444; line-height: 1.6; margin: 8px 0;">${post.content}</p>
            ${post.media ? `
                <div class="post-media" style="margin-top: 12px; border-radius: 12px; overflow: hidden;">
                    <img src="${post.media}" alt="Post image" style="width: 100%; height: 360px; object-fit: cover;">
                </div>
            ` : (post.images && post.images.length > 0 ? `
                <div class="post-images" style="margin-top: 12px; border-radius: 12px; overflow: hidden;">
                    <img src="${post.images[0].url || post.images[0]}" alt="Post image" style="width: 100%; height: 360px; object-fit: cover;">
                </div>
            ` : '')}
            ${post.skills && post.skills.length > 0 ? `
                <div class="post-tags" style="display: flex; flex-wrap: wrap; gap: 8px; margin-top: 12px;">
                    ${post.skills.map(skill => `<span class="tag" style="background: #f0f0f0; color: #666; padding: 4px 12px; border-radius: 20px; font-size: 12px;">${skill}</span>`).join('')}
                </div>
            ` : ''}

        </div>
        <div class="post-actions" style="display: flex; gap: 8px; margin-top: 16px; padding-top: 12px; border-top: 1px solid #eee;">
            <button class="action-btn like-btn" onclick="likeOrgPost('${post.id}', this)" style="flex: 1; display: flex; align-items: center; justify-content: center; gap: 6px; padding: 10px; border: none; background: #f5f5f5; border-radius: 8px; cursor: pointer; color: #666; font-weight: 500;">
                <i class="far fa-heart"></i> <span>${post.likes || 0}</span>
            </button>
            <button class="action-btn comment-btn" onclick="openOrgCommentSection('${post.id}')" style="flex: 1; display: flex; align-items: center; justify-content: center; gap: 6px; padding: 10px; border: none; background: #f5f5f5; border-radius: 8px; cursor: pointer; color: #666; font-weight: 500;">
                <i class="far fa-comment"></i> <span>${post.comments || 0}</span>
            </button>
            <button class="action-btn share-btn" onclick="shareOrgPost('${post.id}')" style="flex: 1; display: flex; align-items: center; justify-content: center; gap: 6px; padding: 10px; border: none; background: #f5f5f5; border-radius: 8px; cursor: pointer; color: #666; font-weight: 500;">
                <i class="fas fa-share"></i> <span>Share</span>
            </button>
        </div>
        <div id="orgCommentSection-${post.id}" class="comment-section" style="display: none; margin-top: 12px; padding-top: 12px; border-top: 1px solid #eee;"></div>
    `;

    return postEl;
}

// ===== ORG POST MENU FUNCTIONS =====
function toggleOrgPostMenu(postId) {
    const menu = document.getElementById(`orgPostMenu-${postId}`);
    if (!menu) return;
    document.querySelectorAll('.post-menu-dropdown').forEach(m => {
        if (m.id !== `orgPostMenu-${postId}`) m.style.display = 'none';
    });
    menu.style.display = menu.style.display === 'none' ? 'block' : 'none';
}

async function deleteOrgFeedPost(postId) {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const userId = user._id || user.id;
    if (!user || !userId) {
        showNotification('Please log in to delete posts', 'error');
        return;
    }
    if (!confirm('Delete this post? This action cannot be undone.')) return;

    try {
        const result = await window.OrgAPIs.Posts.deletePost(postId, userId);

        if (result.success) {
            showNotification('Post deleted successfully', 'success');
            const card = document.querySelector(`[data-post-id="${postId}"]`);
            if (card) {
                card.style.transition = 'opacity 0.25s ease, transform 0.25s ease';
                card.style.opacity = '0';
                card.style.transform = 'scale(0.98)';
                setTimeout(() => card.remove(), 250);
            }
        } else {
            showNotification(result.message || 'Failed to delete post', 'error');
        }
    } catch (error) {
        console.error('Delete post error:', error);
        showNotification('Network error. Please try again.', 'error');
    } finally {
        toggleOrgPostMenu(postId);
    }
}

function openEditOrgFeedPost(postId) {
    showNotification('Edit post UI is not implemented yet.', 'info');
    toggleOrgPostMenu(postId);
}

window.deleteOrgFeedPost = deleteOrgFeedPost;
window.openEditOrgFeedPost = openEditOrgFeedPost;

function saveOrgPost(postId) {
    const savedPosts = JSON.parse(localStorage.getItem('savedPosts') || '[]');
    if (!savedPosts.includes(postId)) {
        savedPosts.push(postId);
        localStorage.setItem('savedPosts', JSON.stringify(savedPosts));
        showNotification('Post saved!', 'success');
    } else {
        showNotification('Post already saved', 'info');
    }
    toggleOrgPostMenu(postId);
}

function reportOrgPost(postId) {
    toggleOrgPostMenu(postId);
    showNotification('Report submitted. We will review this post.', 'success');
}

function copyOrgPostLink(postId) {
    const link = `${window.location.origin}/post/${postId}`;
    navigator.clipboard.writeText(link).then(() => {
        showNotification('Link copied to clipboard!', 'success');
    }).catch(() => {
        showNotification('Failed to copy link', 'error');
    });
    toggleOrgPostMenu(postId);
}

function shareOrgPost(postId) {
    const link = `${window.location.origin}/post/${postId}`;
    if (navigator.share) {
        navigator.share({ title: 'Check out this post on SkillLaunch', url: link }).catch(() => { });
    } else {
        navigator.clipboard.writeText(link).then(() => {
            showNotification('Link copied to clipboard!', 'success');
        }).catch(() => {
            showNotification('Failed to share', 'error');
        });
    }
}

async function likeOrgPost(postId, button) {
    try {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        const userId = user._id || user.id;
        const result = await window.OrgAPIs.Posts.likePost(postId, userId);

        if (result.success) {
            const span = button.querySelector('span');
            const icon = button.querySelector('i');
            span.textContent = result.likes;

            if (result.liked) {
                icon.className = 'fas fa-heart';
                button.style.color = '#e53e3e';
            } else {
                icon.className = 'far fa-heart';
                button.style.color = '#666';
            }
        }
    } catch (error) {
        console.error('Like error:', error);
    }
}

// ===== ORG COMMENT SECTION FUNCTIONS =====
function openOrgCommentSection(postId) {
    const section = document.getElementById(`orgCommentSection-${postId}`);
    if (!section) return;

    if (section.style.display === 'none') {
        section.style.display = 'block';
        loadOrgComments(postId);
    } else {
        section.style.display = 'none';
    }
}

function loadOrgComments(postId) {
    const section = document.getElementById(`orgCommentSection-${postId}`);
    if (!section) return;

    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const orgProfileData = JSON.parse(localStorage.getItem('orgProfileData') || '{}');
    const userProfilePic = orgProfileData.profilePicture || user.profilePicture || '';
    const userInitials = getOrgInitials(user.fullName || 'OR');

    const avatarHTML = userProfilePic
        ? `<img src="${userProfilePic}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 12px;">`
        : userInitials;

    section.innerHTML = `
        <div class="comment-input-container" style="display: flex; gap: 12px; align-items: flex-start;">
            <div class="comment-avatar" style="width: 36px; height: 36px; border-radius: 12px; background: linear-gradient(135deg, #667eea, #764ba2); display: flex; align-items: center; justify-content: center; color: white; font-weight: 600; font-size: 14px; flex-shrink: 0; overflow: hidden;">
                ${avatarHTML}
            </div>
            <div style="flex: 1; display: flex; gap: 8px;">
                <input type="text" id="orgCommentInput-${postId}" placeholder="Write a comment..." style="flex: 1; padding: 10px 14px; border: 1px solid #ddd; border-radius: 20px; font-size: 14px; outline: none;">
                <button onclick="submitOrgComment('${postId}')" style="padding: 10px 16px; background: linear-gradient(135deg, #d32f2f, #b71c1c); color: white; border: none; border-radius: 20px; font-weight: 600; cursor: pointer;">Post</button>
            </div>
        </div>
        <div id="orgCommentsList-${postId}" class="comments-list" style="margin-top: 16px;"></div>
    `;

    const allComments = JSON.parse(localStorage.getItem('postComments') || '{}');
    const postComments = allComments[postId] || [];
    renderOrgComments(postId, postComments);
}

function renderOrgComments(postId, comments) {
    const list = document.getElementById(`orgCommentsList-${postId}`);
    if (!list) return;

    if (comments.length === 0) {
        list.innerHTML = '<p style="color: #999; font-size: 13px; text-align: center; padding: 12px;">No comments yet. Be the first to comment!</p>';
        return;
    }

    list.innerHTML = comments.map(c => {
        const isOrgComment = c.userType === 'organization';
        const avatarHTML = c.profilePicture
            ? `<img src="${c.profilePicture}" style="width: 100%; height: 100%; object-fit: cover; border-radius: ${isOrgComment ? '8px' : '50%'};">`
            : getOrgInitials(c.userName || 'U');

        return `
            <div class="comment-item" style="display: flex; gap: 12px; padding: 12px 0; border-bottom: 1px solid #f0f0f0;">
                <div style="width: 32px; height: 32px; border-radius: ${isOrgComment ? '8px' : '50%'}; background: linear-gradient(135deg, ${isOrgComment ? '#667eea, #764ba2' : '#2196F3, #21CBF3'}); display: flex; align-items: center; justify-content: center; color: white; font-weight: 600; font-size: 12px; flex-shrink: 0; overflow: hidden;">
                    ${avatarHTML}
                </div>
                <div style="flex: 1;">
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <span style="font-weight: 600; color: #1a1a2e; font-size: 14px;">${c.userName}</span>
                        <span style="color: #999; font-size: 12px;">${getTimeAgo(new Date(c.createdAt))}</span>
                    </div>
                    <p style="margin: 4px 0 0; color: #444; font-size: 14px; line-height: 1.5;">${c.text}</p>
                </div>
            </div>
        `;
    }).join('');
}

function submitOrgComment(postId) {
    const input = document.getElementById(`orgCommentInput-${postId}`);
    if (!input) return;

    const text = input.value.trim();
    if (!text) {
        showNotification('Please enter a comment', 'error');
        return;
    }

    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const orgProfileData = JSON.parse(localStorage.getItem('orgProfileData') || '{}');

    const comment = {
        id: Date.now().toString(),
        userId: user._id || user.id,
        userName: user.fullName || 'Anonymous',
        userType: user.userType || 'organization',
        profilePicture: orgProfileData.profilePicture || user.profilePicture || '',
        text: text,
        createdAt: new Date().toISOString()
    };

    const allComments = JSON.parse(localStorage.getItem('postComments') || '{}');
    if (!allComments[postId]) allComments[postId] = [];
    allComments[postId].unshift(comment);
    localStorage.setItem('postComments', JSON.stringify(allComments));

    const postEl = document.querySelector(`[data-post-id="${postId}"]`);
    if (postEl) {
        const commentBtn = postEl.querySelector('.comment-btn span');
        if (commentBtn) {
            const count = parseInt(commentBtn.textContent) || 0;
            commentBtn.textContent = count + 1;
        }
    }

    input.value = '';
    renderOrgComments(postId, allComments[postId]);
    showNotification('Comment posted!', 'success');
}

window.submitOrgComment = submitOrgComment;

// Expose feed action functions to window for inline onclick handlers
window.likeOrgPost = likeOrgPost;
window.openOrgCommentSection = openOrgCommentSection;
window.shareOrgPost = shareOrgPost;
window.saveOrgPost = saveOrgPost;
window.reportOrgPost = reportOrgPost;
window.copyOrgPostLink = copyOrgPostLink;
window.toggleOrgPostMenu = toggleOrgPostMenu;

function updateOrgInfo(org) {
    const initials = getOrgInitials(org.fullName || org.companyName);
    const orgProfileData = JSON.parse(localStorage.getItem('orgProfileData') || '{}');
    const profilePic = orgProfileData.profilePicture || org.profilePicture || '';

    // Update all avatar elements with profile picture or initials
    const avatarElements = ['userAvatar', 'dropdownAvatar', 'postAvatar'];
    avatarElements.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            if (profilePic) {
                element.innerHTML = `<img src="${profilePic}" alt="${org.fullName || org.companyName}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 12px;">`;
                element.style.overflow = 'hidden';
            } else {
                element.textContent = initials;
            }
        }
    });

    // Update name and email
    const userNameElement = document.getElementById('userName');
    const userEmailElement = document.getElementById('userEmail');

    if (userNameElement) userNameElement.textContent = org.fullName || org.companyName;
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

// ===== 2. DROPDOWN FUNCTIONALITY =====
function setupDropdowns() {
    setupDropdownToggle('profileDropdown', 'profileMenu');
    setupDropdownToggle('notificationIcon', 'notificationDropdown');
    setupDropdownToggle('messageIcon', 'messageDropdown');

    document.addEventListener('click', function (event) {
        if (!event.target.closest('.dropdown-menu') &&
            !event.target.closest('.icon-container') &&
            !event.target.closest('.profile-container')) {
            closeAllDropdowns();
        }
    });

    document.addEventListener('keydown', function (event) {
        if (event.key === 'Escape') {
            closeAllDropdowns();
        }
    });

    window.addEventListener('scroll', function () {
        closeAllDropdowns();
    });
}

function setupDropdownToggle(triggerId, dropdownId) {
    const trigger = document.getElementById(triggerId);
    const dropdown = document.getElementById(dropdownId);

    if (!trigger || !dropdown) return;

    trigger.addEventListener('click', function (event) {
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

// ===== 3. SEARCH FUNCTIONALITY =====
function setupOrgSearch() {
    const searchBar = document.querySelector('.search-bar');
    const searchSuggestions = document.getElementById('searchSuggestions');

    if (!searchBar || !searchSuggestions) return;

    searchBar.addEventListener('focus', function () {
        showDefaultSuggestions();
    });

    let debounceTimer;
    searchBar.addEventListener('input', function () {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            const query = this.value.trim();
            console.log(' Searching for:', query);
            if (query) {
                searchUsers(query);
            } else {
                showDefaultSuggestions();
            }
        }, 300);
    });

    document.addEventListener('click', function (event) {
        if (!searchBar.contains(event.target) && !searchSuggestions.contains(event.target)) {
            searchSuggestions.style.display = 'none';
        }
    });

    searchBar.addEventListener('keydown', function (event) {
        if (event.key === 'Enter') {
            performSearch(this.value);
            searchSuggestions.style.display = 'none';
        }
    });
}

function showDefaultSuggestions() {
    const searchSuggestions = document.getElementById('searchSuggestions');
    const suggestions = [
        { icon: 'user-graduate', text: 'Search students by skill' },
        { icon: 'building', text: 'Search organizations' },
        { icon: 'code', text: 'React developers available' },
        { icon: 'database', text: 'Data science students' },
        { icon: 'map-marker-alt', text: 'Users in San Francisco' }
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
        item.addEventListener('click', function () {
            const searchBar = document.querySelector('.search-bar');
            searchBar.value = this.querySelector('span').textContent;
            performSearch(searchBar.value);
            searchSuggestions.style.display = 'none';
        });
    });
}

async function searchUsers(query) {
    if (!query || query.trim().length === 0) {
        showDefaultSuggestions();
        return;
    }

    const suggestionBox = document.getElementById('searchSuggestions');
    suggestionBox.style.display = 'block';

    // Show loading
    suggestionBox.innerHTML = `
        <div style="text-align: center; padding: 20px; color: #666;">
            <i class="fas fa-spinner fa-spin" style="font-size: 20px;"></i>
            <p style="margin-top: 10px; font-size: 13px;">Searching...</p>
        </div>
    `;

    try {
        const result = await window.OrgAPIs.Users.search(query);

        if (result.success && result.users && result.users.length > 0) {
            // Filter to only show students and organizations (not admins)
            const filteredUsers = result.users.filter(user =>
                user.userType === 'student' || user.userType === 'organization'
            );

            if (filteredUsers.length > 0) {
                displayUsersSuggestions(filteredUsers, query);
            } else {
                displayNoResults(query);
            }
        } else {
            displayNoResults(query);
        }
    } catch (error) {
        console.error('Search error:', error);
        displaySearchError();
    }
}

function displayUsersSuggestions(users, query) {
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
            <a href="browse-students.html?search=${encodeURIComponent(query)}" class="view-all-link">
                View all ${users.length} results for "${query}"
            </a>
        </div>
    `;

    searchSuggestions.innerHTML = html;
    searchSuggestions.style.display = 'block';

    // Add click handlers for user results
    searchSuggestions.querySelectorAll('.user-result').forEach(item => {
        item.addEventListener('click', function () {
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
        <div class="suggestion-item">
            <i class="fas fa-wifi"></i>
            <span>Check if backend is running on localhost:5000</span>
        </div>
    `;

    searchSuggestions.innerHTML = html;
    searchSuggestions.style.display = 'block';
}

function performSearch(query) {
    if (!query.trim()) return;

    console.log(`Performing search: ${query}`);
    showNotification(`Searching for "${query}"...`, 'info');

    // In real app, this would redirect to search results page
    setTimeout(() => {
        showNotification(`Found results for "${query}"`, 'success');
    }, 800);
}

// ===== HELPER FUNCTIONS =====
function getInitials(name) {
    if (!name) return 'US';
    return name
        .split(' ')
        .map(word => word[0])
        .join('')
        .toUpperCase()
        .substring(0, 2);
}

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

    // Fetch user profile from backend
    fetch(`http://localhost:5000/api/users/profile/${username}`)
        .then(response => {
            if (!response.ok) throw new Error('Profile not found');
            return response.json();
        })
        .then(result => {
            if (result.success) {
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
    // Create modal HTML (similar to student dashboard)
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
                    <h3 style="margin: 0; color: #d32f2f;">
                        <i class="fas fa-gavel" style="color: #d32f2f; margin-right: 8px;"></i>
                        User Profile
                    </h3>
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
                    <button onclick="messageUser('${user.username}')" style="
                        flex: 1;
                        background: #2196F3;
                        color: white;
                        border: none;
                        padding: 12px;
                        border-radius: 8px;
                        cursor: pointer;
                    ">
                        <i class="fas fa-envelope"></i> Message
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

function messageUser(username) {
    showNotification(`Opening chat with @${username}...`, 'info');
    closeProfileModal();
    // Redirect to messages page
    setTimeout(() => {
        window.location.href = 'org-messages.html?user=' + username;
    }, 500);
}

// Make these functions globally available
window.closeProfileModal = closeProfileModal;
window.connectWithUser = connectWithUser;
window.messageUser = messageUser;

// ===== 4. NAVIGATION =====
function setupNavigation() {
    const tabs = document.querySelectorAll('.nav-tab');

    tabs.forEach(tab => {
        tab.addEventListener('click', function (event) {
            const href = this.getAttribute('href') || '';
            const tabName = this.getAttribute('data-tab');

            // Home and Post tabs stay on this page
            if (href === '#') {
                event.preventDefault();

                tabs.forEach(t => t.classList.remove('active'));
                this.classList.add('active');

                loadOrgTabContent(tabName);
            }
        });
    });
}

function loadOrgTabContent(tabName) {
    const homeContainer = document.getElementById('homeContainer');
    const postContainer = document.getElementById('postInternshipContainer');
    const profileContainer = document.getElementById('orgProfileContainer');

    if (homeContainer) homeContainer.style.display = 'none';
    if (postContainer) postContainer.style.display = 'none';
    if (profileContainer) profileContainer.style.display = 'none';

    if (tabName === 'home') {
        if (homeContainer) homeContainer.style.display = 'grid';
        return;
    }

    if (tabName === 'post') {
        if (postContainer) postContainer.style.display = 'grid';
        loadMyInternships(); // Load the org's internships list
        setupPostInternshipSection();
        return;
    }

    if (tabName === 'profile') {
        if (profileContainer) profileContainer.style.display = 'block';
        renderOrgProfileData();
        showOrgProfileSection('home');
        return;
    }

    console.log(`Loading ${tabName} content...`);
    showNotification(`Loading ${tabName}...`, 'info');

    if (tabName === 'analytics') {
        showNotification('Analytics dashboard loading...', 'info');
    }
}

// Toggle create internship form visibility
function toggleCreateForm() {
    const formCard = document.getElementById('createInternshipCard');
    const toggleBtn = document.getElementById('toggleFormBtn');

    if (formCard) {
        const isHidden = formCard.style.display === 'none';
        formCard.style.display = isHidden ? 'block' : 'none';
        if (toggleBtn) {
            toggleBtn.innerHTML = isHidden ? '<i class="fas fa-times"></i> Cancel' : '<i class="fas fa-plus"></i> Create New';
        }
        if (isHidden) {
            formCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }
}
window.toggleCreateForm = toggleCreateForm;

// Load organization's internships for the management view
async function loadMyInternships() {
    const listContainer = document.getElementById('myInternshipsList');
    if (!listContainer) return;

    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const userId = user._id || user.id;
    if (!user || !userId) {
        listContainer.innerHTML = '<p style="text-align: center; color: #666;">Please log in to view your internships.</p>';
        return;
    }

    listContainer.innerHTML = `
        <div style="text-align: center; padding: 30px; color: #666;">
            <i class="fas fa-spinner fa-spin" style="font-size: 24px;"></i>
            <p style="margin-top: 10px;">Loading your internships...</p>
        </div>
    `;

    try {
        // Use centralized API instead of hardcoded URL
        const result = await window.OrgAPIs.Posts.getOrgInternships(userId);

        if (result.success && result.internships && result.internships.length > 0) {
            listContainer.innerHTML = result.internships.map(internship => {
                // Calculate proper status based on deadline
                const deadline = internship.deadline ? new Date(internship.deadline) : null;
                const now = new Date();
                let statusText = 'Active';
                let statusBg = '#e8f5e9';
                let statusColor = '#4CAF50';

                if (deadline) {
                    const daysUntilDeadline = Math.ceil((deadline - now) / (1000 * 60 * 60 * 24));

                    if (daysUntilDeadline < 0) {
                        statusText = 'Closed';
                        statusBg = '#ffebee';
                        statusColor = '#e53e3e';
                    } else if (daysUntilDeadline <= 3) {
                        statusText = 'Closing Soon';
                        statusBg = '#fff3e0';
                        statusColor = '#FF9800';
                    } else if (daysUntilDeadline <= 7) {
                        statusText = daysUntilDeadline + ' days left';
                        statusBg = '#e3f2fd';
                        statusColor = '#2196F3';
                    }
                }

                return `
                <div class="internship-card" data-id="${internship.id}" style="display: flex; justify-content: space-between; align-items: center; padding: 16px; border: 1px solid #eee; border-radius: 10px; margin-bottom: 12px; background: #fafafa;">
                    <div style="flex: 1;">
                        <h4 style="margin: 0 0 6px; color: #1a1a2e; font-size: 15px;">${internship.title}</h4>
                        <div style="display: flex; gap: 12px; flex-wrap: wrap; font-size: 12px; color: #666;">
                            <span><i class="fas fa-map-marker-alt" style="color: #d32f2f;"></i> ${internship.location || 'Remote'}</span>
                            <span><i class="fas fa-clock" style="color: #2196F3;"></i> ${internship.duration || 'Flexible'}</span>
                            <span><i class="fas fa-users" style="color: #4CAF50;"></i> ${internship.openings || 1} opening(s)</span>
                            <span><i class="fas fa-calendar" style="color: #FF9800;"></i> ${internship.deadline ? new Date(internship.deadline).toLocaleDateString() : 'No deadline'}</span>
                        </div>
                    </div>
                    <div style="display: flex; gap: 8px; align-items: center;">
                        <span style="padding: 4px 10px; background: ${statusBg}; color: ${statusColor}; border-radius: 12px; font-size: 11px; font-weight: 600;">
                            ${statusText}
                        </span>
                        <button onclick="showTopApplicants('${internship.id}', '${(internship.title || '').replace(/'/g, "\\'")}')" style="padding: 6px 12px; background: #9C27B0; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 12px;" title="Top Applicants">
                            <i class="fas fa-user-check"></i> Top Matches
                        </button>
                        <button onclick="editInternship('${internship.id}')" style="padding: 6px 12px; background: #2196F3; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 12px;" title="Edit">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button onclick="deleteInternship('${internship.id}', '${(internship.title || '').replace(/'/g, "\\'")}')" style="padding: 6px 12px; background: #e53e3e; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 12px;" title="Delete">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            `}).join('');
        } else {
            listContainer.innerHTML = `
                <div style="text-align: center; padding: 40px; color: #666;">
                    <i class="fas fa-briefcase" style="font-size: 40px; color: #ddd; margin-bottom: 16px;"></i>
                    <h4 style="margin: 0 0 8px; color: #1a1a2e;">No Internships Yet</h4>
                    <p style="margin: 0; font-size: 14px;">Click "Create New" to post your first internship opportunity.</p>
                </div>
            `;
        }
    } catch (error) {
        console.error('Error loading internships:', error);
        listContainer.innerHTML = `
            <div style="text-align: center; padding: 30px; color: #e53e3e;">
                <i class="fas fa-exclamation-triangle" style="font-size: 24px; margin-bottom: 10px;"></i>
                <p>Failed to load internships. <a href="#" onclick="loadMyInternships(); return false;" style="color: #d32f2f;">Retry</a></p>
            </div>
        `;
    }
}

// ===== 5. CREATE ORGANIZATION POST =====
let pendingOrgPostImage = null;

function setupCreateOrgPost() {
    const postInput = document.querySelector('.post-input');
    const postButton = document.querySelector('.post-submit-btn');
    const actionButtons = document.querySelectorAll('.post-action-btn');

    if (!postInput || !postButton) return;

    actionButtons.forEach(button => {
        button.addEventListener('click', function () {
            const type = this.getAttribute('data-type');
            handleOrgPostAction(type, postInput);
        });
    });

    postButton.addEventListener('click', () => createOrgPost(postInput, postButton));

    postInput.addEventListener('keydown', function (event) {
        if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
            createOrgPost(postInput, postButton);
        }
    });
}

function handleOrgPostAction(type, postInput) {
    const placeholders = {
        internship: 'Describe the internship opportunity...',
        event: 'Share event details...',
        article: 'Write company news or article...',
        photo: 'Add a caption for your photo...'
    };

    if (placeholders[type]) {
        postInput.placeholder = placeholders[type];
    }

    if (type === 'internship') {
        openPostInternshipSection();
        return;
    }

    if (type === 'photo') {
        openOrgPostImageUpload();
        return;
    }

    postInput.focus();
}

function openOrgPostImageUpload() {
    // Use the HTML file input element
    const fileInput = document.getElementById('orgPhotoInput');
    if (fileInput) {
        // Remove any existing listener and add new one
        const newInput = fileInput.cloneNode(true);
        fileInput.parentNode.replaceChild(newInput, fileInput);

        newInput.addEventListener('change', function (e) {
            const file = e.target.files[0];
            if (file) {
                if (file.size > 5 * 1024 * 1024) {
                    showNotification('Image must be less than 5MB', 'error');
                    return;
                }

                const reader = new FileReader();
                reader.onload = function (event) {
                    pendingOrgPostImage = event.target.result;
                    showOrgPostImagePreview(pendingOrgPostImage);
                    showNotification('Image added to post', 'success');
                };
                reader.readAsDataURL(file);
            }
        });

        newInput.click();
    }
}

function showOrgPostImagePreview(imageData) {
    const existingPreview = document.getElementById('orgPostImagePreview');
    if (existingPreview) existingPreview.remove();

    const postCard = document.querySelector('.create-post-card');
    if (!postCard) return;

    const preview = document.createElement('div');
    preview.id = 'orgPostImagePreview';
    preview.style.cssText = `
        position: relative;
        margin: 16px;
        border-radius: 12px;
        overflow: hidden;
        background: #f5f5f5;
        border: 2px solid #e0e0e0;
    `;
    preview.innerHTML = `
        <div style="position: relative;">
            <img src="${imageData}" style="width: 100%; max-height: 350px; object-fit: contain; display: block; background: #000;">
            
            <!-- Action buttons overlay -->
            <div style="
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                padding: 12px;
                display: flex;
                justify-content: space-between;
                background: linear-gradient(to bottom, rgba(0,0,0,0.5), transparent);
            ">
                <span style="color: white; font-weight: 600; font-size: 14px;">
                    <i class="fas fa-image"></i> Photo Preview
                </span>
                <div style="display: flex; gap: 8px;">
                    <button onclick="changeOrgPostImage()" style="
                        padding: 6px 12px;
                        border-radius: 6px;
                        background: rgba(255,255,255,0.9);
                        color: #333;
                        border: none;
                        cursor: pointer;
                        font-size: 12px;
                        font-weight: 500;
                    "><i class="fas fa-sync-alt"></i> Change</button>
                    <button onclick="removeOrgPostImage()" style="
                        padding: 6px 12px;
                        border-radius: 6px;
                        background: rgba(220,53,69,0.9);
                        color: white;
                        border: none;
                        cursor: pointer;
                        font-size: 12px;
                        font-weight: 500;
                    "><i class="fas fa-trash"></i> Remove</button>
                </div>
            </div>
            
            <!-- Bottom info bar -->
            <div style="
                position: absolute;
                bottom: 0;
                left: 0;
                right: 0;
                padding: 10px 12px;
                background: linear-gradient(to top, rgba(0,0,0,0.6), transparent);
                color: white;
                font-size: 12px;
            ">
                <i class="fas fa-check-circle" style="color: #4CAF50;"></i> Ready to post with your update
            </div>
        </div>
    `;

    // Insert after the post header
    const postHeader = postCard.querySelector('.create-post-header');
    if (postHeader) {
        postHeader.after(preview);
    } else {
        postCard.insertBefore(preview, postCard.firstChild);
    }
}

function changeOrgPostImage() {
    const fileInput = document.getElementById('orgPostImageInput');
    if (fileInput) {
        fileInput.click();
    } else {
        openOrgPostImageUpload();
    }
}

window.changeOrgPostImage = changeOrgPostImage;

function removeOrgPostImage() {
    pendingOrgPostImage = null;
    const preview = document.getElementById('orgPostImagePreview');
    if (preview) preview.remove();
    showNotification('Image removed', 'info');
}

window.removeOrgPostImage = removeOrgPostImage;

async function createOrgPost(postInput, postButton) {
    const content = postInput.value.trim();

    if (!content) {
        showNotification('Please enter some content', 'error');
        postInput.focus();
        return;
    }

    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const userId = user._id || user.id;
    if (!user || !userId) {
        showNotification('Please log in to create posts', 'error');
        return;
    }

    if (user.isBlocked) {
        showNotification('You cannot create posts while your account is blocked.', 'error');
        return;
    }

    const originalText = postButton.textContent;
    postButton.textContent = 'Posting...';
    postButton.disabled = true;

    try {
        // Build post data including image if present
        const postData = {
            userId: userId,
            content: content,
            type: 'update'
        };

        // Include image if one was selected
        if (pendingOrgPostImage) {
            postData.media = pendingOrgPostImage;
            postData.mediaType = 'image';
        }

        // Use centralized API
        const result = await window.OrgAPIs.Profile.createFeedPost(postData);

        if (result.success) {
            // Clear input and image
            postInput.value = '';
            postInput.placeholder = 'Share company updates, hiring news, or events...';
            pendingOrgPostImage = null;
            const imagePreview = document.getElementById('orgPostImagePreview');
            if (imagePreview) imagePreview.remove();

            showNotification('Company update published!', 'success');
            loadOrgFeed();
        } else {
            showNotification(result.message || 'Failed to create post', 'error');
        }
    } catch (error) {
        console.error('Create org post error:', error);
        showNotification('Network error while creating post', 'error');
    } finally {
        postButton.textContent = originalText;
        postButton.disabled = false;
    }
}

function addOrgPostToFeed(content) {
    const feed = document.querySelector('.feed-posts');
    if (!feed) return;

    const org = JSON.parse(localStorage.getItem('user') || {});
    const initials = getOrgInitials(org.fullName || org.companyName || 'Company');

    const post = document.createElement('div');
    post.className = 'card feed-post';
    post.innerHTML = `
        <div class="post-header">
            <div class="company-logo">${initials}</div>
            <div class="post-info">
                <h4>${org.fullName || org.companyName || 'Your Company'}</h4>
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
        button.addEventListener('click', function () {
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
        button.addEventListener('click', function () {
            showNotification('Comment feature coming soon!', 'info');
        });
    });

    container.querySelectorAll('.share-btn').forEach(button => {
        button.addEventListener('click', function () {
            showNotification('Share feature coming soon!', 'info');
        });
    });
}

function setupOrgActionButtons() {
    // Edit post button
    document.querySelectorAll('.apply-btn').forEach(button => {
        if (button.textContent.includes('Edit')) {
            button.addEventListener('click', function () {
                openPostInternshipSection();
                showNotification('Editing existing internships will be added soon. For now, you can post a new one.', 'info');
            });
        }
    });

    // Invite to apply buttons
    document.querySelectorAll('.connect-btn').forEach(button => {
        if (button.textContent.includes('Invite')) {
            button.addEventListener('click', function () {
                showNotification('Invitation sent to student!', 'success');
                this.innerHTML = '<i class="fas fa-check"></i> Invited';
                this.disabled = true;
                this.style.opacity = '0.7';
            });
        }
    });

    // Save profile buttons
    document.querySelectorAll('.save-btn').forEach(button => {
        button.addEventListener('click', function () {
            showNotification('User profile saved to favorites!', 'success');
            const icon = this.querySelector('i');
            icon.classList.remove('far');
            icon.classList.add('fas');
            icon.style.color = '#FFD600';
        });
    });

    // Message buttons
    document.querySelectorAll('.message-btn').forEach(button => {
        button.addEventListener('click', function () {
            showNotification('Opening message window...', 'info');
            setTimeout(() => {
                window.location.href = 'org-messages.html';
            }, 500);
        });
    });

    // View portfolio buttons
    document.querySelectorAll('.view-btn').forEach(button => {
        button.addEventListener('click', function () {
            showNotification('Opening user portfolio...', 'info');
        });
    });

    // Download report buttons
    document.querySelectorAll('.download-btn').forEach(button => {
        button.addEventListener('click', function () {
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
        button.addEventListener('click', function () {
            if (this.textContent.includes('Update Skill')) {
                openPostInternshipSection();
            }
        });
    });

    // Quick action items
    document.querySelectorAll('.trending-item').forEach(item => {
        if (item.onclick) return; // Already has onclick

        item.addEventListener('click', function () {
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

// ===== 8. VERIFICATION & POST INTERNSHIP SECTION =====

// Check verification status from backend and update localStorage
async function checkAndUpdateVerificationStatus() {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const userId = user._id || user.id;
    if (!user || !userId) return;

    try {
        const response = await fetch(`http://localhost:5000/api/notifications/status/${userId}`, {
            headers: getAuthHeaders()
        });
        const result = await response.json();

        if (result.success && result.user) {
            // Update localStorage with latest status
            const updatedUser = { ...user, ...result.user };
            localStorage.setItem('user', JSON.stringify(updatedUser));

            // If status changed to verified, show notification
            if (result.user.orgVerificationStatus === 'verified' && user.orgVerificationStatus !== 'verified') {
                showNotification(' Your organization has been verified! You can now post internships.', 'success');
            }

            // Update verification banner
            setupVerificationBanner();
        }
    } catch (error) {
        console.error('Error checking verification status:', error);
    }
}

// Load notifications from backend
async function loadOrgNotifications() {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const userId = user._id || user.id;
    if (!user || !userId) return;

    try {
        const response = await fetch(`http://localhost:5000/api/notifications/${userId}`, {
            headers: getAuthHeaders()
        });
        const result = await response.json();

        if (result.success) {
            updateNotificationBadge(result.unreadCount);
            displayNotifications(result.notifications);
        }
    } catch (error) {
        console.error('Error loading notifications:', error);
    }
}

function updateNotificationBadge(count) {
    const badge = document.querySelector('.notification-count');
    const dot = document.querySelector('.notification-dot');

    if (badge) {
        badge.textContent = count > 9 ? '9+' : count;
        badge.style.display = count > 0 ? 'flex' : 'none';
    }
    if (dot) {
        dot.style.display = count > 0 ? 'block' : 'none';
    }
}

function displayNotifications(notifications) {
    const dropdown = document.getElementById('notificationDropdown');
    if (!dropdown) return;

    if (notifications.length === 0) {
        dropdown.innerHTML = `
            <div class="dropdown-header">
                <h4>Notifications</h4>
            </div>
            <div style="padding: 20px; text-align: center; color: #666;">
                <i class="fas fa-bell-slash" style="font-size: 24px; margin-bottom: 8px;"></i>
                <p>No notifications yet</p>
            </div>
        `;
        return;
    }

    const getNotificationIcon = (type) => {
        const icons = {
            'verification_approved': 'fa-check-circle',
            'verification_rejected': 'fa-times-circle',
            'application_received': 'fa-user-plus',
            'application': 'fa-file-alt',
            'new_internship': 'fa-briefcase',
            'announcement': 'fa-bullhorn',
            'account_blocked': 'fa-ban',
            'account_unblocked': 'fa-unlock'
        };
        return icons[type] || 'fa-bell';
    };

    const getNotificationColor = (type) => {
        const colors = {
            'verification_approved': '#38a169',
            'verification_rejected': '#e53e3e',
            'application_received': '#2196F3',
            'application': '#2196F3',
            'new_internship': '#FF9800',
            'announcement': '#9C27B0',
            'account_blocked': '#e53e3e',
            'account_unblocked': '#38a169'
        };
        return colors[type] || '#3182ce';
    };

    dropdown.innerHTML = `
        <div class="dropdown-header" style="display: flex; justify-content: space-between; align-items: center; padding: 12px 16px; border-bottom: 1px solid #eee;">
            <h4 style="margin: 0; font-size: 14px;">Notifications</h4>
            <button onclick="markAllNotificationsRead()" style="background: none; border: none; color: #d32f2f; cursor: pointer; font-size: 12px;">Mark all read</button>
        </div>
        <div class="notification-list" style="max-height: 350px; overflow-y: auto;">
            ${notifications.slice(0, 15).map(n => `
                <div class="notification-item ${n.isRead ? '' : 'unread'}" onclick="handleNotificationClick('${n._id || n.id}', '${n.type}', ${JSON.stringify(n.data || {}).replace(/"/g, '&quot;')})" style="padding: 12px 16px; border-bottom: 1px solid #f0f0f0; ${n.isRead ? '' : 'background: #f8f9ff;'} cursor: pointer;">
                    <div style="display: flex; align-items: start; gap: 12px;">
                        <i class="fas ${getNotificationIcon(n.type)}" style="color: ${getNotificationColor(n.type)}; margin-top: 2px;"></i>
                        <div style="flex: 1;">
                            <p style="font-weight: ${n.isRead ? '400' : '600'}; margin: 0 0 4px; font-size: 13px; color: #1a1a2e;">${n.title}</p>
                            <p style="font-size: 12px; color: #666; margin: 0; line-height: 1.4;">${n.message.substring(0, 80)}${n.message.length > 80 ? '...' : ''}</p>
                            <p style="font-size: 11px; color: #999; margin: 6px 0 0;">${getTimeAgo(new Date(n.createdAt))}</p>
                        </div>
                    </div>
                </div>
            `).join('')}
        </div>
        <div style="padding: 12px; border-top: 1px solid #eee; text-align: center;">
            <a href="view-applications.html" style="color: #d32f2f; font-size: 13px; text-decoration: none; font-weight: 600;">View All Applications</a>
        </div>
    `;
}

function handleNotificationClick(notificationId, type, data) {
    // Mark as read
    fetch(`http://localhost:5000/api/notifications/${notificationId}/read`, {
        method: 'PUT',
        headers: getAuthHeaders()
    });
    
    // Navigate based on type
    if (type === 'application_received' || type === 'application') {
        window.location.href = 'view-applications.html';
    }
    
    // Refresh notifications
    loadOrgNotifications();
}

async function markAllNotificationsRead() {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const userId = user._id || user.id;
    if (!user || !userId) return;

    try {
        await fetch(`http://localhost:5000/api/notifications/${userId}/read-all`, {
            method: 'PUT',
            headers: getAuthHeaders()
        });
        updateNotificationBadge(0);
        loadOrgNotifications();
    } catch (error) {
        console.error('Error marking notifications as read:', error);
    }
}

function setupVerificationBanner() {
    const banner = document.getElementById('orgVerificationBanner');
    if (!banner) return;

    try {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        if (user && user.userType === 'organization' && user.orgVerificationStatus && user.orgVerificationStatus !== 'verified') {
            banner.style.display = 'flex';
        } else {
            banner.style.display = 'none';
        }
    } catch {
        banner.style.display = 'none';
    }
}

function openPostInternshipSection() {
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    if (user.isBlocked) {
        showNotification('You cannot post internships while your account is blocked.', 'error');
        return;
    }

    if (user.orgVerificationStatus !== 'verified') {
        showNotification('Your organization must be verified before posting internships.', 'error');
        return;
    }

    // Switch to inline post internship section
    const tabs = document.querySelectorAll('.nav-tab');
    const postTab = document.querySelector('.nav-tab[data-tab="post"]');

    if (postTab) {
        tabs.forEach(t => t.classList.remove('active'));
        postTab.classList.add('active');
    }
    loadOrgTabContent('post');
}
window.openPostInternshipSection = openPostInternshipSection;

// Navigation function for dropdown link
function navigateToPostInternship() {
    // Close the profile dropdown
    const profileMenu = document.getElementById('profileMenu');
    if (profileMenu) profileMenu.classList.remove('show');

    openPostInternshipSection();
}
window.navigateToPostInternship = navigateToPostInternship;

function showOrgProfileTab() {
    closeAllDropdowns();

    const tabs = document.querySelectorAll('.nav-tab');
    tabs.forEach(t => t.classList.remove('active'));

    loadOrgTabContent('profile');

    window.scrollTo({ top: 0, behavior: 'smooth' });
}
window.showOrgProfileTab = showOrgProfileTab;

function closeOrgProfileTab() {
    closeAllDropdowns();

    const tabs = document.querySelectorAll('.nav-tab');
    const homeTab = document.querySelector('.nav-tab[data-tab="home"]');

    if (homeTab) {
        tabs.forEach(t => t.classList.remove('active'));
        homeTab.classList.add('active');
    }

    loadOrgTabContent('home');
    window.scrollTo({ top: 0, behavior: 'smooth' });
}
window.closeOrgProfileTab = closeOrgProfileTab;

function showOrgProfileSection(section) {
    const home = document.getElementById('orgProfileHomeSection');
    const about = document.getElementById('orgProfileAboutSection');
    const internships = document.getElementById('orgProfileInternshipsSection');

    if (home) home.style.display = 'none';
    if (about) about.style.display = 'none';
    if (internships) internships.style.display = 'none';

    const navHome = document.getElementById('orgProfileNavHome');
    const navAbout = document.getElementById('orgProfileNavAbout');
    const navInternships = document.getElementById('orgProfileNavInternships');

    const setActive = (el, active) => {
        if (!el) return;
        el.style.borderBottom = active ? '3px solid #d32f2f' : '3px solid transparent';
        el.style.color = active ? '#d32f2f' : '#666';
    };

    setActive(navHome, section === 'home');
    setActive(navAbout, section === 'about');
    setActive(navInternships, section === 'internships');

    if (section === 'about' && about) about.style.display = 'block';
    else if (section === 'internships' && internships) internships.style.display = 'block';
    else if (home) home.style.display = 'block';
}
window.showOrgProfileSection = showOrgProfileSection;

function renderOrgProfileData() {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const orgProfileData = JSON.parse(localStorage.getItem('orgProfileData') || '{}');

    const ORG_TYPE_LABELS = {
        it: 'IT / Software',
        technology: 'Technology',
        finance: 'Finance',
        banking: 'Banking',
        healthcare: 'Healthcare',
        marketing: 'Marketing',
        consulting: 'Consulting',
        education: 'Education',
        manufacturing: 'Manufacturing',
        retail: 'Retail',
        media: 'Media',
        other: 'Other'
    };

    const companyName = (orgProfileData.companyName || user.fullName || '').trim();
    const orgType = (orgProfileData.orgType || user.orgType || '').trim();
    const location = (orgProfileData.location || '').trim();
    const about = (orgProfileData.about || orgProfileData.description || '').trim();

    const nameEl = document.getElementById('orgProfileName');
    if (nameEl) nameEl.textContent = companyName || 'Organization';

    const industryEl = document.getElementById('orgProfileIndustry');
    if (industryEl) industryEl.textContent = ORG_TYPE_LABELS[orgType] || orgType || 'Industry';

    const industryDetailEl = document.getElementById('orgProfileIndustryDetail');
    if (industryDetailEl) industryDetailEl.textContent = ORG_TYPE_LABELS[orgType] || orgType || 'Industry';

    const locationEl = document.getElementById('orgProfileLocation');
    if (locationEl) locationEl.innerHTML = `<i class="fas fa-map-marker-alt"></i> ${location || 'Location'}`;

    const hqEl = document.getElementById('orgProfileHQ');
    if (hqEl) hqEl.textContent = location || 'Location';

    const hqAddressEl = document.getElementById('orgProfileHQAddress');
    if (hqAddressEl) hqAddressEl.textContent = location || 'Location';

    const mapTitleEl = document.getElementById('orgProfileMapTitle');
    if (mapTitleEl) mapTitleEl.textContent = companyName ? `${companyName} Office` : 'Office';

    const mapLocationEl = document.getElementById('orgProfileMapLocation');
    if (mapLocationEl) mapLocationEl.textContent = location || 'Location';

    const aboutEl = document.getElementById('orgProfileAbout');
    if (aboutEl) aboutEl.textContent = about || 'No company description yet. Click Edit to add details.';

    const overviewEl = document.getElementById('orgProfileOverviewText');
    if (overviewEl) overviewEl.textContent = about || 'No company description yet. Click Edit to add details.';

    const emailEl = document.getElementById('orgProfileEmail');
    if (emailEl) emailEl.textContent = (user.email || orgProfileData.email || 'Not provided').trim();

    const phoneEl = document.getElementById('orgProfilePhone');
    if (phoneEl) phoneEl.textContent = (orgProfileData.phone || 'Not provided').trim();

    const websiteEl = document.getElementById('orgProfileWebsite');
    if (websiteEl) {
        const website = (orgProfileData.website || '').trim();
        if (website) {
            websiteEl.href = website;
            websiteEl.textContent = website.replace(/^https?:\/\//, '');
        } else {
            websiteEl.href = '#';
            websiteEl.textContent = 'Not provided';
        }
    }

    const logoEl = document.getElementById('orgProfileLogo');
    if (logoEl) {
        const initials = (companyName || 'OR')
            .split(' ')
            .filter(Boolean)
            .slice(0, 2)
            .map(part => part[0].toUpperCase())
            .join('');
        logoEl.textContent = initials || 'OR';
    }

    const socialWrap = document.getElementById('orgProfileSocialLinks');
    if (socialWrap) {
        socialWrap.innerHTML = '<span style="color: #666; font-weight: 600; font-size: 13px;">Connect:</span>';

        const socials = [
            { key: 'linkedin', icon: 'fab fa-linkedin-in', title: 'LinkedIn' },
            { key: 'twitter', icon: 'fab fa-x-twitter', title: 'X' },
            { key: 'facebook', icon: 'fab fa-facebook-f', title: 'Facebook' },
            { key: 'instagram', icon: 'fab fa-instagram', title: 'Instagram' }
        ];

        socials.forEach(s => {
            const url = String((orgProfileData && orgProfileData[s.key]) || '').trim();
            if (!url) return;
            const a = document.createElement('a');
            a.href = url;
            a.target = '_blank';
            a.rel = 'noopener noreferrer';
            a.title = s.title;
            a.style.cssText = 'width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; border-radius: 999px; background: #f5f5f5; color: #666; text-decoration: none;';
            a.innerHTML = `<i class="${s.icon}"></i>`;
            socialWrap.appendChild(a);
        });
    }
}

function getOrgDirections() {
    const orgProfileData = JSON.parse(localStorage.getItem('orgProfileData') || '{}');
    const location = String((orgProfileData && orgProfileData.location) || '').trim() || 'Location';
    window.open(`https://www.google.com/maps/search/${encodeURIComponent(location)}`, '_blank');
}
window.getOrgDirections = getOrgDirections;

function sendOrgMessage() {
    const messageEl = document.getElementById('orgMessageText');
    const msg = messageEl ? String(messageEl.value || '').trim() : '';
    if (!msg) {
        showNotification('Please write a message before sending.', 'error');
        return;
    }
    const nameEl = document.getElementById('orgMessageName');
    const emailEl = document.getElementById('orgMessageEmail');
    if (nameEl) nameEl.value = '';
    if (emailEl) emailEl.value = '';
    if (messageEl) messageEl.value = '';
    showNotification('Message sent successfully!', 'success');
}
window.sendOrgMessage = sendOrgMessage;

function exportOrgData() {
    showNotification('Exporting organization data...', 'info');
}
window.exportOrgData = exportOrgData;

function generateOrgQR() {
    showNotification('Generating QR code...', 'info');
}
window.generateOrgQR = generateOrgQR;

function openOrgProfileEditModal() {
    const modal = document.getElementById('orgEditProfileModal');
    if (!modal) return;

    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const orgProfileData = JSON.parse(localStorage.getItem('orgProfileData') || '{}');

    const setValue = (id, value) => {
        const el = document.getElementById(id);
        if (el) el.value = value || '';
    };

    setValue('orgEditName', orgProfileData.companyName || user.fullName || '');
    setValue('orgEditIndustry', orgProfileData.orgType || user.orgType || 'other');
    setValue('orgEditLocation', orgProfileData.location || '');
    setValue('orgEditAbout', orgProfileData.about || orgProfileData.description || '');
    setValue('orgEditEmail', orgProfileData.email || user.email || '');
    setValue('orgEditPhone', orgProfileData.phone || '');
    setValue('orgEditWebsite', orgProfileData.website || '');
    setValue('orgEditLinkedin', orgProfileData.linkedin || '');
    setValue('orgEditTwitter', orgProfileData.twitter || '');
    setValue('orgEditFacebook', orgProfileData.facebook || '');
    setValue('orgEditInstagram', orgProfileData.instagram || '');

    modal.style.display = 'flex';
}
window.openOrgProfileEditModal = openOrgProfileEditModal;

function closeOrgProfileEditModal() {
    const modal = document.getElementById('orgEditProfileModal');
    if (!modal) return;
    modal.style.display = 'none';
}
window.closeOrgProfileEditModal = closeOrgProfileEditModal;

async function saveOrgProfileEdits() {
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    if (!user || !user.id) {
        showNotification('Please log in to edit profile', 'error');
        return;
    }

    const getValue = (id) => {
        const el = document.getElementById(id);
        return el ? el.value.trim() : '';
    };

    // Build profile data to send to backend
    const profileData = {
        fullName: getValue('orgEditName'),
        industry: getValue('orgEditIndustry') || 'other',
        location: getValue('orgEditLocation'),
        description: getValue('orgEditAbout'),
        phone: getValue('orgEditPhone'),
        website: getValue('orgEditWebsite'),
        linkedin: getValue('orgEditLinkedin'),
        twitter: getValue('orgEditTwitter'),
        facebook: getValue('orgEditFacebook')
    };

    // Check for profile picture input
    const profilePicInput = document.getElementById('orgEditProfilePic');
    if (profilePicInput && profilePicInput.dataset.base64) {
        profileData.profilePicture = profilePicInput.dataset.base64;
    }

    // Check for cover image input
    const coverInput = document.getElementById('orgEditCoverImage');
    if (coverInput && coverInput.dataset.base64) {
        profileData.coverImage = coverInput.dataset.base64;
    }

    // Show loading state
    const saveBtn = document.querySelector('[onclick="saveOrgProfileEdits()"]');
    const originalText = saveBtn ? saveBtn.innerHTML : '';
    if (saveBtn) {
        saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
        saveBtn.disabled = true;
    }

    try {
        const result = await window.OrgAPIs.Profile.updateProfile(user.id, profileData);

        if (result.success) {
            // Update localStorage with new data from server
            const updatedUser = {
                ...user,
                fullName: profileData.fullName || user.fullName,
                industry: profileData.industry,
                location: profileData.location,
                description: profileData.description,
                website: profileData.website,
                phone: profileData.phone,
                linkedin: profileData.linkedin,
                twitter: profileData.twitter,
                facebook: profileData.facebook
            };

            if (result.organization) {
                Object.assign(updatedUser, result.organization);
            }

            localStorage.setItem('user', JSON.stringify(updatedUser));

            // Also update orgProfileData with keys that openOrgProfileEditModal expects
            const orgProfileData = {
                companyName: profileData.fullName,
                orgType: profileData.industry,
                location: profileData.location,
                about: profileData.description,
                description: profileData.description,
                email: user.email,
                phone: profileData.phone,
                website: profileData.website,
                linkedin: profileData.linkedin,
                twitter: profileData.twitter,
                facebook: profileData.facebook,
                instagram: getValue('orgEditInstagram')
            };
            localStorage.setItem('orgProfileData', JSON.stringify(orgProfileData));

            renderOrgProfileData();
            closeOrgProfileEditModal();
            showNotification('Company profile updated successfully!', 'success');
        } else {
            showNotification(result.message || 'Failed to update profile', 'error');
        }
    } catch (error) {
        console.error('Profile update error:', error);
        showNotification('Network error. Please try again.', 'error');
    } finally {
        if (saveBtn) {
            saveBtn.innerHTML = originalText;
            saveBtn.disabled = false;
        }
    }
}
window.saveOrgProfileEdits = saveOrgProfileEdits;

function copyOrgProfileLink() {
    const url = `${window.location.origin}${window.location.pathname}?tab=profile`;

    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(url)
            .then(() => showNotification('Profile link copied!', 'success'))
            .catch(() => showNotification('Could not copy link', 'error'));
        return;
    }

    try {
        const tmp = document.createElement('input');
        tmp.value = url;
        document.body.appendChild(tmp);
        tmp.select();
        document.execCommand('copy');
        tmp.remove();
        showNotification('Profile link copied!', 'success');
    } catch (_) {
        showNotification('Could not copy link', 'error');
    }
}
window.copyOrgProfileLink = copyOrgProfileLink;

// Skills with levels storage
const skillsWithLevels = [];

let orgSkillsDatabase = [];
let newSkillActiveIndex = -1;

async function loadOrgSkillsDatabase() {
    if (Array.isArray(orgSkillsDatabase) && orgSkillsDatabase.length > 0) return;
    try {
        const response = await fetch('../student/portfolio/skills-database.json');
        if (response.ok) {
            const data = await response.json();
            orgSkillsDatabase = Array.isArray(data) ? data : [];
        }
    } catch (_) {
        orgSkillsDatabase = [];
    }
}

function buildOrgSkillSuggestionItems(query) {
    const q = (query || '').trim().toLowerCase();
    if (!q || !Array.isArray(orgSkillsDatabase) || orgSkillsDatabase.length === 0) return [];

    const starts = [];
    const contains = [];

    for (const s of orgSkillsDatabase) {
        const name = String((s && s.name) || '').trim();
        if (!name) continue;
        const n = name.toLowerCase();
        if (n.startsWith(q)) starts.push(s);
        else if (n.includes(q)) contains.push(s);
    }

    return starts.concat(contains).slice(0, 10);
}

function renderOrgSkillSuggestions(inputEl, dropdownEl, matches) {
    if (!dropdownEl) return;

    dropdownEl.innerHTML = '';
    newSkillActiveIndex = -1;

    if (!matches || matches.length === 0) {
        dropdownEl.classList.add('hidden');
        return;
    }

    matches.forEach((s) => {
        const name = String((s && s.name) || '').trim();
        if (!name) return;
        const category = String((s && s.category) || '').trim();

        const item = document.createElement('div');
        item.className = 'skill-suggestion-item';

        const label = document.createElement('div');
        label.textContent = name;
        item.appendChild(label);

        if (category) {
            const meta = document.createElement('span');
            meta.textContent = category;
            item.appendChild(meta);
        }

        item.addEventListener('mousedown', (e) => {
            e.preventDefault();
            inputEl.value = name;
            dropdownEl.classList.add('hidden');
            inputEl.focus();
        });

        dropdownEl.appendChild(item);
    });

    dropdownEl.classList.remove('hidden');
}

function highlightOrgSkillSuggestion(dropdownEl, nextIndex) {
    if (!dropdownEl) return;
    const items = Array.from(dropdownEl.querySelectorAll('.skill-suggestion-item'));
    if (items.length === 0) return;

    items.forEach((el) => el.classList.remove('highlighted'));
    const idx = Math.max(0, Math.min(nextIndex, items.length - 1));
    items[idx].classList.add('highlighted');
    newSkillActiveIndex = idx;
    items[idx].scrollIntoView({ block: 'nearest' });
}

function setupNewSkillAutocomplete() {
    const inputEl = document.getElementById('newSkillInput');
    const dropdownEl = document.getElementById('newSkillSuggestions');
    if (!inputEl || !dropdownEl) return;

    if (inputEl.dataset.autocompleteReady === 'true') return;
    inputEl.dataset.autocompleteReady = 'true';

    inputEl.addEventListener('input', function () {
        const matches = buildOrgSkillSuggestionItems(inputEl.value);
        renderOrgSkillSuggestions(inputEl, dropdownEl, matches);
    });

    inputEl.addEventListener('keydown', function (e) {
        const isOpen = !dropdownEl.classList.contains('hidden');
        const items = Array.from(dropdownEl.querySelectorAll('.skill-suggestion-item'));

        if (e.key === 'ArrowDown') {
            if (!isOpen || items.length === 0) return;
            e.preventDefault();
            highlightOrgSkillSuggestion(dropdownEl, newSkillActiveIndex + 1);
            return;
        }

        if (e.key === 'ArrowUp') {
            if (!isOpen || items.length === 0) return;
            e.preventDefault();
            highlightOrgSkillSuggestion(dropdownEl, newSkillActiveIndex - 1);
            return;
        }

        if (e.key === 'Escape') {
            dropdownEl.classList.add('hidden');
            return;
        }

        if (e.key === 'Enter') {
            e.preventDefault();
            if (isOpen && items.length > 0 && newSkillActiveIndex >= 0 && items[newSkillActiveIndex]) {
                items[newSkillActiveIndex].dispatchEvent(new MouseEvent('mousedown'));
                return;
            }
            dropdownEl.classList.add('hidden');
            addSkillWithLevel();
        }
    });

    inputEl.addEventListener('blur', function () {
        setTimeout(() => dropdownEl.classList.add('hidden'), 150);
    });

    document.addEventListener('click', function (event) {
        if (!dropdownEl.contains(event.target) && !inputEl.contains(event.target)) {
            dropdownEl.classList.add('hidden');
        }
    });
}

function addSkillWithLevel() {
    const skillInput = document.getElementById('newSkillInput');
    const levelSelect = document.getElementById('newSkillLevel');

    if (!skillInput || !levelSelect) return;

    const skill = skillInput.value.trim();
    const level = levelSelect.value;

    if (!skill) {
        showNotification('Please enter a skill name', 'error');
        return;
    }

    // Check if skill already exists
    if (skillsWithLevels.some(s => s.name.toLowerCase() === skill.toLowerCase())) {
        showNotification('This skill is already added', 'error');
        return;
    }

    skillsWithLevels.push({ name: skill, level: level });
    renderSkillsWithLevels();
    skillInput.value = '';
    const dropdownEl = document.getElementById('newSkillSuggestions');
    if (dropdownEl) dropdownEl.classList.add('hidden');
    skillInput.focus();
}

function removeSkillWithLevel(index) {
    skillsWithLevels.splice(index, 1);
    renderSkillsWithLevels();
}

function renderSkillsWithLevels() {
    const container = document.getElementById('skillsWithLevels');
    if (!container) return;

    const levelColors = {
        beginner: '#4CAF50',
        intermediate: '#2196F3',
        advanced: '#FF9800',
        expert: '#9C27B0'
    };

    container.innerHTML = skillsWithLevels.map((s, i) => `
        <span style="display: inline-flex; align-items: center; gap: 6px; padding: 6px 12px; background: ${levelColors[s.level]}15; border: 1px solid ${levelColors[s.level]}; border-radius: 20px; font-size: 13px;">
            <strong>${s.name}</strong>
            <span style="color: ${levelColors[s.level]}; font-size: 11px; text-transform: capitalize;">(${s.level})</span>
            <button type="button" onclick="removeSkillWithLevel(${i})" style="background: none; border: none; color: #999; cursor: pointer; font-size: 14px; padding: 0;">×</button>
        </span>
    `).join('');
}

// Make functions globally available
window.addSkillWithLevel = addSkillWithLevel;
window.removeSkillWithLevel = removeSkillWithLevel;

function setupPostInternshipSection() {
    const form = document.getElementById('internshipPostForm');
    const submitBtn = document.getElementById('postInternshipSubmit');


    if (!form || !submitBtn) return;

    // Prevent adding duplicate event listeners
    if (form.dataset.listenerAdded === 'true') {
        return;
    }
    form.dataset.listenerAdded = 'true';

    loadOrgSkillsDatabase().then(setupNewSkillAutocomplete);

    form.addEventListener('submit', async function (e) {
        e.preventDefault();

        const user = JSON.parse(localStorage.getItem('user') || '{}');
        if (!user || !user.id) {
            showNotification('Could not find organization account. Please log in again.', 'error');
            return;
        }

        if (user.isBlocked) {
            showNotification('You cannot post internships while your account is blocked.', 'error');
            return;
        }

        if (user.orgVerificationStatus !== 'verified') {
            showNotification('Please verify your organization before posting internships.', 'error');
            return;
        }

        const payload = {
            userId: user.id,
            title: document.getElementById('internshipTitle').value.trim(),
            description: document.getElementById('internshipDescription').value.trim(),
            internshipLocation: document.getElementById('internshipLocation').value.trim(),
            internshipType: document.getElementById('internshipType').value.trim(),
            internshipMode: document.getElementById('internshipMode').value,
            internshipDuration: document.getElementById('internshipDuration').value.trim(),
            internshipStipend: document.getElementById('internshipStipend').value.trim(),
            internshipOpenings: parseInt(document.getElementById('internshipOpenings').value || '0', 10),
            internshipDeadline: document.getElementById('internshipDeadline').value,
            internshipRequirements: document.getElementById('internshipRequirements').value.trim(),
            skills: skillsWithLevels.map(s => s.name),
            skillsWithLevels: skillsWithLevels
        };

        if (!payload.title || !payload.description) {
            showNotification('Please fill in the required fields: title and description.', 'error');
            return;
        }

        const btn = submitBtn;
        const btnText = btn.querySelector('.btn-text');
        const originalText = btnText ? btnText.textContent : 'Post Internship';
        if (btnText) btnText.textContent = 'Publishing...';
        btn.disabled = true;

        try {
            // Use centralized API
            const result = await window.OrgAPIs.Posts.createInternship(payload);

            if (result.success) {
                showNotification('Internship posted successfully!', 'success');
                form.reset();
                skillsWithLevels.length = 0;
                renderSkillsWithLevels();

                // Switch to home tab and refresh feed to show new internship
                setTimeout(() => {
                    const homeTab = document.querySelector('.nav-tab[data-tab="home"]');
                    if (homeTab) {
                        document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
                        homeTab.classList.add('active');
                    }
                    loadOrgTabContent('home');
                    loadOrgInternships();
                }, 1000);
            } else {
                showNotification(result.message || 'Failed to create internship.', 'error');
            }
        } catch (error) {
            console.error('Internship post error:', error);
            showNotification('Network error while posting internship.', 'error');
        } finally {
            const btnTextEl = btn.querySelector('.btn-text');
            if (btnTextEl) btnTextEl.textContent = originalText;
            btn.disabled = false;
        }
    });
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

// ===== EDIT INTERNSHIP =====
async function editInternship(internshipId) {
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    if (!user || !user.id) {
        showNotification('Please log in to edit internships.', 'error');
        return;
    }

    try {
        // Fetch the internship details
        const response = await fetch(`http://localhost:5000/api/posts/internships/org/${user.id}`);
        const result = await response.json();

        if (!result.success) {
            showNotification('Failed to load internship details.', 'error');
            return;
        }

        const internship = result.internships.find(i => i.id === internshipId);
        if (!internship) {
            showNotification('Internship not found.', 'error');
            return;
        }

        // Create edit modal
        const modal = document.createElement('div');
        modal.id = 'editInternshipModal';
        modal.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 9999;';
        modal.innerHTML = `
            <div style="background: white; border-radius: 16px; max-width: 600px; width: 90%; max-height: 90vh; overflow-y: auto; padding: 24px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                    <h3 style="margin: 0; color: #1a1a2e;"><i class="fas fa-edit" style="color: #2196F3; margin-right: 8px;"></i>Edit Internship</h3>
                    <button onclick="closeEditModal()" style="background: none; border: none; font-size: 20px; cursor: pointer; color: #666;">×</button>
                </div>
                <form id="editInternshipForm">
                    <input type="hidden" id="editInternshipId" value="${internshipId}">
                    <div style="margin-bottom: 16px;">
                        <label style="display: block; font-size: 13px; font-weight: 600; margin-bottom: 6px;">Title *</label>
                        <input type="text" id="editTitle" value="${internship.title || ''}" required style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 8px;">
                    </div>
                    <div style="margin-bottom: 16px;">
                        <label style="display: block; font-size: 13px; font-weight: 600; margin-bottom: 6px;">Description *</label>
                        <textarea id="editDescription" rows="3" required style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 8px; resize: vertical;">${internship.description || ''}</textarea>
                    </div>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 16px;">
                        <div>
                            <label style="display: block; font-size: 13px; font-weight: 600; margin-bottom: 6px;">Location</label>
                            <input type="text" id="editLocation" value="${internship.location || ''}" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 8px;">
                        </div>
                        <div>
                            <label style="display: block; font-size: 13px; font-weight: 600; margin-bottom: 6px;">Duration</label>
                            <input type="text" id="editDuration" value="${internship.duration || ''}" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 8px;">
                        </div>
                    </div>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 16px;">
                        <div>
                            <label style="display: block; font-size: 13px; font-weight: 600; margin-bottom: 6px;">Stipend</label>
                            <input type="text" id="editStipend" value="${internship.stipend || ''}" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 8px;">
                        </div>
                        <div>
                            <label style="display: block; font-size: 13px; font-weight: 600; margin-bottom: 6px;">Openings</label>
                            <input type="number" id="editOpenings" value="${internship.openings || 1}" min="1" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 8px;">
                        </div>
                    </div>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 16px;">
                        <div>
                            <label style="display: block; font-size: 13px; font-weight: 600; margin-bottom: 6px;">Mode</label>
                            <select id="editMode" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 8px;">
                                <option value="remote" ${internship.mode === 'remote' ? 'selected' : ''}>Remote</option>
                                <option value="onsite" ${internship.mode === 'onsite' ? 'selected' : ''}>On-site</option>
                                <option value="hybrid" ${internship.mode === 'hybrid' ? 'selected' : ''}>Hybrid</option>
                            </select>
                        </div>
                        <div>
                            <label style="display: block; font-size: 13px; font-weight: 600; margin-bottom: 6px;">Deadline</label>
                            <input type="date" id="editDeadline" value="${internship.deadline ? internship.deadline.split('T')[0] : ''}" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 8px;">
                        </div>
                    </div>
                    <div style="margin-bottom: 16px;">
                        <label style="display: block; font-size: 13px; font-weight: 600; margin-bottom: 6px;">Skills (comma-separated)</label>
                        <input type="text" id="editSkills" value="${(internship.skills || []).join(', ')}" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 8px;">
                    </div>
                    <div style="display: flex; gap: 12px; justify-content: flex-end;">
                        <button type="button" onclick="closeEditModal()" style="padding: 10px 20px; background: #f1f3f4; color: #333; border: none; border-radius: 8px; cursor: pointer;">Cancel</button>
                        <button type="submit" style="padding: 10px 20px; background: #2196F3; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 600;">
                            <i class="fas fa-save" style="margin-right: 6px;"></i>Save Changes
                        </button>
                    </div>
                </form>
            </div>
        `;
        document.body.appendChild(modal);
        document.body.style.overflow = 'hidden';

        // Handle form submission
        document.getElementById('editInternshipForm').addEventListener('submit', async function (e) {
            e.preventDefault();
            await saveInternshipChanges(internshipId);
        });

        modal.addEventListener('click', function (e) {
            if (e.target === modal) closeEditModal();
        });

    } catch (error) {
        console.error('Edit internship error:', error);
        showNotification('Error loading internship details.', 'error');
    }
}

function closeEditModal() {
    const modal = document.getElementById('editInternshipModal');
    if (modal) {
        modal.remove();
        document.body.style.overflow = 'auto';
    }
}

async function saveInternshipChanges(internshipId) {
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    const payload = {
        userId: user.id,
        title: document.getElementById('editTitle').value.trim(),
        description: document.getElementById('editDescription').value.trim(),
        internshipLocation: document.getElementById('editLocation').value.trim(),
        internshipDuration: document.getElementById('editDuration').value.trim(),
        internshipStipend: document.getElementById('editStipend').value.trim(),
        internshipOpenings: parseInt(document.getElementById('editOpenings').value) || 1,
        internshipMode: document.getElementById('editMode').value,
        internshipDeadline: document.getElementById('editDeadline').value || null,
        skills: document.getElementById('editSkills').value.split(',').map(s => s.trim()).filter(Boolean)
    };

    try {
        const response = await fetch(`http://localhost:5000/api/posts/internship/${internshipId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const result = await response.json();

        if (result.success) {
            showNotification('Internship updated successfully!', 'success');
            closeEditModal();
            loadMyInternships();
        } else {
            showNotification(result.message || 'Failed to update internship.', 'error');
        }
    } catch (error) {
        console.error('Save internship error:', error);
        showNotification('Error saving changes.', 'error');
    }
}

// ===== DELETE INTERNSHIP =====
async function deleteInternship(internshipId, title) {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (!user || !user.id) {
        showNotification('Please log in to delete internships.', 'error');
        return;
    }

    if (!confirm(`Are you sure you want to delete "${title || 'this internship'}"?\n\nThis action cannot be undone.`)) {
        return;
    }

    try {
        // Use centralized API
        const result = await window.OrgAPIs.Profile.deleteInternship(internshipId, user.id);

        if (result.success) {
            showNotification('Internship deleted successfully!', 'success');

            // Remove the card from UI immediately
            const card = document.querySelector(`[data-internship-id="${internshipId}"]`) || document.querySelector(`.internship-card[data-id="${internshipId}"]`);
            if (card) {
                card.style.opacity = '0.5';
                card.style.pointerEvents = 'none';
                setTimeout(() => card.remove(), 500);
            }

            // Reload the list
            setTimeout(() => loadMyInternships(), 600);
        } else {
            showNotification(result.message || 'Failed to delete internship.', 'error');
        }
    } catch (error) {
        console.error('Delete internship error:', error);
        showNotification('Error deleting internship.', 'error');
    }
}

// Make functions globally available
window.editInternship = editInternship;
window.deleteInternship = deleteInternship;
window.closeEditModal = closeEditModal;
window.loadMyInternships = loadMyInternships;

// ===== TOP APPLICANTS FEATURE =====
async function showTopApplicants(internshipId, internshipTitle) {
    // Show loading modal
    const modal = document.createElement('div');
    modal.id = 'topApplicantsModal';
    modal.innerHTML = `
        <div style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.6); display: flex; justify-content: center; align-items: center; z-index: 10000; padding: 20px;" onclick="if(event.target===this) closeTopApplicantsModal()">
            <div style="background: white; border-radius: 16px; width: 100%; max-width: 700px; max-height: 90vh; overflow-y: auto;">
                <div style="background: linear-gradient(135deg, #9C27B0, #7B1FA2); padding: 24px; color: white; position: relative;">
                    <button onclick="closeTopApplicantsModal()" style="position: absolute; top: 16px; right: 16px; background: rgba(255,255,255,0.2); border: none; color: white; width: 32px; height: 32px; border-radius: 50%; cursor: pointer; font-size: 16px;">×</button>
                    <h2 style="margin: 0 0 8px; font-size: 20px;"><i class="fas fa-user-check"></i> Top Matching Candidates</h2>
                    <p style="margin: 0; opacity: 0.9; font-size: 14px;">${internshipTitle}</p>
                </div>
                <div id="topApplicantsContent" style="padding: 24px;">
                    <div style="text-align: center; padding: 40px;">
                        <i class="fas fa-spinner fa-spin" style="font-size: 32px; color: #9C27B0;"></i>
                        <p style="margin-top: 12px;">Finding best-matching candidates...</p>
                    </div>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(modal);

    try {
        const response = await fetch(`http://localhost:5000/api/posts/internship/${internshipId}/top-applicants?limit=20`);
        const result = await response.json();

        const contentContainer = document.getElementById('topApplicantsContent');

        if (result.success && result.topApplicants && result.topApplicants.length > 0) {
            contentContainer.innerHTML = `
                <div style="margin-bottom: 16px; padding: 12px; background: #f5f5f5; border-radius: 8px; font-size: 13px; color: #666;">
                    <i class="fas fa-info-circle" style="color: #9C27B0;"></i> 
                    Showing ${result.topApplicants.length} candidates ranked by skill match percentage
                </div>
                <div id="applicantsList">
                    ${result.topApplicants.map((applicant, index) => {
                const matchColor = applicant.matchPercentage >= 70 ? '#4CAF50' : applicant.matchPercentage >= 50 ? '#FF9800' : '#2196F3';
                const initials = applicant.fullName ? applicant.fullName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'U';

                return `
                            <div style="display: flex; align-items: center; gap: 16px; padding: 16px; border: 1px solid #eee; border-radius: 12px; margin-bottom: 12px; ${index < 3 ? 'background: linear-gradient(135deg, #faf0ff, #fff);' : ''}">
                                <div style="position: relative;">
                                    <div style="width: 50px; height: 50px; border-radius: 50%; background: linear-gradient(135deg, #667eea, #764ba2); display: flex; align-items: center; justify-content: center; color: white; font-weight: bold;">
                                        ${initials}
                                    </div>
                                    ${index < 3 ? `<div style="position: absolute; top: -5px; right: -5px; width: 22px; height: 22px; background: ${index === 0 ? '#FFD700' : index === 1 ? '#C0C0C0' : '#CD7F32'}; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: bold; color: ${index === 0 ? '#333' : '#fff'};">${index + 1}</div>` : ''}
                                </div>
                                <div style="flex: 1;">
                                    <div style="font-weight: 700; color: #1a1a2e; font-size: 15px;">${applicant.fullName || 'Unknown'}</div>
                                    <div style="font-size: 12px; color: #666; margin-top: 2px;">${applicant.email || ''}</div>
                                    ${applicant.matchedSkills && applicant.matchedSkills.length > 0 ? `
                                        <div style="display: flex; flex-wrap: wrap; gap: 4px; margin-top: 8px;">
                                            ${applicant.matchedSkills.slice(0, 5).map(s => `<span style="padding: 3px 8px; background: #e8f5e9; color: #2e7d32; border-radius: 10px; font-size: 10px; font-weight: 600;">${s}</span>`).join('')}
                                            ${applicant.matchedSkills.length > 5 ? `<span style="padding: 3px 8px; background: #f5f5f5; color: #666; border-radius: 10px; font-size: 10px;">+${applicant.matchedSkills.length - 5}</span>` : ''}
                                        </div>
                                    ` : ''}
                                </div>
                                <div style="text-align: center;">
                                    <div style="background: ${matchColor}; color: white; padding: 8px 14px; border-radius: 20px; font-weight: 800; font-size: 14px;">
                                        ${applicant.matchPercentage}%
                                    </div>
                                    <div style="font-size: 10px; color: #666; margin-top: 4px; text-transform: capitalize;">${applicant.matchLevel || 'match'}</div>
                                </div>
                                <div style="display: flex; flex-direction: column; gap: 6px;">
                                    <button onclick="viewApplicantProfile('${applicant.id}')" style="padding: 8px 14px; background: #2196F3; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 11px; font-weight: 600;">
                                        <i class="fas fa-user"></i> View
                                    </button>
                                    <button onclick="contactApplicant('${applicant.email}', '${applicant.fullName}')" style="padding: 8px 14px; background: #4CAF50; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 11px; font-weight: 600;">
                                        <i class="fas fa-envelope"></i> Contact
                                    </button>
                                </div>
                            </div>
                        `;
            }).join('')}
                </div>
            `;
        } else {
            contentContainer.innerHTML = `
                <div style="text-align: center; padding: 40px;">
                    <i class="fas fa-users" style="font-size: 48px; color: #ddd; margin-bottom: 16px;"></i>
                    <h4 style="margin: 0 0 8px; color: #1a1a2e;">No Matching Candidates Yet</h4>
                    <p style="color: #666; font-size: 14px;">We'll notify you when students with matching skills join the platform.</p>
                </div>
            `;
        }
    } catch (error) {
        console.error('Error fetching top applicants:', error);
        document.getElementById('topApplicantsContent').innerHTML = `
            <div style="text-align: center; padding: 40px; color: #e53e3e;">
                <i class="fas fa-exclamation-triangle" style="font-size: 32px; margin-bottom: 12px;"></i>
                <p>Failed to load candidates. Please try again.</p>
                <button onclick="closeTopApplicantsModal(); showTopApplicants('${internshipId}', '${internshipTitle}')" style="margin-top: 12px; padding: 10px 20px; background: #9C27B0; color: white; border: none; border-radius: 8px; cursor: pointer;">
                    Retry
                </button>
            </div>
        `;
    }
}

function closeTopApplicantsModal() {
    const modal = document.getElementById('topApplicantsModal');
    if (modal) modal.remove();
}

function viewApplicantProfile(applicantId) {
    showNotification('Opening applicant profile...', 'info');
    // In a real app, you would navigate to the applicant's profile page
    closeTopApplicantsModal();
}

function contactApplicant(email, name) {
    showNotification(`Opening email to ${name}...`, 'success');
    window.location.href = `mailto:${email}?subject=Regarding Your Internship Application`;
}

window.showTopApplicants = showTopApplicants;
window.closeTopApplicantsModal = closeTopApplicantsModal;
window.viewApplicantProfile = viewApplicantProfile;
window.contactApplicant = contactApplicant;

// ===== LOAD TOP APPLICANTS FOR SIDEBAR =====
async function loadTopApplicants() {
    const container = document.querySelector('.recommended-list');
    if (!container) return;

    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (!user || !user.id) return;

    try {
        const result = await window.OrgAPIs.Posts.getAllTopApplicants(user.id);

        if (result.success && result.applicants && result.applicants.length > 0) {
            container.innerHTML = result.applicants.slice(0, 3).map(applicant => {
                const initials = (applicant.fullName || 'NA').split(' ')
                    .map(n => n[0])
                    .join('')
                    .toUpperCase()
                    .substring(0, 2);

                const matchPercent = applicant.matchPercentage || applicant.match || 0;
                const matchColor = matchPercent >= 90 ? '#4CAF50' : matchPercent >= 80 ? '#2196F3' : '#FF9800';

                return `
                    <div class="recommended-item">
                        <div class="company-avatar" style="background: linear-gradient(135deg, ${matchColor}, ${matchColor}dd);">${initials}</div>
                        <div class="recommended-info">
                            <h4>${applicant.fullName || 'Anonymous'}</h4>
                            <p>${applicant.college || applicant.university || 'Student'} • ${matchPercent}% Match</p>
                        </div>
                        <div class="match-badge" style="background: rgba(76, 175, 80, 0.1); color: ${matchColor};">${matchPercent}%</div>
                    </div>
                `;
            }).join('');
        } else {
            container.innerHTML = `
                <div style="text-align: center; padding: 20px; color: #999;">
                    <i class="fas fa-user-slash" style="font-size: 32px; margin-bottom: 10px; opacity: 0.3;"></i>
                    <p style="font-size: 14px;">No applicants yet</p>
                </div>
            `;
        }
    } catch (error) {
        console.error('Error loading top applicants:', error);
    }
}

// ===== LOAD REAL FEED POSTS =====
async function loadOrgFeedPosts() {
    const feedContainer = document.querySelector('.feed-posts');
    if (!feedContainer) {
        console.warn(' Feed container not found');
        return;
    }

    try {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        if (!user || !user.id) {
            console.error(' No user logged in');
            return;
        }

        console.log(' Loading org feed from backend...');
        const result = await window.OrgAPIs.Posts.getFeed(20);

        console.log(' Feed API response:', result);

        if (result.success && result.posts && result.posts.length > 0) {
            // Clear hardcoded posts
            feedContainer.innerHTML = '';

            // Render real posts
            result.posts.forEach(post => {
                const postEl = createFeedPostElement(post, user);
                if (postEl) feedContainer.appendChild(postEl);
            });

            console.log(` Loaded ${result.posts.length} real posts from backend`);
        } else {
            console.log(' No posts found, showing empty state');
            feedContainer.innerHTML = '<div style="text-align:center; padding:40px; color:#999;"><i class="fas fa-rss" style="font-size:48px; margin-bottom:16px; opacity:0.3;"></i><p>No posts yet. Be the first to share!</p></div>';
        }
    } catch (error) {
        console.error(' Error loading feed:', error);
        feedContainer.innerHTML = '<div style="text-align:center; padding:40px; color:#e53e3e;"><i class="fas fa-exclamation-triangle" style="font-size:48px; margin-bottom:16px;"></i><p>Error loading feed. Check if backend is running on http://localhost:5000</p></div>';
    }
}

function initializeOrgDashboardV2() {
    console.log(' Initializing organization dashboard...');

    // Only setup event listeners and UI, don't load data yet

    setupDropdowns(); // THIS WAS MISSING - enables notification/message/profile dropdowns!
    setupNavigation(); // THIS WAS MISSING - enables Home/Post Internship tabs!
    setupPostInternshipSection();
    if (typeof loadTopApplicants === 'function') {
        loadTopApplicants();
    }
    setupOrgLogout();

    // Load data after a delay to avoid blocking
    setTimeout(() => {
        if (typeof loadMyInternships === 'function') {
            loadMyInternships();
        }
        if (typeof loadTopApplicants === 'function') {
            loadTopApplicants();
        }
        if (typeof loadOrgFeedPosts === 'function') {
            loadOrgFeedPosts(); // Replace hardcoded posts with real data!
        }
    }, 500);

    console.log('✅ Organization dashboard initialized');
}


// ===== START ORGANIZATION DASHBOARD =====
document.addEventListener('DOMContentLoaded', function () {
    console.log('🏢 Organization Dashboard Loading...');

    if (checkOrgAuth()) {
        initializeOrgDashboard();
    }
});