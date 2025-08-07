// ===================================================================
// js/hero.js — Hero Section scripts
// ===================================================================

// Wait until all HTML is loaded before running any code
document.addEventListener('DOMContentLoaded', () => {

  // ---- 1) PHONE AUTO-FORMAT (US) ----
  // Grabs the <input id="phone"> in your hero form and formats as (###) ###-####
  const phone = document.getElementById('phone');
  if (phone) {
    phone.addEventListener('input', e => {
      // 1a) Strip out non-digits, cap at 10 digits
      let digits = e.target.value.replace(/\D/g, '').slice(0, 10);
      const parts = [];

      // 1b) Area code (first 3 digits)
      if (digits.length > 3) {
        parts.push('(' + digits.slice(0, 3) + ')');
        digits = digits.slice(3);
      } else {
        parts.push(digits);
        digits = '';
      }

      // 1c) Next three digits
      if (digits.length > 3) {
        parts.push(' ' + digits.slice(0, 3) + '-');
        digits = digits.slice(3);
      } else if (digits.length > 0) {
        parts.push(' ' + digits);
        digits = '';
      }

      // 1d) Any remaining digits
      if (digits.length) parts.push(digits);

      // 1e) Join and set formatted value
      e.target.value = parts.join('');
    });
  }


  // ---- 2) (OPTIONAL) ADDRESS AUTOCOMPLETE ----
  // If you load the Google Places library, this hooks your "street" field.
  // <script src="https://maps.googleapis.com/maps/api/js?key=YOUR_KEY&libraries=places"></script>
  if (window.google && google.maps && google.maps.places) {
    const streetInput = document.getElementById('street');
    new google.maps.places.Autocomplete(streetInput, {
      types: ['address'],
      componentRestrictions: { country: 'us' }
    });
  }


  // ---- 3) SIMPLE HONEYPOT SPAM BLOCKER ----
  // If a hidden field (e.g. <input name="faxNumber">) is filled, we assume bot
  const form = document.querySelector('.hero-form');
  if (form) {
    form.addEventListener('submit', e => {
      const fax = form.querySelector('input[name="faxNumber"]');
      if (fax && fax.value) {
        // Bot detected—stop submission
        return e.preventDefault();
      }
      // Let HTML5 validation run, then submit normally to Netlify
    });
  }

});
