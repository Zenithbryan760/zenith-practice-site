// js/hero.js — phone mask + ZIP → City + reCAPTCHA guard + submit to Netlify
(function () {
  // ---------- PHONE MASK (###) ###-#### ----------
  function bindPhoneMask() {
    const el = document.getElementById('phone');
    if (!el || el._masked) return;
    el._masked = true;
    el.setAttribute('maxlength', '14');

    const fmt = v => {
      const d = (v || '').replace(/\D/g, '').slice(0, 10);
      if (!d) return '';
      if (d.length < 4) return `(${d}`;
      if (d.length < 7) return `(${d.slice(0,3)}) ${d.slice(3)}`;
      return `(${d.slice(0,3)}) ${d.slice(3,6)}-${d.slice(6)}`;
    };

    el.addEventListener('input', e => { e.target.value = fmt(e.target.value); });
    el.addEventListener('blur', e => {
      const len = e.target.value.replace(/\D/g, '').length;
      e.target.setCustomValidity(len === 0 || len === 10 ? '' : 'Enter a 10-digit phone number');
    });
  }

  // ---------- ZIP → CITY AUTOFILL ----------
  function bindZipToCity() {
    const zipInput  = document.getElementById('zip');
    const cityInput = document.getElementById('city');
    if (!zipInput || !cityInput || zipInput._zipBound) return;
    zipInput._zipBound = true;

    const cache = {}; // { "92025": "Escondido" }
    cityInput.addEventListener('input', () => { cityInput.dataset.autofilled = ''; });

    async function lookup(zip5) {
      if (cache[zip5]) return cache[zip5];
      const res = await fetch('https://api.zippopotam.us/us/' + zip5);
      if (!res.ok) throw new Error('zip lookup failed');
      const data = await res.json();
      const place = data.places && data.places[0];
      const city  = place ? place['place name'] : '';
      cache[zip5] = city;
      return city;
    }

    async function maybeFill() {
      const digits = (zipInput.value || '').replace(/\D/g, '');
      if (!(digits.length === 5 || digits.length === 9)) return;
      try {
        const city = await lookup(digits.slice(0,5));
        const canOverwrite = !cityInput.value || cityInput.dataset.autofilled === '1';
        if (canOverwrite) {
          cityInput.value = city || '';
          cityInput.dataset.autofilled = '1';
        }
      } catch {}
    }

    zipInput.addEventListener('input',  maybeFill);
    zipInput.addEventListener('change', maybeFill);
    // Run once if a ZIP is prefilled
    maybeFill();
  }

  // ---------- SUBMIT HANDLER (reCAPTCHA + POST to Netlify) ----------
  async function submitHandler(e) {
    e.preventDefault();
    const form = e.currentTarget;

    // Require reCAPTCHA (v2 checkbox)
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
    // If you later verify server-side, you can add: data.recaptcha_token = token;

    // Build payload from form fields
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
    if (submitBtn) { submitBtn.textContent = "Submitting…"; submitBtn.disabled = true; }

    try {
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

      // Reset reCAPTCHA
      if (window.grecaptcha && typeof window.grecaptcha.reset === "function" &&
          typeof window._recaptchaWidgetId !== "undefined") {
        window.grecaptcha.reset(window._recaptchaWidgetId);
      } else {
        const t = document.querySelector('textarea[name="g-recaptcha-response"]');
        if (t) t.value = '';
      }
    } catch (err) {
      console.error(err);
      alert("Network error. Please try again.");
    } finally {
      if (submitBtn && originalText) { submitBtn.textContent = originalText; submitBtn.disabled = false; }
    }
  }

  // ---------- PUBLIC INIT (call after hero HTML is injected) ----------
  window.initEstimateForm = function initEstimateForm() {
    const form = document.getElementById('estimate-form');
    if (!form || form._bound) return;        // avoid double-binding
    form._bound = true;

    bindPhoneMask();
    bindZipToCity();
    form.addEventListener('submit', submitHandler);
  };

  // Also try at DOM load in case hero is already present
  document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('estimate-form')) window.initEstimateForm();
  });
})();
