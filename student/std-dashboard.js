/*student/std-dashboard.js*/
/* ===== STUDENT DASHBOARD INTERACTIVITY ===== */


// ===== USER-SPECIFIC STORAGE HELPERS =====
// These functions ensure each user has isolated data in localStorage

function getUserStorageKey(baseKey) {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const userId = user.id || 'guest';
    return `${baseKey}_${userId}`;
}

function getUserPortfolioKey() {
    return getUserStorageKey('portfolioDraft');
}

function setUserPortfolioData(data) {
    const key = getUserPortfolioKey();
    localStorage.setItem(key, JSON.stringify(data));
    console.log(`📦 Saved portfolio data with key: ${key}`);
}

function getUserPortfolioData() {
    const key = getUserPortfolioKey();
    const data = localStorage.getItem(key);
    
    // Migration: If user-specific data doesn't exist but old global data does,
    // migrate it for THIS user only (first login after fix)
    if (!data) {
        const oldData = localStorage.getItem('portfolioDraftV2');
        if (oldData) {
            console.log('🔄 Migrating global portfolio data to user-specific key...');
            // Don't auto-migrate - let user create fresh profile
            return null;
        }
    }
    
    return data ? JSON.parse(data) : null;
}

function clearUserSpecificData() {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const userId = user.id;
    
    if (userId) {
        // Clear user-specific keys
        const keysToCheck = ['portfolioDraft', 'savedPosts', 'postComments'];
        keysToCheck.forEach(baseKey => {
            localStorage.removeItem(`${baseKey}_${userId}`);
        });
        console.log(`🧹 Cleared user-specific data for user: ${userId}`);
    }
    
    // Also clear any legacy global keys (one-time cleanup)
    localStorage.removeItem('portfolioDraftV2');
    localStorage.removeItem('portfolioFormData');
}

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
        // Clear legacy global data that may be shared across users
        localStorage.removeItem('portfolioDraftV2');
        localStorage.removeItem('portfolioFormData');
        localStorage.removeItem('orgProfileData');
        
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
    loadHomeFeed();
    loadRecommendedInternships(); // Load recommendations for sidebar
    checkStudentBlockedStatus();

    const params = new URLSearchParams(window.location.search);
    const urlTab = params.get('tab');
    if (urlTab) {
        setActiveTab(urlTab);

        const mode = params.get('mode');
        if (urlTab === 'portfolio' && mode) {
            openPortfolioBuilder(mode);
        }
        
        // Handle profile tab from URL
        if (urlTab === 'profile') {
            loadTabContent('profile');
        }
    }
}

function setActiveTab(tabName) {
    const tabs = document.querySelectorAll('.nav-tab');
    tabs.forEach(t => t.classList.remove('active'));
    const target = Array.from(tabs).find(t => t.getAttribute('data-tab') === tabName);
    if (target) target.classList.add('active');
    loadTabContent(tabName);
}

// ===== CHECK BLOCKED STATUS =====
async function checkStudentBlockedStatus() {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (!user || !user.id) return;

    try {
        const response = await fetch(`http://localhost:5000/api/notifications/status/${user.id}`);
        const result = await response.json();

        if (result.success && result.user && result.user.isBlocked) {
            const updatedUser = { ...user, isBlocked: true, blockReason: result.user.blockReason };
            localStorage.setItem('user', JSON.stringify(updatedUser));
            showStudentBlockedBanner(result.user.blockReason);
        }
    } catch (error) {
        console.error('Error checking blocked status:', error);
    }
}

function showStudentBlockedBanner(reason) {
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
            <button onclick="openStudentAppealModal()" style="
                background: white;
                color: #c53030;
                border: none;
                padding: 10px 20px;
                border-radius: 8px;
                font-weight: 600;
                cursor: pointer;
            ">
                <i class="fas fa-envelope"></i> Send Appeal
            </button>
        </div>
    `;
    document.body.prepend(banner);
    document.body.style.paddingTop = '80px';
}

function openStudentAppealModal() {
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
            ">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                    <h3 style="margin: 0; color: #1a1a2e;">Submit Appeal</h3>
                    <button onclick="document.getElementById('appealModal').remove()" style="background: none; border: none; font-size: 24px; cursor: pointer;">×</button>
                </div>
                <p style="color: #666; margin-bottom: 20px; font-size: 14px;">
                    Explain why you believe this block is a mistake. Admin will review your appeal.
                </p>
                <form id="studentAppealForm">
                    <input type="text" id="appealSubject" placeholder="Subject" required style="width: 100%; padding: 12px; border: 1px solid #ddd; border-radius: 8px; margin-bottom: 12px;">
                    <textarea id="appealMessage" rows="4" placeholder="Your message..." required style="width: 100%; padding: 12px; border: 1px solid #ddd; border-radius: 8px; margin-bottom: 16px;"></textarea>
                    <button type="submit" style="width: 100%; padding: 14px; background: #d32f2f; color: white; border: none; border-radius: 8px; font-weight: 600; cursor: pointer;">
                        Submit Appeal
                    </button>
                </form>
            </div>
        </div>
    `;
    document.body.appendChild(modal);

    document.getElementById('studentAppealForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        
        try {
            const response = await fetch('http://localhost:5000/api/appeals', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: user.id,
                    type: 'block_appeal',
                    subject: document.getElementById('appealSubject').value,
                    message: document.getElementById('appealMessage').value
                })
            });
            const result = await response.json();
            if (result.success) {
                showNotification('Appeal submitted successfully!', 'success');
                document.getElementById('appealModal').remove();
            } else {
                showNotification(result.message || 'Failed to submit appeal', 'error');
            }
        } catch (error) {
            showNotification('Network error. Please try again.', 'error');
        }
    });
}

window.openStudentAppealModal = openStudentAppealModal;

// ===== LOAD HOME FEED =====
async function loadHomeFeed() {
    const feedPosts = document.querySelector('.feed-posts');
    if (!feedPosts) return;

    feedPosts.innerHTML = `
        <div class="card feed-post" style="text-align: center; padding: 40px;">
            <i class="fas fa-spinner fa-spin" style="font-size: 32px; color: #d32f2f;"></i>
            <p style="margin-top: 12px;">Loading feed...</p>
        </div>
    `;

    try {
        const response = await fetch('http://localhost:5000/api/posts/feed?limit=20');
        const result = await response.json();

        if (result.success && result.posts && result.posts.length > 0) {
            feedPosts.innerHTML = '';
            result.posts.forEach(post => {
                const postElement = createFeedPostElement(post);
                feedPosts.appendChild(postElement);
            });
        } else {
            feedPosts.innerHTML = `
                <div class="card feed-post" style="text-align: center; padding: 40px;">
                    <i class="fas fa-rss" style="font-size: 48px; color: #ccc;"></i>
                    <h3 style="margin: 16px 0 8px;">No Posts Yet</h3>
                    <p style="color: #666;">Be the first to share something!</p>
                </div>
            `;
        }
    } catch (error) {
        console.error('Error loading feed:', error);
        feedPosts.innerHTML = `
            <div class="card feed-post" style="text-align: center; padding: 40px;">
                <i class="fas fa-exclamation-triangle" style="font-size: 48px; color: #e53e3e;"></i>
                <h3 style="margin: 16px 0 8px;">Failed to Load Feed</h3>
                <button onclick="loadHomeFeed()" style="padding: 10px 20px; background: #d32f2f; color: white; border: none; border-radius: 8px; cursor: pointer;">Retry</button>
        `;
    }
}

function createFeedPostElement(post) {
    const div = document.createElement('div');
    div.className = 'card feed-post';
    div.setAttribute('data-post-id', post.id);
    
    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
    const isOwner = currentUser.id && post.author?.id && currentUser.id === post.author.id;
    
    const initials = post.author?.fullName ? post.author.fullName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'U';
    const isOrg = post.author?.userType === 'organization';
    const timeAgo = getTimeAgo(new Date(post.createdAt));
    const profilePic = post.author?.profilePicture || '';
    const coverPhoto = post.author?.coverPhoto || '';

    // Avatar HTML - show image if available, otherwise initials
    const avatarHTML = profilePic 
        ? `<img src="${profilePic}" alt="${post.author?.fullName || 'User'}" style="width: 100%; height: 100%; object-fit: cover; border-radius: ${isOrg ? '12px' : '50%'};">`
        : initials;

    // Cover banner for org posts (optional branding)
    const coverBannerHTML = isOrg && coverPhoto ? `
        <div class="post-cover-banner" style="height: 120px; background: linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.5)), url('${coverPhoto}') center/cover no-repeat; border-radius: 12px 12px 0 0; margin: -16px -16px 16px -16px;"></div>
    ` : '';

    div.innerHTML = `
        ${coverBannerHTML}
        <div class="post-header" style="display: flex; justify-content: space-between; align-items: flex-start;">
            <div style="display: flex; gap: 12px; align-items: center; cursor: pointer;" onclick="viewProfileFromFeed('${post.author?.username || ''}')">
                <div class="${isOrg ? 'company-logo' : 'student-avatar'}" style="width: 48px; height: 48px; border-radius: ${isOrg ? '12px' : '50%'}; background: linear-gradient(135deg, ${isOrg ? '#667eea, #764ba2' : '#2196F3, #21CBF3'}); display: flex; align-items: center; justify-content: center; color: white; font-weight: 700; font-size: 16px; overflow: hidden;">
                    ${avatarHTML}
                </div>
                <div class="post-info">
                    <h4 style="margin: 0; font-weight: 700; color: #1a1a2e;">${post.author?.fullName || 'Unknown User'}</h4>
                    <p style="margin: 2px 0; font-size: 13px; color: #666;">${isOrg ? 'Organization' : 'Student'}${post.type === 'internship' ? ' • Hiring' : ''}</p>
                    <small style="color: #999; font-size: 12px;">${timeAgo}</small>
                </div>
            </div>
            <div class="post-menu-container" style="position: relative;">
                <button class="post-menu-btn" onclick="togglePostMenu('${post.id}')" style="background: none; border: none; cursor: pointer; padding: 8px; border-radius: 50%; color: #666;">
                    <i class="fas fa-ellipsis-h"></i>
                </button>
                <div id="postMenu-${post.id}" class="post-menu-dropdown" style="display: none; position: absolute; right: 0; top: 100%; background: white; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.15); min-width: 180px; z-index: 100; overflow: hidden;">
                    <button onclick="savePostToBackend('${post.id}')" style="display: flex; align-items: center; gap: 10px; width: 100%; padding: 12px 16px; border: none; background: none; cursor: pointer; text-align: left; font-size: 14px; color: #333;">
                        <i class="far fa-bookmark"></i> Save post
                    </button>
                    ${isOwner ? `
                    <button onclick="editPost('${post.id}')" style="display: flex; align-items: center; gap: 10px; width: 100%; padding: 12px 16px; border: none; background: none; cursor: pointer; text-align: left; font-size: 14px; color: #2196F3;">
                        <i class="fas fa-edit"></i> Edit post
                    </button>
                    <button onclick="deletePost('${post.id}')" style="display: flex; align-items: center; gap: 10px; width: 100%; padding: 12px 16px; border: none; background: none; cursor: pointer; text-align: left; font-size: 14px; color: #e53e3e;">
                        <i class="fas fa-trash"></i> Delete post
                    </button>
                    ` : `
                    <button onclick="reportPost('${post.id}')" style="display: flex; align-items: center; gap: 10px; width: 100%; padding: 12px 16px; border: none; background: none; cursor: pointer; text-align: left; font-size: 14px; color: #333;">
                        <i class="far fa-flag"></i> Report post
                    </button>
                    `}
                    <button onclick="copyPostLink('${post.id}')" style="display: flex; align-items: center; gap: 10px; width: 100%; padding: 12px 16px; border: none; background: none; cursor: pointer; text-align: left; font-size: 14px; color: #333;">
                        <i class="fas fa-link"></i> Copy link
                    </button>
                </div>
            </div>
        </div>
        <div class="post-content" style="margin-top: 12px;">
            ${post.type === 'internship' ? '<div class="post-badge" style="display: inline-block; background: linear-gradient(135deg, #d32f2f, #b71c1c); color: white; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; margin-bottom: 8px;">🚀 Hiring</div>' : ''}
            ${post.title ? `<h3 style="margin: 8px 0; font-size: 18px; font-weight: 700; color: #1a1a2e;">${post.title}</h3>` : ''}
            <p style="color: #444; line-height: 1.6; margin: 8px 0;">${post.content}</p>
            ${post.media ? `
                <div class="post-media" style="margin-top: 12px; border-radius: 12px; overflow: hidden;">
                    <img src="${post.media}" alt="Post image" style="width: 100%; max-height: 400px; object-fit: cover; cursor: pointer;" onclick="openImageFullscreen('${post.media}')">
                </div>
            ` : (post.images && post.images.length > 0 ? `
                <div class="post-images" style="margin-top: 12px; border-radius: 12px; overflow: hidden;">
                    <img src="${post.images[0].url || post.images[0]}" alt="Post image" style="width: 100%; max-height: 400px; object-fit: cover;">
                </div>
            ` : '')}
            ${post.skills && post.skills.length > 0 ? `
                <div class="post-tags" style="display: flex; flex-wrap: wrap; gap: 8px; margin-top: 12px;">
                    ${post.skills.map(s => `<span class="tag" style="background: #f0f0f0; color: #666; padding: 4px 12px; border-radius: 20px; font-size: 12px;">${s}</span>`).join('')}
                </div>
            ` : ''}
        </div>
        <div class="post-actions" style="display: flex; gap: 8px; margin-top: 16px; padding-top: 12px; border-top: 1px solid #eee;">
            <button class="action-btn like-btn" onclick="likePost('${post.id}', this)" style="flex: 1; display: flex; align-items: center; justify-content: center; gap: 6px; padding: 10px; border: none; background: #f5f5f5; border-radius: 8px; cursor: pointer; color: #666; font-weight: 500;">
                <i class="far fa-heart"></i> <span>${post.likes || 0}</span>
            </button>
            <button class="action-btn comment-btn" onclick="openCommentSection('${post.id}')" style="flex: 1; display: flex; align-items: center; justify-content: center; gap: 6px; padding: 10px; border: none; background: #f5f5f5; border-radius: 8px; cursor: pointer; color: #666; font-weight: 500;">
                <i class="far fa-comment"></i> <span>${post.comments || 0}</span>
            </button>
            <button class="action-btn share-btn" onclick="sharePost('${post.id}')" style="flex: 1; display: flex; align-items: center; justify-content: center; gap: 6px; padding: 10px; border: none; background: #f5f5f5; border-radius: 8px; cursor: pointer; color: #666; font-weight: 500;">
                <i class="fas fa-share"></i> <span>Share</span>
            </button>
            ${post.type === 'internship' ? `<button class="apply-btn" onclick="applyToInternship('${post.id}', '${(post.title || '').replace(/'/g, "\\'")}')" style="flex: 1; background: linear-gradient(135deg, #d32f2f, #b71c1c); color: white; border: none; padding: 10px 16px; border-radius: 8px; font-weight: 600; cursor: pointer;">Apply Now</button>` : ''}
        </div>
        <div id="commentSection-${post.id}" class="comment-section" style="display: none; margin-top: 12px; padding-top: 12px; border-top: 1px solid #eee;"></div>
    `;
    return div;
}

async function likePost(postId, button) {
    try {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        const response = await fetch(`http://localhost:5000/api/posts/${postId}/like`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: user.id })
        });
        const result = await response.json();
        if (result.success) {
            const span = button.querySelector('span');
            const icon = button.querySelector('i');
            span.textContent = result.likes;
            
            if (result.liked) {
                // Post was liked
                icon.className = 'fas fa-heart';
                button.style.color = '#e53e3e';
            } else {
                // Post was unliked
                icon.className = 'far fa-heart';
                button.style.color = '#666';
            }
        }
    } catch (error) {
        console.error('Like error:', error);
    }
}

async function applyToInternship(internshipId, title) {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const token = localStorage.getItem('token');
    
    if (user.isBlocked) {
        showNotification('You cannot apply while your account is blocked.', 'error');
        return;
    }
    
    if (!token) {
        showNotification('Please log in to apply for internships.', 'error');
        return;
    }
    
    // Check if user has a portfolio (optional - for showing portfolio option)
    let portfolioInfo = null;
    try {
        const response = await fetch('http://localhost:5000/api/portfolio/check', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const result = await response.json();
        if (result.hasPortfolio) {
            portfolioInfo = result.portfolio;
        }
    } catch (error) {
        console.error('Error checking portfolio:', error);
    }
    
    // Always show application modal with both options (upload OR portfolio)
    showApplicationModal(internshipId, title, portfolioInfo);
}

// Store pending application data for after portfolio build
let pendingApplicationData = null;

function savePendingApplication(internshipId, title) {
    pendingApplicationData = { internshipId, title };
    localStorage.setItem('pendingApplication', JSON.stringify({ internshipId, title }));
}

function getPendingApplication() {
    if (pendingApplicationData) return pendingApplicationData;
    const stored = localStorage.getItem('pendingApplication');
    return stored ? JSON.parse(stored) : null;
}

function clearPendingApplication() {
    pendingApplicationData = null;
    localStorage.removeItem('pendingApplication');
}

function showApplicationModal(internshipId, title, portfolioInfo) {
    const existingModal = document.getElementById('applicationModal');
    if (existingModal) existingModal.remove();
    
    const hasPortfolio = portfolioInfo && portfolioInfo.id;
    const safeTitle = title.replace(/'/g, "\\'").replace(/"/g, '&quot;');
    
    const modal = document.createElement('div');
    modal.id = 'applicationModal';
    modal.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        background: rgba(0,0,0,0.6); display: flex; align-items: center;
        justify-content: center; z-index: 10000; overflow-y: auto; padding: 20px;
    `;
    modal.innerHTML = `
        <div style="background: white; border-radius: 16px; padding: 32px; max-width: 550px; width: 100%; box-shadow: 0 20px 60px rgba(0,0,0,0.3); max-height: 90vh; overflow-y: auto;">
            <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 20px;">
                <div>
                    <h3 style="margin: 0 0 8px; color: #1a1a2e; font-size: 22px;">Apply to Internship</h3>
                    <p style="color: #666; margin: 0; font-size: 14px;">${title}</p>
                </div>
                <button onclick="document.getElementById('applicationModal').remove()" style="background: none; border: none; font-size: 24px; cursor: pointer; color: #999;">&times;</button>
            </div>
            
            <!-- Resume Selection Section -->
            <div style="margin-bottom: 24px;">
                <label style="display: block; font-weight: 600; color: #1a1a2e; margin-bottom: 12px;">
                    <i class="fas fa-file-alt" style="margin-right: 8px; color: #d32f2f;"></i>Choose Resume Type
                </label>
                
                <!-- Option 1: Upload Resume -->
                <div id="resumeOption1" onclick="selectResumeOption('upload')" style="border: 2px solid #e0e0e0; border-radius: 12px; padding: 16px; margin-bottom: 12px; cursor: pointer; transition: all 0.2s;">
                    <div style="display: flex; align-items: center; gap: 12px;">
                        <input type="radio" name="resumeType" value="upload" id="radioUpload" style="width: 18px; height: 18px; accent-color: #d32f2f;">
                        <div style="flex: 1;">
                            <div style="font-weight: 600; color: #1a1a2e;"><i class="fas fa-upload" style="margin-right: 8px; color: #2196f3;"></i>Upload Your Resume</div>
                            <div style="font-size: 13px; color: #666; margin-top: 4px;">Upload PDF or DOC file (max 5MB)</div>
                        </div>
                    </div>
                    <div id="uploadSection" style="display: none; margin-top: 12px; padding-top: 12px; border-top: 1px solid #eee;">
                        <input type="file" id="resumeFile" accept=".pdf,.doc,.docx" style="display: none;" onchange="handleResumeUpload(this)">
                        <div id="uploadArea" onclick="event.stopPropagation(); document.getElementById('resumeFile').click()" style="border: 2px dashed #ddd; border-radius: 8px; padding: 20px; text-align: center; cursor: pointer; background: #fafafa;">
                            <i class="fas fa-cloud-upload-alt" style="font-size: 32px; color: #999; margin-bottom: 8px;"></i>
                            <div style="color: #666;">Click to upload or drag & drop</div>
                            <div style="font-size: 12px; color: #999; margin-top: 4px;">PDF, DOC, DOCX</div>
                        </div>
                        <div id="uploadedFileInfo" style="display: none; padding: 12px; background: #e8f5e9; border-radius: 8px; margin-top: 8px;">
                            <div style="display: flex; align-items: center; gap: 8px;">
                                <i class="fas fa-file-pdf" style="color: #d32f2f;"></i>
                                <span id="uploadedFileName" style="flex: 1; font-size: 14px;"></span>
                                <button onclick="event.stopPropagation(); clearUploadedFile()" style="background: none; border: none; color: #d32f2f; cursor: pointer;"><i class="fas fa-times"></i></button>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Option 2: Use Portfolio -->
                <div id="resumeOption2" onclick="selectResumeOption('portfolio')" style="border: 2px solid #e0e0e0; border-radius: 12px; padding: 16px; cursor: pointer; transition: all 0.2s;">
                    <div style="display: flex; align-items: center; gap: 12px;">
                        <input type="radio" name="resumeType" value="portfolio" id="radioPortfolio" style="width: 18px; height: 18px; accent-color: #d32f2f;">
                        <div style="flex: 1;">
                            <div style="font-weight: 600; color: #1a1a2e;"><i class="fas fa-id-card" style="margin-right: 8px; color: #4caf50;"></i>Use SkillLaunch Portfolio</div>
                            ${hasPortfolio ? 
                                `<div style="font-size: 13px; color: #4caf50; margin-top: 4px;"><i class="fas fa-check-circle"></i> Portfolio ready: ${portfolioInfo.fullName || 'Your Portfolio'}</div>` :
                                `<div style="font-size: 13px; color: #ff9800; margin-top: 4px;"><i class="fas fa-info-circle"></i> You haven't built a portfolio yet</div>`
                            }
                        </div>
                    </div>
                    ${!hasPortfolio ? `
                    <div id="portfolioSection" style="display: none; margin-top: 12px; padding-top: 12px; border-top: 1px solid #eee;">
                        <div style="background: #fff3e0; border-radius: 8px; padding: 12px; text-align: center;">
                            <p style="margin: 0 0 12px; color: #e65100; font-size: 14px;">Build your professional portfolio to use this option</p>
                            <button onclick="event.stopPropagation(); savePendingApplication('${internshipId}', '${safeTitle}'); window.location.href='portfolio/portfolio-form.html'" 
                                style="padding: 10px 20px; background: linear-gradient(135deg, #ff9800, #f57c00); color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 600;">
                                <i class="fas fa-plus"></i> Build Portfolio Now
                            </button>
                        </div>
                    </div>
                    ` : ''}
                </div>
            </div>
            
            <!-- Motivation Section -->
            <div style="margin-bottom: 24px;">
                <label style="display: block; font-weight: 600; color: #1a1a2e; margin-bottom: 8px;">
                    <i class="fas fa-comment-alt" style="margin-right: 8px; color: #9c27b0;"></i>Why should we select you? <span style="color: #d32f2f;">*</span>
                </label>
                <textarea id="motivationText" placeholder="Tell the organization why you're a great fit for this internship..." 
                    style="width: 100%; min-height: 100px; padding: 12px; border: 2px solid #e0e0e0; border-radius: 8px; font-family: inherit; font-size: 14px; resize: vertical; box-sizing: border-box;"
                    oninput="updateCharCount()"></textarea>
                <div style="display: flex; justify-content: space-between; margin-top: 4px;">
                    <span style="font-size: 12px; color: #999;">Minimum 50 characters</span>
                    <span id="charCount" style="font-size: 12px; color: #999;">0/500</span>
                </div>
            </div>
            
            <!-- Submit Button -->
            <div style="display: flex; gap: 12px; justify-content: flex-end;">
                <button onclick="document.getElementById('applicationModal').remove()" 
                    style="padding: 12px 24px; border: 1px solid #ddd; background: white; border-radius: 8px; cursor: pointer; font-weight: 500;">
                    Cancel
                </button>
                <button id="submitAppBtn" onclick="submitApplication('${internshipId}', '${safeTitle}')" 
                    style="padding: 12px 24px; background: linear-gradient(135deg, #d32f2f, #b71c1c); color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 600;">
                    <i class="fas fa-paper-plane"></i> Submit Application
                </button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    
    modal.dataset.hasPortfolio = hasPortfolio ? 'true' : 'false';
    if (hasPortfolio) modal.dataset.portfolioId = portfolioInfo.id;
    
    modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.remove();
    });
}

// Resume option selection handlers
let selectedResumeType = null;
let uploadedResumeFile = null;

function selectResumeOption(type) {
    selectedResumeType = type;
    
    document.getElementById('resumeOption1').style.borderColor = type === 'upload' ? '#2196f3' : '#e0e0e0';
    document.getElementById('resumeOption1').style.background = type === 'upload' ? '#e3f2fd' : 'white';
    document.getElementById('resumeOption2').style.borderColor = type === 'portfolio' ? '#4caf50' : '#e0e0e0';
    document.getElementById('resumeOption2').style.background = type === 'portfolio' ? '#e8f5e9' : 'white';
    
    document.getElementById('radioUpload').checked = type === 'upload';
    document.getElementById('radioPortfolio').checked = type === 'portfolio';
    
    document.getElementById('uploadSection').style.display = type === 'upload' ? 'block' : 'none';
    const portfolioSection = document.getElementById('portfolioSection');
    if (portfolioSection) {
        portfolioSection.style.display = type === 'portfolio' ? 'block' : 'none';
    }
}

function handleResumeUpload(input) {
    const file = input.files[0];
    if (!file) return;
    
    if (file.size > 5 * 1024 * 1024) {
        showNotification('File size must be less than 5MB', 'error');
        return;
    }
    
    const validTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!validTypes.includes(file.type)) {
        showNotification('Please upload a PDF or DOC file', 'error');
        return;
    }
    
    uploadedResumeFile = file;
    document.getElementById('uploadArea').style.display = 'none';
    document.getElementById('uploadedFileInfo').style.display = 'block';
    document.getElementById('uploadedFileName').textContent = file.name;
}

function clearUploadedFile() {
    uploadedResumeFile = null;
    document.getElementById('resumeFile').value = '';
    document.getElementById('uploadArea').style.display = 'block';
    document.getElementById('uploadedFileInfo').style.display = 'none';
}

function updateCharCount() {
    const textarea = document.getElementById('motivationText');
    const count = textarea.value.length;
    document.getElementById('charCount').textContent = `${count}/500`;
    document.getElementById('charCount').style.color = count < 50 ? '#d32f2f' : '#4caf50';
}

async function submitApplication(internshipId, title) {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const modal = document.getElementById('applicationModal');
    
    if (!token || (!user._id && !user.id)) {
        showNotification('Please log in to apply.', 'error');
        return;
    }
    
    if (!selectedResumeType) {
        showNotification('Please select a resume type (Upload or Portfolio)', 'error');
        return;
    }
    
    if (selectedResumeType === 'upload' && !uploadedResumeFile) {
        showNotification('Please upload your resume file', 'error');
        return;
    }
    
    if (selectedResumeType === 'portfolio' && modal.dataset.hasPortfolio !== 'true') {
        showNotification('Please build your portfolio first or upload a resume instead', 'error');
        return;
    }
    
    const motivationText = document.getElementById('motivationText').value.trim();
    if (motivationText.length < 50) {
        showNotification('Please write at least 50 characters about why you should be selected', 'error');
        return;
    }
    
    const submitBtn = document.getElementById('submitAppBtn');
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Submitting...';
    }
    
    try {
        let resumeReference = null;
        
        if (selectedResumeType === 'upload' && uploadedResumeFile) {
            resumeReference = await fileToBase64(uploadedResumeFile);
        } else if (selectedResumeType === 'portfolio') {
            resumeReference = modal.dataset.portfolioId;
        }
        
        const response = await fetch('http://localhost:5000/api/applications/submit', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                studentId: user._id || user.id,
                internshipId: internshipId,
                resumeType: selectedResumeType,
                resumeReference: resumeReference,
                resumeFileName: uploadedResumeFile ? uploadedResumeFile.name : null,
                message: motivationText
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            modal?.remove();
            clearPendingApplication();
            selectedResumeType = null;
            uploadedResumeFile = null;
            showNotification(`Application submitted for "${title}"! The organization will review your application.`, 'success');
        } else {
            throw new Error(result.message || 'Failed to submit application');
        }
        
    } catch (error) {
        console.error('Error submitting application:', error);
        showNotification(error.message || 'Error submitting application. Please try again.', 'error');
        
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Submit Application';
        }
    }
}

function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
    });
}

function checkPendingApplication() {
    const pending = getPendingApplication();
    if (pending && pending.internshipId) {
        clearPendingApplication();
        setTimeout(() => {
            showNotification('Portfolio saved! You can now complete your application.', 'success');
            applyToInternship(pending.internshipId, pending.title);
        }, 500);
    }
}

// ===== POST MENU FUNCTIONS =====
function togglePostMenu(postId) {
    const menu = document.getElementById(`postMenu-${postId}`);
    document.querySelectorAll('.post-menu-dropdown').forEach(m => {
        if (m.id !== `postMenu-${postId}`) m.style.display = 'none';
    });
    menu.style.display = menu.style.display === 'none' ? 'block' : 'none';
}

function savePost(postId) {
    const savedPosts = JSON.parse(localStorage.getItem('savedPosts') || '[]');
    if (!savedPosts.includes(postId)) {
        savedPosts.push(postId);
        localStorage.setItem('savedPosts', JSON.stringify(savedPosts));
        showNotification('Post saved!', 'success');
    } else {
        showNotification('Post already saved', 'info');
    }
    togglePostMenu(postId);
}

function reportPost(postId) {
    togglePostMenu(postId);
    showNotification('Report submitted. We will review this post.', 'success');
}

function copyPostLink(postId) {
    const link = `${window.location.origin}/post/${postId}`;
    navigator.clipboard.writeText(link).then(() => {
        showNotification('Link copied to clipboard!', 'success');
    }).catch(() => {
        showNotification('Failed to copy link', 'error');
    });
    togglePostMenu(postId);
}

function sharePost(postId) {
    const link = `${window.location.origin}/post/${postId}`;
    if (navigator.share) {
        navigator.share({ title: 'Check out this post on SkillLaunch', url: link }).catch(() => {});
    } else {
        navigator.clipboard.writeText(link).then(() => {
            showNotification('Link copied to clipboard!', 'success');
        }).catch(() => {
            showNotification('Failed to share', 'error');
        });
    }
}

// ===== COMMENT SECTION FUNCTIONS =====
function openCommentSection(postId) {
    const section = document.getElementById(`commentSection-${postId}`);
    if (!section) return;
    
    if (section.style.display === 'none') {
        section.style.display = 'block';
        loadComments(postId);
    } else {
        section.style.display = 'none';
    }
}

function loadComments(postId) {
    const section = document.getElementById(`commentSection-${postId}`);
    if (!section) return;
    
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const draft = JSON.parse(localStorage.getItem('portfolioDraftV2') || '{}');
    const userProfilePic = draft.profilePhoto || user.profilePicture || '';
    const userInitials = (user.fullName || 'U').split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
    
    const avatarHTML = userProfilePic 
        ? `<img src="${userProfilePic}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">`
        : userInitials;
    
    section.innerHTML = `
        <div class="comment-input-container" style="display: flex; gap: 12px; align-items: flex-start;">
            <div class="comment-avatar" style="width: 36px; height: 36px; border-radius: 50%; background: linear-gradient(135deg, #2196F3, #21CBF3); display: flex; align-items: center; justify-content: center; color: white; font-weight: 600; font-size: 14px; flex-shrink: 0; overflow: hidden;">
                ${avatarHTML}
            </div>
            <div style="flex: 1; display: flex; gap: 8px;">
                <input type="text" id="commentInput-${postId}" placeholder="Write a comment..." style="flex: 1; padding: 10px 14px; border: 1px solid #ddd; border-radius: 20px; font-size: 14px; outline: none;">
                <button onclick="submitComment('${postId}')" style="padding: 10px 16px; background: linear-gradient(135deg, #d32f2f, #b71c1c); color: white; border: none; border-radius: 20px; font-weight: 600; cursor: pointer;">Post</button>
            </div>
        </div>
        <div id="commentsList-${postId}" class="comments-list" style="margin-top: 16px;"></div>
    `;
    
    const allComments = JSON.parse(localStorage.getItem('postComments') || '{}');
    const postComments = allComments[postId] || [];
    renderComments(postId, postComments);
}

function renderComments(postId, comments) {
    const list = document.getElementById(`commentsList-${postId}`);
    if (!list) return;
    
    if (comments.length === 0) {
        list.innerHTML = '<p style="color: #999; font-size: 13px; text-align: center; padding: 12px;">No comments yet. Be the first to comment!</p>';
        return;
    }
    
    list.innerHTML = comments.map(c => {
        const avatarHTML = c.profilePicture 
            ? `<img src="${c.profilePicture}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">`
            : (c.userName || 'U').split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
        
        return `
            <div class="comment-item" style="display: flex; gap: 12px; padding: 12px 0; border-bottom: 1px solid #f0f0f0;">
                <div style="width: 32px; height: 32px; border-radius: 50%; background: linear-gradient(135deg, #2196F3, #21CBF3); display: flex; align-items: center; justify-content: center; color: white; font-weight: 600; font-size: 12px; flex-shrink: 0; overflow: hidden;">
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

function submitComment(postId) {
    const input = document.getElementById(`commentInput-${postId}`);
    if (!input) return;
    
    const text = input.value.trim();
    if (!text) {
        showNotification('Please enter a comment', 'error');
        return;
    }
    
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const draft = JSON.parse(localStorage.getItem('portfolioDraftV2') || '{}');
    
    const comment = {
        id: Date.now().toString(),
        userId: user.id,
        userName: user.fullName || 'Anonymous',
        profilePicture: draft.profilePhoto || user.profilePicture || '',
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
    renderComments(postId, allComments[postId]);
    showNotification('Comment posted!', 'success');
}

// Close post menus when clicking outside
document.addEventListener('click', function(e) {
    if (!e.target.closest('.post-menu-container')) {
        document.querySelectorAll('.post-menu-dropdown').forEach(m => m.style.display = 'none');
    }
});

// Open image in fullscreen modal
function openImageFullscreen(imageSrc) {
    const modal = document.createElement('div');
    modal.id = 'imageFullscreenModal';
    modal.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.9); display: flex; align-items: center; justify-content: center; z-index: 10000; cursor: zoom-out;';
    modal.onclick = () => modal.remove();
    modal.innerHTML = `<img src="${imageSrc}" style="max-width: 90%; max-height: 90%; object-fit: contain; border-radius: 8px;">`;
    document.body.appendChild(modal);
}

// Navigate to user profile from feed
function viewProfileFromFeed(username) {
    if (!username) return;
    viewUserProfile(username);
}

// Updated savePost to use backend API
async function savePostToBackend(postId) {
    try {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        const response = await fetch(`http://localhost:5000/api/posts/${postId}/save`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: user.id })
        });
        const result = await response.json();
        if (result.success) {
            showNotification(result.isSaved ? 'Post saved!' : 'Post unsaved!', 'success');
        }
    } catch (error) {
        console.error('Save post error:', error);
        showNotification('Failed to save post', 'error');
    }
    togglePostMenu(postId);
}

window.likePost = likePost;
window.applyToInternship = applyToInternship;
window.loadHomeFeed = loadHomeFeed;
window.togglePostMenu = togglePostMenu;
window.savePost = savePost;
window.savePostToBackend = savePostToBackend;
window.reportPost = reportPost;
window.copyPostLink = copyPostLink;
window.sharePost = sharePost;
window.openCommentSection = openCommentSection;
window.submitComment = submitComment;
window.openImageFullscreen = openImageFullscreen;
window.viewProfileFromFeed = viewProfileFromFeed;

// Edit post function
function editPost(postId) {
    togglePostMenu(postId);
    const postEl = document.querySelector(`[data-post-id="${postId}"]`);
    if (!postEl) return;
    
    const contentEl = postEl.querySelector('.post-content p');
    const currentContent = contentEl ? contentEl.textContent : '';
    
    const modal = document.createElement('div');
    modal.id = 'editPostModal';
    modal.innerHTML = `
        <div style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.6); display: flex; justify-content: center; align-items: center; z-index: 10000;">
            <div style="background: white; border-radius: 16px; width: 90%; max-width: 500px; padding: 24px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
                    <h3 style="margin: 0; color: #1a1a2e;">Edit Post</h3>
                    <button onclick="document.getElementById('editPostModal').remove()" style="background: none; border: none; font-size: 24px; cursor: pointer;">×</button>
                </div>
                <textarea id="editPostContent" rows="4" style="width: 100%; padding: 12px; border: 1px solid #ddd; border-radius: 8px; font-size: 14px; resize: vertical;">${currentContent}</textarea>
                <div style="display: flex; gap: 12px; margin-top: 16px;">
                    <button onclick="document.getElementById('editPostModal').remove()" style="flex: 1; padding: 12px; background: #f5f5f5; border: none; border-radius: 8px; cursor: pointer;">Cancel</button>
                    <button onclick="submitEditPost('${postId}')" style="flex: 1; padding: 12px; background: linear-gradient(135deg, #d32f2f, #b71c1c); color: white; border: none; border-radius: 8px; font-weight: 600; cursor: pointer;">Save Changes</button>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

async function submitEditPost(postId) {
    const content = document.getElementById('editPostContent').value.trim();
    if (!content) {
        showNotification('Post cannot be empty', 'error');
        return;
    }
    
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    try {
        const response = await fetch(`http://localhost:5000/api/posts/${postId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: user.id, content })
        });
        const result = await response.json();
        if (result.success) {
            document.getElementById('editPostModal').remove();
            showNotification('Post updated!', 'success');
            loadHomeFeed();
        } else {
            showNotification(result.message || 'Failed to update post', 'error');
        }
    } catch (error) {
        console.error('Edit post error:', error);
        showNotification('Network error', 'error');
    }
}

// Delete post function
async function deletePost(postId) {
    togglePostMenu(postId);
    
    if (!confirm('Are you sure you want to delete this post? This cannot be undone.')) {
        return;
    }
    
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    try {
        const response = await fetch(`http://localhost:5000/api/posts/${postId}`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: user.id })
        });
        const result = await response.json();
        if (result.success) {
            showNotification('Post deleted!', 'success');
            const postEl = document.querySelector(`[data-post-id="${postId}"]`);
            if (postEl) postEl.remove();
        } else {
            showNotification(result.message || 'Failed to delete post', 'error');
        }
    } catch (error) {
        console.error('Delete post error:', error);
        showNotification('Network error', 'error');
    }
}

window.likePost = likePost;
window.applyToInternship = applyToInternship;
window.loadHomeFeed = loadHomeFeed;
window.togglePostMenu = togglePostMenu;
window.savePost = savePost;
window.savePostToBackend = savePostToBackend;
window.reportPost = reportPost;
window.copyPostLink = copyPostLink;
window.sharePost = sharePost;
window.openCommentSection = openCommentSection;
window.submitComment = submitComment;
window.openImageFullscreen = openImageFullscreen;
window.viewProfileFromFeed = viewProfileFromFeed;
window.editPost = editPost;
window.submitEditPost = submitEditPost;
window.deletePost = deletePost;

// ===== LOAD RECOMMENDED INTERNSHIPS FOR SIDEBAR =====
async function loadRecommendedInternships() {
    const recommendedList = document.querySelector('.recommended-list');
    if (!recommendedList) return;

    // Get student skills from portfolioDraftV2
    let studentSkills = [];
    try {
        const draft = JSON.parse(localStorage.getItem('portfolioDraftV2') || '{}');
        if (draft.skills?.technical && Array.isArray(draft.skills.technical)) {
            studentSkills = draft.skills.technical;
        }
    } catch (e) {
        console.error('Error loading student skills:', e);
    }

    // Show loading state
    recommendedList.innerHTML = `
        <div style="text-align: center; padding: 20px;">
            <i class="fas fa-spinner fa-spin" style="color: #d32f2f;"></i>
            <p style="margin-top: 8px; font-size: 12px; color: #666;">Finding matches...</p>
        </div>
    `;

    try {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        const response = await fetch(`http://localhost:5000/api/posts/recommendations/${user.id || 'guest'}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ skills: studentSkills })
        });

        const result = await response.json();

        if (result.success && result.recommendations && result.recommendations.length > 0) {
            // Take top 5 recommendations
            const topRecs = result.recommendations.slice(0, 5);
            
            recommendedList.innerHTML = topRecs.map(rec => {
                const companyInitial = rec.company ? rec.company.substring(0, 2).toUpperCase() : 'CO';
                const matchColor = rec.matchPercentage >= 70 ? '#4CAF50' : rec.matchPercentage >= 50 ? '#FF9800' : '#2196F3';
                
                return `
                    <div class="recommended-item" onclick="showInternshipDetails('${rec.id}')" style="cursor: pointer;">
                        <div class="company-avatar" style="background: linear-gradient(135deg, #667eea, #764ba2);">${companyInitial}</div>
                        <div class="recommended-info">
                            <h4>${rec.company || 'Company'}</h4>
                            <p>${rec.title}</p>
                        </div>
                        <div class="match-badge" style="background: ${matchColor}; color: white; padding: 4px 8px; border-radius: 12px; font-size: 11px; font-weight: 800;">
                            ${rec.matchPercentage !== null ? rec.matchPercentage + '%' : 'New'}
                        </div>
                    </div>
                `;
            }).join('');

            // Add "See All" link
            recommendedList.innerHTML += `
                <div style="text-align: center; padding: 12px 0 4px; border-top: 1px solid #eee; margin-top: 8px;">
                    <a href="#" onclick="event.preventDefault(); goToExploreRecommendations();" style="color: #d32f2f; font-weight: 700; font-size: 13px; text-decoration: none;">
                        See All Recommendations <i class="fas fa-arrow-right" style="margin-left: 4px;"></i>
                    </a>
                </div>
            `;
        } else {
            // No recommendations or no skills
            if (studentSkills.length === 0) {
                recommendedList.innerHTML = `
                    <div style="text-align: center; padding: 20px;">
                        <i class="fas fa-user-plus" style="font-size: 28px; color: #ccc; margin-bottom: 10px;"></i>
                        <p style="font-size: 13px; color: #666; margin-bottom: 12px;">Add skills to your portfolio to get personalized recommendations</p>
                        <button onclick="openPortfolioBuilder('update')" style="padding: 8px 16px; background: #d32f2f; color: white; border: none; border-radius: 8px; font-size: 12px; font-weight: 700; cursor: pointer;">
                            Update Portfolio
                        </button>
                    </div>
                `;
            } else {
                recommendedList.innerHTML = `
                    <div style="text-align: center; padding: 20px;">
                        <i class="fas fa-search" style="font-size: 28px; color: #ccc; margin-bottom: 10px;"></i>
                        <p style="font-size: 13px; color: #666;">No matching internships found yet. Check back soon!</p>
                    </div>
                `;
            }
        }
    } catch (error) {
        console.error('Error loading recommendations:', error);
        recommendedList.innerHTML = `
            <div style="text-align: center; padding: 20px;">
                <p style="font-size: 13px; color: #666;">Unable to load recommendations</p>
                <button onclick="loadRecommendedInternships()" style="margin-top: 8px; padding: 6px 12px; background: #f5f5f5; border: 1px solid #ddd; border-radius: 6px; font-size: 12px; cursor: pointer;">
                    Retry
                </button>
            </div>
        `;
    }
}

function goToExploreRecommendations() {
    // Switch to explore tab with recommendation sorting
    const tabs = document.querySelectorAll('.nav-tab');
    tabs.forEach(t => t.classList.remove('active'));
    const exploreTab = document.querySelector('.nav-tab[data-tab="explore"]');
    if (exploreTab) exploreTab.classList.add('active');

    loadTabContent('explore');
    
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

window.loadRecommendedInternships = loadRecommendedInternships;
window.goToExploreRecommendations = goToExploreRecommendations;

// ===== LOAD INTERNSHIPS FROM BACKEND =====
async function loadInternships() {
    const feedPosts = document.querySelector('.feed-posts');
    if (!feedPosts) return;

    // Show loading state
    const loadingHTML = `
        <div class="card feed-post" style="text-align: center; padding: 40px;">
            <i class="fas fa-spinner fa-spin" style="font-size: 32px; color: #d32f2f; margin-bottom: 16px;"></i>
            <p>Loading internships...</p>
        </div>
    `;
    feedPosts.innerHTML = loadingHTML;

    try {
        const response = await fetch('http://localhost:5000/api/posts/internships?limit=10');
        const result = await response.json();

        if (result.success && result.internships && result.internships.length > 0) {
            feedPosts.innerHTML = '';
            
            result.internships.forEach(internship => {
                const postElement = createInternshipCard(internship);
                feedPosts.appendChild(postElement);
            });
        } else {
            feedPosts.innerHTML = `
                <div class="card feed-post" style="text-align: center; padding: 40px;">
                    <i class="fas fa-briefcase" style="font-size: 48px; color: #ccc; margin-bottom: 16px;"></i>
                    <h3 style="margin-bottom: 8px;">No Internships Available Yet</h3>
                    <p style="color: #666;">Check back soon for new opportunities from verified organizations.</p>
                </div>
            `;
        }
    } catch (error) {
        console.error('Error loading internships:', error);
        feedPosts.innerHTML = `
            <div class="card feed-post" style="text-align: center; padding: 40px;">
                <i class="fas fa-exclamation-triangle" style="font-size: 48px; color: #e53e3e; margin-bottom: 16px;"></i>
                <h3 style="margin-bottom: 8px;">Failed to Load Internships</h3>
                <p style="color: #666; margin-bottom: 16px;">Please check your connection and try again.</p>
                <button onclick="loadInternships()" style="background: #d32f2f; color: white; border: none; padding: 10px 20px; border-radius: 8px; cursor: pointer;">
                    <i class="fas fa-redo"></i> Retry
                </button>
            </div>
        `;
    }
}

function createInternshipCard(internship) {
    const post = document.createElement('div');
    post.className = 'card feed-post';
    
    const companyInitial = internship.company ? internship.company.charAt(0).toUpperCase() : 'C';
    const timeAgo = getTimeAgo(new Date(internship.createdAt));
    
    post.innerHTML = `
        <div class="post-header">
            <div class="company-logo" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 18px; width: 50px; height: 50px; border-radius: 12px;">
                ${companyInitial}
            </div>
            <div class="post-info">
                <h4>${internship.company || 'Company'}</h4>
                <p>${internship.type || 'Internship'} • ${internship.location || 'Location not specified'}</p>
                <small>Posted ${timeAgo}</small>
            </div>
        </div>
        <div class="post-content">
            <div class="post-badge">🚀 Hiring Interns</div>
            <h3>${internship.title}</h3>
            <p>${internship.description.substring(0, 250)}${internship.description.length > 250 ? '...' : ''}</p>
            ${internship.skills && internship.skills.length > 0 ? `
                <div class="post-tags">
                    ${internship.skills.slice(0, 5).map(skill => `<span class="tag">${skill}</span>`).join('')}
                    ${internship.mode ? `<span class="tag">${internship.mode}</span>` : ''}
                    ${internship.stipend ? `<span class="tag">${internship.stipend}</span>` : ''}
                </div>
            ` : ''}
            ${internship.duration || internship.openings ? `
                <div class="project-preview" style="margin-top: 12px;">
                    <div class="preview-image">
                        <i class="fas fa-info-circle"></i>
                    </div>
                    <div class="preview-info">
                        <h5>Details</h5>
                        <p>
                            ${internship.duration ? `Duration: ${internship.duration}` : ''}
                            ${internship.openings ? ` • ${internship.openings} opening${internship.openings > 1 ? 's' : ''}` : ''}
                            ${internship.deadline ? ` • Apply by ${new Date(internship.deadline).toLocaleDateString()}` : ''}
                        </p>
                    </div>
                </div>
            ` : ''}
        </div>
        <div class="post-actions">
            <button class="action-btn like-btn" data-post-id="${internship.id}">
                <i class="far fa-heart"></i> <span>${internship.likes || 0}</span>
            </button>
            <button class="action-btn comment-btn">
                <i class="far fa-comment"></i> <span>Comment</span>
            </button>
            <button class="action-btn share-btn">
                <i class="fas fa-share"></i> <span>Share</span>
            </button>
            <button class="apply-btn" onclick="applyToInternship('${internship.id}', '${internship.title}')">
                <i class="fas fa-paper-plane"></i> Apply Now
            </button>
        </div>
    `;
    
    return post;
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
    // Use user-specific portfolio data
    const draft = getUserPortfolioData() || {};
    const profilePic = draft.profilePhoto || user.profilePicture || '';
    
    // Update all avatar elements with profile picture or initials
    const avatarElements = ['userAvatar', 'dropdownAvatar', 'postAvatar'];
    avatarElements.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            if (profilePic) {
                element.innerHTML = `<img src="${profilePic}" alt="${user.fullName}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">`;
                element.style.overflow = 'hidden';
            } else {
                element.textContent = initials;
            }
        }
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
        const profilePic = user.profilePicture || '';
        const avatarContent = profilePic 
            ? `<img src="${profilePic}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">`
            : getInitials(user.fullName);
        
        html += `
            <div class="suggestion-item user-result" data-username="${user.username}" data-userid="${user.id || user._id}" style="display: flex; align-items: center; padding: 12px; gap: 12px;">
                <div class="user-avatar-small" style="width: 45px; height: 45px; min-width: 45px; border-radius: 50%; background: linear-gradient(135deg, ${user.userType === 'student' ? '#667eea, #764ba2' : '#d32f2f, #b71c1c'}); display: flex; align-items: center; justify-content: center; color: white; font-weight: 700; font-size: 14px; overflow: hidden;">
                    ${avatarContent}
                </div>
                <div class="user-info" style="flex: 1; min-width: 0;">
                    <div class="user-name" style="font-weight: 600; color: #1a1a2e;">${user.fullName}</div>
                    <div class="user-details" style="display: flex; gap: 8px; font-size: 12px; color: #666;">
                        <span class="username">@${user.username}</span>
                        <span class="user-type">
                            <i class="fas ${userTypeIcon}"></i> ${userTypeLabel}
                        </span>
                    </div>
                </div>
                <button class="view-profile-btn" onclick="event.stopPropagation(); viewUserProfile('${user.username}')" style="padding: 8px 14px; background: linear-gradient(135deg, #d32f2f, #b71c1c); color: white; border: none; border-radius: 8px; font-size: 12px; font-weight: 600; cursor: pointer; white-space: nowrap;">
                    <i class="fas fa-eye"></i> View Profile
                </button>
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
    // Get profile picture or use initials
    const profilePic = user.profilePicture || '';
    const coverPhoto = user.coverPhoto || '';
    const avatarContent = profilePic 
        ? `<img src="${profilePic}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">`
        : getInitials(user.fullName);
    
    // Format join date
    const joinDate = user.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'Recently';
    
    // Get bio/about text
    const bio = user.bio || user.about || user.summary || '';
    
    // Get skills if available
    const skills = user.skills || [];
    const skillsHTML = skills.length > 0 ? `
        <div style="margin-top: 16px;">
            <div style="font-weight: 600; font-size: 13px; color: #1a1a2e; margin-bottom: 8px;">Skills</div>
            <div style="display: flex; flex-wrap: wrap; gap: 6px;">
                ${skills.slice(0, 6).map(skill => `<span style="padding: 4px 10px; background: #f5f5f5; border-radius: 12px; font-size: 12px;">${typeof skill === 'string' ? skill : skill.name}</span>`).join('')}
                ${skills.length > 6 ? `<span style="padding: 4px 10px; background: #e8e8e8; border-radius: 12px; font-size: 12px; color: #666;">+${skills.length - 6} more</span>` : ''}
            </div>
        </div>
    ` : '';
    
    // Create modal HTML with enhanced design
    const modalHTML = `
        <div class="profile-modal" id="viewProfileModal" style="
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.6);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 9999;
            backdrop-filter: blur(4px);
        ">
            <div style="
                background: white;
                border-radius: 16px;
                width: 90%;
                max-width: 480px;
                max-height: 90vh;
                overflow: hidden;
                box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            ">
                <!-- Cover Photo -->
                <div style="height: 120px; background: ${coverPhoto ? `url(${coverPhoto}) center/cover` : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'}; position: relative;">
                    <button onclick="closeProfileModal()" style="
                        position: absolute;
                        top: 12px;
                        right: 12px;
                        background: rgba(0,0,0,0.4);
                        border: none;
                        width: 32px;
                        height: 32px;
                        border-radius: 50%;
                        color: white;
                        font-size: 18px;
                        cursor: pointer;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                    ">×</button>
                </div>
                
                <!-- Profile Content -->
                <div style="padding: 0 24px 24px; margin-top: -50px;">
                    <!-- Avatar -->
                    <div style="
                        width: 100px;
                        height: 100px;
                        border-radius: 50%;
                        background: ${user.userType === 'student' ? 'linear-gradient(135deg, #667eea, #764ba2)' : 'linear-gradient(135deg, #d32f2f, #b71c1c)'};
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        color: white;
                        font-size: 32px;
                        font-weight: bold;
                        border: 4px solid white;
                        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                        overflow: hidden;
                    ">
                        ${avatarContent}
                    </div>
                    
                    <!-- User Info -->
                    <div style="margin-top: 12px;">
                        <h3 style="margin: 0; font-size: 22px; font-weight: 800; color: #1a1a2e;">${user.fullName}</h3>
                        <div style="color: #666; margin: 4px 0;">@${user.username}</div>
                        <div style="
                            display: inline-flex;
                            align-items: center;
                            gap: 6px;
                            background: ${user.userType === 'student' ? '#e3f2fd' : '#ffebee'};
                            color: ${user.userType === 'student' ? '#1976d2' : '#d32f2f'};
                            padding: 5px 12px;
                            border-radius: 16px;
                            font-size: 12px;
                            font-weight: 600;
                            margin-top: 8px;
                        ">
                            <i class="fas ${user.userType === 'student' ? 'fa-user-graduate' : 'fa-building'}"></i>
                            ${user.userType === 'student' ? 'Student' : 'Organization'}
                        </div>
                    </div>
                    
                    <!-- Bio -->
                    ${bio ? `
                        <div style="margin-top: 16px; padding: 14px; background: #f8f9fa; border-radius: 10px;">
                            <p style="margin: 0; color: #444; font-size: 14px; line-height: 1.5;">${bio.substring(0, 200)}${bio.length > 200 ? '...' : ''}</p>
                        </div>
                    ` : ''}
                    
                    ${skillsHTML}
                    
                    <!-- Stats -->
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 16px;">
                        <div style="background: #f8f9fa; padding: 14px; border-radius: 10px; text-align: center;">
                            <div style="font-size: 11px; color: #888; text-transform: uppercase; letter-spacing: 0.5px;">Member Since</div>
                            <div style="font-weight: 700; color: #1a1a2e; margin-top: 4px;">${joinDate}</div>
                        </div>
                        <div style="background: #f8f9fa; padding: 14px; border-radius: 10px; text-align: center;">
                            <div style="font-size: 11px; color: #888; text-transform: uppercase; letter-spacing: 0.5px;">Account</div>
                            <div style="font-weight: 700; color: #1a1a2e; margin-top: 4px;">${user.isVerified ? '✓ Verified' : 'Active'}</div>
                        </div>
                    </div>
                    
                    <!-- Action Buttons -->
                    <div style="display: flex; gap: 10px; margin-top: 20px;">
                        <button onclick="connectWithUser('${user.username}')" style="
                            flex: 1;
                            background: linear-gradient(135deg, #d32f2f, #b71c1c);
                            color: white;
                            border: none;
                            padding: 14px;
                            border-radius: 10px;
                            cursor: pointer;
                            font-weight: 600;
                            font-size: 14px;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            gap: 8px;
                        ">
                            <i class="fas fa-user-plus"></i> Connect
                        </button>
                        <button onclick="sendMessageToUser('${user.username}')" style="
                            flex: 1;
                            background: #f1f3f4;
                            color: #333;
                            border: none;
                            padding: 14px;
                            border-radius: 10px;
                            cursor: pointer;
                            font-weight: 600;
                            font-size: 14px;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            gap: 8px;
                        ">
                            <i class="fas fa-envelope"></i> Message
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Remove any existing modal
    closeProfileModal();
    
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

function sendMessageToUser(username) {
    showNotification(`Messaging feature coming soon! Connect with @${username} first.`, 'info');
}

// Make these functions globally available
window.viewUserProfile = viewUserProfile;
window.closeProfileModal = closeProfileModal;
window.connectWithUser = connectWithUser;
window.sendMessageToUser = sendMessageToUser;

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
    
    const mainContainer = document.querySelector('.main-container');
    const exploreContainer = document.getElementById('exploreContainer');
    const portfolioContainer = document.getElementById('portfolioContainer');
    const profileContainer = document.getElementById('profileContainer');
    
    // Hide all containers first
    if (mainContainer) mainContainer.style.display = 'none';
    if (exploreContainer) exploreContainer.style.display = 'none';
    if (portfolioContainer) portfolioContainer.style.display = 'none';
    if (profileContainer) profileContainer.style.display = 'none';
    
    if (tabName === 'home') {
        if (mainContainer) mainContainer.style.display = 'grid';
    } else if (tabName === 'explore') {
        if (exploreContainer) exploreContainer.style.display = 'block';
        setExploreView(exploreViewMode);
        loadExploreInternships();
    } else if (tabName === 'portfolio') {
        if (portfolioContainer) portfolioContainer.style.display = 'block';
        closePortfolioBuilder();
        renderPortfolioLandingPreview();
    } else if (tabName === 'profile') {
        if (profileContainer) profileContainer.style.display = 'block';
        renderProfileData();
    } else {
        showNotification(`Loading ${tabName}...`, 'info');
    }
}

function openPortfolioBuilder(mode = 'new') {
    const overlay = document.getElementById('portfolioBuilderOverlay');
    const frame = document.getElementById('portfolioBuilderFrame');

    if (overlay) {
        overlay.style.display = 'block';
        document.body.style.overflow = 'hidden';
    }

    if (frame) {
        const query = mode === 'update' ? '?mode=update&embed=1' : '?embed=1';
        frame.src = `portfolio/portfolio-form.html${query}`;
    }
}

function closePortfolioBuilder() {
    const overlay = document.getElementById('portfolioBuilderOverlay');
    const frame = document.getElementById('portfolioBuilderFrame');

    if (overlay) {
        overlay.style.display = 'none';
        document.body.style.overflow = '';
    }
    if (frame) frame.src = '';
    
    renderPortfolioLandingPreview();
}

window.openPortfolioBuilder = openPortfolioBuilder;
window.closePortfolioBuilder = closePortfolioBuilder;

// ===== EXPLORE SECTION FUNCTIONS =====
let exploreCurrentPage = 1;
let exploreTotalPages = 1;

let exploreViewMode = (localStorage.getItem('exploreViewMode') || 'grid');

function setExploreView(mode) {
    exploreViewMode = mode === 'list' ? 'list' : 'grid';
    localStorage.setItem('exploreViewMode', exploreViewMode);

    const gridBtn = document.getElementById('exploreViewGrid');
    const listBtn = document.getElementById('exploreViewList');
    const results = document.getElementById('exploreResults');

    if (gridBtn && listBtn) {
        if (exploreViewMode === 'grid') {
            gridBtn.style.background = '#111827';
            gridBtn.style.color = 'white';
            gridBtn.style.borderColor = '#111827';
            listBtn.style.background = '#f5f5f5';
            listBtn.style.color = '#333';
            listBtn.style.borderColor = '#ddd';
        } else {
            listBtn.style.background = '#111827';
            listBtn.style.color = 'white';
            listBtn.style.borderColor = '#111827';
            gridBtn.style.background = '#f5f5f5';
            gridBtn.style.color = '#333';
            gridBtn.style.borderColor = '#ddd';
        }
    }

    if (results) {
        results.style.display = 'grid';
        results.style.gridTemplateColumns = exploreViewMode === 'list' ? '1fr' : 'repeat(auto-fill, minmax(280px, 1fr))';
    }
}

window.setExploreView = setExploreView;

async function loadExploreInternships(page = 1) {
    const resultsContainer = document.getElementById('exploreResults');
    if (!resultsContainer) return;

    setExploreView(exploreViewMode);

    resultsContainer.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; padding: 40px;">
            <i class="fas fa-spinner fa-spin" style="font-size: 32px; color: #d32f2f;"></i>
            <p style="margin-top: 12px;">Loading internships with recommendations...</p>
        </div>
    `;

    const search = document.getElementById('exploreSearch')?.value || '';
    const location = document.getElementById('exploreLocation')?.value || '';
    const duration = document.getElementById('exploreDuration')?.value || '';
    const skillLevel = document.getElementById('exploreSkillLevel')?.value || '';
    const internshipType = document.getElementById('exploreInternshipType')?.value || '';

    // Get student skills for recommendation matching
    let studentSkills = [];
    try {
        const draft = JSON.parse(localStorage.getItem('portfolioDraftV2') || '{}');
        if (draft.skills?.technical && Array.isArray(draft.skills.technical)) {
            studentSkills = draft.skills.technical;
        }
    } catch (e) {
        console.error('Error loading student skills:', e);
    }

    // Build query params
    let queryParams = `page=${page}&limit=9&sortBy=recommendation`;
    if (search) queryParams += `&search=${encodeURIComponent(search)}`;
    if (location) queryParams += `&location=${encodeURIComponent(location)}`;
    if (duration) queryParams += `&duration=${encodeURIComponent(duration)}`;
    if (internshipType === 'remote') {
        queryParams += `&mode=remote`;
    } else if (internshipType === 'paid' || internshipType === 'unpaid') {
        queryParams += `&type=${encodeURIComponent(internshipType)}`;
    }

    // Show active filters
    updateActiveFilters({ search, location, duration, internshipType, skillLevel });

    try {
        // Use recommendation API endpoint (POST to send skills)
        const response = await fetch(`http://localhost:5000/api/posts/internships/explore?${queryParams}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ skills: studentSkills })
        });
        const result = await response.json();

        if (result.success && result.internships && result.internships.length > 0) {
            let list = result.internships;
            if (skillLevel) {
                const needle = skillLevel.toLowerCase();
                list = list.filter(i => {
                    const hay = `${i.title || ''} ${i.description || ''} ${(i.skills || []).join(' ')}`.toLowerCase();
                    return hay.includes(needle);
                });
            }
            exploreCurrentPage = result.page;
            exploreTotalPages = result.pages;

            window.__exploreLastResults = list;
            
            // Show recommendations section if we have student skills
            let html = '';
            if (studentSkills.length > 0 && result.recommended && result.recommended.length > 0) {
                html += `<div style="grid-column: 1/-1; margin-bottom: 16px;">
                    <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px;">
                        <i class="fas fa-star" style="color: #FF9800;"></i>
                        <span style="font-weight: 800; color: #1a1a2e;">Recommended for You</span>
                        <span style="font-size: 12px; color: #666;">(${result.recommended.length} matches)</span>
                    </div>
                </div>`;
            }
            
            html += list.map(internship => createExploreCard(internship)).join('');
            resultsContainer.innerHTML = html;
            renderExplorePagination();

            const meta = document.getElementById('exploreResultsMeta');
            const hasSkills = studentSkills.length > 0;
            if (meta) meta.textContent = `${list.length} result${list.length !== 1 ? 's' : ''} found${hasSkills ? ' • Sorted by match' : ''}`;
        } else {
            resultsContainer.innerHTML = `
                <div style="grid-column: 1/-1; text-align: center; padding: 60px;">
                    <i class="fas fa-briefcase" style="font-size: 48px; color: #ccc;"></i>
                    <h3 style="margin: 16px 0 8px;">No Internships Found</h3>
                    <p style="color: #666;">Try adjusting your filters or check back later.</p>
                </div>
            `;
            document.getElementById('explorePagination').innerHTML = '';

            const meta = document.getElementById('exploreResultsMeta');
            if (meta) meta.textContent = '0 results found';
        }
    } catch (error) {
        console.error('Error loading internships:', error);
        resultsContainer.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 60px;">
                <i class="fas fa-exclamation-triangle" style="font-size: 48px; color: #e53e3e;"></i>
                <h3 style="margin: 16px 0 8px;">Failed to Load</h3>
                <p style="color: #666; margin-bottom: 16px;">Please check your connection.</p>
                <button onclick="loadExploreInternships()" style="padding: 10px 20px; background: #d32f2f; color: white; border: none; border-radius: 8px; cursor: pointer;">
                    <i class="fas fa-redo"></i> Retry
                </button>
            </div>
        `;

        const meta = document.getElementById('exploreResultsMeta');
        if (meta) meta.textContent = 'Failed to load results';
    }
}

function createExploreCard(internship) {
    const companyInitial = internship.company ? internship.company.charAt(0).toUpperCase() : 'C';
    const timeAgo = getTimeAgo(new Date(internship.createdAt));
    const deadlineText = internship.deadline ? new Date(internship.deadline).toLocaleDateString() : 'Open';
    
    // Match percentage badge
    const hasMatch = internship.matchPercentage !== null && internship.matchPercentage !== undefined;
    const matchPercent = hasMatch ? internship.matchPercentage : 0;
    const matchColor = matchPercent >= 70 ? '#4CAF50' : matchPercent >= 50 ? '#FF9800' : matchPercent >= 30 ? '#2196F3' : '#9E9E9E';
    const matchBadgeHTML = hasMatch ? `
        <div style="position: absolute; top: 12px; right: 12px; background: ${matchColor}; color: white; padding: 4px 10px; border-radius: 12px; font-size: 11px; font-weight: 800; box-shadow: 0 2px 8px rgba(0,0,0,0.2);">
            ${matchPercent}% Match
        </div>
    ` : '';

    if (exploreViewMode === 'list') {
        return `
            <div class="card explore-card" style="padding: 16px; border-radius: 16px; cursor: pointer; transition: transform 0.2s, box-shadow 0.2s; position: relative;" 
                 onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 12px 24px rgba(0,0,0,0.10)';"
                 onmouseout="this.style.transform=''; this.style.boxShadow='';"
                 onclick="showInternshipDetails('${internship.id}')">
                ${matchBadgeHTML}
                <div style="display: flex; gap: 14px; align-items: center;">
                    <div style="width: 56px; height: 56px; border-radius: 14px; background: linear-gradient(135deg, #667eea, #764ba2); display: flex; align-items: center; justify-content: center; color: white; font-weight: 900; font-size: 18px; flex-shrink: 0;">
                        ${companyInitial}
                    </div>
                    <div style="flex: 1; min-width: 0;">
                        <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 12px;">
                            <div style="min-width: 0;">
                                <div style="font-weight: 900; color: #1a1a2e; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${internship.title}</div>
                                <div style="margin-top: 3px; font-size: 13px; color: #666;">${internship.company || 'Company'} • ${internship.location || 'Remote'} • ${internship.mode || 'Flexible'}</div>
                            </div>
                            <div style="text-align: right;">
                                <div style="font-size: 12px; color: #666;">${timeAgo}</div>
                                <div style="margin-top: 3px; font-weight: 800; color: #1a1a2e;">${internship.stipend || 'Unpaid'}</div>
                            </div>
                        </div>

                        ${internship.skills && internship.skills.length > 0 ? `
                            <div style="display: flex; flex-wrap: wrap; gap: 8px; margin-top: 10px;">
                                ${internship.skills.slice(0, 6).map(s => `<span style="padding: 6px 12px; background: #f1f3f4; border: 1px solid #e5e7eb; border-radius: 999px; font-size: 12px; font-weight: 700; color: #333;">${s}</span>`).join('')}
                            </div>
                        ` : ''}

                        <div style="display: flex; justify-content: space-between; align-items: center; gap: 12px; margin-top: 12px; padding-top: 12px; border-top: 1px solid #eee;">
                            <div style="font-size: 12px; color: #666;">${internship.duration ? `Duration: ${internship.duration}` : ''}${internship.deadline ? ` • Deadline: ${deadlineText}` : ''}</div>
                            <button onclick="event.stopPropagation(); applyToInternship('${internship.id}', '${internship.title.replace(/'/g, "\\'")}')" style="padding: 10px 18px; background: linear-gradient(135deg, #d32f2f, #b71c1c); color: white; border: none; border-radius: 999px; font-size: 13px; font-weight: 800; cursor: pointer;">
                                Apply
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    return `
        <div class="card explore-card" style="padding: 0; border-radius: 16px; overflow: hidden; cursor: pointer; transition: transform 0.2s, box-shadow 0.2s; position: relative;" 
             onmouseover="this.style.transform='translateY(-4px)'; this.style.boxShadow='0 12px 24px rgba(0,0,0,0.12)';"
             onmouseout="this.style.transform=''; this.style.boxShadow='';"
             onclick="showInternshipDetails('${internship.id}')">
            ${matchBadgeHTML}
            <!-- Header with gradient -->
            <div style="background: linear-gradient(135deg, #667eea, #764ba2); padding: 20px; color: white; position: relative;">
                <div style="display: flex; gap: 14px; align-items: center;">
                    <div style="width: 50px; height: 50px; border-radius: 12px; background: rgba(255,255,255,0.2); display: flex; align-items: center; justify-content: center; font-size: 20px; font-weight: bold;">
                        ${companyInitial}
                    </div>
                    <div style="flex: 1;">
                        <h4 style="font-size: 16px; margin: 0 0 4px; font-weight: 600;">${internship.title}</h4>
                        <p style="font-size: 13px; opacity: 0.9;">${internship.company || 'Company'}</p>
                    </div>
                </div>
            </div>
            
            <!-- Content -->
            <div style="padding: 18px;">
                <!-- Quick Info -->
                <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; margin-bottom: 14px;">
                    <div style="background: #f8f9fa; padding: 14px; border-radius: 10px;">
                        <div style="font-size: 12px; color: #666; margin-bottom: 4px;"><i class="fas fa-map-marker-alt" style="color: #d32f2f;"></i> Location</div>
                        <div style="font-weight: 600;">${internship.location || 'Remote'}</div>
                    </div>
                    <div style="background: #f8f9fa; padding: 14px; border-radius: 10px;">
                        <div style="font-size: 12px; color: #666; margin-bottom: 4px;"><i class="fas fa-laptop-house" style="color: #2196F3;"></i> Work Mode</div>
                        <div style="font-weight: 600;">${internship.mode || 'Flexible'}</div>
                    </div>
                    <div style="background: #f8f9fa; padding: 14px; border-radius: 10px;">
                        <div style="font-size: 12px; color: #666; margin-bottom: 4px;"><i class="fas fa-clock" style="color: #4CAF50;"></i> Duration</div>
                        <div style="font-weight: 600;">${internship.duration || 'Flexible'}</div>
                    </div>
                    <div style="background: #f8f9fa; padding: 14px; border-radius: 10px;">
                        <div style="font-size: 12px; color: #666; margin-bottom: 4px;"><i class="fas fa-users" style="color: #FF9800;"></i> Openings</div>
                        <div style="font-weight: 600;">${internship.openings || 1} opening(s)</div>
                    </div>
                </div>
                
                <!-- Description -->
                <p style="font-size: 13px; color: #444; margin-bottom: 14px; line-height: 1.5; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden;">
                    ${internship.description}
                </p>
                
                <!-- Skills -->
                ${internship.skills && internship.skills.length > 0 ? `
                    <div style="display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 14px;">
                        ${internship.skills.slice(0, 4).map(s => `<span style="padding: 5px 12px; background: linear-gradient(135deg, #f0f0f0, #e8e8e8); border-radius: 20px; font-size: 11px; font-weight: 500;">${s}</span>`).join('')}
                        ${internship.skills.length > 4 ? `<span style="padding: 5px 12px; background: #f0f0f0; border-radius: 20px; font-size: 11px; color: #888;">+${internship.skills.length - 4}</span>` : ''}
                    </div>
                ` : ''}
                
                <!-- Footer -->
                <div style="display: flex; justify-content: space-between; align-items: center; padding-top: 14px; border-top: 1px solid #eee;">
                    <div>
                        <div style="font-size: 14px; font-weight: 600; color: #1a1a2e;">${internship.stipend || 'Unpaid'}</div>
                        <div style="font-size: 11px; color: #999;">Deadline: ${deadlineText}</div>
                    </div>
                    <button onclick="event.stopPropagation(); applyToInternship('${internship.id}', '${internship.title.replace(/'/g, "\\'")}')" 
                            style="padding: 10px 24px; background: linear-gradient(135deg, #d32f2f, #b71c1c); color: white; border: none; border-radius: 25px; font-size: 13px; font-weight: 600; cursor: pointer; transition: transform 0.2s;"
                            onmouseover="this.style.transform='scale(1.05)';"
                            onmouseout="this.style.transform='';">
                        Apply Now
                    </button>
                </div>
            </div>
        </div>
    `;
}

// Show full internship details in a modal
function showInternshipDetails(internshipId) {
    // Fetch full details from backend
    fetch(`http://localhost:5000/api/posts/internships?search=`)
        .then(res => res.json())
        .then(result => {
            const internship = result.internships?.find(i => i.id === internshipId);
            if (!internship) {
                showNotification('Internship not found', 'error');
                return;
            }
            
            const modal = document.createElement('div');
            modal.id = 'internshipModal';
            modal.innerHTML = `
                <div style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.6); display: flex; justify-content: center; align-items: center; z-index: 10000; padding: 20px;" onclick="if(event.target===this) this.remove()">
                    <div style="background: white; border-radius: 16px; width: 100%; max-width: 600px; max-height: 90vh; overflow-y: auto;">
                        <!-- Header -->
                        <div style="background: linear-gradient(135deg, #667eea, #764ba2); padding: 24px; color: white; position: relative;">
                            <button onclick="document.getElementById('internshipModal').remove()" style="position: absolute; top: 16px; right: 16px; background: rgba(255,255,255,0.2); border: none; color: white; width: 32px; height: 32px; border-radius: 50%; cursor: pointer; font-size: 16px;">×</button>
                            <h2 style="margin: 0 0 8px; font-size: 22px;">${internship.title}</h2>
                            <p style="margin: 0; opacity: 0.9;">${internship.company}</p>
                        </div>
                        
                        <!-- Content -->
                        <div style="padding: 24px;">
                            <!-- Quick Info Grid -->
                            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; margin-bottom: 24px;">
                                <div style="background: #f8f9fa; padding: 14px; border-radius: 10px;">
                                    <div style="font-size: 12px; color: #666; margin-bottom: 4px;"><i class="fas fa-map-marker-alt" style="color: #d32f2f;"></i> Location</div>
                                    <div style="font-weight: 600;">${internship.location || 'Remote'}</div>
                                </div>
                                <div style="background: #f8f9fa; padding: 14px; border-radius: 10px;">
                                    <div style="font-size: 12px; color: #666; margin-bottom: 4px;"><i class="fas fa-laptop-house" style="color: #2196F3;"></i> Work Mode</div>
                                    <div style="font-weight: 600;">${internship.mode || 'Flexible'}</div>
                                </div>
                                <div style="background: #f8f9fa; padding: 14px; border-radius: 10px;">
                                    <div style="font-size: 12px; color: #666; margin-bottom: 4px;"><i class="fas fa-clock" style="color: #4CAF50;"></i> Duration</div>
                                    <div style="font-weight: 600;">${internship.duration || 'Flexible'}</div>
                                </div>
                                <div style="background: #f8f9fa; padding: 14px; border-radius: 10px;">
                                    <div style="font-size: 12px; color: #666; margin-bottom: 4px;"><i class="fas fa-dollar-sign" style="color: #FF9800;"></i> Compensation</div>
                                    <div style="font-weight: 600;">${internship.stipend || 'Unpaid'}</div>
                                </div>
                            </div>
                            
                            <!-- Description -->
                            <div style="margin-bottom: 24px;">
                                <h4 style="margin: 0 0 12px; color: #1a1a2e;">Description</h4>
                                <p style="color: #555; line-height: 1.6; margin: 0;">${internship.description}</p>
                            </div>
                            
                            <!-- Requirements -->
                            ${internship.requirements ? `
                                <div style="margin-bottom: 24px;">
                                    <h4 style="margin: 0 0 12px; color: #1a1a2e;">Requirements</h4>
                                    <p style="color: #555; line-height: 1.6; margin: 0;">${internship.requirements}</p>
                                </div>
                            ` : ''}
                            
                            <!-- Skills -->
                            ${internship.skills && internship.skills.length > 0 ? `
                                <div style="margin-bottom: 24px;">
                                    <h4 style="margin: 0 0 12px; color: #1a1a2e;">Required Skills</h4>
                                    <div style="display: flex; flex-wrap: wrap; gap: 8px;">
                                        ${internship.skills.map(s => `<span style="padding: 6px 14px; background: linear-gradient(135deg, #e3f2fd, #bbdefb); color: #1565c0; border-radius: 20px; font-size: 13px; font-weight: 500;">${s}</span>`).join('')}
                                    </div>
                                </div>
                            ` : ''}
                            
                            <!-- Apply Button -->
                            <button onclick="document.getElementById('internshipModal').remove(); applyToInternship('${internship.id}', '${internship.title.replace(/'/g, "\\'")}')" 
                                    style="width: 100%; padding: 14px; background: linear-gradient(135deg, #d32f2f, #b71c1c); color: white; border: none; border-radius: 10px; font-size: 16px; font-weight: 600; cursor: pointer;">
                                <i class="fas fa-paper-plane"></i> Apply for this Internship
                            </button>
                        </div>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);
        })
        .catch(err => {
            console.error('Error fetching internship details:', err);
            showNotification('Failed to load internship details', 'error');
        });
}
window.showInternshipDetails = showInternshipDetails;

function renderExplorePagination() {
    const pagination = document.getElementById('explorePagination');
    if (!pagination || exploreTotalPages <= 1) {
        if (pagination) pagination.innerHTML = '';
        return;
    }

    let html = '';
    if (exploreCurrentPage > 1) {
        html += `<button onclick="changeExplorePage(${exploreCurrentPage - 1})" style="padding: 8px 14px; border: 1px solid #ddd; border-radius: 6px; background: white; cursor: pointer;">Previous</button>`;
    }
    
    for (let i = 1; i <= exploreTotalPages; i++) {
        if (i === 1 || i === exploreTotalPages || (i >= exploreCurrentPage - 1 && i <= exploreCurrentPage + 1)) {
            html += `<button onclick="changeExplorePage(${i})" style="padding: 8px 14px; border: 1px solid ${i === exploreCurrentPage ? '#d32f2f' : '#ddd'}; border-radius: 6px; background: ${i === exploreCurrentPage ? '#d32f2f' : 'white'}; color: ${i === exploreCurrentPage ? 'white' : '#333'}; cursor: pointer;">${i}</button>`;
        } else if (i === exploreCurrentPage - 2 || i === exploreCurrentPage + 2) {
            html += `<span style="padding: 8px;">...</span>`;
        }
    }
    
    if (exploreCurrentPage < exploreTotalPages) {
        html += `<button onclick="changeExplorePage(${exploreCurrentPage + 1})" style="padding: 8px 14px; border: 1px solid #ddd; border-radius: 6px; background: white; cursor: pointer;">Next</button>`;
    }

    pagination.innerHTML = html;
}

function changeExplorePage(page) {
    exploreCurrentPage = page;
    loadExploreInternships(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function searchExploreInternships() {
    exploreCurrentPage = 1;
    loadExploreInternships(1);
}

function clearExploreFilters() {
    document.getElementById('exploreSearch').value = '';
    document.getElementById('exploreLocation').value = '';
    document.getElementById('exploreDuration').value = '';
    const level = document.getElementById('exploreSkillLevel');
    const it = document.getElementById('exploreInternshipType');
    if (level) level.value = '';
    if (it) it.value = '';
    document.getElementById('activeFilters').innerHTML = '';
    searchExploreInternships();
}

function updateActiveFilters(filters) {
    const container = document.getElementById('activeFilters');
    if (!container) return;

    const activeFilters = [];
    if (filters.search) activeFilters.push({ label: `Search: ${filters.search}`, key: 'exploreSearch' });
    if (filters.location) activeFilters.push({ label: `Location: ${filters.location}`, key: 'exploreLocation' });
    if (filters.duration) activeFilters.push({ label: `Duration: ${filters.duration}`, key: 'exploreDuration' });
    if (filters.internshipType) activeFilters.push({ label: `Type: ${filters.internshipType}`, key: 'exploreInternshipType' });
    if (filters.skillLevel) activeFilters.push({ label: `Skill Level: ${filters.skillLevel}`, key: 'exploreSkillLevel' });

    if (activeFilters.length === 0) {
        container.innerHTML = '';
        return;
    }

    container.innerHTML = activeFilters.map(f => `
        <span style="display: inline-flex; align-items: center; gap: 6px; padding: 6px 12px; background: #e3f2fd; color: #1565c0; border-radius: 20px; font-size: 12px;">
            ${f.label}
            <button onclick="removeFilter('${f.key}')" style="background: none; border: none; color: #1565c0; cursor: pointer; font-size: 14px; padding: 0;">&times;</button>
        </span>
    `).join('');
}

function removeFilter(inputId) {
    const input = document.getElementById(inputId);
    if (input) {
        input.value = '';
        searchExploreInternships();
    }
}

// Navigate to Explore with skill filter
function searchBySkill(skill) {

    // Switch to explore tab
    const tabs = document.querySelectorAll('.nav-tab');
    tabs.forEach(t => t.classList.remove('active'));
    const exploreTab = document.querySelector('.nav-tab[data-tab="explore"]');
    if (exploreTab) exploreTab.classList.add('active');

    // Show explore container, hide home
    const mainContainer = document.querySelector('.main-container');
    const exploreContainer = document.getElementById('exploreContainer');
    if (mainContainer) mainContainer.style.display = 'none';
    if (exploreContainer) exploreContainer.style.display = 'block';

    const q = document.getElementById('exploreSearch');
    if (q) q.value = skill;

    // Trigger search
    loadExploreInternships(1);

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function getPortfolioDraft() {
    try {
        return JSON.parse(localStorage.getItem('portfolioDraftV2') || 'null');
    } catch (_) {
        return null;
    }
}

function calculatePortfolioCompleteness(draft) {
    const has = (v) => {
        if (!v) return false;
        if (Array.isArray(v)) return v.length > 0;
        if (typeof v === 'string') return v.trim().length > 0;
        if (typeof v === 'object') return Object.keys(v).length > 0;
        return Boolean(v);
    };

    const points = [
        { ok: has(draft?.name) },
        { ok: has(draft?.title) },
        { ok: has(draft?.email) },
        { ok: has(draft?.location) },
        { ok: has(draft?.about) },
        { ok: Array.isArray(draft?.skills) && draft.skills.length > 0 },
        { ok: has(draft?.eduSchool) && has(draft?.eduDegree) && has(draft?.eduYears) },
        { ok: Array.isArray(draft?.projects) && draft.projects.some(p => (p.title || '').trim() || (p.desc || '').trim()) }
    ];

    const earned = points.filter(p => p.ok).length;
    return Math.round((earned / points.length) * 100);
}

function renderPortfolioLandingPreview() {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const draft = getPortfolioDraft();
    const percent = calculatePortfolioCompleteness(draft);

    const completenessEl = document.getElementById('portfolioCompleteness');
    const barEl = document.getElementById('portfolioProgressBar');
    const updatedEl = document.getElementById('portfolioLastUpdated');
    const toggleEl = document.getElementById('portfolioPublicToggle');
    const shareBtn = document.getElementById('portfolioShareBtn');

    if (completenessEl) completenessEl.textContent = `${percent}%`;
    if (barEl) barEl.style.width = `${percent}%`;

    if (updatedEl) {
        const last = draft?.lastUpdatedAt ? new Date(draft.lastUpdatedAt) : null;
        updatedEl.textContent = last ? last.toLocaleDateString() : 'Never';
    }

    if (toggleEl) {
        toggleEl.checked = Boolean(draft?.isPublic);
        toggleEl.onchange = () => {
            const next = { ...(draft || {}), isPublic: toggleEl.checked, lastUpdatedAt: new Date().toISOString() };
            localStorage.setItem('portfolioDraftV2', JSON.stringify(next));
            renderPortfolioLandingPreview();
        };
    }

    const nameEl = document.getElementById('portfolioPreviewName');
    const titleEl = document.getElementById('portfolioPreviewTitle');
    const avatarEl = document.getElementById('portfolioPreviewAvatar');
    const skillsEl = document.getElementById('portfolioPreviewSkills');

    const name = (draft?.name || user.fullName || 'Your Name').trim();
    const title = (draft?.title || user.title || 'Professional Title').trim();

    if (nameEl) nameEl.textContent = name;
    if (titleEl) titleEl.textContent = title;
    if (avatarEl) avatarEl.textContent = getInitials(name);

    if (skillsEl) {
        const top = Array.isArray(draft?.skills) ? draft.skills.slice(0, 3) : [];
        skillsEl.innerHTML = (top.length ? top : ['Add skills to preview']).map(s => {
            const label = typeof s === 'string' ? s : `${s.name || 'Skill'}${s.level ? ` • ${s.level}` : ''}`;
            return `<span style="padding: 6px 14px; background: #f1f3f4; border: 1px solid #e5e7eb; border-radius: 999px; font-size: 12px; font-weight: 700; color: #333;">${label}</span>`;
        }).join('');
    }

    if (shareBtn) {
        const enabled = percent >= 40 && Boolean(draft?.isPublic);
        shareBtn.disabled = !enabled;
        shareBtn.style.cursor = enabled ? 'pointer' : 'not-allowed';
        shareBtn.style.color = enabled ? 'white' : '#999';
        shareBtn.style.background = enabled ? '#111827' : '#f1f3f4';
        shareBtn.style.borderColor = enabled ? '#111827' : '#e5e7eb';
    }
}

function closePortfolioPreviewModal() {
    const modal = document.getElementById('portfolioPreviewModal');
    if (modal) modal.remove();
    document.body.style.overflow = 'auto';
}

function viewPortfolioFromDashboard() {
    try {
        window.open('portfolio/portfolio-preview.html', '_blank');
        return;
    } catch (_) {
        window.location.href = 'portfolio/portfolio-preview.html';
        return;
    }

    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const draft = getPortfolioDraft() || {};

    const name = (draft.name || user.fullName || 'Your Name').trim();
    const title = (draft.title || user.title || 'Professional Title').trim();
    const email = (draft.email || user.email || '').trim();
    const location = (draft.location || '').trim();
    const about = (draft.about || '').trim();
    const skills = Array.isArray(draft.skills) ? draft.skills : [];
    const projects = Array.isArray(draft.projects) ? draft.projects : [];
    const experience = Array.isArray(draft.experience) ? draft.experience : [];
    const certifications = Array.isArray(draft.certifications) ? draft.certifications : [];

    const initials = getInitials(name);

    const modal = document.createElement('div');
    modal.id = 'portfolioPreviewModal';
    modal.innerHTML = `
        <div style="position: fixed; inset: 0; background: rgba(0,0,0,0.55); z-index: 10000; display: flex; align-items: center; justify-content: center; padding: 20px;" onclick="if(event.target===this) closePortfolioPreviewModal()">
            <div style="width: 100%; max-width: 980px; max-height: 90vh; overflow: auto; background: white; border-radius: 18px; box-shadow: 0 30px 80px rgba(0,0,0,0.25);">
                <div style="position: sticky; top: 0; background: white; border-bottom: 1px solid #eee; padding: 14px 18px; display: flex; justify-content: space-between; align-items: center; gap: 12px;">
                    <div style="display: flex; align-items: center; gap: 12px;">
                        <div style="width: 40px; height: 40px; border-radius: 12px; background: linear-gradient(135deg, #667eea, #764ba2); display: flex; align-items: center; justify-content: center; color: white; font-weight: 900;">${initials}</div>
                        <div>
                            <div style="font-weight: 900; color: #111827;">${name}</div>
                            <div style="font-size: 13px; color: #6b7280;">${title}</div>
                        </div>
                    </div>
                    <button onclick="closePortfolioPreviewModal()" style="padding: 10px 14px; background: #f5f5f5; border: 1px solid #e5e7eb; border-radius: 12px; cursor: pointer; font-weight: 800;">Close</button>
                </div>

                <div style="padding: 22px;">
                    <div style="display: grid; grid-template-columns: 1fr; gap: 14px;">
                        <div style="padding: 18px; border: 1px solid #eee; border-radius: 16px; background: linear-gradient(135deg, rgba(211,47,47,0.06), rgba(102,126,234,0.06));">
                            <div style="display: flex; justify-content: space-between; gap: 12px; flex-wrap: wrap;">
                                <div style="font-size: 13px; color: #374151; font-weight: 800;">${email ? email : ''}${email && location ? ' • ' : ''}${location ? location : ''}</div>
                                <div style="font-size: 12px; color: #6b7280; font-weight: 800;">Portfolio Preview</div>
                            </div>
                            ${about ? `<div style="margin-top: 12px; color: #111827; line-height: 1.6;">${about}</div>` : `<div style="margin-top: 12px; color: #6b7280;">Add an About Me summary to make your portfolio stronger.</div>`}
                        </div>

                        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 14px;">
                            <div style="padding: 18px; border: 1px solid #eee; border-radius: 16px;">
                                <div style="font-weight: 900; color: #111827;">Skills</div>
                                <div style="margin-top: 12px; display: flex; flex-wrap: wrap; gap: 8px;">
                                    ${(skills.length ? skills : ['Add skills']).slice(0, 12).map(s => {
                                        const label = typeof s === 'string' ? s : `${s.name || 'Skill'}${s.level ? ` • ${s.level}` : ''}`;
                                        return `<span style="padding: 6px 12px; background: #f1f3f4; border: 1px solid #e5e7eb; border-radius: 999px; font-size: 12px; font-weight: 800; color: #111827;">${label}</span>`;
                                    }).join('')}
                                </div>
                            </div>

                            <div style="padding: 18px; border: 1px solid #eee; border-radius: 16px;">
                                <div style="font-weight: 900; color: #111827;">Projects</div>
                                <div style="margin-top: 12px; display: grid; gap: 10px;">
                                    ${(projects.length ? projects : [{ title: '', desc: '' }]).slice(0, 4).map(p => {
                                        const t = (p.title || 'Add a project').trim();
                                        const d = (p.desc || '').trim();
                                        const stack = (p.stack || '').trim();
                                        return `<div style="padding: 12px; border: 1px solid #f1f3f4; border-radius: 14px; background: #fff;">
                                            <div style="font-weight: 900; color: #111827;">${t}${stack ? ` <span style=\"font-weight:700; color:#6b7280;\">— ${stack}</span>` : ''}</div>
                                            ${d ? `<div style="margin-top: 6px; color: #374151; font-size: 13px; line-height: 1.5;">${d}</div>` : ''}
                                        </div>`;
                                    }).join('')}
                                </div>
                            </div>
                        </div>

                        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 14px;">
                            <div style="padding: 18px; border: 1px solid #eee; border-radius: 16px;">
                                <div style="font-weight: 900; color: #111827;">Experience</div>
                                <div style="margin-top: 12px; display: grid; gap: 10px;">
                                    ${(experience.length ? experience : [{ role: '', company: '', desc: '' }]).slice(0, 4).map(e => {
                                        const role = (e.role || 'Add experience').trim();
                                        const company = (e.company || '').trim();
                                        const meta = [company, [e.start, e.end].filter(Boolean).join(' – ')].filter(Boolean).join(' • ');
                                        return `<div style="padding: 12px; border: 1px solid #f1f3f4; border-radius: 14px;">
                                            <div style="font-weight: 900; color: #111827;">${role}${meta ? ` <span style=\"font-weight:700; color:#6b7280;\">— ${meta}</span>` : ''}</div>
                                            ${e.desc ? `<div style="margin-top: 6px; color: #374151; font-size: 13px; line-height: 1.5;">${e.desc}</div>` : ''}
                                        </div>`;
                                    }).join('')}
                                </div>
                            </div>

                            <div style="padding: 18px; border: 1px solid #eee; border-radius: 16px;">
                                <div style="font-weight: 900; color: #111827;">Certifications</div>
                                <div style="margin-top: 12px; display: grid; gap: 10px;">
                                    ${(certifications.length ? certifications : [{ name: '', issuer: '' }]).slice(0, 5).map(c => {
                                        const n = (c.name || 'Add certification').trim();
                                        const meta = [c.issuer, c.date].filter(Boolean).join(' • ');
                                        return `<div style="padding: 12px; border: 1px solid #f1f3f4; border-radius: 14px;">
                                            <div style="font-weight: 900; color: #111827;">${n}${meta ? ` <span style=\"font-weight:700; color:#6b7280;\">— ${meta}</span>` : ''}</div>
                                        </div>`;
                                    }).join('')}
                                </div>
                            </div>
                        </div>

                        <div style="display: flex; justify-content: flex-end; gap: 10px; padding-top: 6px;">
                            <button onclick="closePortfolioPreviewModal()" style="padding: 12px 16px; background: #f5f5f5; border: 1px solid #e5e7eb; border-radius: 12px; cursor: pointer; font-weight: 800;">Close</button>
                            <button onclick="openPortfolioBuilder('update'); closePortfolioPreviewModal();" style="padding: 12px 16px; background: linear-gradient(135deg, #d32f2f, #b71c1c); color: white; border: none; border-radius: 12px; cursor: pointer; font-weight: 900;">Edit in Builder</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
    document.body.style.overflow = 'hidden';
}

function sharePortfolioFromDashboard() {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const draft = getPortfolioDraft() || {};

    if (!draft || typeof draft !== 'object') {
        showNotification('Build your portfolio first', 'info');
        return;
    }

    if (!draft.isPublic) {
        showNotification('Make your portfolio public first', 'info');
        return;
    }

    const ownerId = String(draft.ownerId || user.id || '').trim();
    if (!ownerId) {
        showNotification('Please log in again to generate a share link', 'error');
        return;
    }

    // Ensure ownerId is stored in the draft
    if (!draft.ownerId && user.id) {
        try {
            localStorage.setItem('portfolioDraftV2', JSON.stringify({ ...draft, ownerId }));
        } catch (_) {
            // ignore
        }
    }

    const shareUrl = new URL('portfolio/portfolio-preview.html', window.location.href);
    shareUrl.searchParams.set('userId', ownerId);

    const copy = async () => {
        try {
            await navigator.clipboard.writeText(shareUrl.toString());
            showNotification('Share link copied to clipboard', 'success');
        } catch (_) {
            try {
                prompt('Copy your share link:', shareUrl.toString());
            } catch (__){
                // ignore
            }
        }
    };

    copy();
}

window.closePortfolioPreviewModal = closePortfolioPreviewModal;
window.viewPortfolioFromDashboard = viewPortfolioFromDashboard;
window.sharePortfolioFromDashboard = sharePortfolioFromDashboard;

// Make explore functions globally available
window.searchBySkill = searchBySkill;
window.removeFilter = removeFilter;
window.searchExploreInternships = searchExploreInternships;
window.clearExploreFilters = clearExploreFilters;
window.changeExplorePage = changeExplorePage;
window.loadExploreInternships = loadExploreInternships;

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

let pendingPostImage = null;

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
        openPostImageUpload();
    }
    
    postInput.focus();
}

function openPostImageUpload() {
    // Create hidden file input if not exists
    let fileInput = document.getElementById('postImageInput');
    if (!fileInput) {
        fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.id = 'postImageInput';
        fileInput.accept = 'image/*';
        fileInput.style.display = 'none';
        document.body.appendChild(fileInput);
        
        fileInput.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (file) {
                if (file.size > 5 * 1024 * 1024) {
                    showNotification('Image must be less than 5MB', 'error');
                    return;
                }
                
                const reader = new FileReader();
                reader.onload = function(event) {
                    pendingPostImage = event.target.result;
                    showPostImagePreview(pendingPostImage);
                    showNotification('Image added to post', 'success');
                };
                reader.readAsDataURL(file);
            }
        });
    }
    fileInput.click();
}

function showPostImagePreview(imageData) {
    // Remove existing preview
    const existingPreview = document.getElementById('postImagePreview');
    if (existingPreview) existingPreview.remove();
    
    // Create preview element - Facebook-style with full controls
    const postCard = document.querySelector('.create-post-card') || document.querySelector('.create-post');
    if (!postCard) return;
    
    const preview = document.createElement('div');
    preview.id = 'postImagePreview';
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
                    <button onclick="changePostImage()" style="
                        padding: 6px 12px;
                        border-radius: 6px;
                        background: rgba(255,255,255,0.9);
                        color: #333;
                        border: none;
                        cursor: pointer;
                        font-size: 12px;
                        font-weight: 500;
                    "><i class="fas fa-sync-alt"></i> Change</button>
                    <button onclick="removePostImage()" style="
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

function changePostImage() {
    const fileInput = document.getElementById('postImageInput');
    if (fileInput) {
        fileInput.click();
    } else {
        openPostImageUpload();
    }
}

window.changePostImage = changePostImage;

function removePostImage() {
    pendingPostImage = null;
    const preview = document.getElementById('postImagePreview');
    if (preview) preview.remove();
    showNotification('Image removed', 'info');
}

window.removePostImage = removePostImage;

// ... (rest of the code remains the same)
async function createPost(postInput, postButton) {
    const content = postInput.value.trim();
    
    if (!content) {
        showNotification('Please enter some content', 'error');
        postInput.focus();
        return;
    }

    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (!user || !user.id) {
        showNotification('Please log in to create posts', 'error');
        return;
    }

    if (user.isBlocked) {
        showNotification('You cannot create posts while your account is blocked.', 'error');
        return;
    }
    
    // Show loading state
    const originalText = postButton.textContent;
    postButton.textContent = 'Posting...';
    postButton.disabled = true;
    
    try {
        // Build post data including image if present
        const postData = {
            userId: user.id,
            content: content,
            type: 'update'
        };
        
        // Include image if one was selected
        if (pendingPostImage) {
            postData.media = pendingPostImage;
            postData.mediaType = 'image';
        }
        
        const response = await fetch('http://localhost:5000/api/posts/feed', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(postData)
        });

        const result = await response.json();

        if (result.success) {
            // Clear input and image
            postInput.value = '';
            postInput.placeholder = 'Share an update, project, or internship interest...';
            pendingPostImage = null;
            const imagePreview = document.getElementById('postImagePreview');
            if (imagePreview) imagePreview.remove();
            
            // Show success
            showNotification('Post published successfully!', 'success');
            
            // Reload feed to show new post
            loadHomeFeed();
        } else {
            showNotification(result.message || 'Failed to create post', 'error');
        }
    } catch (error) {
        console.error('Create post error:', error);
        showNotification('Network error while creating post', 'error');
    } finally {
        postButton.textContent = originalText;
        postButton.disabled = false;
    }
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
     loadStudentNotifications();
     // Refresh notifications every 30 seconds
     setInterval(loadStudentNotifications, 30000);
 }

function getAuthHeaders() {
    const token = localStorage.getItem('token');
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return headers;
}

async function loadStudentNotifications() {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const userId = user._id || user.id;
    if (!user || !userId) return;

    try {
        const response = await fetch(`http://localhost:5000/api/notifications/${userId}`, {
            headers: getAuthHeaders()
        });
        const result = await response.json();

        if (result.success) {
            updateStudentNotificationBadge(result.unreadCount || 0);
            displayStudentNotifications(result.notifications || []);
        }
    } catch (error) {
        console.error('Error loading notifications:', error);
    }
}

async function markAllStudentNotificationsRead() {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const userId = user._id || user.id;
    if (!user || !userId) return;

    try {
        await fetch(`http://localhost:5000/api/notifications/${userId}/read-all`, {
            method: 'PUT',
            headers: getAuthHeaders()
        });
        updateStudentNotificationBadge(0);
        loadStudentNotifications();
    } catch (error) {
        console.error('Error marking notifications as read:', error);
    }
}

async function markNotificationRead(notificationId) {
    try {
        await fetch(`http://localhost:5000/api/notifications/${notificationId}/read`, {
            method: 'PUT',
            headers: getAuthHeaders()
        });
        loadStudentNotifications();
    } catch (error) {
        console.error('Error marking notification as read:', error);
    }
}

function updateStudentNotificationBadge(count) {
    const badge = document.getElementById('notificationBadge');
    const dot = document.querySelector('#notificationIcon .notification-dot');

    if (badge) {
        if (count && count > 0) {
            badge.textContent = String(count);
            badge.style.display = 'inline-flex';
        } else {
            badge.textContent = '0';
            badge.style.display = 'none';
        }
    }

    if (dot) {
        dot.style.display = count && count > 0 ? 'block' : 'none';
    }
}

function displayStudentNotifications(notifications) {
    const dropdown = document.getElementById('notificationDropdown');
    if (!dropdown) return;

    const itemsHtml = (notifications || []).map(n => {
        const id = n._id || '';
        const title = n.title || 'Notification';
        const message = n.message || '';
        const createdAt = n.createdAt ? new Date(n.createdAt) : null;
        const timeLabel = createdAt ? createdAt.toLocaleString() : '';
        const isRead = !!n.isRead;

        let icon = 'fa-bell';
        if (n.type && String(n.type).includes('application')) icon = 'fa-briefcase';

        return `
            <div class="notification-item" data-id="${id}" style="opacity:${isRead ? '0.65' : '1'}; cursor:pointer;">
                <div class="notification-icon">
                    <i class="fas ${icon}"></i>
                </div>
                <div class="notification-content">
                    <p><strong>${title}</strong>${message ? ` - ${message}` : ''}</p>
                    <small>${timeLabel}</small>
                </div>
            </div>
        `;
    }).join('');

    dropdown.innerHTML = `
        <div style="display:flex; align-items:center; justify-content:space-between; gap:12px;">
            <h3 style="margin:0;">Notifications</h3>
            <button id="markAllNotifReadBtn" style="background:none; border:none; color:#d32f2f; font-weight:700; cursor:pointer;">Mark all read</button>
        </div>
        ${itemsHtml || '<div style="padding:12px; color:#666;">No notifications</div>'}
        <a href="applications.html" class="dropdown-item">See all applications</a>
    `;

    const markAllBtn = document.getElementById('markAllNotifReadBtn');
    if (markAllBtn) {
        markAllBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            markAllStudentNotificationsRead();
        });
    }

    dropdown.querySelectorAll('.notification-item').forEach(el => {
        el.addEventListener('click', async () => {
            const notificationId = el.getAttribute('data-id');
            if (notificationId) await markNotificationRead(notificationId);

            const text = (el.textContent || '').toLowerCase();
            if (text.includes('application')) {
                window.location.href = 'applications.html';
            }
        });
    });
}

function clearNotificationCount() {
    const notificationCount = document.querySelector('#notificationIcon .notification-count');
    if (notificationCount) {
        notificationCount.style.display = 'none';
    }
    markAllStudentNotificationsRead();
}

function showNotification(message, type = 'info') {
    // ... (rest of the code remains the same)
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

// ===== PROFILE SECTION FUNCTIONS =====

function showProfileTab() {
    closeAllDropdowns();
    document.querySelectorAll('.nav-tab').forEach(tab => tab.classList.remove('active'));
    loadTabContent('profile');
}

function renderProfileData() {
    console.log('📋 Rendering profile data for current user...');
    // Use user-specific portfolio data
    const data = getUserPortfolioData();
    
    // Also get the authenticated user info
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    
    if (!data && !user.id) { 
        console.log('No portfolio data found'); 
        // Show user's basic info from login at minimum
        if (user.fullName) {
            const nameEl = document.getElementById('profileDisplayName');
            if (nameEl) nameEl.textContent = user.fullName;
            const emailEl = document.getElementById('profileContactEmail');
            if (emailEl) emailEl.textContent = user.email || 'Not provided';
        }
        return; 
    }
    
    try {
        // If no portfolio data, use user data from login
        const profileData = data || {};
        
        // Get name from either structure (root level or basicInfo)
        const name = data.name || data.basicInfo?.fullName || 'Your Name';
        const title = data.title || data.basicInfo?.professionalTitle || 'Professional Title';
        const location = data.location || data.basicInfo?.location || 'Location';
        const about = data.about || data.basicInfo?.summary || 'No summary added yet.';
        const email = data.email || data.basicInfo?.email || 'Not provided';
        const phone = data.phone || data.basicInfo?.phone || 'Not provided';
        const university = data.education?.[0]?.institution || data.basicInfo?.university || 'University';
        
        // Basic Info
        document.getElementById('profileDisplayName').textContent = name;
        document.getElementById('profileDisplayTitle').textContent = title;
        document.getElementById('profileDisplayUni').innerHTML = `<i class="fas fa-university" style="color: #d32f2f;"></i> ${university}`;
        document.getElementById('profileDisplayLocation').innerHTML = `<i class="fas fa-map-marker-alt"></i> ${location}`;
        document.getElementById('profileAboutText').textContent = about;
        
        const contactEmail = document.getElementById('profileContactEmail');
        const contactPhone = document.getElementById('profileContactPhone');
        if (contactEmail) contactEmail.textContent = email;
        if (contactPhone) contactPhone.textContent = phone;
        
        // Profile Picture - check root level first, then basicInfo
        const profilePhoto = data.profilePhoto || data.basicInfo?.profilePhoto || '';
        const avatarContainer = document.getElementById('profileAvatarImage');
        if (avatarContainer) {
            if (profilePhoto) {
                avatarContainer.innerHTML = `<img src="${profilePhoto}" alt="${name}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 12px;">`;
            } else {
                const initials = name.split(' ').map(w => w[0]).join('').toUpperCase().substring(0, 2);
                avatarContainer.textContent = initials;
            }
        }
        
        // Cover Photo
        const coverPhoto = data.coverPhoto || data.basicInfo?.coverPhoto || '';
        const coverBanner = document.getElementById('profileCoverBanner');
        if (coverBanner && coverPhoto) {
            coverBanner.style.backgroundImage = `url(${coverPhoto})`;
            coverBanner.style.backgroundSize = 'cover';
            coverBanner.style.backgroundPosition = 'center';
        }
        
        // Skills
        if (data.skills?.technical?.length > 0) {
            document.getElementById('profileSkillsList').innerHTML = data.skills.technical.map(skill => {
                const percent = skill.level === 'expert' ? 95 : skill.level === 'advanced' ? 80 : skill.level === 'intermediate' ? 60 : 35;
                return `<div style="background: #f9f9f9; border: 1px solid #e5e7eb; border-radius: 12px; padding: 14px;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                        <span style="font-weight: 700;">${skill.name}</span>
                        <span style="font-size: 12px; color: #666;">${skill.level || 'Intermediate'}</span>
                    </div>
                    <div style="height: 6px; background: #e5e7eb; border-radius: 3px;"><div style="height: 100%; width: ${percent}%; background: linear-gradient(90deg, #d32f2f, #b71c1c); border-radius: 3px;"></div></div>
                </div>`;
            }).join('');
        }
        
        // Education
        if (data.education?.length > 0) {
            document.getElementById('profileEducationList').innerHTML = data.education.map(edu => `
                <div style="display: flex; gap: 14px;">
                    <div style="width: 48px; height: 48px; border-radius: 12px; background: #ffebee; display: flex; align-items: center; justify-content: center;"><i class="fas fa-graduation-cap" style="color: #d32f2f;"></i></div>
                    <div><h4 style="margin: 0; font-size: 15px; font-weight: 700;">${edu.institution}</h4><p style="margin: 4px 0; color: #555; font-size: 14px;">${edu.degree} ${edu.field ? 'in ' + edu.field : ''}</p></div>
                </div>
            `).join('');
        }
        
        // Projects
        if (data.projects?.length > 0) {
            document.getElementById('profileProjectsList').innerHTML = data.projects.map(proj => `
                <div style="border: 1px solid #e5e7eb; border-radius: 12px; padding: 16px;">
                    <h4 style="margin: 0; font-size: 15px; font-weight: 700;">${proj.title}</h4>
                    ${proj.description ? `<p style="margin: 8px 0; color: #666; font-size: 13px;">${proj.description}</p>` : ''}
                    ${proj.technologies ? `<div style="display: flex; flex-wrap: wrap; gap: 6px; margin-top: 10px;">${proj.technologies.split(',').map(t => `<span style="padding: 4px 10px; background: #f5f5f5; border-radius: 12px; font-size: 12px;">${t.trim()}</span>`).join('')}</div>` : ''}
                </div>
            `).join('');
        }
        
        console.log('✅ Profile data rendered');
    } catch (error) { console.error('Error rendering profile:', error); }
}

function getProfileLink() {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    return `${window.location.origin}/profile/${user.username || 'student'}`;
}

function shareProfileWithOptions() { showQRCodeModal(); }

function showQRCodeModal() {
    const modal = document.getElementById('shareModal');
    document.getElementById('shareProfileLink').value = getProfileLink();
    document.getElementById('qrCodeImage').innerHTML = `<div style="width: 180px; height: 180px; background: white; border: 2px solid #e5e7eb; border-radius: 8px; display: flex; flex-direction: column; align-items: center; justify-content: center;"><i class="fas fa-qrcode" style="font-size: 80px; color: #1a1a2e;"></i><p style="margin: 10px 0 0; font-size: 11px; color: #666;">Profile QR Code</p></div>`;
    modal.style.display = 'flex';
}

function closeShareModal() { document.getElementById('shareModal').style.display = 'none'; }

function copyProfileLink() {
    navigator.clipboard.writeText(getProfileLink()).then(() => showNotification('Profile link copied!', 'success')).catch(() => showNotification('Failed to copy', 'error'));
}

function downloadQRCode() { showNotification('QR download feature coming soon', 'info'); }

function previewPublicProfile() {
    const data = getUserPortfolioData();
    if (!data) { showNotification('No portfolio data', 'error'); return; }
    const name = data.basicInfo?.fullName || data.name || 'Your Name';
    const initials = name.split(' ').map(w => w[0]).join('').toUpperCase().substring(0, 2);
    
    document.getElementById('portfolioPreviewContent').innerHTML = `
        <div style="text-align: center; padding-bottom: 20px; border-bottom: 1px solid #eee; margin-bottom: 20px;">
            <div style="width: 100px; height: 100px; border-radius: 50%; background: linear-gradient(135deg, #d32f2f, #b71c1c); display: flex; align-items: center; justify-content: center; color: white; font-size: 36px; font-weight: 700; margin: 0 auto 16px;">${initials}</div>
            <h2 style="margin: 0;">${name}</h2>
            <p style="color: #666;">${data.basicInfo?.professionalTitle || ''}</p>
        </div>
        ${data.basicInfo?.summary ? `<div style="margin-bottom: 24px;"><h3 style="color: #d32f2f;">About</h3><p style="color: #555;">${data.basicInfo.summary}</p></div>` : ''}
        ${data.skills?.technical?.length > 0 ? `<div style="margin-bottom: 24px;"><h3 style="color: #d32f2f;">Skills</h3><div style="display: flex; flex-wrap: wrap; gap: 8px;">${data.skills.technical.map(s => `<span style="padding: 6px 14px; background: #f5f5f5; border-radius: 20px;">${s.name}</span>`).join('')}</div></div>` : ''}
    `;
    document.getElementById('portfolioPreviewModal').style.display = 'flex';
}

function closePreviewModal() { document.getElementById('portfolioPreviewModal').style.display = 'none'; }

async function downloadProfilePDF() {
    showNotification('Generating PDF...', 'info');
    
    // ... (rest of the code remains the same)
    const data = getUserPortfolioData() || {};
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const fullName = data.basicInfo?.fullName || user.fullName || 'Portfolio';
    const title = data.basicInfo?.professionalTitle || '';
    const summary = data.basicInfo?.summary || data.basicInfo?.bio || '';
    const email = data.basicInfo?.email || user.email || '';
    const location = data.basicInfo?.location || '';
    const phone = data.basicInfo?.phone || '';
    
    // Build skills HTML
    const skills = data.skills?.technical || [];
    const skillsHTML = skills.length > 0 ? `
        <div class="section">
            <h3>Skills</h3>
            <div class="skills-list">${skills.map(s => `<span class="skill-tag">${typeof s === 'object' ? s.name : s}</span>`).join('')}</div>
        </div>
    ` : '';
    
    // Build education HTML
    const education = data.education || [];
    const eduHTML = education.length > 0 ? `
        <div class="section">
            <h3>Education</h3>
            ${education.map(e => `
                <div class="item">
                    <strong>${e.institution || e.school || ''}</strong>
                    <p>${e.degree || ''} ${e.field ? 'in ' + e.field : ''}</p>
                    <small>${e.startDate || ''} - ${e.current ? 'Present' : (e.endDate || '')}</small>
                </div>
            `).join('')}
        </div>
    ` : '';
    
    // Build experience HTML
    const experience = data.experience || [];
    const expHTML = experience.length > 0 ? `
        <div class="section">
            <h3>Experience</h3>
            ${experience.map(e => `
                <div class="item">
                    <strong>${e.role || e.position || ''}</strong> at ${e.company || ''}
                    <p>${e.description || ''}</p>
                    <small>${e.startDate || ''} - ${e.current ? 'Present' : (e.endDate || '')}</small>
                </div>
            `).join('')}
        </div>
    ` : '';
    
    // Build projects HTML
    const projects = data.projects || [];
    const projHTML = projects.length > 0 ? `
        <div class="section">
            <h3>Projects</h3>
            ${projects.map(p => `
                <div class="item">
                    <strong>${p.title || p.name || ''}</strong>
                    <p>${p.description || ''}</p>
                    ${p.technologies ? `<small>Technologies: ${p.technologies}</small>` : ''}
                </div>
            `).join('')}
        </div>
    ` : '';
    
    // Create PDF content
    const pdfContent = document.createElement('div');
    pdfContent.innerHTML = `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 40px; color: #333;">
            <style>
                .header { text-align: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 3px solid #d32f2f; }
                .header h1 { margin: 0; font-size: 32px; color: #1a1a2e; }
                .header .title { color: #d32f2f; font-size: 18px; margin: 8px 0; }
                .header .contact { color: #666; font-size: 14px; }
                .section { margin-bottom: 25px; }
                .section h3 { color: #d32f2f; font-size: 18px; border-bottom: 1px solid #eee; padding-bottom: 8px; margin-bottom: 15px; }
                .item { margin-bottom: 15px; padding-left: 15px; border-left: 3px solid #d32f2f; }
                .item strong { color: #1a1a2e; }
                .item p { margin: 5px 0; color: #444; }
                .item small { color: #888; }
                .skills-list { display: flex; flex-wrap: wrap; gap: 8px; }
                .skill-tag { background: #f0f0f0; padding: 6px 14px; border-radius: 20px; font-size: 13px; color: #333; }
                .summary { color: #444; line-height: 1.7; font-size: 15px; }
            </style>
            <div class="header">
                <h1>${fullName}</h1>
                ${title ? `<div class="title">${title}</div>` : ''}
                <div class="contact">
                    ${email ? `<span>${email}</span>` : ''}
                    ${phone ? ` | <span>${phone}</span>` : ''}
                    ${location ? ` | <span>${location}</span>` : ''}
                </div>
            </div>
            ${summary ? `<div class="section"><h3>About</h3><p class="summary">${summary}</p></div>` : ''}
            ${skillsHTML}
            ${expHTML}
            ${eduHTML}
            ${projHTML}
        </div>
    `;
    
    // Check if html2pdf is available, if not load it
    if (!window.html2pdf) {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
        document.head.appendChild(script);
        await new Promise(resolve => script.onload = resolve);
    }
    
    try {
        const opt = {
            margin: [15, 15, 15, 15],
            filename: `${fullName.replace(/[^a-zA-Z0-9]/g, '_')}_Profile.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true, logging: false },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };
        
        await html2pdf().set(opt).from(pdfContent).save();
        showNotification('PDF downloaded successfully!', 'success');
    } catch (error) {
        console.error('PDF generation error:', error);
        // Fallback to print
        const printWindow = window.open('', '_blank');
        printWindow.document.write(`<!DOCTYPE html><html><head><title>${fullName}</title></head><body>${pdfContent.innerHTML}</body></html>`);
        printWindow.document.close();
        printWindow.print();
        showNotification('PDF opened in print dialog', 'info');
    }
}

// ===== DIRECT PROFILE EDIT FUNCTIONS =====
function openDirectPhotoEdit() {
    const modal = document.createElement('div');
    modal.id = 'photoEditModal';
    modal.innerHTML = `
        <div style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.6); display: flex; justify-content: center; align-items: center; z-index: 10001;">
            <div style="background: white; border-radius: 16px; width: 90%; max-width: 450px; padding: 24px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                    <h3 style="margin: 0; font-weight: 800; color: #1a1a2e;">Update Profile Picture</h3>
                    <button onclick="document.getElementById('photoEditModal').remove()" style="background: none; border: none; font-size: 24px; cursor: pointer; color: #666;">×</button>
                </div>
                <div id="photoPreviewArea" style="width: 150px; height: 150px; margin: 0 auto 20px; border-radius: 50%; background: linear-gradient(135deg, #d32f2f, #b71c1c); display: flex; align-items: center; justify-content: center; overflow: hidden;">
                    <span style="color: white; font-size: 48px; font-weight: 700;" id="photoPreviewInitials">U</span>
                </div>
                <input type="file" id="profilePhotoInput" accept="image/*" style="display: none;">
                <button onclick="document.getElementById('profilePhotoInput').click()" style="width: 100%; padding: 14px; background: #f5f5f5; border: 2px dashed #ddd; border-radius: 12px; cursor: pointer; font-weight: 600; margin-bottom: 12px;">
                    <i class="fas fa-upload"></i> Choose Photo
                </button>
                <p style="text-align: center; color: #888; font-size: 12px; margin-bottom: 16px;">Recommended: Square image, at least 200x200px</p>
                <div style="display: flex; gap: 10px;">
                    <button onclick="removeProfilePhoto()" style="flex: 1; padding: 12px; background: #fff; border: 1px solid #e53e3e; color: #e53e3e; border-radius: 10px; cursor: pointer; font-weight: 600;">Remove</button>
                    <button onclick="saveProfilePhoto()" style="flex: 1; padding: 12px; background: linear-gradient(135deg, #d32f2f, #b71c1c); color: white; border: none; border-radius: 10px; cursor: pointer; font-weight: 600;">Save</button>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    
    // Load current photo - use user-specific storage
    const draft = getUserPortfolioData() || {};
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (draft.profilePhoto) {
        document.getElementById('photoPreviewArea').innerHTML = `<img src="${draft.profilePhoto}" style="width: 100%; height: 100%; object-fit: cover;">`;
    } else {
        const initials = (user.fullName || 'U').split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
        document.getElementById('photoPreviewInitials').textContent = initials;
    }
    
    document.getElementById('profilePhotoInput').addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(event) {
                document.getElementById('photoPreviewArea').innerHTML = `<img src="${event.target.result}" style="width: 100%; height: 100%; object-fit: cover;">`;
                document.getElementById('photoPreviewArea').dataset.newPhoto = event.target.result;
            };
            reader.readAsDataURL(file);
        }
    });
}

function saveProfilePhoto() {
    const previewArea = document.getElementById('photoPreviewArea');
    const newPhoto = previewArea.dataset.newPhoto;
    
    if (newPhoto) {
        // Use user-specific storage
        const draft = getUserPortfolioData() || {};
        draft.profilePhoto = newPhoto;
        setUserPortfolioData(draft);
        
        // Also update user object for consistency
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        user.profilePicture = newPhoto;
        localStorage.setItem('user', JSON.stringify(user));
        
        // Refresh profile display
        renderProfileData();
        updateUserInfo(user);
        showNotification('Profile picture updated!', 'success');
    }
    document.getElementById('photoEditModal').remove();
}

function removeProfilePhoto() {
    // Use user-specific storage
    const draft = getUserPortfolioData() || {};
    delete draft.profilePhoto;
    setUserPortfolioData(draft);
    
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    delete user.profilePicture;
    localStorage.setItem('user', JSON.stringify(user));
    
    renderProfileData();
    updateUserInfo(user);
    showNotification('Profile picture removed', 'info');
    document.getElementById('photoEditModal').remove();
}

function openDirectCoverEdit() {
    const modal = document.createElement('div');
    modal.id = 'coverEditModal';
    modal.innerHTML = `
        <div style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.6); display: flex; justify-content: center; align-items: center; z-index: 10001;">
            <div style="background: white; border-radius: 16px; width: 90%; max-width: 550px; padding: 24px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                    <h3 style="margin: 0; font-weight: 800; color: #1a1a2e;">Update Cover Photo</h3>
                    <button onclick="document.getElementById('coverEditModal').remove()" style="background: none; border: none; font-size: 24px; cursor: pointer; color: #666;">×</button>
                </div>
                <div id="coverPreviewArea" style="width: 100%; height: 150px; border-radius: 12px; background: linear-gradient(135deg, #2c3e50 0%, #4a6491 100%); margin-bottom: 20px; overflow: hidden;"></div>
                <input type="file" id="coverPhotoInput" accept="image/*" style="display: none;">
                <button onclick="document.getElementById('coverPhotoInput').click()" style="width: 100%; padding: 14px; background: #f5f5f5; border: 2px dashed #ddd; border-radius: 12px; cursor: pointer; font-weight: 600; margin-bottom: 12px;">
                    <i class="fas fa-upload"></i> Choose Cover Image
                </button>
                <p style="text-align: center; color: #888; font-size: 12px; margin-bottom: 16px;">Recommended: 1200x400px or similar aspect ratio</p>
                <div style="display: flex; gap: 10px;">
                    <button onclick="removeCoverPhoto()" style="flex: 1; padding: 12px; background: #fff; border: 1px solid #e53e3e; color: #e53e3e; border-radius: 10px; cursor: pointer; font-weight: 600;">Remove</button>
                    <button onclick="saveCoverPhoto()" style="flex: 1; padding: 12px; background: linear-gradient(135deg, #d32f2f, #b71c1c); color: white; border: none; border-radius: 10px; cursor: pointer; font-weight: 600;">Save</button>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    
    // Load current cover - use user-specific storage
    const draft = getUserPortfolioData() || {};
    if (draft.coverPhoto) {
        document.getElementById('coverPreviewArea').style.backgroundImage = `url(${draft.coverPhoto})`;
        document.getElementById('coverPreviewArea').style.backgroundSize = 'cover';
        document.getElementById('coverPreviewArea').style.backgroundPosition = 'center';
    }
    
    document.getElementById('coverPhotoInput').addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(event) {
                const preview = document.getElementById('coverPreviewArea');
                preview.style.backgroundImage = `url(${event.target.result})`;
                preview.style.backgroundSize = 'cover';
                preview.style.backgroundPosition = 'center';
                preview.dataset.newCover = event.target.result;
            };
            reader.readAsDataURL(file);
        }
    });
}

function saveCoverPhoto() {
    const previewArea = document.getElementById('coverPreviewArea');
    const newCover = previewArea.dataset.newCover;
    
    if (newCover) {
        // Use user-specific storage
        const draft = getUserPortfolioData() || {};
        draft.coverPhoto = newCover;
        setUserPortfolioData(draft);
        
        // Refresh profile display
        renderProfileData();
        showNotification('Cover photo updated!', 'success');
    }
    document.getElementById('coverEditModal').remove();
}

function removeCoverPhoto() {
    // Use user-specific storage
    const draft = getUserPortfolioData() || {};
    delete draft.coverPhoto;
    setUserPortfolioData(draft);
    
    // Reset cover banner to default
    const coverBanner = document.getElementById('profileCoverBanner');
    if (coverBanner) {
        coverBanner.style.backgroundImage = '';
        coverBanner.style.background = 'linear-gradient(135deg, #2c3e50 0%, #4a6491 100%)';
    }
    
    showNotification('Cover photo removed', 'info');
    document.getElementById('coverEditModal').remove();
}

// Function to make an element editable
function makeEditable(elementId, fieldName, isTextarea = false) {
    const element = document.getElementById(elementId);
    if (!element) return;

    // Save original content
    const originalContent = element.textContent.trim();
    
    // Create input element
    const input = document.createElement(isTextarea ? 'textarea' : 'input');
    input.type = 'text';
    input.value = originalContent;
    input.className = 'profile-edit-input';
    input.style.width = '100%';
    input.style.padding = '8px';
    input.style.border = '1px solid #ddd';
    input.style.borderRadius = '4px';
    
    // Replace element with input
    element.parentNode.replaceChild(input, element);
    input.focus();
    
    // Handle save on blur or enter key
    const saveEdit = () => {
        const newValue = input.value.trim();
        if (newValue !== originalContent) {
            // Save the change
            saveProfileChange(fieldName, newValue);
        }
        // Revert to span with updated content
        const newSpan = document.createElement('span');
        newSpan.id = elementId;
        newSpan.textContent = newValue || element.textContent;
        input.parentNode.replaceChild(newSpan, input);
        
        // Make it editable again on click
        newSpan.addEventListener('click', () => makeEditable(elementId, fieldName, isTextarea));
    };
    
    input.addEventListener('blur', saveEdit);
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            input.blur();
        }
    });
}

// Function to save profile changes
function saveProfileChange(field, value) {
    // Get current user data from localStorage
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    
    // Update the field in user object
    const fieldParts = field.split('.');
    if (fieldParts.length > 1) {
        if (!user[fieldParts[0]]) user[fieldParts[0]] = {};
        user[fieldParts[0]][fieldParts[1]] = value;
    } else {
        user[field] = value;
    }
    
    // Save back to localStorage
    localStorage.setItem('user', JSON.stringify(user));
    
    // Update the UI
    renderProfileData();
    showNotification('Profile updated successfully!', 'success');
}

// Function to open profile editor
function openProfileEditor() {
    // Show the profile tab
    showProfileTab();
    
    // Scroll to the top of the page
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    // Make profile fields editable
    const editableFields = [
        { id: 'profileDisplayName', field: 'fullName' },
        { id: 'profileDisplayTitle', field: 'professionalTitle' },
        { id: 'profileDisplayUni', field: 'education.0.institution' },
        { id: 'profileDisplayLocation', field: 'location' },
        { id: 'profileAboutText', field: 'about', isTextarea: true },
        { id: 'profileContactEmail', field: 'email' },
        { id: 'profileContactPhone', field: 'phone' },
        { id: 'profileAvailability', field: 'availability' }
    ];
    
    // Add click handlers to make fields editable
    editableFields.forEach(({ id, field, isTextarea }) => {
        const element = document.getElementById(id);
        if (element) {
            element.style.cursor = 'pointer';
            element.style.padding = '4px 8px';
            element.style.borderRadius = '4px';
            element.style.transition = 'background-color 0.2s';
            
            element.addEventListener('mouseenter', () => {
                element.style.backgroundColor = 'rgba(0, 0, 0, 0.05)';
            });
            
            element.addEventListener('mouseleave', () => {
                element.style.backgroundColor = '';
            });
            
            element.addEventListener('click', (e) => {
                e.stopPropagation();
                makeEditable(id, field, isTextarea);
            });
        }
    });
    
    // Show a notification to guide the user
    showNotification('Click on any field to edit it. Changes are saved automatically.', 'info');
}

// Make functions globally available
window.saveCoverPhoto = saveCoverPhoto;
window.removeCoverPhoto = removeCoverPhoto;
window.openProfileEditor = openProfileEditor;
window.showQRCodeModal = showQRCodeModal;
window.closeShareModal = closeShareModal;
window.copyProfileLink = copyProfileLink;
window.downloadQRCode = downloadQRCode;
window.previewPublicProfile = previewPublicProfile;
window.closePreviewModal = closePreviewModal;
window.downloadProfilePDF = downloadProfilePDF;

// ===== START DASHBOARD =====
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Professional Dashboard Loading...');
    
    if (checkAuth()) {
        initializeDashboard();
        // Check if user was building portfolio for an application
        checkPendingApplication();
    }
});