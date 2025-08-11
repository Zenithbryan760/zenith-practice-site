/**
     * Zenith Roofing Form Enhancement
     * - Form validation
     * - File upload handling
     * - Display name generation
     * - Form submission
     */
    document.addEventListener('DOMContentLoaded', function() {
      const form = document.getElementById('estimate-form');
      if (!form) return;

      // [1] FORM ELEMENTS
      const firstNameInput = document.getElementById('first-name');
      const lastNameInput = document.getElementById('last-name');
      const phoneInput = document.getElementById('phone');
      const emailInput = document.getElementById('email');
      const serviceSelect = document.getElementById('service');
      const detailsTextarea = document.getElementById('details');
      const fileInput = document.getElementById('photos');
      const fileNameDisplay = document.querySelector('.file-name');
      const displayNameField = document.getElementById('display-name');
      const stateInput = document.getElementById('state');
      const zipInput = document.getElementById('zip');

      // [2] INITIAL SETUP
      setupPhoneMasking();
      setupFormValidation();
      setupFileUploadDisplay();
      setupDisplayNameGeneration();
      setupServiceDetailsBehavior();

      // [3] FORM SUBMISSION
      form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        if (!validateForm()) {
          return;
        }

        // Show loading state
        const submitBtn = form.querySelector('.zenith-submit');
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="submit-text">Sending...</span>';

        // Simulate form submission (replace with actual AJAX call)
        setTimeout(() => {
          submitBtn.innerHTML = '<span class="submit-text">Estimate Sent!</span><span class="submit-icon">✓</span>';
          
          // Reset form after success (or redirect)
          setTimeout(() => {
            showSuccessMessage();
            form.reset();
            fileNameDisplay.textContent = 'No files selected';
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<span class="submit-text">Request Free Estimate</span><span class="submit-icon">→</span>';
          }, 1500);
        }, 2000);
      });

      // [4] HELPER FUNCTIONS

      function setupPhoneMasking() {
        // Phone number formatting (123-456-7890)
        phoneInput.addEventListener('input', function(e) {
          const value = e.target.value.replace(/\D/g, '');
          let formattedValue = '';
          
          if (value.length > 0) {
            formattedValue = value.substring(0, 3);
            if (value.length > 3) {
              formattedValue += '-' + value.substring(3, 6);
            }
            if (value.length > 6) {
              formattedValue += '-' + value.substring(6, 10);
            }
          }
          
          e.target.value = formattedValue;
        });
      }

      function setupFormValidation() {
        // Add real-time validation feedback
        const inputs = form.querySelectorAll('input:not([type="hidden"]), textarea, select');
        
        inputs.forEach(input => {
          input.addEventListener('blur', validateField);
          input.addEventListener('input', clearError);
        });

        // Auto-advance from state to ZIP
        stateInput.addEventListener('input', function() {
          if (this.value.length === 2) {
            zipInput.focus();
          }
        });
      }

      function validateField(e) {
        const field = e.target;
        const value = field.value.trim();
        const fieldId = field.id;
        const fieldGroup = field.closest('.zenith-input-group, .floating-select');
        
        // Clear previous errors
        clearError(field);
        
        // Required field validation
        if (field.required && !value) {
          showError(fieldGroup, 'This field is required');
          return false;
        }
        
        // Specific field validations
        switch(fieldId) {
          case 'email':
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
              showError(fieldGroup, 'Please enter a valid email');
              return false;
            }
            break;
            
          case 'phone':
            if (!/^\d{3}-\d{3}-\d{4}$/.test(value)) {
              showError(fieldGroup, 'Please use format: 123-456-7890');
              return false;
            }
            break;
            
          case 'zip':
            if (!/^\d{5}(-\d{4})?$/.test(value)) {
              showError(fieldGroup, 'Please enter a valid ZIP code');
              return false;
            }
            break;
            
          case 'state':
            if (value.length !== 2) {
              showError(fieldGroup, 'Please use 2-letter state code');
              return false;
            }
            break;
        }
        
        return true;
      }

      function validateForm() {
        let isValid = true;
        const fieldsToValidate = form.querySelectorAll('input:not([type="hidden"]):required, textarea:required, select:required');
        
        fieldsToValidate.forEach(field => {
          const event = { target: field };
          if (!validateField(event)) {
            isValid = false;
            // Scroll to first error
            if (isValid === false) {
              field.scrollIntoView({ behavior: 'smooth', block: 'center' });
              isValid = false; // To prevent overwriting in subsequent iterations
            }
          }
        });
        
        return isValid;
      }

      function showError(fieldGroup, message) {
        if (!fieldGroup) return;
        
        // Remove existing error if any
        const existingError = fieldGroup.querySelector('.error-message');
        if (existingError) existingError.remove();
        
        // Add error message
        const errorElement = document.createElement('div');
        errorElement.className = 'error-message';
        errorElement.textContent = message;
        
        fieldGroup.appendChild(errorElement);
        
        // Highlight field
        const input = fieldGroup.querySelector('input, textarea, select');
        if (input) {
          input.style.borderColor = '#e74c3c';
          input.style.boxShadow = '0 0 0 2px rgba(231, 76, 60, 0.2)';
        }
      }

      function clearError(e) {
        const field = e.target || e;
        const fieldGroup = field.closest('.zenith-input-group, .floating-select');
        
        if (!fieldGroup) return;
        
        // Remove error message
        const errorElement = fieldGroup.querySelector('.error-message');
        if (errorElement) errorElement.remove();
        
        // Reset field styling
        field.style.borderColor = '';
        field.style.boxShadow = '';
      }

      function setupFileUploadDisplay() {
        fileInput.addEventListener('change', function() {
          if (this.files.length > 0) {
            if (this.files.length === 1) {
              fileNameDisplay.textContent = this.files[0].name;
            } else {
              fileNameDisplay.textContent = `${this.files.length} files selected`;
            }
          } else {
            fileNameDisplay.textContent = 'No files selected';
          }
        });
      }

      function setupDisplayNameGeneration() {
        // Generate display name from first + last name
        const nameInputs = [firstNameInput, lastNameInput];
        
        nameInputs.forEach(input => {
          input.addEventListener('blur', updateDisplayName);
        });
      }

      function updateDisplayName() {
        const firstName = firstNameInput.value.trim();
        const lastName = lastNameInput.value.trim();
        
        if (firstName || lastName) {
          displayNameField.value = `${firstName} ${lastName}`.trim();
        }
      }

      function setupServiceDetailsBehavior() {
        // Update details placeholder when "Other" is selected
        serviceSelect.addEventListener('change', function() {
          if (this.value === 'Other') {
            detailsTextarea.placeholder = 'Please describe your roofing needs';
          } else {
            detailsTextarea.placeholder = ' ';
          }
        });
      }

      function showSuccessMessage() {
        // Create success message element
        const successMessage = document.createElement('div');
        successMessage.className = 'zenith-success-message';
        successMessage.innerHTML = `
          <h3 style="color: var(--zenith-navy); margin-top: 0; margin-bottom: 1rem;">Thank You!</h3>
          <p style="color: #495057; margin-bottom: 1rem;">Your roofing estimate request has been received. Our team will contact you within 24 hours.</p>
          <p style="color: #6c757d; font-size: 0.9rem; margin-bottom: 0;">For immediate assistance, call <strong>858-900-6163</strong></p>
        `;
        
        // Insert after form
        form.parentNode.insertBefore(successMessage, form.nextSibling);
        
        // Remove message after 5 seconds
        setTimeout(() => {
          successMessage.style.opacity = '0';
          successMessage.style.transition = 'opacity 0.5s ease';
          setTimeout(() => successMessage.remove(), 500);
        }, 5000);
      }
    });
