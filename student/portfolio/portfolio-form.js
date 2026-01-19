// ===== PORTFOLIO FORM FUNCTIONALITY =====
const API_BASE_URL = 'http://localhost:5000/api';

// Get auth token from localStorage
function getAuthToken() {
    return localStorage.getItem('token');
}

// Get current user from localStorage
function getCurrentUser() {
    try {
        return JSON.parse(localStorage.getItem('user') || '{}');
    } catch {
        return {};
    }
}

// API helper for authenticated requests
async function apiRequest(endpoint, method = 'GET', body = null) {
    const token = getAuthToken();
    const headers = {
        'Content-Type': 'application/json'
    };
    
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    
    const options = { method, headers };
    if (body) {
        options.body = JSON.stringify(body);
    }
    
    const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
    return response.json();
}

document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 SkillLaunch Portfolio Builder Loaded');
    
    // Initialize form
    initializeForm();
    initializePhotoUpload();
    setupEventListeners();
    loadSkillsDatabase();
    loadSavedData();
    setupCharacterCounter();
    setupSkillsInput();
    setupSoftSkillsInput();
    
    // Initialize with one entry for each section
    setTimeout(() => {
        if (document.getElementById('educationContainer').children.length === 0) {
            addEducationEntry();
        }
        if (document.getElementById('experienceContainer').children.length === 0) {
            addExperienceEntry();
        }
        if (document.getElementById('projectsContainer').children.length === 0) {
            addProjectEntry();
        }
    }, 100);
});

// ===== FORM INITIALIZATION =====
function initializeForm() {
    // Set current step
    currentStep = 1;
    updateProgressBar();
    updateNavigation();
    
    // Add event listeners for navigation
    document.getElementById('formNextBtn').addEventListener('click', goToNextStep);
    document.getElementById('formPrevBtn').addEventListener('click', goToPreviousStep);
    document.getElementById('generateBtn').addEventListener('click', generatePortfolio);
    
    // Preview controls
    document.getElementById('downloadPreviewBtn').addEventListener('click', downloadPortfolioPDF);
    document.getElementById('sharePreviewBtn').addEventListener('click', sharePortfolio);
    
    // Add form submit handler
    document.getElementById('portfolioForm').addEventListener('submit', function(e) {
        e.preventDefault();
        generatePortfolio();
    });
}

// ===== PROGRESS MANAGEMENT =====
let currentStep = 1;
let skillsDatabase = [];
let imageTransform = { scale: 1, x: 0, y: 0 };

function updateProgressBar() {
    // Update progress steps
    document.querySelectorAll('.progress-step').forEach((step, index) => {
        const stepNumber = index + 1;
        if (stepNumber < currentStep) {
            step.classList.add('completed');
            step.classList.remove('active');
        } else if (stepNumber === currentStep) {
            step.classList.add('active');
            step.classList.remove('completed');
        } else {
            step.classList.remove('active', 'completed');
        }
    });
    
    // Update progress bar
    const progressPercentage = ((currentStep - 1) / 5) * 100;
    document.querySelector('.progress-fill').style.width = `${progressPercentage}%`;
    
    // Show/hide form steps
    document.querySelectorAll('.form-step').forEach(step => {
        step.classList.remove('active');
        if (parseInt(step.dataset.step) === currentStep) {
            step.classList.add('active');
        }
    });
}

function updateNavigation() {
    const prevBtn = document.getElementById('formPrevBtn');
    const nextBtn = document.getElementById('formNextBtn');
    
    if (currentStep === 1) {
        prevBtn.style.visibility = 'hidden';
    } else {
        prevBtn.style.visibility = 'visible';
    }
    
    if (currentStep === 5) {
        nextBtn.innerHTML = 'Next <i class="fas fa-arrow-right"></i>';
    } else if (currentStep === 6) {
        prevBtn.style.visibility = 'visible';
        nextBtn.style.display = 'none';
    } else {
        nextBtn.innerHTML = 'Next <i class="fas fa-arrow-right"></i>';
        nextBtn.style.display = 'flex';
    }
}

function goToNextStep() {
    if (validateCurrentStep()) {
        if (currentStep < 6) {
            currentStep++;
            updateProgressBar();
            updateNavigation();
            saveFormData();
        }
    }
}

function goToPreviousStep() {
    if (currentStep > 1) {
        currentStep--;
        updateProgressBar();
        updateNavigation();
    }
}

function validateCurrentStep() {
    const currentStepElement = document.querySelector(`.form-step[data-step="${currentStep}"]`);
    const requiredFields = currentStepElement.querySelectorAll('[required]');
    
    for (let field of requiredFields) {
        if (!field.value.trim()) {
            field.focus();
            const label = field.closest('.form-group')?.querySelector('.form-label')?.textContent || 'this field';
            showNotification(`Please fill in ${label}`, 'error');
            return false;
        }
        
        // Email validation
        if (field.type === 'email' && field.value.trim()) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(field.value.trim())) {
                field.focus();
                showNotification('Please enter a valid email address', 'error');
                return false;
            }
        }
        
        // URL validation
        if (field.type === 'url' && field.value.trim() && !field.value.startsWith('http')) {
            field.focus();
            showNotification('Please enter a valid URL starting with http:// or https://', 'error');
            return false;
        }
    }
    
    return true;
}

// ===== PHOTO UPLOAD & IMAGE CONTROLS =====
function initializePhotoUpload() {
    const profileUpload = document.getElementById('profileUpload');
    const profilePreview = document.getElementById('profilePreview');
    const profileImage = document.getElementById('profileImage');
    const initialsPlaceholder = profilePreview.querySelector('.initials-placeholder');
    
    profileUpload.addEventListener('change', function(e) {
        handleImageUpload(e.target.files[0], profileImage, initialsPlaceholder);
    });
    
    // Update initials when name changes
    document.getElementById('fullName').addEventListener('input', function() {
        updateUserInitials(this.value);
    });
}

function handleImageUpload(file, imageElement, placeholderElement) {
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
        showNotification('Please select an image file', 'error');
        return;
    }
    
    if (file.size > 5 * 1024 * 1024) {
        showNotification('Image must be less than 5MB', 'error');
        return;
    }
    
    const reader = new FileReader();
    reader.onload = function(e) {
        imageElement.src = e.target.result;
        imageElement.classList.remove('hidden');
        placeholderElement.classList.add('hidden');
        
        // Reset transform
        imageTransform = { scale: 1, x: 0, y: 0 };
        applyImageTransform(imageElement);
        
        saveFormData();
        showNotification('Profile photo uploaded successfully', 'success');
    };
    reader.readAsDataURL(file);
}

function adjustImage(action) {
    const profileImage = document.getElementById('profileImage');
    if (profileImage.classList.contains('hidden')) {
        showNotification('Please upload a photo first', 'warning');
        return;
    }
    
    switch(action) {
        case 'zoomIn':
            imageTransform.scale = Math.min(imageTransform.scale + 0.1, 2);
            break;
        case 'zoomOut':
            imageTransform.scale = Math.max(imageTransform.scale - 0.1, 0.5);
            break;
        case 'reposition':
            // Simulate repositioning by random offset
            imageTransform.x = (Math.random() - 0.5) * 20;
            imageTransform.y = (Math.random() - 0.5) * 20;
            break;
        case 'reset':
            imageTransform = { scale: 1, x: 0, y: 0 };
            break;
    }
    
    applyImageTransform(profileImage);
    saveFormData();
    showNotification('Image adjusted', 'info');
}

function applyImageTransform(imageElement) {
    imageElement.style.transform = `scale(${imageTransform.scale}) translate(${imageTransform.x}px, ${imageTransform.y}px)`;
}

function updateUserInitials(name) {
    const initialsPlaceholder = document.querySelector('.initials-placeholder');
    if (!name || name.trim().length === 0) {
        initialsPlaceholder.textContent = 'JD';
        return;
    }
    
    const initials = name
        .split(' ')
        .map(word => word[0])
        .join('')
        .toUpperCase()
        .substring(0, 2);
    
    initialsPlaceholder.textContent = initials;
}

// ===== SKILLS MANAGEMENT =====
function setupSkillsInput() {
    const skillInput = document.getElementById('skillInput');
    const skillLevel = document.getElementById('skillLevel');
    const addSkillBtn = document.getElementById('addSkillBtn');
    const skillSuggestions = document.getElementById('skillSuggestions');
    
    // Add skill on button click
    addSkillBtn.addEventListener('click', addTechnicalSkill);
    
    // Add skill on Enter key
    skillInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            addTechnicalSkill();
        }
    });
    
    // Show suggestions on input
    skillInput.addEventListener('input', function() {
        const value = this.value.toLowerCase();
        if (value.length < 2) {
            skillSuggestions.style.display = 'none';
            return;
        }
        
        const matches = skillsDatabase.filter(skill => 
            skill.toLowerCase().includes(value)
        ).slice(0, 8);
        
        if (matches.length > 0) {
            skillSuggestions.innerHTML = matches.map(skill => 
                `<div class="skill-suggestion-item" data-skill="${skill}">${skill}</div>`
            ).join('');
            skillSuggestions.style.display = 'block';
        } else {
            skillSuggestions.style.display = 'none';
        }
    });
    
    // Handle suggestion click
    skillSuggestions.addEventListener('click', function(e) {
        if (e.target.classList.contains('skill-suggestion-item')) {
            const skill = e.target.dataset.skill;
            document.getElementById('skillInput').value = skill;
            skillSuggestions.style.display = 'none';
            document.getElementById('skillLevel').focus();
        }
    });
    
    // Hide suggestions on click outside
    document.addEventListener('click', function(e) {
        if (!skillInput.contains(e.target) && !skillSuggestions.contains(e.target)) {
            skillSuggestions.style.display = 'none';
        }
    });
}

function addTechnicalSkill() {
    const skillInput = document.getElementById('skillInput');
    const skillLevel = document.getElementById('skillLevel');
    const skillsDisplay = document.getElementById('technicalSkillsDisplay');
    
    const skillName = skillInput.value.trim();
    const level = skillLevel.value;
    
    if (!skillName) {
        showNotification('Please enter a skill name', 'error');
        skillInput.focus();
        return;
    }
    
    if (!level) {
        showNotification('Please select a proficiency level', 'error');
        skillLevel.focus();
        return;
    }
    
    // Check if skill already exists
    const existingSkills = Array.from(skillsDisplay.querySelectorAll('.skill-name')).map(el => el.textContent.toLowerCase());
    if (existingSkills.includes(skillName.toLowerCase())) {
        showNotification('This skill is already added', 'info');
        skillInput.value = '';
        skillInput.focus();
        return;
    }
    
    // Create skill chip
    const skillChip = document.createElement('div');
    skillChip.className = `skill-chip level-${level}`;
    skillChip.innerHTML = `
        <span class="skill-name">${skillName}</span>
        <span class="level-badge">${capitalizeFirstLetter(level)}</span>
        <button class="remove-skill" onclick="removeSkillChip(this)">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    skillsDisplay.appendChild(skillChip);
    
    // Clear inputs
    skillInput.value = '';
    skillLevel.value = '';
    skillInput.focus();
    
    // Hide suggestions
    document.getElementById('skillSuggestions').style.display = 'none';
    
    // Save form data
    saveFormData();
    
    // Show success feedback
    skillChip.style.animation = 'fadeIn 0.2s ease';
}

function removeSkillChip(button) {
    const skillChip = button.closest('.skill-chip');
    skillChip.style.animation = 'fadeOut 0.2s ease';
    setTimeout(() => {
        skillChip.remove();
        saveFormData();
    }, 200);
}

function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

function setupSoftSkillsInput() {
    const softSkillsInput = document.getElementById('softSkillsInput');
    const softSkillsDisplay = document.getElementById('softSkillsDisplay');
    
    // Add soft skill on comma or Enter
    softSkillsInput.addEventListener('keydown', function(e) {
        if (e.key === ',' || e.key === 'Enter') {
            e.preventDefault();
            addSoftSkill();
        }
    });
    
    // Add soft skill on blur
    softSkillsInput.addEventListener('blur', addSoftSkill);
}

function addSoftSkill() {
    const softSkillsInput = document.getElementById('softSkillsInput');
    let skills = softSkillsInput.value.trim();
    
    if (!skills) return;
    
    // Split by commas and clean up
    let skillArray = skills.split(',')
        .map(skill => skill.trim())
        .filter(skill => skill.length > 0);
    
    // Update display
    updateSoftSkillsDisplay(skillArray);
    
    // Clear input
    softSkillsInput.value = '';
    
    // Save form data
    saveFormData();
}

function updateSoftSkillsDisplay(skillsArray = []) {
    const softSkillsDisplay = document.getElementById('softSkillsDisplay');
    
    // If no array provided, get from input
    if (skillsArray.length === 0) {
        const currentValue = document.getElementById('softSkillsInput').value;
        skillsArray = currentValue ? currentValue.split(',').map(s => s.trim()).filter(s => s) : [];
    }
    
    // Clear and rebuild display
    softSkillsDisplay.innerHTML = '';
    
    skillsArray.forEach(skill => {
        const tag = document.createElement('span');
        tag.className = 'soft-skill-tag';
        tag.innerHTML = `
            <i class="fas fa-check"></i>
            ${skill}
        `;
        softSkillsDisplay.appendChild(tag);
    });
    
    // Show placeholder if empty
    if (skillsArray.length === 0) {
        softSkillsDisplay.innerHTML = '<span style="color: var(--text-light); font-style: italic;">No soft skills added yet</span>';
    }
}

// ===== SKILLS DATABASE =====
async function loadSkillsDatabase() {
    try {
        // Load skills from JSON file
        const response = await fetch('skills-database.json');
        if (response.ok) {
            const data = await response.json();
            skillsDatabase = data.skills || data;
            console.log(`✅ Loaded ${skillsDatabase.length} skills from database`);
            
            // Populate datalist
            const datalist = document.getElementById('skillsList');
            datalist.innerHTML = '';
            skillsDatabase.forEach(skill => {
                const option = document.createElement('option');
                option.value = skill;
                datalist.appendChild(option);
            });
        } else {
            console.log('Using default skills');
            skillsDatabase = getDefaultSkills();
        }
    } catch (error) {
        console.log('Error loading skills database:', error);
        skillsDatabase = getDefaultSkills();
    }
}

function getDefaultSkills() {
    return [
        'Python', 'JavaScript', 'Java', 'C++', 'TypeScript', 'React', 'Node.js',
        'HTML/CSS', 'SQL', 'Git', 'AWS', 'Docker', 'Kubernetes', 'Machine Learning',
        'Data Analysis', 'UI/UX Design', 'Project Management', 'Agile/Scrum'
    ];
}

// ===== PORTFOLIO GENERATION & PREVIEW =====
async function generatePortfolio() {
    if (!validateCurrentStep()) {
        return;
    }
    
    // Save final data locally
    saveFormData();
    
    // Generate preview
    generatePreviewContent();
    
    // Show preview page
    document.getElementById('formContainer').style.display = 'none';
    document.getElementById('previewPage').classList.add('active');
    
    // Smooth scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    // Save to backend
    await savePortfolioToBackend();
    
    showNotification('Portfolio generated successfully!', 'success');
}

// Save portfolio to backend
async function savePortfolioToBackend(publish = false) {
    const token = getAuthToken();
    if (!token) {
        console.log('No auth token, saving locally only');
        return null;
    }
    
    try {
        const formData = getFormData();
        const previewHTML = document.getElementById('previewPage')?.innerHTML || '';
        const profileImage = document.getElementById('profileImage');
        
        const portfolioData = {
            ...formData,
            profilePhoto: !profileImage.classList.contains('hidden') ? profileImage.src : '',
            previewHTML: previewHTML,
            status: publish ? 'published' : 'draft'
        };
        
        const result = await apiRequest('/portfolio/save', 'POST', portfolioData);
        
        if (result.success) {
            console.log('✅ Portfolio saved to backend:', result.portfolio);
            // Store portfolio info locally
            localStorage.setItem('portfolioInfo', JSON.stringify(result.portfolio));
            return result.portfolio;
        } else {
            console.error('Failed to save portfolio:', result.message);
            return null;
        }
    } catch (error) {
        console.error('Error saving portfolio to backend:', error);
        return null;
    }
}

// Publish portfolio
async function publishPortfolio() {
    const token = getAuthToken();
    if (!token) {
        showNotification('Please log in to publish your portfolio', 'error');
        return null;
    }
    
    try {
        // First save the portfolio
        await savePortfolioToBackend(true);
        
        // Then publish it
        const result = await apiRequest('/portfolio/publish', 'POST');
        
        if (result.success) {
            showNotification('Portfolio published successfully!', 'success');
            localStorage.setItem('portfolioShareToken', result.shareToken);
            return result;
        } else {
            showNotification(result.message || 'Failed to publish portfolio', 'error');
            return null;
        }
    } catch (error) {
        console.error('Error publishing portfolio:', error);
        showNotification('Error publishing portfolio', 'error');
        return null;
    }
}

// Check if user has a portfolio
async function checkUserPortfolio() {
    const token = getAuthToken();
    if (!token) return { hasPortfolio: false };
    
    try {
        const result = await apiRequest('/portfolio/check');
        return result;
    } catch (error) {
        console.error('Error checking portfolio:', error);
        return { hasPortfolio: false };
    }
}

// Load portfolio from backend
async function loadPortfolioFromBackend() {
    const token = getAuthToken();
    if (!token) return null;
    
    try {
        const result = await apiRequest('/portfolio/my');
        if (result.success && result.portfolio) {
            return result.portfolio;
        }
        return null;
    } catch (error) {
        console.error('Error loading portfolio from backend:', error);
        return null;
    }
}

function generatePreviewContent() {
    const data = getFormData();
    
    // Update profile image
    updatePreviewProfileImage();
    
    // Update contact info
    updatePreviewContactInfo(data.basicInfo);
    
    // Update education
    updatePreviewEducation(data.education);
    
    // Update skills
    updatePreviewSkills(data.skills);
    
    // Update main content
    updatePreviewMainContent(data);
}

function updatePreviewProfileImage() {
    const profileImage = document.getElementById('profileImage');
    const previewContainer = document.getElementById('previewProfileImage');
    const initials = document.querySelector('.initials-placeholder').textContent;
    
    if (!profileImage.classList.contains('hidden')) {
        previewContainer.innerHTML = `<img src="${profileImage.src}" alt="Profile" style="transform: scale(${imageTransform.scale}) translate(${imageTransform.x}px, ${imageTransform.y}px);">`;
    } else {
        previewContainer.querySelector('.initials').textContent = initials;
    }
}

function updatePreviewContactInfo(basicInfo) {
    const contactList = document.getElementById('previewContactInfo');
    let html = '';
    
    if (basicInfo.email) {
        html += `<li><i class="fas fa-envelope"></i> ${escapeHTML(basicInfo.email)}</li>`;
    }
    if (basicInfo.phone) {
        html += `<li><i class="fas fa-phone"></i> ${escapeHTML(basicInfo.phone)}</li>`;
    }
    if (basicInfo.location) {
        html += `<li><i class="fas fa-map-marker-alt"></i> ${escapeHTML(basicInfo.location)}</li>`;
    }
    
    contactList.innerHTML = html || '<li>No contact information provided</li>';
}

function updatePreviewEducation(education) {
    const educationList = document.getElementById('previewEducation');
    
    if (education.length === 0) {
        educationList.innerHTML = '<div class="no-data">No education added</div>';
        return;
    }
    
    let html = '';
    education.forEach(edu => {
        if (edu.institution && edu.degree) {
            html += `
                <li class="education-item">
                    <div class="education-degree">${escapeHTML(edu.degree)}</div>
                    <div class="education-institution">${escapeHTML(edu.institution)}</div>
                    <div class="education-date">${formatDateRange(edu.startDate, edu.endDate, edu.currentlyStudying)}</div>
                    ${edu.description ? `<div style="margin-top: 8px; font-size: 13px; color: var(--text-secondary);">${escapeHTML(edu.description)}</div>` : ''}
                </li>
            `;
        }
    });
    
    educationList.innerHTML = html || '<div class="no-data">No education added</div>';
}

function updatePreviewSkills(skills) {
    const skillsList = document.getElementById('previewSkills');
    
    // Combine technical and soft skills
    const allSkills = [...skills.technical];
    
    if (skills.soft) {
        skills.soft.split(',').forEach(skill => {
            const trimmedSkill = skill.trim();
            if (trimmedSkill) {
                allSkills.push({
                    name: trimmedSkill,
                    level: 'experienced'
                });
            }
        });
    }
    
    if (allSkills.length === 0) {
        skillsList.innerHTML = '<div class="no-data">No skills added</div>';
        return;
    }
    
    let html = '';
    allSkills.forEach(skill => {
        html += `
            <li class="skill-item">
                <span class="skill-name">${escapeHTML(skill.name)}</span>
                <span class="skill-level">${capitalizeFirstLetter(skill.level)}</span>
            </li>
        `;
    });
    
    skillsList.innerHTML = html;
}

function updatePreviewMainContent(data) {
    const { basicInfo, experience, projects } = data;
    const additionalInfo = document.getElementById('additionalInfo')?.value || '';
    
    // Update name and title
    document.getElementById('previewFullName').textContent = escapeHTML(basicInfo.fullName || 'John Doe');
    document.getElementById('previewTitle').textContent = escapeHTML(basicInfo.professionalTitle || 'Professional');
    
    // Update summary
    document.getElementById('previewSummary').innerHTML = formatDescription(basicInfo.summary || 'No summary provided.');
    
    // Update experience
    updatePreviewExperience(experience);
    
    // Update projects
    updatePreviewProjects(projects);
    
    // Update additional info
    updatePreviewAdditionalInfo(additionalInfo);
}

function updatePreviewExperience(experience) {
    const experienceContainer = document.getElementById('previewExperience');
    
    if (experience.length === 0) {
        experienceContainer.innerHTML = '<div class="no-data">No work experience added</div>';
        return;
    }
    
    let html = '';
    experience.forEach(exp => {
        if (exp.title && exp.company) {
            html += `
                <div class="timeline-item">
                    <div class="timeline-header">
                        <div>
                            <div class="timeline-title">${escapeHTML(exp.title)}</div>
                            <div class="timeline-subtitle">${escapeHTML(exp.company)}${exp.location ? ` • ${escapeHTML(exp.location)}` : ''}</div>
                        </div>
                        <div class="timeline-date">${formatDateRange(exp.startDate, exp.endDate, exp.current)}</div>
                    </div>
                    ${exp.description ? `<div class="timeline-description">${formatDescription(exp.description)}</div>` : ''}
                </div>
            `;
        }
    });
    
    experienceContainer.innerHTML = html || '<div class="no-data">No work experience added</div>';
}

function updatePreviewProjects(projects) {
    const projectsContainer = document.getElementById('previewProjects');
    
    if (projects.length === 0) {
        projectsContainer.innerHTML = '<div class="no-data">No projects added</div>';
        return;
    }
    
    let html = '';
    projects.forEach(project => {
        if (project.title) {
            html += `
                <div class="timeline-item">
                    <div class="timeline-header">
                        <div>
                            <div class="timeline-title">${escapeHTML(project.title)}</div>
                            ${project.technologies ? `
                                <div class="project-tags">
                                    ${project.technologies.split(',').map(tech => `
                                        <span class="project-tag">${escapeHTML(tech.trim())}</span>
                                    `).join('')}
                                </div>
                            ` : ''}
                        </div>
                        ${(project.url || project.demoUrl) ? `
                            <div style="display: flex; gap: 10px;">
                                ${project.url ? `<a href="${project.url}" target="_blank" style="color: var(--accent-color); font-size: 14px;"><i class="fab fa-github"></i></a>` : ''}
                                ${project.demoUrl ? `<a href="${project.demoUrl}" target="_blank" style="color: var(--accent-color); font-size: 14px;"><i class="fas fa-external-link-alt"></i></a>` : ''}
                            </div>
                        ` : ''}
                    </div>
                    ${project.description ? `<div class="timeline-description">${formatDescription(project.description)}</div>` : ''}
                </div>
            `;
        }
    });
    
    projectsContainer.innerHTML = html || '<div class="no-data">No projects added</div>';
}

function updatePreviewAdditionalInfo(additionalInfo) {
    const section = document.getElementById('previewAdditionalInfoSection');
    const container = document.getElementById('previewAdditionalInfo');
    
    if (additionalInfo.trim()) {
        section.style.display = 'block';
        container.innerHTML = formatDescription(additionalInfo);
    } else {
        section.style.display = 'none';
    }
}

// ===== HELPER FUNCTIONS =====
function formatDateRange(startDate, endDate, isCurrent = false) {
    if (!startDate) return '';
    
    const formatDate = (dateString) => {
        if (!dateString) return '';
        const [year, month] = dateString.split('-');
        const date = new Date(year, month - 1);
        return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    };
    
    const formattedStart = formatDate(startDate);
    const formattedEnd = isCurrent ? 'Present' : formatDate(endDate);
    
    return `${formattedStart} - ${formattedEnd}`;
}

function formatDescription(text) {
    if (!text) return '';
    // Convert line breaks to HTML and escape
    return escapeHTML(text).replace(/\n/g, '<br>');
}

function escapeHTML(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ===== PORTFOLIO DOWNLOAD & SHARE =====
function downloadPortfolioPDF() {
    showNotification('Preparing PDF download...', 'info');
    
    // Use html2pdf library for professional PDF generation
    if (typeof html2pdf === 'undefined') {
        // Load html2pdf library
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
        script.onload = generatePDF;
        document.head.appendChild(script);
    } else {
        generatePDF();
    }
}

function generatePDF() {
    const element = document.getElementById('previewContainer');
    const filename = document.getElementById('fullName').value || 'portfolio';
    
    const opt = {
        margin: [10, 10, 10, 10],
        filename: `${filename}_Portfolio.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { 
            scale: 2,
            useCORS: true,
            letterRendering: true,
            backgroundColor: '#ffffff'
        },
        jsPDF: { 
            unit: 'mm', 
            format: 'a4', 
            orientation: 'portrait',
            compress: true
        },
        pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
    };
    
    html2pdf().set(opt).from(element).save().then(() => {
        showNotification('PDF downloaded successfully!', 'success');
    }).catch(error => {
        console.error('PDF generation error:', error);
        showNotification('Error generating PDF. Please try again.', 'error');
    });
}

async function sharePortfolio() {
    showNotification('Publishing and generating shareable link...', 'info');
    
    const token = getAuthToken();
    if (!token) {
        const shareId = 'portfolio_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        const portfolioData = localStorage.getItem('portfolioDraftV2');
        localStorage.setItem('share_' + shareId, portfolioData);
        const shareUrl = window.location.origin + '/student/portfolio/portfolio-view.html?share=' + shareId;
        copyToClipboard(shareUrl);
        return;
    }
    
    try {
        const publishResult = await publishPortfolio();
        if (publishResult && publishResult.shareToken) {
            const shareUrl = window.location.origin + '/student/portfolio/portfolio-view.html?token=' + publishResult.shareToken;
            copyToClipboard(shareUrl);
        } else {
            showNotification('Failed to generate share link', 'error');
        }
    } catch (error) {
        console.error('Error sharing portfolio:', error);
        showNotification('Error generating share link', 'error');
    }
}

function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        showNotification('Share link copied to clipboard!', 'success');
    }).catch(() => {
        prompt('Copy this share link:', text);
        showNotification('Share link displayed above', 'info');
    });
}

// ===== FORM DATA MANAGEMENT =====
function getFormData() {
    const formData = {
        basicInfo: {
            fullName: document.getElementById('fullName').value,
            professionalTitle: document.getElementById('professionalTitle').value,
            email: document.getElementById('email').value,
            phone: document.getElementById('phone').value,
            location: document.getElementById('location').value,
            summary: document.getElementById('summary').value
        },
        education: [],
        skills: {
            technical: [],
            soft: document.getElementById('softSkillsInput').value
        },
        experience: [],
        projects: [],
        imageTransform: imageTransform
    };
    
    // Get education data
    document.querySelectorAll('.education-entry').forEach(entry => {
        const inputs = entry.querySelectorAll('input, textarea');
        if (inputs[0]?.value) {
            formData.education.push({
                institution: inputs[0].value,
                degree: inputs[1]?.value || '',
                field: inputs[2]?.value || '',
                startDate: inputs[3]?.value || '',
                endDate: inputs[4]?.value || '',
                currentlyStudying: entry.querySelector('.currently-studying')?.checked || false,
                description: inputs[5]?.value || ''
            });
        }
    });
    
    // Get technical skills from chips
    document.querySelectorAll('.skill-chip').forEach(chip => {
        formData.skills.technical.push({
            name: chip.querySelector('.skill-name').textContent,
            level: chip.className.includes('level-') ? 
                  chip.className.match(/level-(\w+)/)[1] : 'intermediate'
        });
    });
    
    // Get experience data
    document.querySelectorAll('.experience-entry').forEach(entry => {
        const inputs = entry.querySelectorAll('input, textarea, select');
        if (inputs[0]?.value) {
            formData.experience.push({
                title: inputs[0].value,
                company: inputs[1]?.value || '',
                location: inputs[2]?.value || '',
                type: inputs[3]?.value || '',
                startDate: inputs[4]?.value || '',
                endDate: inputs[5]?.value || '',
                current: entry.querySelector('.current-job')?.checked || false,
                description: inputs[6]?.value || ''
            });
        }
    });
    
    // Get projects data
    document.querySelectorAll('.project-entry').forEach(entry => {
        const inputs = entry.querySelectorAll('input, textarea');
        if (inputs[0]?.value) {
            formData.projects.push({
                title: inputs[0].value,
                technologies: inputs[1]?.value || '',
                url: inputs[2]?.value || '',
                demoUrl: inputs[3]?.value || '',
                description: inputs[4]?.value || ''
            });
        }
    });
    
    return formData;
}

function saveFormData() {
    const formData = getFormData();
    formData.lastSaved = new Date().toISOString();
    formData.additionalInfo = document.getElementById('additionalInfo')?.value || '';
    
    // Save to localStorage
    localStorage.setItem('portfolioDraftV2', JSON.stringify(formData));
    console.log('✅ Form data saved');
}

function loadSavedData() {
    try {
        const savedData = localStorage.getItem('portfolioDraftV2');
        if (!savedData) return;
        
        const data = JSON.parse(savedData);
        
        // Load basic info
        if (data.basicInfo) {
            Object.keys(data.basicInfo).forEach(key => {
                const element = document.getElementById(key);
                if (element && data.basicInfo[key]) {
                    element.value = data.basicInfo[key];
                }
            });
        }
        
        // Load additional info
        if (data.additionalInfo) {
            document.getElementById('additionalInfo').value = data.additionalInfo;
        }
        
        // Load image transform
        if (data.imageTransform) {
            imageTransform = data.imageTransform;
            const profileImage = document.getElementById('profileImage');
            if (!profileImage.classList.contains('hidden')) {
                applyImageTransform(profileImage);
            }
        }
        
        // Load technical skills
        if (data.skills?.technical) {
            const skillsDisplay = document.getElementById('technicalSkillsDisplay');
            skillsDisplay.innerHTML = '';
            
            data.skills.technical.forEach(skill => {
                const skillChip = document.createElement('div');
                skillChip.className = `skill-chip level-${skill.level}`;
                skillChip.innerHTML = `
                    <span class="skill-name">${skill.name}</span>
                    <span class="level-badge">${capitalizeFirstLetter(skill.level)}</span>
                    <button class="remove-skill" onclick="removeSkillChip(this)">
                        <i class="fas fa-times"></i>
                    </button>
                `;
                skillsDisplay.appendChild(skillChip);
            });
        }
        
        // Load soft skills
        if (data.skills?.soft) {
            document.getElementById('softSkillsInput').value = data.skills.soft;
            updateSoftSkillsDisplay(data.skills.soft.split(',').map(s => s.trim()));
        }
        
        console.log('✅ Loaded saved form data');
    } catch (error) {
        console.error('Error loading saved data:', error);
    }
}

// ===== ENTRY MANAGEMENT FUNCTIONS =====
function addEducationEntry() {
    const container = document.getElementById('educationContainer');
    const count = container.children.length + 1;
    
    const entry = document.createElement('div');
    entry.className = 'entry-card education-entry';
    entry.innerHTML = `
        <div class="entry-header">
            <h4>Education #${count}</h4>
            <button type="button" class="remove-entry-btn" onclick="removeEntry(this)">
                <i class="fas fa-trash"></i>
            </button>
        </div>
        
        <div class="form-grid">
            <div class="form-group">
                <label class="form-label">Institution</label>
                <input type="text" class="form-input" placeholder="University Name">
            </div>
            <div class="form-group">
                <label class="form-label">Degree</label>
                <input type="text" class="form-input" placeholder="Bachelor of Science">
            </div>
            <div class="form-group">
                <label class="form-label">Field of Study</label>
                <input type="text" class="form-input" placeholder="Computer Science">
            </div>
            <div class="form-group">
                <label class="form-label">Start Date</label>
                <input type="month" class="form-input">
            </div>
            <div class="form-group">
                <label class="form-label">End Date</label>
                <input type="month" class="form-input">
                <div style="margin-top: 8px;">
                    <label class="checkbox-label">
                        <input type="checkbox" class="currently-studying"> Currently Studying
                    </label>
                </div>
            </div>
            <div class="form-group full-width">
                <label class="form-label">Description</label>
                <textarea class="form-textarea" rows="2" placeholder="Relevant coursework, achievements, GPA..."></textarea>
            </div>
        </div>
    `;
    
    container.appendChild(entry);
    
    // Add event listener for currently studying checkbox
    const checkbox = entry.querySelector('.currently-studying');
    const endDate = entry.querySelectorAll('input[type="month"]')[1];
    checkbox.addEventListener('change', function() {
        endDate.disabled = this.checked;
        if (this.checked) endDate.value = '';
    });
    
    // Focus on first input
    entry.querySelector('input').focus();
}

function addExperienceEntry() {
    const container = document.getElementById('experienceContainer');
    const count = container.children.length + 1;
    
    const entry = document.createElement('div');
    entry.className = 'entry-card experience-entry';
    entry.innerHTML = `
        <div class="entry-header">
            <h4>Experience #${count}</h4>
            <button type="button" class="remove-entry-btn" onclick="removeEntry(this)">
                <i class="fas fa-trash"></i>
            </button>
        </div>
        
        <div class="form-grid">
            <div class="form-group">
                <label class="form-label">Job Title</label>
                <input type="text" class="form-input" placeholder="Software Engineer Intern">
            </div>
            <div class="form-group">
                <label class="form-label">Company</label>
                <input type="text" class="form-input" placeholder="TechCorp Inc.">
            </div>
            <div class="form-group">
                <label class="form-label">Location</label>
                <input type="text" class="form-input" placeholder="San Francisco, CA">
            </div>
            <div class="form-group">
                <label class="form-label">Employment Type</label>
                <select class="form-select">
                    <option value="">Select Type</option>
                    <option value="full-time">Full-time</option>
                    <option value="part-time">Part-time</option>
                    <option value="internship">Internship</option>
                    <option value="contract">Contract</option>
                </select>
            </div>
            <div class="form-group">
                <label class="form-label">Start Date</label>
                <input type="month" class="form-input">
            </div>
            <div class="form-group">
                <label class="form-label">End Date</label>
                <input type="month" class="form-input">
                <div style="margin-top: 8px;">
                    <label class="checkbox-label">
                        <input type="checkbox" class="current-job"> Currently Working Here
                    </label>
                </div>
            </div>
            <div class="form-group full-width">
                <label class="form-label">Description</label>
                <textarea class="form-textarea" rows="3" placeholder="Describe your responsibilities and achievements..."></textarea>
            </div>
        </div>
    `;
    
    container.appendChild(entry);
    
    // Add event listener for current job checkbox
    const checkbox = entry.querySelector('.current-job');
    const endDate = entry.querySelectorAll('input[type="month"]')[1];
    checkbox.addEventListener('change', function() {
        endDate.disabled = this.checked;
        if (this.checked) endDate.value = '';
    });
    
    // Focus on first input
    entry.querySelector('input').focus();
}

function addProjectEntry() {
    const container = document.getElementById('projectsContainer');
    const count = container.children.length + 1;
    
    const entry = document.createElement('div');
    entry.className = 'entry-card project-entry';
    entry.innerHTML = `
        <div class="entry-header">
            <h4>Project #${count}</h4>
            <button type="button" class="remove-entry-btn" onclick="removeEntry(this)">
                <i class="fas fa-trash"></i>
            </button>
        </div>
        
        <div class="form-grid">
            <div class="form-group">
                <label class="form-label">Project Title</label>
                <input type="text" class="form-input" placeholder="E-commerce Platform">
            </div>
            <div class="form-group">
                <label class="form-label">Technologies Used</label>
                <input type="text" class="form-input" placeholder="React, Node.js, MongoDB">
            </div>
            <div class="form-group">
                <label class="form-label">Project URL</label>
                <input type="url" class="form-input" placeholder="https://github.com/username/project">
            </div>
            <div class="form-group">
                <label class="form-label">Live Demo URL</label>
                <input type="url" class="form-input" placeholder="https://project-demo.com">
            </div>
            <div class="form-group full-width">
                <label class="form-label">Description</label>
                <textarea class="form-textarea" rows="3" placeholder="Describe the project, your role, and outcomes..."></textarea>
            </div>
        </div>
    `;
    
    container.appendChild(entry);
    
    // Focus on first input
    entry.querySelector('input').focus();
}

function removeEntry(button) {
    const entry = button.closest('.entry-card');
    if (entry) {
        entry.style.opacity = '0.5';
        entry.style.pointerEvents = 'none';
        setTimeout(() => {
            entry.remove();
            saveFormData();
            showNotification('Entry removed', 'info');
        }, 300);
    }
}

// ===== CHARACTER COUNTER =====
function setupCharacterCounter() {
    const summaryTextarea = document.getElementById('summary');
    const charCount = document.getElementById('charCount');
    
    if (!summaryTextarea || !charCount) return;
    
    summaryTextarea.addEventListener('input', function() {
        const length = this.value.length;
        charCount.textContent = length;
        
        if (length > 300) {
            charCount.style.color = '#e74c3c';
            this.style.borderColor = '#e74c3c';
        } else if (length > 270) {
            charCount.style.color = '#f39c12';
            this.style.borderColor = '#f39c12';
        } else {
            charCount.style.color = '#27ae60';
            this.style.borderColor = '#27ae60';
        }
    });
    
    // Trigger initial count
    summaryTextarea.dispatchEvent(new Event('input'));
}

// ===== EVENT LISTENERS =====
function setupEventListeners() {
    // Auto-save on input
    const form = document.getElementById('portfolioForm');
    form.addEventListener('input', function() {
        clearTimeout(window.autoSaveTimer);
        window.autoSaveTimer = setTimeout(saveFormData, 1000);
    });
}

// ===== NOTIFICATION =====
function showNotification(message, type = 'info') {
    // Remove existing notification
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
        existingNotification.remove();
    }
    
    // Create notification
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'}"></i>
        <span>${message}</span>
    `;
    
    // Add styles
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#27ae60' : type === 'error' ? '#e74c3c' : '#3498db'};
        color: white;
        padding: 12px 16px;
        border-radius: var(--radius-md);
        display: flex;
        align-items: center;
        gap: 10px;
        z-index: 10000;
        box-shadow: var(--shadow-md);
        animation: slideInRight 0.3s ease;
        max-width: 350px;
        font-size: 14px;
        font-weight: 500;
    `;
    
    document.body.appendChild(notification);
    
    // Auto-remove after 3 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }
    }, 3000);
}

// ===== KEYBOARD SHORTCUTS =====
document.addEventListener('keydown', function(e) {
    // Ctrl + S to save
    if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
        saveFormData();
        showNotification('Portfolio saved!', 'success');
    }
    
    // Ctrl + Enter to generate portfolio
    if (e.ctrlKey && e.key === 'Enter') {
        e.preventDefault();
        if (currentStep === 5) {
            generatePortfolio();
        } else {
            goToNextStep();
        }
    }
});

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes fadeIn {
        from { opacity: 0; transform: translateY(5px); }
        to { opacity: 1; transform: translateY(0); }
    }
    
    @keyframes fadeOut {
        from { opacity: 1; transform: translateY(0); }
        to { opacity: 0; transform: translateY(5px); }
    }
    
    @keyframes slideInRight {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    
    @keyframes slideOutRight {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
    
    .checkbox-label {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 13px;
        color: var(--text-secondary);
        cursor: pointer;
    }
    
    .checkbox-label input[type="checkbox"] {
        width: 14px;
        height: 14px;
        cursor: pointer;
        accent-color: var(--accent-color);
    }
    
    .hidden {
        display: none !important;
    }
    
    .completion-card {
        background: var(--sidebar-bg);
        border: 1px solid var(--border-light);
        border-radius: var(--radius-md);
        padding: 20px;
        margin-bottom: 20px;
    }
`;
document.head.appendChild(style);