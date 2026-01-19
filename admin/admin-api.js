/* ===== ADMIN API SERVICE ===== */
/* Complete integration with SkillLaunch Backend API */

// API Configuration
const API_CONFIG = {
    BASE_URL: 'http://localhost:5000/api',
    ADMIN_URL: 'http://localhost:5000/api/admin',
    TIMEOUT: 10000
};

// Get auth token from localStorage
function getAuthToken() {
    return localStorage.getItem('adminToken');
}

// Get admin info
function getAdminInfo() {
    const adminData = localStorage.getItem('adminData');
    return adminData ? JSON.parse(adminData) : null;
}

// API Request Helper
async function apiRequest(endpoint, options = {}) {
    const token = getAuthToken();
    
    const config = {
        method: options.method || 'GET',
        headers: {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` }),
            ...options.headers
        },
        ...options
    };
    
    if (options.body && typeof options.body === 'object') {
        config.body = JSON.stringify(options.body);
    }
    
    try {
        const response = await fetch(endpoint, config);
        const data = await response.json();
        
        // Handle 401 Unauthorized
        if (response.status === 401) {
            localStorage.removeItem('adminToken');
            localStorage.removeItem('adminData');
            window.location.href = 'login-admin.html';
            throw new Error('Session expired. Please login again.');
        }
        
        return data;
    } catch (error) {
        console.error('API Request Error:', error);
        throw error;
    }
}

// ===== AUTHENTICATION API =====
const AuthAPI = {
    // Admin Login
    async login(email, password) {
        const response = await apiRequest(`${API_CONFIG.ADMIN_URL}/auth/login`, {
            method: 'POST',
            body: { email, password }
        });
        
        if (response.success && response.token) {
            localStorage.setItem('adminToken', response.token);
            localStorage.setItem('adminData', JSON.stringify(response.admin));
        }
        
        return response;
    },
    
    // Admin Logout
    async logout() {
        try {
            await apiRequest(`${API_CONFIG.ADMIN_URL}/auth/logout`, {
                method: 'POST'
            });
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            localStorage.removeItem('adminToken');
            localStorage.removeItem('adminData');
        }
    }
};

// ===== USER MANAGEMENT API =====
const UserAPI = {
    // Get all users
    async getAll(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        return await apiRequest(`${API_CONFIG.ADMIN_URL}/users?${queryString}`);
    },
    
    // Get user by ID
    async getById(userId) {
        return await apiRequest(`${API_CONFIG.ADMIN_URL}/users/${userId}`);
    },
    
    // Search all users
    async search(query, type = '') {
        return await apiRequest(`${API_CONFIG.ADMIN_URL}/users/search?query=${encodeURIComponent(query)}&type=${type}`);
    },
    
    // Block user
    async blockUser(userId, reason = '') {
        const adminData = getAdminInfo();
        return await apiRequest(`${API_CONFIG.ADMIN_URL}/users/${userId}/block`, {
            method: 'PUT',
            body: { 
                reason: reason || 'Blocked by admin',
                adminId: adminData?.id || 'admin'
            }
        });
    },
    
    // Unblock user
    async unblockUser(userId) {
        return await apiRequest(`${API_CONFIG.ADMIN_URL}/users/${userId}/unblock`, {
            method: 'PUT'
        });
    },
    
    // Update user status (block/unblock)
    async updateStatus(userId, { action, reason }) {
        if (action === 'block') {
            return await this.blockUser(userId, reason);
        } else if (action === 'unblock') {
            return await this.unblockUser(userId);
        }
        throw new Error('Invalid action');
    },
    
    // Get all students
    async getStudents(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        return await apiRequest(`${API_CONFIG.ADMIN_URL}/students?${queryString}`);
    },
    
    // Get user statistics
    async getStats() {
        return await apiRequest(`${API_CONFIG.ADMIN_URL}/users/stats`);
    }
};

// ===== ORGANIZATION MANAGEMENT API =====
const OrganizationAPI = {
    // Get all organizations
    async getAll(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        return await apiRequest(`${API_CONFIG.ADMIN_URL}/organizations?${queryString}`);
    },
    
    // Get pending organizations
    async getPending() {
        return await apiRequest(`${API_CONFIG.ADMIN_URL}/organizations/pending`);
    },
    
    // Get single organization
    async getById(id) {
        return await apiRequest(`${API_CONFIG.ADMIN_URL}/organizations/${id}`);
    },
    
    // Verify organization
    async verify(id) {
        return await apiRequest(`${API_CONFIG.ADMIN_URL}/organizations/${id}/verify`, {
            method: 'PUT'
        });
    },
    
    // Reject organization
    async reject(id, reason, deleteAccount = false) {
        return await apiRequest(`${API_CONFIG.ADMIN_URL}/organizations/${id}/reject`, {
            method: 'PUT',
            body: { reason, deleteAccount }
        });
    },
    
    // Get organization statistics
    async getStats() {
        return await apiRequest(`${API_CONFIG.ADMIN_URL}/organizations/stats`);
    }
};

// ===== CONTENT MODERATION API =====
const ContentAPI = {
    // Get all posts
    async getPosts(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        return await apiRequest(`${API_CONFIG.ADMIN_URL}/content/posts?${queryString}`);
    },
    
    // Get single post
    async getPost(id) {
        return await apiRequest(`${API_CONFIG.ADMIN_URL}/content/posts/${id}`);
    },
    
    // Delete post
    async deletePost(id, reason) {
        return await apiRequest(`${API_CONFIG.ADMIN_URL}/content/posts/${id}`, {
            method: 'DELETE',
            body: { reason }
        });
    },
    
    // Get all reports
    async getReports(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        return await apiRequest(`${API_CONFIG.ADMIN_URL}/content/reports?${queryString}`);
    },
    
    // Get single report
    async getReport(id) {
        return await apiRequest(`${API_CONFIG.ADMIN_URL}/content/reports/${id}`);
    },
    
    // Resolve report
    async resolveReport(id, action) {
        return await apiRequest(`${API_CONFIG.ADMIN_URL}/content/reports/${id}/resolve`, {
            method: 'PUT',
            body: { action }
        });
    },
    
    // Take action on report
    async takeAction(id, action, reason) {
        return await apiRequest(`${API_CONFIG.ADMIN_URL}/content/reports/${id}/action`, {
            method: 'POST',
            body: { action, note: reason }
        });
    },
    
    // Get content statistics
    async getStats() {
        return await apiRequest(`${API_CONFIG.ADMIN_URL}/content/stats`);
    }
};

// ===== ANALYTICS API =====
const AnalyticsAPI = {
    // Get platform overview
    async getOverview() {
        return await apiRequest(`${API_CONFIG.ADMIN_URL}/analytics/overview`);
    },
    
    // Get user growth data
    async getGrowth(days = 30) {
        return await apiRequest(`${API_CONFIG.ADMIN_URL}/analytics/growth?days=${days}`);
    },
    
    // Get engagement metrics
    async getEngagement() {
        return await apiRequest(`${API_CONFIG.ADMIN_URL}/analytics/engagement`);
    },
    
    // Get activity logs
    async getActivityLogs(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        return await apiRequest(`${API_CONFIG.ADMIN_URL}/analytics/activity-logs?${queryString}`);
    }
};

// ===== ANNOUNCEMENTS API =====
const AnnouncementAPI = {
    // Get all announcements
    async getAll(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        return await apiRequest(`${API_CONFIG.ADMIN_URL}/announcements?${queryString}`);
    },
    
    // Get single announcement
    async getById(id) {
        return await apiRequest(`${API_CONFIG.ADMIN_URL}/announcements/${id}`);
    },
    
    // Create announcement
    async create(data) {
        return await apiRequest(`${API_CONFIG.ADMIN_URL}/announcements`, {
            method: 'POST',
            body: data
        });
    },
    
    // Update announcement
    async update(id, data) {
        return await apiRequest(`${API_CONFIG.ADMIN_URL}/announcements/${id}`, {
            method: 'PUT',
            body: data
        });
    },
    
    // Delete announcement
    async delete(id) {
        return await apiRequest(`${API_CONFIG.ADMIN_URL}/announcements/${id}`, {
            method: 'DELETE'
        });
    },
    
    // Send announcement
    async send(id) {
        return await apiRequest(`${API_CONFIG.ADMIN_URL}/announcements/${id}/send`, {
            method: 'POST'
        });
    },
    
    // Get announcement statistics
    async getStats() {
        return await apiRequest(`${API_CONFIG.ADMIN_URL}/announcements/stats`);
    }
};

// ===== SKILLS MANAGEMENT API =====
const SkillAPI = {
    // Get all skills
    async getAll(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        return await apiRequest(`${API_CONFIG.ADMIN_URL}/skills?${queryString}`);
    },
    
    // Get single skill
    async getById(id) {
        return await apiRequest(`${API_CONFIG.ADMIN_URL}/skills/${id}`);
    },
    
    // Create skill
    async create(data) {
        return await apiRequest(`${API_CONFIG.ADMIN_URL}/skills`, {
            method: 'POST',
            body: data
        });
    },
    
    // Update skill
    async update(id, data) {
        return await apiRequest(`${API_CONFIG.ADMIN_URL}/skills/${id}`, {
            method: 'PUT',
            body: data
        });
    },
    
    // Delete skill
    async delete(id) {
        return await apiRequest(`${API_CONFIG.ADMIN_URL}/skills/${id}`, {
            method: 'DELETE'
        });
    },
    
    // Get skill categories
    async getCategories() {
        return await apiRequest(`${API_CONFIG.ADMIN_URL}/skills/categories`);
    },
    
    // Bulk add skills
    async bulkAdd(skills) {
        return await apiRequest(`${API_CONFIG.ADMIN_URL}/skills/bulk`, {
            method: 'POST',
            body: { skills }
        });
    },
    
    // Get skill statistics
    async getStats() {
        return await apiRequest(`${API_CONFIG.ADMIN_URL}/skills/stats`);
    }
};

// ===== PLATFORM SETTINGS API =====
const SettingAPI = {
    // Initialize default settings
    async initialize() {
        return await apiRequest(`${API_CONFIG.ADMIN_URL}/settings/initialize`, {
            method: 'POST'
        });
    },
    
    // Get all settings
    async getAll(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        return await apiRequest(`${API_CONFIG.ADMIN_URL}/settings?${queryString}`);
    },
    
    // Get single setting
    async getByKey(key) {
        return await apiRequest(`${API_CONFIG.ADMIN_URL}/settings/${key}`);
    },
    
    // Update single setting
    async update(key, value) {
        return await apiRequest(`${API_CONFIG.ADMIN_URL}/settings/${key}`, {
            method: 'PUT',
            body: { value }
        });
    },
    
    // Update multiple settings
    async updateMultiple(settings) {
        return await apiRequest(`${API_CONFIG.ADMIN_URL}/settings`, {
            method: 'PUT',
            body: { settings }
        });
    },
    
    // Get system health
    async getSystemHealth() {
        return await apiRequest(`${API_CONFIG.ADMIN_URL}/settings/system/health`);
    }
};

// ===== ADMIN MANAGEMENT API =====
const AdminAPI = {
    // Get all admins
    async getAll(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        return await apiRequest(`${API_CONFIG.ADMIN_URL}/admins?${queryString}`);
    },
    
    // Get single admin
    async getById(id) {
        return await apiRequest(`${API_CONFIG.ADMIN_URL}/admins/${id}`);
    },
    
    // Create admin
    async create(data) {
        return await apiRequest(`${API_CONFIG.ADMIN_URL}/admins`, {
            method: 'POST',
            body: data
        });
    },
    
    // Update admin
    async update(id, data) {
        return await apiRequest(`${API_CONFIG.ADMIN_URL}/admins/${id}`, {
            method: 'PUT',
            body: data
        });
    },
    
    // Update admin permissions
    async updatePermissions(id, permissions) {
        return await apiRequest(`${API_CONFIG.ADMIN_URL}/admins/${id}/permissions`, {
            method: 'PUT',
            body: { permissions }
        });
    },
    
    // Delete admin
    async delete(id) {
        return await apiRequest(`${API_CONFIG.ADMIN_URL}/admins/${id}`, {
            method: 'DELETE'
        });
    },
    
    // Get admin statistics
    async getStats() {
        return await apiRequest(`${API_CONFIG.ADMIN_URL}/admins/stats`);
    }
};

// ===== APPEALS API =====
const AppealAPI = {
    // Get all appeals
    async getAll(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        return await apiRequest(`${API_CONFIG.BASE_URL}/appeals?${queryString}`);
    },
    
    // Respond to appeal
    async respond(id, data) {
        return await apiRequest(`${API_CONFIG.BASE_URL}/appeals/${id}/respond`, {
            method: 'PUT',
            body: data
        });
    }
};

// Export all APIs
window.AdminAPIs = {
    Auth: AuthAPI,
    User: UserAPI,
    Organization: OrganizationAPI,
    Content: ContentAPI,
    Analytics: AnalyticsAPI,
    Announcement: AnnouncementAPI,
    Skill: SkillAPI,
    Setting: SettingAPI,
    Admin: AdminAPI,
    Appeal: AppealAPI
};

console.log('✅ Admin API Service Loaded');
