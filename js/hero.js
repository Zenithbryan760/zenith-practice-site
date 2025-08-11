<script>
    document.addEventListener('DOMContentLoaded', function() {
      const form = document.getElementById('estimate-form');
      const fileInput = document.getElementById('photos');
      const fileNameDisplay = document.getElementById('file-name-display');

      // Fixed File Upload Display
      fileInput.addEventListener('change', function() {
        if (this.files.length > 0) {
          fileNameDisplay.textContent = this.files.length === 1 
            ? this.files[0].name 
            : `${this.files.length} files selected`;
        } else {
          fileNameDisplay.textContent = 'No files selected';
        }
      });

      // Form Submission
      form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Validate reCAPTCHA
        const recaptchaResponse = grecaptcha.getResponse();
        if (recaptchaResponse.length === 0) {
          alert('Please complete the reCAPTCHA verification');
          return;
        }

        // Submit form (replace with actual AJAX call)
        alert('Form submitted successfully!');
        form.reset();
        fileNameDisplay.textContent = 'No files selected';
        grecaptcha.reset();
      });
    });
  </script>
