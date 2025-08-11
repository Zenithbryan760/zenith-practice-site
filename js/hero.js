// js/hero.js — lightweight helpers (no reCAPTCHA render logic here)

// ZIP -> City (US) using Zippopotam.us
document.addEventListener('DOMContentLoaded', function () {
  var zipInput = document.getElementById('zip');
  var cityInput = document.getElementById('city');

  if (zipInput && cityInput) {
    zipInput.addEventListener('blur', function () {
      var zip = zipInput.value.trim();
      if (zip.length >= 5) {
        fetch('https://api.zippopotam.us/us/' + zip)
          .then(function (res) { return res.ok ? res.json() : Promise.reject(); })
          .then(function (data) {
            var place = data.places && data.places[0];
            cityInput.value = place ? place['place name'] : '';
          })
          .catch(function () {
            cityInput.value = '';
          });
      }
    });
  }

  // Optional: guard to prevent submit without captcha token (client-side UX)
  var form = document.getElementById('estimate-form');
  if (form) {
    form.addEventListener('submit', function (e) {
      var tokenEl = document.querySelector('textarea[name="g-recaptcha-response"]');
      var hasToken = tokenEl && tokenEl.value && tokenEl.value.trim().length > 0;
      if (!hasToken) {
        e.preventDefault();
        alert('Please complete the reCAPTCHA before submitting.');
      }
    });
  }
});
