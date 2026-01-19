//js/auth-check.js
// Protect pages that require login
document.addEventListener('DOMContentLoaded', function() {
    console.log('🔐 Auth check running...');
    
    // Check if user is logged in
    const user = localStorage.getItem('user');
    const isLoggedIn = localStorage.getItem('isLoggedIn');
    
    // If not logged in, redirect to login
    if (!user || !isLoggedIn || isLoggedIn !== 'true') {
        console.log('❌ Not logged in, redirecting to login...');
        
        // Store where they tried to go (for redirect after login)
        localStorage.setItem('redirectUrl', window.location.pathname);
        
        // Check which type of page they're trying to access
        const path = window.location.pathname;
        
        if (path.includes('org-dashboard') || path.includes('organization')) {
            // Trying to access organization page
            window.location.href = '../organization/login-org.html';
        } else if (path.includes('std-dashboard') || path.includes('portfolio-builder') || path.includes('student')) {
            // Trying to access student page
            window.location.href = '../student/login-std.html';
        } else {
            // Default to student login
            window.location.href = '../student/login-std.html';
        }
        return;
    }
    
    // Parse user data
    let userData;
    try {
        userData = JSON.parse(user);
    } catch (error) {
        console.error('Error parsing user data:', error);
        localStorage.clear();
        window.location.href = '../index.html';
        return;
    }
    
    console.log('✅ Logged in as:', userData.fullName, '- Type:', userData.userType);
    
    // ========== CHECK USER TYPE MATCHES PAGE ==========
    const path = window.location.pathname;
    
    // If user is STUDENT but trying to access ORGANIZATION pages
    if (userData.userType === 'student') {
        if (path.includes('org-dashboard') || path.includes('/organization/')) {
            console.log('❌ Student trying to access org page, redirecting...');
            alert('This page is for organizations only. Redirecting to student dashboard...');
            window.location.href = '../student/std-dashboard.html';
            return;
        }
    }
    
    // If user is ORGANIZATION but trying to access STUDENT pages
    if (userData.userType === 'organization') {
        if (path.includes('std-dashboard') || path.includes('portfolio-builder') || path.includes('/student/')) {
            console.log('❌ Organization trying to access student page, redirecting...');
            alert('This page is for students only. Redirecting to organization dashboard...');
            window.location.href = '../organization/org-dashboard.html';
            return;
        }
    }

    if (userData.userType === 'organization' && userData.orgVerificationStatus !== 'verified') {
        const restrictedOrgPaths = [
            'post-internship',
            'view-applications',
            'browse-students',
            'org-analytics',
            'org-messages'
        ];
        const isRestricted = restrictedOrgPaths.some(segment => path.includes(segment));
        if (isRestricted) {
            alert('Please verify your organization to access this feature.');
            window.location.href = '../organization/org-dashboard.html';
            return;
        }
    }
    
    // ========== DISPLAY USER INFO (Optional) ==========
    // You can call a function here to update UI with user info
    displayUserInfo(userData);
    
    // ========== CHECK IF EMAIL IS VERIFIED ==========
    // Optional: Add this if you want to force verification
    if (!userData.isVerified) {
        console.log('⚠️ User not verified');
        // Uncomment to force verification
        // alert('Please verify your email first');
        // localStorage.setItem('pendingVerificationEmail', userData.email);
        // window.location.href = '../pages/verify-email.html?email=' + encodeURIComponent(userData.email);
        // return;
    }
});

// Function to display user info on the page
function displayUserInfo(userData) {
    // Update elements with user data if they exist
    const userNameElements = document.querySelectorAll('#userName, .user-name, .welcome-user');
    const userEmailElements = document.querySelectorAll('#userEmail, .user-email');
    const userTypeElements = document.querySelectorAll('#userType, .user-type');
    const userAvatarElements = document.querySelectorAll('.user-avatar, .avatar-initials');
    
    // Update name
    userNameElements.forEach(el => {
        if (userData.fullName) {
            el.textContent = userData.fullName;
        }
    });
    
    // Update email
    userEmailElements.forEach(el => {
        if (userData.email) {
            el.textContent = userData.email;
        }
    });
    
    // Update user type
    userTypeElements.forEach(el => {
        if (userData.userType) {
            el.textContent = userData.userType === 'student' ? 'Student' : 'Organization';
        }
    });
    
    // Update avatar with initials
    userAvatarElements.forEach(el => {
        if (userData.fullName && !el.textContent.trim()) {
            const initials = userData.fullName
                .split(' ')
                .map(name => name[0])
                .join('')
                .toUpperCase()
                .substring(0, 2);
            el.textContent = initials;
        }
    });
    
    // Update welcome message if exists
    const welcomeMsg = document.querySelector('.welcome-message, .welcome-text');
    if (welcomeMsg && userData.fullName) {
        const timeOfDay = getTimeOfDay();
        welcomeMsg.textContent = `${timeOfDay}, ${userData.fullName.split(' ')[0]}!`;
    }
}

// Helper function for welcome message
function getTimeOfDay() {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
}

// Function to check if user is logged in (for other scripts)
function isUserLoggedIn() {
    const user = localStorage.getItem('user');
    const isLoggedIn = localStorage.getItem('isLoggedIn');
    return !!(user && isLoggedIn && isLoggedIn === 'true');
}

// Function to get current user data
function getCurrentUser() {
    const user = localStorage.getItem('user');
    try {
        return JSON.parse(user || '{}');
    } catch {
        return {};
    }
}

// Function to check if user is verified
function isUserVerified() {
    const user = getCurrentUser();
    return user.isVerified === true;
}

// Function to get user type
function getUserType() {
    const user = getCurrentUser();
    return user.userType || 'student';
}

// Export functions for use in other scripts
window.authCheck = {
    isLoggedIn: isUserLoggedIn,
    getCurrentUser: getCurrentUser,
    isVerified: isUserVerified,
    getUserType: getUserType,
    displayUserInfo: displayUserInfo
};