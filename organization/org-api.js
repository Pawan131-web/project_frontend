/* ===== ORGANIZATION API SERVICE ===== */
/* Complete integration with SkillLaunch Backend API for Organizations */

// API Configuration
const ORG_API_CONFIG = {
    BASE_URL: 'http://localhost:5000/api',
    TIMEOUT: 10000
};

// Get auth token from localStorage
function getOrgAuthToken() {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    return user.token || null;
}

// Get organization info
function getOrgInfo() {
    return JSON.parse(localStorage.getItem('user') || '{}');
}

// API Request Helper
async function orgApiRequest(endpoint, options = {}) {
    const token = getOrgAuthToken();

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

        // Handle non-JSON responses
        const contentType = response.headers.get('content-type');
        let data;

        if (contentType && contentType.includes('application/json')) {
            data = await response.json();
        } else {
            // If not JSON, return text
            const text = await response.text();
            data = { success: false, message: text || 'Invalid response from server' };
        }

        // Handle 401 Unauthorized
        if (response.status === 401) {
            localStorage.removeItem('user');
            localStorage.removeItem('isLoggedIn');
            window.location.href = 'login-org.html';
            throw new Error('Session expired. Please login again.');
        }

        return data;
    } catch (error) {
        console.error('API Request Error:', error);
        throw error;
    }
}

// ===== POSTS API =====
const OrgPostsAPI = {
    // Get feed posts
    async getFeed(limit = 20) {
        return await orgApiRequest(`${ORG_API_CONFIG.BASE_URL}/posts/feed?limit=${limit}`);
    },

    // Get organization's internships
    async getOrgInternships(orgId) {
        return await orgApiRequest(`${ORG_API_CONFIG.BASE_URL}/posts/internships/org/${orgId}`);
    },

    // Create internship post
    async createInternship(data) {
        return await orgApiRequest(`${ORG_API_CONFIG.BASE_URL}/posts/internship`, {
            method: 'POST',
            body: data
        });
    },

    // Update internship
    async updateInternship(postId, data) {
        return await orgApiRequest(`${ORG_API_CONFIG.BASE_URL}/posts/internship/${postId}`, {
            method: 'PUT',
            body: data
        });
    },

    // Delete post (owner only)
    async deletePost(postId, userId) {
        return await orgApiRequest(`${ORG_API_CONFIG.BASE_URL}/posts/${postId}`, {
            method: 'DELETE',
            body: { userId }
        });
    },

    // Update post (owner only)
    async updatePost(postId, data) {
        return await orgApiRequest(`${ORG_API_CONFIG.BASE_URL}/posts/${postId}`, {
            method: 'PUT',
            body: data
        });
    },

    // Like post
    async likePost(postId, userId) {
        return await orgApiRequest(`${ORG_API_CONFIG.BASE_URL}/posts/${postId}/like`, {
            method: 'PUT',
            body: { userId }
        });
    },

    // Add comment
    async addComment(postId, data) {
        return await orgApiRequest(`${ORG_API_CONFIG.BASE_URL}/posts/${postId}/comments`, {
            method: 'POST',
            body: data
        });
    },

    // Get comments
    async getComments(postId) {
        return await orgApiRequest(`${ORG_API_CONFIG.BASE_URL}/posts/${postId}/comments`);
    },

    // Get top applicants for an internship (with match %)
    async getTopApplicants(internshipId) {
        return await orgApiRequest(`${ORG_API_CONFIG.BASE_URL}/posts/internship/${internshipId}/top-applicants`);
    },

    // Get all applicants for organization's internships
    async getAllTopApplicants(orgId) {
        // First get org's internships, then fetch top applicants for each
        const internships = await this.getOrgInternships(orgId);
        if (!internships.success || !internships.internships?.length) {
            return { success: false, applicants: [] };
        }

        // Get top applicants from first internship (most recent)
        const firstInternship = internships.internships[0];
        return await this.getTopApplicants(firstInternship.id);
    }
};

// ===== USERS API =====
const OrgUsersAPI = {
    // Search users (students, organizations)
    async search(query, type = '') {
        const url = `${ORG_API_CONFIG.BASE_URL}/users/search?q=${encodeURIComponent(query)}${type ? `&type=${type}` : ''}`;
        return await orgApiRequest(url);
    },

    // Get user profile
    async getProfile(userId) {
        return await orgApiRequest(`${ORG_API_CONFIG.BASE_URL}/users/${userId}`);
    },

    // Update own profile
    async updateProfile(userId, data) {
        return await orgApiRequest(`${ORG_API_CONFIG.BASE_URL}/users/${userId}`, {
            method: 'PUT',
            body: data
        });
    }
};

// ===== NOTIFICATIONS API =====
const OrgNotificationsAPI = {
    // Get user notifications
    async getAll(userId) {
        return await orgApiRequest(`${ORG_API_CONFIG.BASE_URL}/notifications/${userId}`);
    },

    // Get user status (including blocked status)
    async getStatus(userId) {
        return await orgApiRequest(`${ORG_API_CONFIG.BASE_URL}/notifications/status/${userId}`);
    },

    // Mark notification as read
    async markAsRead(notificationId) {
        return await orgApiRequest(`${ORG_API_CONFIG.BASE_URL}/notifications/${notificationId}/read`, {
            method: 'PUT'
        });
    },

    // Mark all as read
    async markAllAsRead(userId) {
        return await orgApiRequest(`${ORG_API_CONFIG.BASE_URL}/notifications/${userId}/read-all`, {
            method: 'PUT'
        });
    }
};

// ===== APPEALS API =====
const OrgAppealsAPI = {
    // Submit appeal
    async create(data) {
        return await orgApiRequest(`${ORG_API_CONFIG.BASE_URL}/appeals`, {
            method: 'POST',
            body: data
        });
    },

    // Get user's appeals
    async getByUser(userId) {
        return await orgApiRequest(`${ORG_API_CONFIG.BASE_URL}/appeals/user/${userId}`);
    }
};

// ===== APPLICATIONS API =====
const OrgApplicationsAPI = {
    // Get applications for organization's internships
    async getForOrganization(orgId, filters = {}) {
        const queryString = new URLSearchParams(filters).toString();
        return await orgApiRequest(`${ORG_API_CONFIG.BASE_URL}/applications/organization/${orgId}?${queryString}`);
    },

    // Get applications for specific internship
    async getForInternship(internshipId) {
        return await orgApiRequest(`${ORG_API_CONFIG.BASE_URL}/applications/internship/${internshipId}`);
    },

    // Update application status
    async updateStatus(applicationId, status, feedback = '') {
        return await orgApiRequest(`${ORG_API_CONFIG.BASE_URL}/applications/${applicationId}/status`, {
            method: 'PUT',
            body: { status, feedback }
        });
    }
};

// ===== VERIFICATION API =====
const OrgVerificationAPI = {
    // Submit verification request
    async submit(data) {
        return await orgApiRequest(`${ORG_API_CONFIG.BASE_URL}/verification/submit`, {
            method: 'POST',
            body: data
        });
    },

    // Get verification status
    async getStatus(userId) {
        return await orgApiRequest(`${ORG_API_CONFIG.BASE_URL}/verification/status/${userId}`);
    }
};

// ===== ORGANIZATION PROFILE API =====
const OrgProfileAPI = {
    // Get organization profile from backend
    async getProfile(orgId) {
        return await orgApiRequest(`${ORG_API_CONFIG.BASE_URL}/organization/${orgId}`);
    },

    // Update organization profile (including images)
    async updateProfile(orgId, data) {
        return await orgApiRequest(`${ORG_API_CONFIG.BASE_URL}/organization/${orgId}`, {
            method: 'PUT',
            body: data
        });
    },

    // Create feed post with optional image
    async createFeedPost(data) {
        return await orgApiRequest(`${ORG_API_CONFIG.BASE_URL}/posts/feed`, {
            method: 'POST',
            body: data
        });
    },

    // Delete internship (with ownership validation - userId required)
    async deleteInternship(postId, userId) {
        return await orgApiRequest(`${ORG_API_CONFIG.BASE_URL}/posts/internship/${postId}`, {
            method: 'DELETE',
            body: { userId }
        });
    }
};

// ===== SKILLS API =====
const OrgSkillsAPI = {
    // Get all skills
    async getAll() {
        return await orgApiRequest(`${ORG_API_CONFIG.BASE_URL}/skills`);
    },

    // Search skills
    async search(query) {
        return await orgApiRequest(`${ORG_API_CONFIG.BASE_URL}/skills/search?q=${encodeURIComponent(query)}`);
    }
};

// Export all APIs
window.OrgAPIs = {
    Posts: OrgPostsAPI,
    Users: OrgUsersAPI,
    Notifications: OrgNotificationsAPI,
    Appeals: OrgAppealsAPI,
    Applications: OrgApplicationsAPI,
    Verification: OrgVerificationAPI,
    Skills: OrgSkillsAPI,
    Profile: OrgProfileAPI,
    Config: ORG_API_CONFIG
};

console.log('✅ Organization API Service Loaded');
