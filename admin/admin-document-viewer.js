/* ===== ADMIN DOCUMENT VIEWER ===== */

// View organization verification documents
async function viewOrgDocuments(orgId, orgName) {
    try {
        // Fetch organization details including documents
        const response = await fetch(`http://localhost:5000/api/admin/organizations/${orgId}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
            }
        });
        
        const result = await response.json();
        
        if (!result.success) {
            showNotification('Failed to load organization documents', 'error');
            return;
        }

        const org = result.organization;
        const documents = org.verificationDocuments || [];

        // Create modal
        const modal = document.createElement('div');
        modal.id = 'documentViewerModal';
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4';
        
        modal.innerHTML = `
            <div class="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
                <!-- Header -->
                <div class="p-6 border-b flex justify-between items-center bg-gray-50">
                    <div>
                        <h2 class="text-2xl font-bold text-gray-800">Verification Documents</h2>
                        <p class="text-gray-600 mt-1">${orgName}</p>
                    </div>
                    <button onclick="closeDocumentViewer()" class="p-2 hover:bg-gray-200 rounded-lg transition-colors">
                        <i class="fas fa-times text-gray-600 text-xl"></i>
                    </button>
                </div>
                
                <!-- Documents List -->
                <div class="flex-1 overflow-y-auto p-6">
                    ${documents.length > 0 ? `
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            ${documents.map((doc, index) => `
                                <div class="border rounded-lg p-4 hover:shadow-lg transition-shadow">
                                    <div class="flex items-start justify-between mb-3">
                                        <div class="flex items-center gap-3">
                                            <div class="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                                                <i class="fas fa-file-alt text-blue-600 text-xl"></i>
                                            </div>
                                            <div>
                                                <h3 class="font-semibold text-gray-800">Document ${index + 1}</h3>
                                                <p class="text-sm text-gray-500">${doc.type || 'Verification Letter'}</p>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    ${doc.url ? `
                                        <div class="mt-3">
                                            <img src="${doc.url}" alt="Document ${index + 1}" 
                                                 class="w-full h-48 object-cover rounded border cursor-pointer hover:opacity-90"
                                                 onclick="openDocumentFullscreen('${doc.url}')">
                                        </div>
                                    ` : ''}
                                    
                                    ${doc.description ? `
                                        <p class="mt-3 text-sm text-gray-600">${doc.description}</p>
                                    ` : ''}
                                    
                                    <div class="mt-4 flex gap-2">
                                        <button onclick="openDocumentFullscreen('${doc.url}')" 
                                                class="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">
                                            <i class="fas fa-expand mr-2"></i>View Full
                                        </button>
                                        <button onclick="downloadDocument('${doc.url}', 'document_${index + 1}')" 
                                                class="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-sm">
                                            <i class="fas fa-download"></i>
                                        </button>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    ` : `
                        <div class="text-center py-12">
                            <i class="fas fa-folder-open text-gray-300 text-6xl mb-4"></i>
                            <h3 class="text-xl font-semibold text-gray-600 mb-2">No Documents Uploaded</h3>
                            <p class="text-gray-500">This organization hasn't uploaded any verification documents yet.</p>
                        </div>
                    `}
                </div>
                
                <!-- Footer -->
                <div class="p-6 border-t bg-gray-50 flex justify-between items-center">
                    <div class="text-sm text-gray-600">
                        <i class="fas fa-info-circle mr-2"></i>
                        ${documents.length} document(s) uploaded
                    </div>
                    <div class="flex gap-3">
                        <button onclick="closeDocumentViewer()" 
                                class="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300">
                            Close
                        </button>
                        ${documents.length > 0 ? `
                            <button onclick="verifyOrgFromViewer('${orgId}')" 
                                    class="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                                <i class="fas fa-check mr-2"></i>Verify Organization
                            </button>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Close on background click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeDocumentViewer();
            }
        });

    } catch (error) {
        console.error('Error loading documents:', error);
        showNotification('Failed to load documents', 'error');
    }
}

// Open document in fullscreen
function openDocumentFullscreen(url) {
    const fullscreenModal = document.createElement('div');
    fullscreenModal.id = 'fullscreenDocumentModal';
    fullscreenModal.className = 'fixed inset-0 bg-black bg-opacity-95 flex items-center justify-center z-[60] p-4';
    
    fullscreenModal.innerHTML = `
        <div class="relative w-full h-full flex items-center justify-center">
            <button onclick="closeFullscreenDocument()" 
                    class="absolute top-4 right-4 p-3 bg-white rounded-full hover:bg-gray-100 z-10">
                <i class="fas fa-times text-gray-800 text-xl"></i>
            </button>
            <img src="${url}" alt="Document" class="max-w-full max-h-full object-contain">
        </div>
    `;
    
    document.body.appendChild(fullscreenModal);
    
    fullscreenModal.addEventListener('click', (e) => {
        if (e.target === fullscreenModal) {
            closeFullscreenDocument();
        }
    });
}

// Close fullscreen document
function closeFullscreenDocument() {
    const modal = document.getElementById('fullscreenDocumentModal');
    if (modal) modal.remove();
}

// Close document viewer
function closeDocumentViewer() {
    const modal = document.getElementById('documentViewerModal');
    if (modal) modal.remove();
}

// Download document
function downloadDocument(url, filename) {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Verify organization from viewer
async function verifyOrgFromViewer(orgId) {
    if (!confirm('Are you sure you want to verify this organization?')) return;
    
    try {
        const response = await fetch(`http://localhost:5000/api/admin/verify-organization/${orgId}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
                'Content-Type': 'application/json'
            }
        });
        
        const result = await response.json();
        
        if (result.success) {
            showNotification('Organization verified successfully!', 'success');
            closeDocumentViewer();
            // Reload organizations list if on that page
            if (typeof loadOrganizationsSection === 'function') {
                loadOrganizationsSection();
            }
        } else {
            showNotification(result.message || 'Failed to verify organization', 'error');
        }
    } catch (error) {
        console.error('Error verifying organization:', error);
        showNotification('Failed to verify organization', 'error');
    }
}

// Export functions to window
window.viewOrgDocuments = viewOrgDocuments;
window.openDocumentFullscreen = openDocumentFullscreen;
window.closeFullscreenDocument = closeFullscreenDocument;
window.closeDocumentViewer = closeDocumentViewer;
window.downloadDocument = downloadDocument;
window.verifyOrgFromViewer = verifyOrgFromViewer;

console.log('✅ Admin Document Viewer Loaded');
