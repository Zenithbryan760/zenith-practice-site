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
// js/hero.js
(function () {
  // Public API used by index.html after injecting the hero
  window.initEstimateForm = function initEstimateForm() {
    const form = document.getElementById('estimate-form');
    if (!form || form.dataset.bound === 'true') return;
    form.dataset.bound = 'true';

    // Build (but don't show) a top summary area for accessibility
    let summary = form.querySelector('.error-summary');
    if (!summary) {
      summary = document.createElement('div');
      summary.className = 'error-summary';
      summary.setAttribute('role', 'alert');
      summary.setAttribute('aria-live', 'assertive');
      summary.innerHTML = '<strong>Please fix the highlighted fields.</strong>';
      form.prepend(summary);
    }

    // Phone mask: (###) ###-####
    const phone = form.querySelector('#phone');
    if (phone) {
      phone.addEventListener('input', () => {
        let v = phone.value.replace(/\D/g, '').slice(0, 10);
        const parts = [];
        if (v.length > 0) parts.push('(' + v.slice(0, 3));
        if (v.length >= 4) parts[0] += ') ' + v.slice(3, 6);
        if (v.length >= 7) parts[0] += '-' + v.slice(6, 10);
        phone.value = parts.join('');
      });
    }

    // Inline validation helpers
    const fields = Array.from(form.querySelectorAll('input[required], select[required], textarea[required], #zip, #phone, #email'));
    fields.forEach((el) => {
      el.addEventListener('blur', () => validateField(el));
      el.addEventListener('input', () => clearError(el)); // clear as they type
      el.addEventListener('change', () => clearError(el));
    });

    function validateField(el) {
      // Use native validity first
      const isValid = el.checkValidity();
      if (isValid) {
        clearError(el);
        return true;
      }
      let msg = 'This field is required.';
      if (el.id === 'email' && el.value) msg = 'Enter a valid email.';
      if (el.id === 'phone' && el.value) msg = 'Format: (123) 456-7890';
      if (el.id === 'zip' && el.value) msg = 'Enter a 5-digit ZIP (or ZIP+4).';
      showError(el, msg);
      return false;
    }

    function showError(el, message) {
      const group = el.closest('.form-group') || el.parentElement;
      if (!group) return;
      group.classList.add('has-error');
      let help = group.querySelector('.field-error');
      if (!help) {
        help = document.createElement('div');
        help.className = 'field-error';
        group.appendChild(help);
      }
      help.textContent = message;
    }

    function clearError(el) {
      const group = el.closest('.form-group') || el.parentElement;
      if (!group) return;
      group.classList.remove('has-error');
      const help = group.querySelector('.field-error');
      if (help) help.remove();
      // hide global summary if no errors left
      if (!form.querySelector('.form-group.has-error')) {
        summary.classList.remove('show');
      }
    }

    // reCAPTCHA helper
    function captchaOK() {
      try {
        if (window.grecaptcha && typeof window._recaptchaWidgetId === 'number') {
          return grecaptcha.getResponse(window._recaptchaWidgetId).length > 0;
        }
      } catch (_) {}
      return false;
    }

    function flagCaptchaError() {
      const slot = form.querySelector('#recaptcha-slot');
      const wrap = slot && slot.closest('.form-group');
      if (!wrap) return;
      wrap.classList.add('has-error');
      let help = wrap.querySelector('.field-error');
      if (!help) {
        help = document.createElement('div');
        help.className = 'field-error';
        wrap.appendChild(help);
      }
      help.textContent = 'Please verify you are not a robot.';
      summary.classList.add('show');
      // focus to the captcha for quick fix
      slot.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    // Final submit guard: blocks only when invalid; otherwise lets your flow continue
    form.addEventListener('submit', function (e) {
      // Validate all required fields
      let allGood = true;
      fields.forEach((el) => {
        if (!validateField(el)) allGood = false;
      });

      // Check captcha
      if (!captchaOK()) {
        allGood = false;
        flagCaptchaError();
      }

      if (!allGood) {
        e.preventDefault();            // block submit
        e.stopImmediatePropagation();  // block any other submit handlers
        summary.classList.add('show');

        // scroll & focus first problem
        const firstError = form.querySelector('.form-group.has-error input, .form-group.has-error select, .form-group.has-error textarea');
        if (firstError) {
          firstError.focus({ preventScroll: true });
          firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        return false;
      }

      // If valid, do NOT interfere. Let your existing submit logic (if any) run.
      // Nothing to do here.
      return true;
    }, true);
  };
})();
// js/hero.js
(function () {
  // Public API used by index.html after injecting the hero
  window.initEstimateForm = function initEstimateForm() {
    const form = document.getElementById('estimate-form');
    if (!form || form.dataset.bound === 'true') return;
    form.dataset.bound = 'true';

    // Build (but don't show) a top summary area for accessibility
    let summary = form.querySelector('.error-summary');
    if (!summary) {
      summary = document.createElement('div');
      summary.className = 'error-summary';
      summary.setAttribute('role', 'alert');
      summary.setAttribute('aria-live', 'assertive');
      summary.innerHTML = '<strong>Please fix the highlighted fields.</strong>';
      form.prepend(summary);
    }

    // Phone mask: (###) ###-####
    const phone = form.querySelector('#phone');
    if (phone) {
      phone.addEventListener('input', () => {
        let v = phone.value.replace(/\D/g, '').slice(0, 10);
        const parts = [];
        if (v.length > 0) parts.push('(' + v.slice(0, 3));
        if (v.length >= 4) parts[0] += ') ' + v.slice(3, 6);
        if (v.length >= 7) parts[0] += '-' + v.slice(6, 10);
        phone.value = parts.join('');
      });
    }

    // Inline validation helpers
    const fields = Array.from(form.querySelectorAll('input[required], select[required], textarea[required], #zip, #phone, #email'));
    fields.forEach((el) => {
      el.addEventListener('blur', () => validateField(el));
      el.addEventListener('input', () => clearError(el)); // clear as they type
      el.addEventListener('change', () => clearError(el));
    });

    function validateField(el) {
      // Use native validity first
      const isValid = el.checkValidity();
      if (isValid) {
        clearError(el);
        return true;
      }
      let msg = 'This field is required.';
      if (el.id === 'email' && el.value) msg = 'Enter a valid email.';
      if (el.id === 'phone' && el.value) msg = 'Format: (123) 456-7890';
      if (el.id === 'zip' && el.value) msg = 'Enter a 5-digit ZIP (or ZIP+4).';
      showError(el, msg);
      return false;
    }

    function showError(el, message) {
      const group = el.closest('.form-group') || el.parentElement;
      if (!group) return;
      group.classList.add('has-error');
      let help = group.querySelector('.field-error');
      if (!help) {
        help = document.createElement('div');
        help.className = 'field-error';
        group.appendChild(help);
      }
      help.textContent = message;
    }

    function clearError(el) {
      const group = el.closest('.form-group') || el.parentElement;
      if (!group) return;
      group.classList.remove('has-error');
      const help = group.querySelector('.field-error');
      if (help) help.remove();
      // hide global summary if no errors left
      if (!form.querySelector('.form-group.has-error')) {
        summary.classList.remove('show');
      }
    }

    // reCAPTCHA helper
    function captchaOK() {
      try {
        if (window.grecaptcha && typeof window._recaptchaWidgetId === 'number') {
          return grecaptcha.getResponse(window._recaptchaWidgetId).length > 0;
        }
      } catch (_) {}
      return false;
    }

    function flagCaptchaError() {
      const slot = form.querySelector('#recaptcha-slot');
      const wrap = slot && slot.closest('.form-group');
      if (!wrap) return;
      wrap.classList.add('has-error');
      let help = wrap.querySelector('.field-error');
      if (!help) {
        help = document.createElement('div');
        help.className = 'field-error';
        wrap.appendChild(help);
      }
      help.textContent = 'Please verify you are not a robot.';
      summary.classList.add('show');
      // focus to the captcha for quick fix
      slot.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    // Final submit guard: blocks only when invalid; otherwise lets your flow continue
    form.addEventListener('submit', function (e) {
      // Validate all required fields
      let allGood = true;
      fields.forEach((el) => {
        if (!validateField(el)) allGood = false;
      });

      // Check captcha
      if (!captchaOK()) {
        allGood = false;
        flagCaptchaError();
      }

      if (!allGood) {
        e.preventDefault();            // block submit
        e.stopImmediatePropagation();  // block any other submit handlers
        summary.classList.add('show');

        // scroll & focus first problem
        const firstError = form.querySelector('.form-group.has-error input, .form-group.has-error select, .form-group.has-error textarea');
        if (firstError) {
          firstError.focus({ preventScroll: true });
          firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        return false;
      }

      // If valid, do NOT interfere. Let your existing submit logic (if any) run.
      // Nothing to do here.
      return true;
    }, true);
  };
})();
