// js/hero.js
document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('lead-form');
  const status = document.getElementById('form-status');
  const phone = form.querySelector('#phone');

  // 1) Simple phone auto-format (US)
  phone.addEventListener('input', () => {
    let digits = phone.value.replace(/\D/g,'').slice(0,10);
    const parts = [];
    if (digits.length > 3) {
      parts.push(digits.slice(0,3));
      digits = digits.slice(3);
    }
    if (digits.length > 3) {
      parts.push(digits.slice(0,3));
      digits = digits.slice(3);
    }
    if (digits) parts.push(digits);
    phone.value = parts.map((p,i)=> i>0?` ${p}`:p).join('');
  });

  // 2) Address autocomplete (Google Places)
  if (window.google && google.maps && google.maps.places) {
    new google.maps.places.Autocomplete(
      form.projectAddress,
      { types: ['address'], componentRestrictions: { country: 'us' } }
    );
  }

  // 3) Handle spam honeypot
  form.addEventListener('submit', e => {
    if (form.faxNumber.value) return e.preventDefault(); // bot caught

    // 4) Native HTML5 validation
    if (!form.checkValidity()) {
      return; // browser will show built-in errors
    }

    // 5) Submit via fetch to Netlify
    e.preventDefault();
    const data = new FormData(form);
    fetch('/', { method: 'POST', body: data })
      .then(res => {
        if (res.ok) {
          status.textContent = 'Thanks! We received your request.';
          status.className = 'form-status success';
          form.reset();
        } else {
          throw new Error('Network error');
        }
      })
      .catch(() => {
        status.textContent = 'Oops! Something went wrong. Please try again.';
        status.className = 'form-status error';
      });
  });
});
