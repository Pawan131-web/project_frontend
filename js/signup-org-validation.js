//js/signup-org-validation.js
/* ===== ORGANIZATION SIGNUP VALIDATION ===== */
/*form validation*/

document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('organizationSignupForm');
    const submitBtn = document.getElementById('submitBtn');
    
    // Form elements
    const companyNameInput = document.getElementById('companyName');
    const repNameInput = document.getElementById('repName');
    const emailInput = document.getElementById('email');
    const companySizeSelect = document.getElementById('companySize');
    const passwordInput = document.getElementById('password');
    const confirmPasswordInput = document.getElementById('confirmPassword');
    const termsCheckbox = document.getElementById('terms');
    
    // Validation states
    let isValid = {
        companyName: false,
        repName: false,
        email: false,
        companySize: false,
        password: false,
        confirmPassword: false,
        terms: false
    };
    
    // Real-time validation on input
    companyNameInput.addEventListener('input', validateCompanyName);
    repNameInput.addEventListener('input', validateRepName);
    emailInput.addEventListener('input', validateEmail);
    companySizeSelect.addEventListener('change', validateCompanySize);
    passwordInput.addEventListener('input', validatePassword);
    confirmPasswordInput.addEventListener('input', validateConfirmPassword);
    termsCheckbox.addEventListener('change', validateTerms);
    
    // Form submission
    form.addEventListener('submit', handleSubmit);
    
    // Validation functions
    function validateCompanyName() {
        const name = companyNameInput.value.trim();
        
        if (name.length === 0) {
            showFieldError(companyNameInput, 'Company name is required');
            isValid.companyName = false;
        } else if (name.length < 2) {
            showFieldError(companyNameInput, 'Company name must be at least 2 characters');
            isValid.companyName = false;
        } else {
            showFieldSuccess(companyNameInput);
            isValid.companyName = true;
        }
        updateSubmitButton();
    }
    
    function validateRepName() {
        const name = repNameInput.value.trim();
        
        if (name.length === 0) {
            showFieldError(repNameInput, 'Representative name is required');
            isValid.repName = false;
        } else if (name.length < 2) {
            showFieldError(repNameInput, 'Name must be at least 2 characters');
            isValid.repName = false;
        } else if (!/^[A-Za-z\s]+$/.test(name.replace(/\s+/g, ' '))) {
            showFieldError(repNameInput, 'Name can only contain letters and spaces');
            isValid.repName = false;
        } else {
            showFieldSuccess(repNameInput);
            isValid.repName = true;
        }
        updateSubmitButton();
    }
    
    function validateEmail() {
        const email = emailInput.value.trim();
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const workEmailRegex = /\.(com|org|net|edu|co|io|ai|tech|digital)$/i;
        
        if (email.length === 0) {
            showFieldError(emailInput, 'Work email is required');
            isValid.email = false;
        } else if (!emailRegex.test(email)) {
            showFieldError(emailInput, 'Please enter a valid email address');
            isValid.email = false;
        } else if (!workEmailRegex.test(email)) {
            // Optional: Suggest it should be a work email
            showFieldWarning(emailInput, 'Consider using a work email address');
            isValid.email = true; // Still valid, just warning
        } else {
            showFieldSuccess(emailInput);
            isValid.email = true;
        }
        updateSubmitButton();
    }
    
    function validateCompanySize() {
        const value = companySizeSelect.value;
        
        if (!value || value === '') {
            showFieldError(companySizeSelect, 'Please select company size');
            isValid.companySize = false;
        } else {
            showFieldSuccess(companySizeSelect);
            isValid.companySize = true;
        }
        updateSubmitButton();
    }
    
    function validatePassword() {
        const password = passwordInput.value;
        const hasMinLength = password.length >= 8;
        const hasLetter = /[A-Za-z]/.test(password);
        const hasNumber = /\d/.test(password);
        
        if (password.length === 0) {
            showFieldError(passwordInput, 'Password is required');
            isValid.password = false;
        } else if (!hasMinLength) {
            showFieldError(passwordInput, 'Password must be at least 8 characters');
            isValid.password = false;
        } else if (!hasLetter || !hasNumber) {
            showFieldError(passwordInput, 'Must contain both letters and numbers');
            isValid.password = false;
        } else {
            showFieldSuccess(passwordInput);
            isValid.password = true;
        }
        
        // Also validate confirm password if it has content
        if (confirmPasswordInput.value.length > 0) {
            validateConfirmPassword();
        }
        updateSubmitButton();
    }
    
    function validateConfirmPassword() {
        const password = passwordInput.value;
        const confirmPassword = confirmPasswordInput.value;
        
        if (confirmPassword.length === 0) {
            showFieldError(confirmPasswordInput, 'Please confirm your password');
            isValid.confirmPassword = false;
        } else if (password !== confirmPassword) {
            showFieldError(confirmPasswordInput, 'Passwords do not match');
            isValid.confirmPassword = false;
        } else {
            showFieldSuccess(confirmPasswordInput);
            isValid.confirmPassword = true;
        }
        updateSubmitButton();
    }
    
    function validateTerms() {
        isValid.terms = termsCheckbox.checked;
        updateSubmitButton();
    }
    
    // Helper functions for field styling
    function showFieldError(inputElement, message) {
        inputElement.style.borderColor = '#E53E3E';
        inputElement.style.boxShadow = '0 0 0 2px rgba(229, 62, 62, 0.1)';
        removeFieldMessage(inputElement);
        
        const errorElement = document.createElement('div');
        errorElement.className = 'field-error-message';
        errorElement.style.color = '#E53E3E';
        errorElement.style.fontSize = '0.8rem';
        errorElement.style.marginTop = '5px';
        errorElement.style.display = 'flex';
        errorElement.style.alignItems = 'center';
        errorElement.style.gap = '5px';
        errorElement.innerHTML = `<i class="fas fa-exclamation-circle" style="font-size: 0.8rem;"></i> ${message}`;
        
        inputElement.parentNode.insertBefore(errorElement, inputElement.nextSibling);
    }
    
    function showFieldWarning(inputElement, message) {
        inputElement.style.borderColor = '#D69E2E';
        inputElement.style.boxShadow = '0 0 0 2px rgba(214, 158, 46, 0.1)';
        removeFieldMessage(inputElement);
        
        const warningElement = document.createElement('div');
        warningElement.className = 'field-warning-message';
        warningElement.style.color = '#D69E2E';
        warningElement.style.fontSize = '0.8rem';
        warningElement.style.marginTop = '5px';
        warningElement.style.display = 'flex';
        warningElement.style.alignItems = 'center';
        warningElement.style.gap = '5px';
        warningElement.innerHTML = `<i class="fas fa-exclamation-triangle" style="font-size: 0.8rem;"></i> ${message}`;
        
        inputElement.parentNode.insertBefore(warningElement, inputElement.nextSibling);
    }
    
    function showFieldSuccess(inputElement) {
        inputElement.style.borderColor = '#38A169';
        inputElement.style.boxShadow = '0 0 0 2px rgba(56, 161, 105, 0.1)';
        removeFieldMessage(inputElement);
    }
    
    function removeFieldMessage(inputElement) {
        const existingError = inputElement.parentNode.querySelector('.field-error-message');
        const existingWarning = inputElement.parentNode.querySelector('.field-warning-message');
        
        if (existingError) existingError.remove();
        if (existingWarning) existingWarning.remove();
    }
    
    function updateSubmitButton() {
        const allValid = Object.values(isValid).every(value => value === true);
        
        if (allValid) {
            submitBtn.disabled = false;
            submitBtn.style.opacity = '1';
            submitBtn.style.cursor = 'pointer';
        } else {
            submitBtn.disabled = true;
            submitBtn.style.opacity = '0.7';
            submitBtn.style.cursor = 'not-allowed';
        }
    }
    
    function handleSubmit(event) {
        event.preventDefault();
        
        // Validate all fields one more time
        validateCompanyName();
        validateRepName();
        validateEmail();
        validateCompanySize();
        validatePassword();
        validateConfirmPassword();
        validateTerms();
        
        // Check if all valid
        const allValid = Object.values(isValid).every(value => value === true);
        
        if (allValid) {
            // Form is valid - you can add your submission logic here
            console.log('Organization form is valid! Ready for submission.');
            console.log({
                companyName: companyNameInput.value.trim(),
                repName: repNameInput.value.trim(),
                email: emailInput.value.trim(),
                companySize: companySizeSelect.value,
                password: passwordInput.value
            });
            
            // For demo: Show success message
            submitBtn.innerHTML = 'Account Created!';
            submitBtn.style.background = '#38A169';
            
            // Reset after 2 seconds (for demo only)
            setTimeout(() => {
                submitBtn.innerHTML = 'Create Account';
                submitBtn.style.background = '#D32F2F';
                form.reset();
                
                // Reset validation states
                isValid = {
                    companyName: false,
                    repName: false,
                    email: false,
                    companySize: false,
                    password: false,
                    confirmPassword: false,
                    terms: false
                };
                updateSubmitButton();
                
                // Reset field styles
                const inputs = [companyNameInput, repNameInput, emailInput, companySizeSelect, passwordInput, confirmPasswordInput];
                inputs.forEach(input => {
                    input.style.borderColor = '#ddd';
                    input.style.boxShadow = 'none';
                    removeFieldMessage(input);
                });
                
            }, 2000);
        } else {
            // Scroll to first error
            const firstInvalidField = findFirstInvalidField();
            if (firstInvalidField) {
                firstInvalidField.scrollIntoView({ behavior: 'smooth', block: 'center' });
                firstInvalidField.focus();
            }
        }
    }
    
    function findFirstInvalidField() {
        if (!isValid.companyName) return companyNameInput;
        if (!isValid.repName) return repNameInput;
        if (!isValid.email) return emailInput;
        if (!isValid.companySize) return companySizeSelect;
        if (!isValid.password) return passwordInput;
        if (!isValid.confirmPassword) return confirmPasswordInput;
        return null;
    }
    
    // Initialize button state
    updateSubmitButton();
});