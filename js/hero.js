// js/hero.js — lightweight helpers (ZIP -> City + submit guard)

document.addEventListener('DOMContentLoaded', function () {
  // ZIP -> City (US) using Zippopotam.us
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
          .catch(function () { cityInput.value = ''; });
      }
    });
  }

  // Optional: client-side guard to ensure captcha solved before submit
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
<script>
  (function () {
    function setNavCollapsedClass() {
      var toggle = document.querySelector('.menu-toggle');
      var collapsed = toggle && getComputedStyle(toggle).display !== 'none';
      document.documentElement.classList.toggle('nav-collapsed', collapsed);
    }
    window.addEventListener('load', setNavCollapsedClass);
    window.addEventListener('resize', setNavCollapsedClass);
  })();
</script>
