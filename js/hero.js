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
// js/hero.js Netlify Forms Functions to JobNimbus)
// js/hero.js
document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("estimate-form");
  if (!form) return;

  // Optional: phone mask pattern hint (since your HTML pattern is (###) ###-####)
  const phoneInput = form.querySelector('#phone');

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    // Collect fields by your EXACT name attributes
    const fd = new FormData(form);

    // Build a plain object for JSON (excluding files)
    const data = {
      first_name: fd.get("first_name")?.trim() || "",
      last_name: fd.get("last_name")?.trim() || "",
      phone: fd.get("phone")?.trim() || "",
      email: fd.get("email")?.trim() || "",
      street_address: fd.get("street_address")?.trim() || "",
      city: fd.get("city")?.trim() || "",
      state: fd.get("state")?.trim() || "",
      zip: fd.get("zip")?.trim() || "",
      service_type: fd.get("service_type") || "",
      referral_source: fd.get("referral_source") || "",
      description: fd.get("description")?.trim() || ""
    };

    // (Photos) We’re not sending files to JobNimbus yet. See notes below.

    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn ? submitBtn.textContent : null;

    try {
      if (submitBtn) submitBtn.textContent = "Submitting…";

      const res = await fetch("/.netlify/functions/jn-create-lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });

      const text = await res.text();
      if (!res.ok) {
        console.error("JobNimbus error:", text);
        alert("Sorry, there was a problem submitting your request.");
        return;
      }

      alert("Thanks! Your request has been submitted.");
      form.reset();
    } catch (err) {
      console.error(err);
      alert("Network error. Please try again.");
    } finally {
      if (submitBtn && originalText) submitBtn.textContent = originalText;
    }
  });
});
