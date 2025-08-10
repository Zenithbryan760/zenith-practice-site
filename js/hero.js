// ====================================================================
// js/hero.js — Zapier-only submission
// - Phone mask: (123) 456-7890 x1234
// - Date min = today
// - ZIP → City (State locked to CA)
// - reCAPTCHA explicit render (token appended)
// - ONE submit handler sending FormData (incl. files) to Zapier
// ====================================================================

document.addEventListener('DOMContentLoaded', () => {
  // --- 0) Helper: wait until the hero form exists (because it's injected) ---
  let bound = false;
  const tryBind = () => {
    if (bound) return true;
    const form = document.getElementById('estimate-form');
    if (!form) return false;

    if (form.dataset.bound === 'true') return true;
    form.dataset.bound = 'true';
    bound = true;

    bootstrapForm(form);
    return true;
  };

  if (!tryBind()) {
    const int = setInterval(() => { if (tryBind()) clearInterval(int); }, 150);
    setTimeout(() => clearInterval(int), 10000);
  }

  // --- 1) reCAPTCHA explicit render hooks (global) ---
  window.renderHeroRecaptchaIfReady = function () {
    const el = document.getElementById('estimate-recaptcha');
    if (!el) return;
    if (window.grecaptcha && typeof grecaptcha.render === 'function') {
      if (!el.getAttribute('data-rendered')) {
        window.__zenithRecaptchaWidgetId = grecaptcha.render(el, {
          sitekey: '6LclaJ4rAAAAAEMe8ppXrEJvIgLeFVxgmkq4DBrI'
        });
        el.setAttribute('data-rendered', 'true');
      }
    }
  };
  window.recaptchaOnload = function () { window.renderHeroRecaptchaIfReady(); };

  // --- 2) Main initializer for the form ---
  function bootstrapForm(form) {
    // A) Phone mask
    phoneMask();

    // B) Date min = today
    const completionDate = document.getElementById('completionDate');
    if (completionDate) {
      completionDate.min = new Date().toISOString().slice(0, 10);
    }

    // C) Optional Google Places autocomplete on Address
    if (window.google && google.maps && google.maps.places) {
      const addr = document.getElementById('address');
      if (addr) {
        new google.maps.places.Autocomplete(addr, {
          types: ['address'],
          componentRestrictions: { country: 'us' },
        });
      }
    }

    // D) ZIP → City (keep State = CA)
    zipToCityCA();

    // E) Submit handler (Zapier)
    form.addEventListener('submit', onSubmit);

    // F) Render captcha if Google script already loaded
    window.renderHeroRecaptchaIfReady();
  }

  // --- Phone input: (123) 456-7890 x1234 (with caret preservation) ---
  function phoneMask() {
    const el = document.getElementById('phone');
    if (!el) return;

    const formatPhone = (raw) => {
      const lower = String(raw || '').toLowerCase();
      const xIndex = lower.indexOf('x');                       // start of ext if present
      const extDigits = xIndex >= 0 ? lower.slice(xIndex + 1).replace(/\D/g, '') : '';
      const mainDigits = (xIndex >= 0 ? lower.slice(0, xIndex) : lower).replace(/\D/g, '').slice(0, 10);

      let out = '';
      if (mainDigits.length > 0) out = '(' + mainDigits.slice(0, 3);
      if (mainDigits.length >= 4) out += ') ' + mainDigits.slice(3, 6);
      if (mainDigits.length >= 7) out += '-' + mainDigits.slice(6, 10);
      if (mainDigits.length > 0 && mainDigits.length < 4 && !out.startsWith('(')) {
        out = '(' + out;
      }
      if (extDigits) out += ' x' + extDigits.slice(0, 6);      // up to 6 ext digits
      return out;
    };

    const setFormatted = () => {
      const start = el.selectionStart ?? el.value.length;
      const rawBefore = el.value;

      // digits before caret in original string
      const digitsBeforeCaret = rawBefore.slice(0, start).replace(/\D/g, '').length;

      const formatted = formatPhone(rawBefore);
      el.value = formatted;

      // place caret after same number of digits in new string
      let caret = formatted.length;
      let seen = 0;
      for (let i = 0; i < formatted.length; i++) {
        if (/\d/.test(formatted[i])) seen++;
        if (seen >= digitsBeforeCaret) { caret = i + 1; break; }
      }
      requestAnimationFrame(() => el.setSelectionRange(caret, caret));
    };

    // block invalid chars except digits, space, parens, dash, x
    el.addEventListener('beforeinput', (e) => {
      if (e.inputType && e.inputType.startsWith('delete')) return;
      const ok = /^[0-9xX ()-]*$/.test(e.data || '');
      if (e.data && !ok) e.preventDefault();
    });

    el.addEventListener('input', setFormatted);
    el.addEventListener('blur', () => { el.value = formatPhone(el.value); });
  }

  // --- ZIP → City and keep State = CA (read-only visual style handled in CSS) ---
  function zipToCityCA() {
    const zipEl = document.getElementById('zip');
    const cityEl = document.getElementById('city');
    const stateEl = document.getElementById('state');
    if (stateEl) stateEl.value = 'CA';

    if (!(zipEl && cityEl)) return;

    let zipTimer = null;
    const lookupZip = async (zip) => {
      if (!/^\d{5}$/.test(zip)) return;
      try {
        const r = await fetch(`https://api.zippopotam.us/us/${zip}`);
        if (!r.ok) return;
        const data = await r.json();
        const place = data.places && data.places[0];
        if (place) cityEl.value = place['place name'] || cityEl.value;
      } catch (_) {}
    };

    zipEl.addEventListener('input', () => {
      clearTimeout(zipTimer);
      const val = zipEl.value.replace(/\D/g, '').slice(0, 5);
      zipTimer = setTimeout(() => lookupZip(val), 300);
    });
    zipEl.addEventListener('blur', () => {
      const val = zipEl.value.replace(/\D/g, '').slice(0, 5);
      lookupZip(val);
    });
  }

  // --- Submit -> Zapier ---
  async function onSubmit(e) {
    e.preventDefault();
    const form = e.currentTarget;

    // Build FormData (includes files)
    const fd = new FormData(form);

    // Normalize phone to digits (JobNimbus/CRM friendly)
    const phoneRaw = String(fd.get('phone') || '');
    fd.set('phone', phoneRaw.replace(/\D/g, ''));

    // Ensure CA (even if user edits)
    const stateEl = document.getElementById('state');
    if (stateEl) fd.set('state', 'CA');

    // Honeypot: if filled, silently succeed
    if ((fd.get('company') || '').toString().trim() !== '') {
      alert('Thanks! We’ll be in touch shortly.');
      form.reset();
      return;
    }

    // Add page context
    fd.append('page', location.pathname + location.hash);

    // Add reCAPTCHA token if present
    try {
      if (window.grecaptcha && window.__zenithRecaptchaWidgetId != null) {
        const token = grecaptcha.getResponse(window.__zenithRecaptchaWidgetId);
        fd.append('recaptcha', token || '');
      }
    } catch (_) {}

    // 👉 REPLACE with your Zapier Catch Hook URL
    const ZAP_URL = 'https://hooks.zapier.com/hooks/catch/xxxx/yyyy';

    // UI state
    const btn = form.querySelector('button[type="submit"]');
    const oldText = btn ? btn.textContent : '';
    if (btn) { btn.disabled = true; btn.textContent = 'Sending…'; }

    try {
      const res = await fetch(ZAP_URL, {
        method: 'POST',
        body: fd,          // let browser set multipart/form-data with boundary
      });
      if (!res.ok) throw new Error('Submit failed');

      alert('Thanks! We’ll be in touch shortly.');
      form.reset();
      if (window.grecaptcha && window.__zenithRecaptchaWidgetId != null) {
        grecaptcha.reset(window.__zenithRecaptchaWidgetId);
      }
    } catch (err) {
      console.error(err);
      alert('Sorry, something went wrong. Please call 858-900-6163 or try again.');
    } finally {
      if (btn) { btn.disabled = false; btn.textContent = oldText; }
    }
  }
});
