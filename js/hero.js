// js/hero.js — phone mask + ZIP → City + validation + reCAPTCHA guard + submit + lazy desktop video
(function () {
  /* ---------- DESKTOP VIDEO: inject source only on desktop & near viewport ---------- */
  function initHeroVideo() {
    var mq = window.matchMedia('(min-width: 769px)');
    var hero = document.querySelector('.zenith-hero');
    var video = document.querySelector('.zenith-background-video');
    if (!hero || !video) return;

    function attach() {
      if (video._attached || !mq.matches) return;
      var src = video.dataset.src || '';
      if (!src) return;
      var source = document.createElement('source');
      source.src = src;
      source.type = 'video/mp4';
      video.appendChild(source);
      video.load();
      video._attached = true;
    }

    // attach immediately on desktop if hero already visible
    if (mq.matches) {
      if ('IntersectionObserver' in window) {
        var io = new IntersectionObserver(function (entries) {
          entries.forEach(function (e) {
            if (e.isIntersecting) { attach(); io.disconnect(); }
          });
        }, { rootMargin: '800px 0px' });
        io.observe(hero);
      } else {
        attach(); // fallback
      }
    }

    // react to viewport width changes
    mq.addEventListener ? mq.addEventListener('change', function(e){ if (e.matches) attach(); })
                        : mq.addListener(function(e){ if (e.matches) attach(); });
  }

  // Expose for index.js init
  window.initHeroVideo = initHeroVideo;

  /* ---------- PHONE MASK (###) ###-#### ---------- */
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

  /* ---------- ZIP → CITY AUTOFILL ---------- */
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
    maybeFill();
  }

  /* ---------- VALIDATION (photos optional) ---------- */
  function ensureErrorSummary(form) {
    let box = form.querySelector('.error-summary');
    if (!box) {
      box = document.createElement('div');
      box.className = 'error-summary';
      box.setAttribute('role', 'alert');
      box.setAttribute('aria-live', 'assertive');
      const firstRow = form.querySelector('.form-row');
      (firstRow?.parentNode || form).insertBefore(box, firstRow);
    }
    return box;
  }

  function clearErrors(form) {
    form.querySelectorAll('.form-group.has-error').forEach(g => g.classList.remove('has-error'));
    form.querySelectorAll('.field-error').forEach(n => n.remove());
    const box = form.querySelector('.error-summary');
    if (box) { box.textContent = ''; box.classList.remove('show'); }
  }

  function showFieldError(input, message) {
    const group = input.closest('.form-group') || input.parentElement;
    if (!group) return;
    group.classList.add('has-error');
    if (!group.querySelector('.field-error')) {
      const note = document.createElement('div');
      note.className = 'field-error';
      note.textContent = message;
      group.appendChild(note);
    }
  }

  function getMessageFor(input) {
    if (input.validity.valueMissing) return 'This field is required.';
    if (input.id === 'email' && input.validity.typeMismatch) return 'Enter a valid email address.';
    if (input.id === 'phone' && input.validity.patternMismatch) return 'Use format: (555) 123-4567';
    if (input.id === 'zip'   && input.validity.patternMismatch) return 'Enter a 5-digit ZIP (or ZIP+4).';
    return 'Please check this field.';
  }

  function validateForm(form) {
    clearErrors(form);
    const required = Array.from(form.querySelectorAll('[required]'));
    const invalid = required.filter(el => !el.checkValidity());

    if (invalid.length) {
      const box = ensureErrorSummary(form);
      box.textContent = 'Please fix the highlighted fields. Photos are optional; all other fields are required.';
      box.classList.add('show');
      invalid.forEach(el => showFieldError(el, getMessageFor(el)));
      invalid[0].focus();
      return false;
    }
    return true;
  }

  /* ---------- SUBMIT ---------- */
  async function submitHandler(e) {
    e.preventDefault();
    const form = e.currentTarget;

    if (!validateForm(form)) return;

    // reCAPTCHA required
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
      const box = ensureErrorSummary(form);
      box.textContent = 'Please complete the reCAPTCHA before submitting.';
      box.classList.add('show');
      return;
    }

    // payload
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

      clearErrors(form);
    } catch (err) {
      console.error(err);
      alert("Network error. Please try again.");
    } finally {
      if (submitBtn && originalText) { submitBtn.textContent = originalText; submitBtn.disabled = false; }
    }
  }

  /* ---------- PUBLIC INIT ---------- */
  window.initEstimateForm = function initEstimateForm() {
    const form = document.getElementById('estimate-form');
    if (!form || form._bound) return;
    form._bound = true;
    bindPhoneMask();
    bindZipToCity();
    form.addEventListener('submit', submitHandler);
  };

  // in case hero exists pre-includes
  document.addEventListener('DOMContentLoaded', function () {
    if (document.getElementById('estimate-form')) window.initEstimateForm();
    if (document.querySelector('.zenith-background-video')) initHeroVideo();
  });
})();
