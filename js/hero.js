// ====================================================================
// js/hero.js — Zenith Hero helpers
// - Phone auto-format (US)
// - Date min = today
// - Floating label fix for <select> (when optional)
// - Honeypot spam guard
// ====================================================================

document.addEventListener('DOMContentLoaded', () => {
  // ---- 1) PHONE AUTO-FORMAT → (123) 456-7890 ----
  const phone = document.getElementById('phone');
  if (phone) {
    phone.addEventListener('input', (e) => {
      let v = e.target.value.replace(/\D/g, '').slice(0, 10);
      let out = '';
      if (v.length > 0) out = '(' + v.slice(0, 3);
      if (v.length >= 4) out += ') ' + v.slice(3, 6);
      if (v.length >= 7) out += '-' + v.slice(6);
      e.target.value = out;
    });
  }

  // ---- 2) DATE MIN (prevent past dates) ----
  const date = document.getElementById('date');
  if (date) {
    const today = new Date();
    const iso = today.toISOString().slice(0, 10);
    date.min = iso;
  }

  // ---- 3) OPTIONAL: Google Places Autocomplete on "street" ----
  // Load this script in your HTML if you want it:
  // <script src="https://maps.googleapis.com/maps/api/js?key=YOUR_KEY&libraries=places"></script>
  if (window.google && google.maps && google.maps.places) {
    const street = document.getElementById('street');
    if (street) {
      new google.maps.places.Autocomplete(street, {
        types: ['address'],
        componentRestrictions: { country: 'us' },
      });
    }
  }

  // ---- 4) FLOATING LABEL FIX FOR <select> ----
  // If a select is not required (e.g., referral), we add/remove a class
  // on its parent so the label can float when a value is chosen.
  document.querySelectorAll('.zenith-input-group select').forEach((sel) => {
    const parent = sel.closest('.zenith-input-group');
    const toggle = () => {
      if (sel.value && sel.value !== '') parent.classList.add('has-value');
      else parent.classList.remove('has-value');
    };
    sel.addEventListener('change', toggle);
    toggle(); // initialize on load
  });

// ---- 6) Google reCAPTCHA explicit render helpers ----
// Renders the checkbox IF the hero has been injected and the Google API is ready.
window.renderHeroRecaptchaIfReady = function () {
  var el = document.getElementById('estimate-recaptcha');
  if (!el) return; // hero not injected yet

  if (window.grecaptcha && typeof grecaptcha.render === 'function') {
    if (!el.getAttribute('data-rendered')) { // avoid duplicate renders
      grecaptcha.render(el, {
        sitekey: '6LclaJ4rAAAAAEMe8ppXrEJvIgLeFVxgmkq4DBrI'
      });
      el.setAttribute('data-rendered', 'true');
    }
  }
};

// Google calls this after their script finishes loading (?onload=recaptchaOnload)
window.recaptchaOnload = function () {
  window.renderHeroRecaptchaIfReady();
};


  // ---- 3) Estimate from API ----
  
document.getElementById("estimate-form").addEventListener("submit", async function (e) {
  e.preventDefault();

  const formData = new FormData(this);
  const data = Object.fromEntries(formData.entries());

  try {
    const response = await fetch("/.netlify/functions/jn-create-lead", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(data)
    });

    const result = await response.json();
    if (response.ok) {
      alert("Form submitted successfully!");
      this.reset();
    } else {
      alert("Error: " + (result.error || "Something went wrong"));
    }
  } catch (err) {
    console.error(err);
    alert("Network error, please try again.");
  }
});
