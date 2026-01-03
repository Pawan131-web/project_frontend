//js/signup-validation.js
/* ===== STUDENT SIGNUP VALIDATION ===== */
/* form validation */

document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('studentSignupForm');
    const submitBtn = document.getElementById('submitBtn');
    
    // Form elements
    const fullNameInput = document.getElementById('fullName');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const confirmPasswordInput = document.getElementById('confirmPassword');
    const termsCheckbox = document.getElementById('terms');
    
    // Validation states
    let isValid = {
        name: false,
        email: false,
        password: false,
        confirmPassword: false,
        terms: false
    };
    
    // Real-time validation on input
    fullNameInput.addEventListener('input', validateName);
    emailInput.addEventListener('input', validateEmail);
    passwordInput.addEventListener('input', validatePassword);
    confirmPasswordInput.addEventListener('input', validateConfirmPassword);
    termsCheckbox.addEventListener('change', validateTerms);
    
    // Form submission
    form.addEventListener('submit', handleSubmit);
    
    // Validation functions
    function validateName() {
        const name = fullNameInput.value.trim();
        
        if (name.length === 0) {
            showFieldError(fullNameInput, 'Full name is required');
            isValid.name = false;
        } else if (name.length < 2) {
            showFieldError(fullNameInput, 'Name must be at least 2 characters');
            isValid.name = false;
        } else if (!/^[A-Za-z\s]+$/.test(name.replace(/\s+/g, ' '))) {
            showFieldError(fullNameInput, 'Name can only contain letters and spaces');
            isValid.name = false;
        } else {
            showFieldSuccess(fullNameInput);
            isValid.name = true;
        }
        updateSubmitButton();
    }
    
    function validateEmail() {
        const email = emailInput.value.trim();
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        
        if (email.length === 0) {
            showFieldError(emailInput, 'Email is required');
            isValid.email = false;
        } else if (!emailRegex.test(email)) {
            showFieldError(emailInput, 'Please enter a valid email address');
            isValid.email = false;
        } else {
            showFieldSuccess(emailInput);
            isValid.email = true;
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
        
        // Remove any existing error message
        removeErrorMessage(inputElement);
        
        // Create error message element
        const errorElement = document.createElement('div');
        errorElement.className = 'field-error-message';
        errorElement.style.color = '#E53E3E';
        errorElement.style.fontSize = '0.8rem';
        errorElement.style.marginTop = '5px';
        errorElement.style.display = 'flex';
        errorElement.style.alignItems = 'center';
        errorElement.style.gap = '5px';
        errorElement.innerHTML = `<i class="fas fa-exclamation-circle" style="font-size: 0.8rem;"></i> ${message}`;
        
        // Insert after input
        inputElement.parentNode.insertBefore(errorElement, inputElement.nextSibling);
    }
    
    function showFieldSuccess(inputElement) {
        inputElement.style.borderColor = '#38A169';
        inputElement.style.boxShadow = '0 0 0 2px rgba(56, 161, 105, 0.1)';
        removeErrorMessage(inputElement);
    }
    
    function removeErrorMessage(inputElement) {
        const existingError = inputElement.parentNode.querySelector('.field-error-message');
        if (existingError) {
            existingError.remove();
        }
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
        validateName();
        validateEmail();
        validatePassword();
        validateConfirmPassword();
        validateTerms();
        
        // Check if all valid
        const allValid = Object.values(isValid).every(value => value === true);
        
        if (allValid) {
            // Form is valid - you can add your submission logic here
            console.log('Form is valid! Ready for submission.');
            console.log({
                name: fullNameInput.value.trim(),
                email: emailInput.value.trim(),
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
                    name: false,
                    email: false,
                    password: false,
                    confirmPassword: false,
                    terms: false
                };
                updateSubmitButton();
                
                // Reset field styles
                const inputs = [fullNameInput, emailInput, passwordInput, confirmPasswordInput];
                inputs.forEach(input => {
                    input.style.borderColor = '#ddd';
                    input.style.boxShadow = 'none';
                    removeErrorMessage(input);
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
        if (!isValid.name) return fullNameInput;
        if (!isValid.email) return emailInput;
        if (!isValid.password) return passwordInput;
        if (!isValid.confirmPassword) return confirmPasswordInput;
        return null;
    }
    
    // Initialize button state
    updateSubmitButton();
});