// ====================================================================
// js/hero.js — Zapier-only (no Netlify)
// - Phone auto-format
// - Date min = today + day-of-week label
// - Floating label fix for <select>
// - ZIP → City (State locked to CA)
// - reCAPTCHA explicit render (token appended to form)
// - ONE submit handler
// - Sends FormData (incl. files) directly to Zapier Webhook
// ====================================================================

document.addEventListener('DOMContentLoaded', () => {
  // 1) Phone auto-format: (123) 456-7890
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

  // 2) Date min = today + show DOW under picker
  const dateEl = document.getElementById('date');
  const dateDOW = document.getElementById('date-dow');
  if (dateEl) {
    dateEl.min = new Date().toISOString().slice(0, 10);
    if (dateDOW) {
      dateDOW.classList.remove('visually-hidden');
      const setDOW = () => {
        const v = dateEl.value;
        if (!v) { dateDOW.textContent = ''; return; }
        const d = new Date(v + 'T00:00:00'); // avoid tz shift
        const days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
        dateDOW.textContent = `(${days[d.getUTCDay()]})`;
      };
      dateEl.addEventListener('change', setDOW);
      setDOW();
    }
  }

  // 3) Optional Google Places autocomplete on "street"
  if (window.google && google.maps && google.maps.places) {
    const street = document.getElementById('street');
    if (street) {
      new google.maps.places.Autocomplete(street, {
        types: ['address'],
        componentRestrictions: { country: 'us' },
      });
    }
  }

  // 4) Floating label fix for <select>
  document.querySelectorAll('.zenith-input-group select').forEach((sel) => {
    const parent = sel.closest('.zenith-input-group');
    const toggle = () => (sel.value ? parent.classList.add('has-value') : parent.classList.remove('has-value'));
    sel.addEventListener('change', toggle);
    toggle();
  });

  // 5) ZIP → City (State locked to CA)
  const zipEl = document.getElementById('zip');
  const cityEl = document.getElementById('city');
  const stateEl = document.getElementById('state');
  if (stateEl) stateEl.value = 'CA';

  if (zipEl && cityEl) {
    let zipTimer = null;
    const lookupZip = async (zip) => {
      if (!/^\d{5}$/.test(zip)) return;
      try {
        const r = await fetch(`https://api.zippopotam.us/us/${zip}`);
        if (!r.ok) return;
        const data = await r.json();
        const place = data.places && data.places[0];
        if (place) cityEl.value = place['place name'] || cityEl.value;
      } catch(_) {}
    };
    zipEl.addEventListener('input', () => {
      clearTimeout(zipTimer);
      const val = zipEl.value.replace(/\D/g, '').slice(0,5);
      zipTimer = setTimeout(() => lookupZip(val), 300);
    });
    zipEl.addEventListener('blur', () => {
      const val = zipEl.value.replace(/\D/g, '').slice(0,5);
      lookupZip(val);
    });
  }

  // 6) reCAPTCHA explicit render
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

  // 7) Bind submit handler
  let bound = false;
  const tryBind = () => {
    if (bound) return true;
    const form = document.getElementById('estimate-form');
    if (!form) return false;
    if (form.dataset.bound === 'true') return true;
    form.dataset.bound = 'true';
    bound = true;

    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      // Build FormData (includes files automatically)
      const fd = new FormData(form);

// Phone auto-format with caret preservation: (123) 456-7890
const phone = document.getElementById('phone');
if (phone) {
  const formatPhone = (digits) => {
    const v = digits.slice(0, 10);
    if (v.length <= 3) return v;
    if (v.length <= 6) return `(${v.slice(0,3)}) ${v.slice(3)}`;
    return `(${v.slice(0,3)}) ${v.slice(3,6)}-${v.slice(6)}`;
  };

  const setFormatted = () => {
    const start = phone.selectionStart;
    const end = phone.selectionEnd;

    const rawBefore = phone.value;
    const digits = rawBefore.replace(/\D/g, '');
    const formatted = formatPhone(digits);

    // Rough caret mapping: count digits before caret in old, place after same count in new
    const digitsBeforeCaret = rawBefore.slice(0, start).replace(/\D/g, '').length;
    let caret = 0, digitCount = 0;
    for (let i = 0; i < formatted.length; i++) {
      if (/\d/.test(formatted[i])) digitCount++;
      if (digitCount === digitsBeforeCaret) { caret = i + 1; break; }
    }
    phone.value = formatted;
    requestAnimationFrame(() => phone.setSelectionRange(caret, caret));
  };

  phone.addEventListener('input', setFormatted);
  phone.addEventListener('blur', () => {
    // Optional: if fewer than 10 digits, leave as-is; pattern will handle validity
    const digits = phone.value.replace(/\D/g, '');
    phone.value = formatPhone(digits);
  });
}


      // Ensure CA stays set
      if (stateEl) fd.set('state', 'CA');

      // Add page context
      fd.append('page', location.pathname + location.hash);

      // Add reCAPTCHA token if present
      try {
        if (window.grecaptcha && window.__zenithRecaptchaWidgetId != null) {
          const token = grecaptcha.getResponse(window.__zenithRecaptchaWidgetId);
          fd.append('recaptcha', token || '');
        }
      } catch (_) {}

      // Honeypot: if filled, silently "succeed"
      if ((fd.get('company') || '').trim() !== '') {
        alert('Thanks! We’ll be in touch shortly.');
        form.reset();
        return;
      }

      // 👉 Zapier Catch Hook URL — REPLACE THIS
      const ZAP_URL = 'https://hooks.zapier.com/hooks/catch/xxxx/yyyy';

      // UI state
      const btn = form.querySelector('button[type="submit"]');
      const oldText = btn ? btn.textContent : '';
      if (btn) { btn.disabled = true; btn.textContent = 'Sending…'; }

      try {
        // Do NOT set Content-Type; browser sets multipart boundary
        const res = await fetch(ZAP_URL, { method: 'POST', body: fd });
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
    });

    window.renderHeroRecaptchaIfReady();
    return true;
  };

  if (!tryBind()) {
    const int = setInterval(() => { if (tryBind()) clearInterval(int); }, 150);
    setTimeout(() => clearInterval(int), 10000);
  }
});
