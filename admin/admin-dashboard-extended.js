/* ===== EXTENDED ADMIN DASHBOARD SECTIONS ===== */
/* This file contains the missing section loaders for Skills, Announcements, Analytics, Content, and Settings */

// Load Skills Section
function loadSkillsSection() {
    const skillsSection = document.getElementById('skillsSection');
    
    skillsSection.innerHTML = `
        <div class="mb-6">
            <div class="flex justify-between items-center">
                <h2 class="text-xl font-bold text-gray-800">Skills Management</h2>
                <div class="flex gap-3">
                    <button onclick="showAddSkillModal()" class="px-4 py-2 bg-[#d32f2f] text-white rounded-lg hover:bg-[#b71c1c]">
                        <i class="fas fa-plus mr-2"></i> Add Skill
                    </button>
                </div>
            </div>
            <p class="text-gray-600 mt-2">Manage skills and categories for the platform</p>
        </div>
        
        <!-- Skills Stats -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div class="bg-white p-6 rounded-lg border">
                <div class="text-3xl font-bold text-blue-600">150</div>
                <div class="text-gray-600">Total Skills</div>
            </div>
            <div class="bg-white p-6 rounded-lg border">
                <div class="text-3xl font-bold text-green-600">12</div>
                <div class="text-gray-600">Categories</div>
            </div>
            <div class="bg-white p-6 rounded-lg border">
                <div class="text-3xl font-bold text-purple-600">45</div>
                <div class="text-gray-600">Popular Skills</div>
            </div>
            <div class="bg-white p-6 rounded-lg border">
                <div class="text-3xl font-bold text-orange-600">8</div>
                <div class="text-gray-600">New This Month</div>
            </div>
        </div>
        
        <!-- Skills Table -->
        <div class="bg-white border rounded-lg overflow-hidden">
            <div class="p-4 border-b">
                <div class="flex gap-4">
                    <select class="border rounded-lg px-3 py-2">
                        <option>All Categories</option>
                        <option>Programming</option>
                        <option>Design</option>
                        <option>Marketing</option>
                    </select>
                    <input type="text" placeholder="Search skills..." class="border rounded-lg px-3 py-2 flex-1">
                </div>
            </div>
            <div class="overflow-x-auto">
                <table class="w-full">
                    <thead class="bg-gray-50">
                        <tr>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Skill Name</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Popularity</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-gray-200">
                        <tr>
                            <td class="px-6 py-4">JavaScript</td>
                            <td class="px-6 py-4">Programming</td>
                            <td class="px-6 py-4"><span class="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">High</span></td>
                            <td class="px-6 py-4">
                                <button class="text-blue-600 hover:text-blue-800 mr-3"><i class="fas fa-edit"></i></button>
                                <button class="text-red-600 hover:text-red-800"><i class="fas fa-trash"></i></button>
                            </td>
                        </tr>
                        <tr>
                            <td class="px-6 py-4">React</td>
                            <td class="px-6 py-4">Programming</td>
                            <td class="px-6 py-4"><span class="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">High</span></td>
                            <td class="px-6 py-4">
                                <button class="text-blue-600 hover:text-blue-800 mr-3"><i class="fas fa-edit"></i></button>
                                <button class="text-red-600 hover:text-red-800"><i class="fas fa-trash"></i></button>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

// Load Announcements Section
function loadAnnouncementsSection() {
    const announcementsSection = document.getElementById('announcementsSection');
    
    announcementsSection.innerHTML = `
        <div class="mb-6">
            <div class="flex justify-between items-center">
                <h2 class="text-xl font-bold text-gray-800">Announcements</h2>
                <div class="flex gap-3">
                    <button onclick="showCreateAnnouncementModal()" class="px-4 py-2 bg-[#d32f2f] text-white rounded-lg hover:bg-[#b71c1c]">
                        <i class="fas fa-plus mr-2"></i> Create Announcement
                    </button>
                </div>
            </div>
            <p class="text-gray-600 mt-2">Send notifications and announcements to users</p>
        </div>
        
        <!-- Announcement Stats -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div class="bg-white p-6 rounded-lg border">
                <div class="text-3xl font-bold text-blue-600">24</div>
                <div class="text-gray-600">Total Sent</div>
            </div>
            <div class="bg-white p-6 rounded-lg border">
                <div class="text-3xl font-bold text-green-600">3</div>
                <div class="text-gray-600">This Month</div>
            </div>
            <div class="bg-white p-6 rounded-lg border">
                <div class="text-3xl font-bold text-purple-600">5,428</div>
                <div class="text-gray-600">Total Reach</div>
            </div>
            <div class="bg-white p-6 rounded-lg border">
                <div class="text-3xl font-bold text-orange-600">92%</div>
                <div class="text-gray-600">Open Rate</div>
            </div>
        </div>
        
        <!-- Announcements List -->
        <div class="space-y-4">
            <div class="bg-white border rounded-lg p-6">
                <div class="flex justify-between items-start mb-4">
                    <div>
                        <h3 class="font-bold text-lg text-gray-800">Platform Maintenance Notice</h3>
                        <p class="text-sm text-gray-600 mt-1">Sent to: All Users • 2 days ago</p>
                    </div>
                    <span class="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">Sent</span>
                </div>
                <p class="text-gray-700 mb-4">The platform will undergo scheduled maintenance on Sunday, January 15th from 2:00 AM to 6:00 AM EST...</p>
                <div class="flex gap-2">
                    <button class="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm">
                        <i class="fas fa-eye mr-2"></i> View Details
                    </button>
                    <button class="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm">
                        <i class="fas fa-chart-bar mr-2"></i> View Stats
                    </button>
                </div>
            </div>
            
            <div class="bg-white border rounded-lg p-6">
                <div class="flex justify-between items-start mb-4">
                    <div>
                        <h3 class="font-bold text-lg text-gray-800">New Features Released</h3>
                        <p class="text-sm text-gray-600 mt-1">Sent to: All Users • 1 week ago</p>
                    </div>
                    <span class="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">Sent</span>
                </div>
                <p class="text-gray-700 mb-4">We're excited to announce new features including enhanced search, improved messaging, and more...</p>
                <div class="flex gap-2">
                    <button class="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm">
                        <i class="fas fa-eye mr-2"></i> View Details
                    </button>
                    <button class="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm">
                        <i class="fas fa-chart-bar mr-2"></i> View Stats
                    </button>
                </div>
            </div>
        </div>
    `;
}

// Load Analytics Section
function loadAnalyticsSection() {
    const analyticsSection = document.getElementById('analyticsSection');
    
    analyticsSection.innerHTML = `
        <div class="mb-6">
            <h2 class="text-xl font-bold text-gray-800">Analytics & Insights</h2>
            <p class="text-gray-600 mt-2">Platform performance and user engagement metrics</p>
        </div>
        
        <!-- Analytics Stats -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div class="bg-white p-6 rounded-lg border">
                <div class="text-3xl font-bold text-blue-600">5,428</div>
                <div class="text-gray-600">Total Users</div>
                <div class="text-sm text-green-600 mt-2">
                    <i class="fas fa-arrow-up"></i> 12% from last month
                </div>
            </div>
            <div class="bg-white p-6 rounded-lg border">
                <div class="text-3xl font-bold text-green-600">3,245</div>
                <div class="text-gray-600">Active Users</div>
                <div class="text-sm text-green-600 mt-2">
                    <i class="fas fa-arrow-up"></i> 8% from last month
                </div>
            </div>
            <div class="bg-white p-6 rounded-lg border">
                <div class="text-3xl font-bold text-purple-600">1,218</div>
                <div class="text-gray-600">Organizations</div>
                <div class="text-sm text-green-600 mt-2">
                    <i class="fas fa-arrow-up"></i> 15% from last month
                </div>
            </div>
            <div class="bg-white p-6 rounded-lg border">
                <div class="text-3xl font-bold text-orange-600">342</div>
                <div class="text-gray-600">Active Internships</div>
                <div class="text-sm text-green-600 mt-2">
                    <i class="fas fa-arrow-up"></i> 20% from last month
                </div>
            </div>
        </div>
        
        <!-- Charts -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <div class="bg-white border rounded-lg p-6">
                <h3 class="font-bold text-gray-800 mb-4">User Growth Trend</h3>
                <div class="h-64 flex items-center justify-center text-gray-400">
                    <i class="fas fa-chart-line text-4xl"></i>
                </div>
            </div>
            <div class="bg-white border rounded-lg p-6">
                <h3 class="font-bold text-gray-800 mb-4">User Engagement</h3>
                <div class="h-64 flex items-center justify-center text-gray-400">
                    <i class="fas fa-chart-bar text-4xl"></i>
                </div>
            </div>
        </div>
        
        <!-- Activity Logs -->
        <div class="bg-white border rounded-lg p-6">
            <h3 class="font-bold text-gray-800 mb-4">Recent Activity</h3>
            <div class="space-y-3">
                <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div class="flex items-center gap-3">
                        <i class="fas fa-user-plus text-blue-600"></i>
                        <span class="text-gray-700">New user registration: john@example.com</span>
                    </div>
                    <span class="text-sm text-gray-500">2 minutes ago</span>
                </div>
                <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div class="flex items-center gap-3">
                        <i class="fas fa-briefcase text-green-600"></i>
                        <span class="text-gray-700">New internship posted by TechCorp</span>
                    </div>
                    <span class="text-sm text-gray-500">15 minutes ago</span>
                </div>
                <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div class="flex items-center gap-3">
                        <i class="fas fa-check-circle text-purple-600"></i>
                        <span class="text-gray-700">Organization verified: Google Inc.</span>
                    </div>
                    <span class="text-sm text-gray-500">1 hour ago</span>
                </div>
            </div>
        </div>
    `;
}

// Load Content Section
function loadContentSection() {
    const contentSection = document.getElementById('contentSection');
    
    contentSection.innerHTML = `
        <div class="mb-6">
            <h2 class="text-xl font-bold text-gray-800">Content Management</h2>
            <p class="text-gray-600 mt-2">Manage posts, internships, and platform content</p>
        </div>
        
        <!-- Content Stats -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div class="bg-white p-6 rounded-lg border">
                <div class="text-3xl font-bold text-blue-600">1,245</div>
                <div class="text-gray-600">Total Posts</div>
            </div>
            <div class="bg-white p-6 rounded-lg border">
                <div class="text-3xl font-bold text-green-600">342</div>
                <div class="text-gray-600">Internships</div>
            </div>
            <div class="bg-white p-6 rounded-lg border">
                <div class="text-3xl font-bold text-purple-600">89</div>
                <div class="text-gray-600">Pending Review</div>
            </div>
            <div class="bg-white p-6 rounded-lg border">
                <div class="text-3xl font-bold text-red-600">12</div>
                <div class="text-gray-600">Flagged Content</div>
            </div>
        </div>
        
        <!-- Content Filters -->
        <div class="bg-white border rounded-lg p-4 mb-6">
            <div class="flex gap-4">
                <select class="border rounded-lg px-3 py-2">
                    <option>All Content</option>
                    <option>Posts</option>
                    <option>Internships</option>
                    <option>Updates</option>
                </select>
                <select class="border rounded-lg px-3 py-2">
                    <option>All Status</option>
                    <option>Active</option>
                    <option>Pending</option>
                    <option>Flagged</option>
                </select>
                <input type="text" placeholder="Search content..." class="border rounded-lg px-3 py-2 flex-1">
                <button class="px-4 py-2 bg-[#d32f2f] text-white rounded-lg hover:bg-[#b71c1c]">
                    <i class="fas fa-search"></i>
                </button>
            </div>
        </div>
        
        <!-- Content List -->
        <div class="space-y-4">
            <div class="bg-white border rounded-lg p-6">
                <div class="flex justify-between items-start mb-4">
                    <div>
                        <span class="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">Internship</span>
                        <h3 class="font-bold text-lg text-gray-800 mt-2">Software Engineering Intern - Summer 2025</h3>
                        <p class="text-sm text-gray-600 mt-1">Posted by: TechCorp • 2 days ago</p>
                    </div>
                    <span class="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">Active</span>
                </div>
                <p class="text-gray-700 mb-4">Looking for talented software engineering interns to join our team...</p>
                <div class="flex gap-2">
                    <button class="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm">
                        <i class="fas fa-eye mr-2"></i> View
                    </button>
                    <button class="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm">
                        <i class="fas fa-edit mr-2"></i> Edit
                    </button>
                    <button class="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 text-sm">
                        <i class="fas fa-trash mr-2"></i> Remove
                    </button>
                </div>
            </div>
        </div>
    `;
}

// Load Settings Section
function loadSettingsSection() {
    const settingsSection = document.getElementById('settingsSection');
    
    settingsSection.innerHTML = `
        <div class="mb-6">
            <h2 class="text-xl font-bold text-gray-800">Platform Settings</h2>
            <p class="text-gray-600 mt-2">Configure platform settings and preferences</p>
        </div>
        
        <!-- Settings Tabs -->
        <div class="bg-white border rounded-lg overflow-hidden">
            <div class="border-b">
                <div class="flex">
                    <button class="px-6 py-3 border-b-2 border-[#d32f2f] text-[#d32f2f] font-medium">General</button>
                    <button class="px-6 py-3 text-gray-600 hover:text-gray-800">Email</button>
                    <button class="px-6 py-3 text-gray-600 hover:text-gray-800">Security</button>
                    <button class="px-6 py-3 text-gray-600 hover:text-gray-800">System</button>
                </div>
            </div>
            
            <div class="p-6">
                <!-- General Settings -->
                <div class="space-y-6">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Platform Name</label>
                        <input type="text" value="SkillLaunch" class="w-full border rounded-lg px-4 py-2">
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Platform Description</label>
                        <textarea class="w-full border rounded-lg px-4 py-2" rows="3">Connect students with internship opportunities</textarea>
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Contact Email</label>
                        <input type="email" value="support@skilllaunch.com" class="w-full border rounded-lg px-4 py-2">
                    </div>
                    
                    <div>
                        <label class="flex items-center gap-2">
                            <input type="checkbox" checked class="rounded">
                            <span class="text-sm text-gray-700">Allow new user registrations</span>
                        </label>
                    </div>
                    
                    <div>
                        <label class="flex items-center gap-2">
                            <input type="checkbox" checked class="rounded">
                            <span class="text-sm text-gray-700">Require email verification</span>
                        </label>
                    </div>
                    
                    <div>
                        <label class="flex items-center gap-2">
                            <input type="checkbox" class="rounded">
                            <span class="text-sm text-gray-700">Maintenance mode</span>
                        </label>
                    </div>
                    
                    <div class="pt-4 border-t">
                        <button class="px-6 py-2 bg-[#d32f2f] text-white rounded-lg hover:bg-[#b71c1c]">
                            Save Changes
                        </button>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- System Health -->
        <div class="mt-6 bg-white border rounded-lg p-6">
            <h3 class="font-bold text-gray-800 mb-4">System Health</h3>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div class="p-4 bg-green-50 rounded-lg">
                    <div class="flex items-center justify-between">
                        <span class="text-gray-700">Database</span>
                        <span class="text-green-600 font-medium">Online</span>
                    </div>
                </div>
                <div class="p-4 bg-green-50 rounded-lg">
                    <div class="flex items-center justify-between">
                        <span class="text-gray-700">API Server</span>
                        <span class="text-green-600 font-medium">Online</span>
                    </div>
                </div>
                <div class="p-4 bg-green-50 rounded-lg">
                    <div class="flex items-center justify-between">
                        <span class="text-gray-700">Email Service</span>
                        <span class="text-green-600 font-medium">Online</span>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Placeholder functions for modals
function showAddSkillModal() {
    showNotification('Add Skill modal - Coming soon!', 'info');
}

function showCreateAnnouncementModal() {
    showNotification('Create Announcement modal - Coming soon!', 'info');
}

console.log('✅ Extended Admin Dashboard Sections Loaded');
