// js/hero.js — single, consolidated version
(function () {
  // ----- helpers: errors & summary -----
  function ensureSummary(form) {
    let summary = form.querySelector('.error-summary');
    if (!summary) {
      summary = document.createElement('div');
      summary.className = 'error-summary';
      summary.setAttribute('role', 'alert');
      summary.setAttribute('aria-live', 'assertive');
      summary.innerHTML = '<strong>Please fix the highlighted fields.</strong>';
      form.prepend(summary);
    }
    return summary;
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
  }

  // ----- phone mask -----
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

  // ----- ZIP -> City (best-effort) -----
  function bindZipToCity() {
    const zipInput  = document.getElementById('zip');
    const cityInput = document.getElementById('city');
    if (!zipInput || !cityInput || zipInput._zipBound) return;
    zipInput._zipBound = true;
    const cache = {};
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
    maybeFill();
  }

  // ----- captcha helpers -----
  function captchaOK() {
    try {
      if (window.grecaptcha && typeof window._recaptchaWidgetId === 'number') {
        return grecaptcha.getResponse(window._recaptchaWidgetId).length > 0;
      }
    } catch (_) {}
    return false;
  }
  function flagCaptchaError(form, summary) {
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
    slot.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  // ----- validation -----
  function validateField(el) {
    // native validity first
    if (el.checkValidity()) {
      clearError(el);
      return true;
    }
    let msg = 'This field is required.';
    if (el.id === 'email' && el.value) msg = 'Enter a valid email.';
    if (el.id === 'phone' && el.value) msg = 'Format: (123) 456-7890';
    if (el.id === 'zip'   && el.value) msg = 'Enter a 5-digit ZIP (or ZIP+4).';
    showError(el, msg);
    return false;
  }

  // ----- submit to Netlify function -----
  async function postLead(data) {
    const res = await fetch("/.netlify/functions/jn-create-lead", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });
    const text = await res.text();
    return { ok: res.ok, text };
  }

  // ----- main init -----
  window.initEstimateForm = function initEstimateForm() {
    const form = document.getElementById('estimate-form');
    if (!form || form.dataset.bound === 'true') return;
    form.dataset.bound = 'true';

    const summary = ensureSummary(form);
    bindPhoneMask();
    bindZipToCity();

    const fields = Array.from(form.querySelectorAll('input[required], select[required], textarea[required]'));
    fields.forEach((el) => {
      el.addEventListener('blur',  () => validateField(el));
      el.addEventListener('input', () => { clearError(el); });
      el.addEventListener('change', () => { clearError(el); });
    });

    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      // validate required fields
      let allGood = true;
      fields.forEach((el) => { if (!validateField(el)) allGood = false; });

      // captcha
      if (!captchaOK()) {
        allGood = false;
        flagCaptchaError(form, summary);
      }

      if (!allGood) {
        summary.classList.add('show');
        const firstError = form.querySelector('.form-group.has-error input, .form-group.has-error select, .form-group.has-error textarea');
        if (firstError) {
          firstError.focus({ preventScroll: true });
          firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        return;
      }

      // build payload
      const fd = new FormData(form);
      let recaptcha_token = '';
      try {
        recaptcha_token = grecaptcha.getResponse(window._recaptchaWidgetId) || '';
      } catch (_) {}
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
        description:     (fd.get("description")    || "").trim(),
        recaptcha_token
      };

      const btn = form.querySelector('button[type="submit"]');
      const originalText = btn ? btn.textContent : null;
      if (btn) { btn.textContent = "Submitting…"; btn.disabled = true; }

      try {
        const res = await postLead(data);
        if (!res.ok) {
          console.error("JobNimbus error:", res.text);
          alert("Sorry, there was a problem submitting your request.");
          return;
        }
        alert("Thanks! Your request has been submitted.");
        form.reset();

        // reset captcha
        try {
          if (window.grecaptcha && typeof window.grecaptcha.reset === "function" &&
              typeof window._recaptchaWidgetId !== "undefined") {
            window.grecaptcha.reset(window._recaptchaWidgetId);
          } else {
            const t = document.querySelector('textarea[name=\"g-recaptcha-response\"]');
            if (t) t.value = '';
          }
        } catch (_) {}
      } catch (err) {
        console.error(err);
        alert("Network error. Please try again.");
      } finally {
        if (btn && originalText) { btn.textContent = originalText; btn.disabled = false; }
        // hide summary if no errors remain
        if (!form.querySelector('.form-group.has-error')) summary.classList.remove('show');
      }
    });
  };

  // In case the hero is already in DOM (SSR/inline)
  document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('estimate-form')) window.initEstimateForm();
  });
})();
