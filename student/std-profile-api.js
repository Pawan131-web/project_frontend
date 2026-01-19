/* ===== STUDENT PROFILE API SERVICE ===== */

const API_BASE = 'http://localhost:5000/api';

// Profile API Service
const ProfileAPI = {
    // Get profile
    async getProfile(userId) {
        try {
            const response = await fetch(`${API_BASE}/profile/${userId}`);
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error fetching profile:', error);
            throw error;
        }
    },

    // Update profile
    async updateProfile(userId, profileData) {
        try {
            const response = await fetch(`${API_BASE}/profile/${userId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(profileData)
            });
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error updating profile:', error);
            throw error;
        }
    },

    // Update profile picture
    async updateProfilePicture(userId, imageUrl) {
        try {
            const response = await fetch(`${API_BASE}/profile/${userId}/picture`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ profilePicture: imageUrl })
            });
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error updating profile picture:', error);
            throw error;
        }
    },

    // Update cover image
    async updateCoverImage(userId, imageUrl) {
        try {
            const response = await fetch(`${API_BASE}/profile/${userId}/cover`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ coverImage: imageUrl })
            });
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error updating cover image:', error);
            throw error;
        }
    }
};

// Profile Editor Class
class ProfileEditor {
    constructor() {
        this.editMode = false;
        this.currentUser = null;
        this.originalData = {};
        this.pendingChanges = {};
    }

    init() {
        this.currentUser = JSON.parse(localStorage.getItem('user') || '{}');
        if (!this.currentUser.id) {
            console.error('No user logged in');
            return;
        }
        this.loadProfile();
        this.setupEventListeners();
    }

    async loadProfile() {
        try {
            const result = await ProfileAPI.getProfile(this.currentUser.id);
            if (result.success) {
                this.originalData = result.user;
                this.renderProfile(result.user);
            }
        } catch (error) {
            console.error('Failed to load profile:', error);
            this.showNotification('Failed to load profile', 'error');
        }
    }

    setupEventListeners() {
        // Edit button
        const editBtn = document.querySelector('[onclick="toggleEditMode()"]');
        if (editBtn) {
            editBtn.onclick = () => this.toggleEditMode();
        }
    }

    toggleEditMode() {
        this.editMode = !this.editMode;
        const btn = document.querySelector('[onclick="toggleEditMode()"]');
        
        if (this.editMode) {
            btn.innerHTML = '<i class="fas fa-save mr-2"></i>Save Changes';
            btn.classList.add('bg-green-600');
            btn.classList.remove('red-btn');
            this.enableEditing();
        } else {
            this.saveAllChanges();
        }
    }

    enableEditing() {
        // Make fields editable
        document.querySelectorAll('[data-editable]').forEach(el => {
            const field = el.getAttribute('data-editable');
            el.contentEditable = true;
            el.classList.add('border', 'border-blue-300', 'rounded', 'px-2', 'py-1');
            
            el.addEventListener('input', () => {
                this.pendingChanges[field] = el.textContent.trim();
            });
        });

        this.showNotification('Edit mode enabled. Click fields to edit.', 'info');
    }

    async saveAllChanges() {
        if (Object.keys(this.pendingChanges).length === 0) {
            this.exitEditMode();
            return;
        }

        try {
            this.showNotification('Saving changes...', 'info');
            
            const result = await ProfileAPI.updateProfile(this.currentUser.id, this.pendingChanges);
            
            if (result.success) {
                this.showNotification('Profile updated successfully!', 'success');
                this.originalData = result.user;
                this.pendingChanges = {};
                this.exitEditMode();
                
                // Update localStorage
                const user = JSON.parse(localStorage.getItem('user') || '{}');
                Object.assign(user, result.user);
                localStorage.setItem('user', JSON.stringify(user));
            } else {
                this.showNotification(result.message || 'Failed to save changes', 'error');
            }
        } catch (error) {
            console.error('Save error:', error);
            this.showNotification('Error saving changes', 'error');
        }
    }

    exitEditMode() {
        this.editMode = false;
        const btn = document.querySelector('[onclick="toggleEditMode()"]');
        btn.innerHTML = '<i class="fas fa-edit mr-2"></i>Edit Profile';
        btn.classList.remove('bg-green-600');
        btn.classList.add('red-btn');

        document.querySelectorAll('[data-editable]').forEach(el => {
            el.contentEditable = false;
            el.classList.remove('border', 'border-blue-300', 'rounded', 'px-2', 'py-1');
        });
    }

    renderProfile(user) {
        // Update profile display
        if (user.fullName) {
            const nameEl = document.querySelector('[data-editable="fullName"]');
            if (nameEl) nameEl.textContent = user.fullName;
        }
        
        if (user.headline) {
            const headlineEl = document.querySelector('[data-editable="headline"]');
            if (headlineEl) headlineEl.textContent = user.headline;
        }
        
        if (user.bio) {
            const bioEl = document.querySelector('[data-editable="bio"]');
            if (bioEl) bioEl.textContent = user.bio;
        }
    }

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
        }, 5000);
    }
}

// Initialize on page load
let profileEditor;
document.addEventListener('DOMContentLoaded', () => {
    profileEditor = new ProfileEditor();
    profileEditor.init();
});

// Export for use in HTML
window.ProfileAPI = ProfileAPI;
window.profileEditor = profileEditor;
