// js/hero.js — ZIP -> City + single submit handler with reCAPTCHA guard + JobNimbus submit

document.addEventListener('DOMContentLoaded', function () {
  // ---- ZIP -> City (US) using Zippopotam.us ----
  const zipInput = document.getElementById('zip');
  const cityInput = document.getElementById('city');

  if (zipInput && cityInput) {
    zipInput.addEventListener('blur', function () {
      const zip = (zipInput.value || '').replace(/\D/g, '');
      if (zip.length >= 5) {
        fetch('https://api.zippopotam.us/us/' + zip)
          .then(res => (res.ok ? res.json() : Promise.reject()))
          .then(data => {
            const place = data.places && data.places[0];
            cityInput.value = place ? place['place name'] : '';
          })
          .catch(() => { /* keep whatever user typed */ });
      }
    });
  }

  // ---- Single submit handler ----
  const form = document.getElementById('estimate-form');
  if (!form) return;

  form.addEventListener('submit', async function (e) {
    e.preventDefault();

    // Require reCAPTCHA solved (v2 checkbox).
    // Prefer explicit widget id; fall back to hidden textarea if needed.
    let token = '';
    if (window.grecaptcha && typeof window.grecaptcha.getResponse === 'function') {
      if (typeof window._recaptchaWidgetId !== 'undefined') {
        token = window.grecaptcha.getResponse(window._recaptchaWidgetId) || '';
      }
      if (!token) {
        const t = document.querySelector('textarea[name="g-recaptcha-response"]');
        if (t && t.value) token = t.value.trim();
      }
    }
    if (!token) {
      alert("Please complete the reCAPTCHA before submitting.");
      return;
    }
    // If you later add server-side verification in your Netlify function:
    // data.recaptcha_token = token;

    // Build payload from form fields (names match your HTML)
    const fd = new FormData(form);
    const data = {
      first_name: (fd.get("first_name") || "").trim(),
      last_name:  (fd.get("last_name")  || "").trim(),
      phone:      (fd.get("phone")      || "").trim(),
      email:      (fd.get("email")      || "").trim(),
      street_address: (fd.get("street_address") || "").trim(),
      city:       (fd.get("city")       || "").trim(),
      state:      (fd.get("state")      || "").trim(),
      zip:        (fd.get("zip")        || "").trim(),
      service_type:    fd.get("service_type")    || "",
      referral_source: fd.get("referral_source") || "",
      description:     (fd.get("description")    || "").trim()
    };

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

      // Reset reCAPTCHA after success (works for explicit + fallback)
      if (window.grecaptcha && typeof window.grecaptcha.reset === "function" &&
          typeof window._recaptchaWidgetId !== "undefined") {
        window.grecaptcha.reset(window._recaptchaWidgetId);
      } else {
        const t = document.querySelector('textarea[name=\"g-recaptcha-response\"]');
        if (t) t.value = '';
      }
    } catch (err) {
      console.error(err);
      alert("Network error. Please try again.");
    } finally {
      if (submitBtn && originalText) submitBtn.textContent = originalText;
    }
  });
});
