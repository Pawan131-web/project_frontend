/* ===== UNIVERSAL PROFILE NAVIGATOR ===== */
/* Handles navigation from feed to any user profile (student or organization) */

const ProfileNavigator = {
    // Navigate to user profile
    async navigateToProfile(username, userType = null) {
        try {
            // Show loading notification
            this.showNotification('Loading profile...', 'info');

            // Fetch user profile
            const response = await fetch(`http://localhost:5000/api/users/profile/${username}`);
            const result = await response.json();

            if (!result.success) {
                this.showNotification('Profile not found', 'error');
                return;
            }

            const user = result.user;

            // Track profile view
            const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
            if (currentUser.id && currentUser.id !== user.id) {
                this.trackProfileView(user.id, currentUser.id);
            }

            // Determine profile URL based on user type
            let profileUrl;
            if (user.userType === 'student') {
                profileUrl = `../student/std-profile.html?username=${username}`;
            } else if (user.userType === 'organization') {
                profileUrl = `../organization/org-profile.html?username=${username}`;
            } else {
                this.showNotification('Invalid user type', 'error');
                return;
            }

            // Navigate to profile
            window.location.href = profileUrl;

        } catch (error) {
            console.error('Profile navigation error:', error);
            this.showNotification('Failed to load profile', 'error');
        }
    },

    // Track profile view
    async trackProfileView(profileUserId, viewerId) {
        try {
            await fetch(`http://localhost:5000/api/profile-views/${profileUserId}/view`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ viewerId })
            });
        } catch (error) {
            console.error('Error tracking profile view:', error);
        }
    },

    // Show notification
    showNotification(message, type = 'info') {
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
            </div>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 3000);
    }
};

// Make globally available
window.ProfileNavigator = ProfileNavigator;

// Helper function for easy access
window.goToProfile = function(username, userType = null) {
    ProfileNavigator.navigateToProfile(username, userType);
};

console.log('✅ Universal Profile Navigator Loaded');
