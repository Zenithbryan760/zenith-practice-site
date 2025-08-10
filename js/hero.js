// ====================================================================
// js/hero.js — Zapier-only, original styling preserved
// - Phone mask: (123) 456-7890 x1234
// - ZIP → City (State locked to CA)
// - reCAPTCHA explicit render (token appended)
// - Sends FormData (incl. files) to Zapier
// - No preferred date field; users can type timing in "details"
// ====================================================================

document.addEventListener('DOMContentLoaded', () => {
  // Wait for injected hero
  let bound = false;
  const tryBind = () => {
    if (bound) return true;
    const form = document.getElementById('estimate-form');
    if (!form) return false;
    if (form.dataset.bound === 'true') return true;
    form.dataset.bound = 'true';
    bound = true;

    init(form);
    return true;
  };
  if (!tryBind()) {
    const int = setInterval(() => { if (tryBind()) clearInterval(int); }, 150);
    setTimeout(() => clearInterval(int), 10000);
  }

  // reCAPTCHA explicit render
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

  function init(form) {
    phoneMask();
    zipToCityCA();
    if (window.google && google.maps && google.maps.places) {
      const street = document.getElementById('street');
      if (street) {
        new google.maps.places.Autocomplete(street, {
          types: ['address'],
          componentRestrictions: { country: 'us' },
        });
      }
    }
    form.addEventListener('submit', onSubmit);
    window.renderHeroRecaptchaIfReady();
  }

  // Phone mask with caret preservation
  function phoneMask() {
    const el = document.getElementById('phone');
    if (!el) return;

    const formatPhone = (raw) => {
      const lower = String(raw || '').toLowerCase();
      const xIndex = lower.indexOf('x');
      const extDigits = xIndex >= 0 ? lower.slice(xIndex + 1).replace(/\D/g, '') : '';
      const mainDigits = (xIndex >= 0 ? lower.slice(0, xIndex) : lower).replace(/\D/g, '').slice(0, 10);

      let out = '';
      if (mainDigits.length > 0) out = '(' + mainDigits.slice(0, 3);
      if (mainDigits.length >= 4) out += ') ' + mainDigits.slice(3, 6);
      if (mainDigits.length >= 7) out += '-' + mainDigits.slice(6, 10);
      if (extDigits) out += ' x' + extDigits.slice(0, 6);
      return out;
    };

    const setFormatted = () => {
      const start = el.selectionStart ?? el.value.length;
      const rawBefore = el.value;
      const digitsBeforeCaret = rawBefore.slice(0, start).replace(/\D/g, '').length;

      const formatted = formatPhone(rawBefore);
      el.value = formatted;

      let caret = formatted.length, seen = 0;
      for (let i = 0; i < formatted.length; i++) {
        if (/\d/.test(formatted[i])) seen++;
        if (seen >= digitsBeforeCaret) { caret = i + 1; break; }
      }
      requestAnimationFrame(() => el.setSelectionRange(caret, caret));
    };

    el.addEventListener('beforeinput', (e) => {
      if (e.inputType && e.inputType.startsWith('delete')) return;
      const ok = /^[0-9xX ()-]*$/.test(e.data || '');
      if (e.data && !ok) e.preventDefault();
    });

    el.addEventListener('input', setFormatted);
    el.addEventListener('blur', () => { el.value = formatPhone(el.value); });
  }

  // ZIP -> City; lock State to CA
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

  // Submit -> Zapier
  async function onSubmit(e) {
    e.preventDefault();
    const form = e.currentTarget;

    const fd = new FormData(form);

    // normalize phone to digits for CRMs
    const phoneRaw = String(fd.get('phone') || '');
    fd.set('phone', phoneRaw.replace(/\D/g, ''));

    // force CA
    fd.set('state', 'CA');

    // honeypot
    if ((fd.get('company') || '').toString().trim() !== '') {
      alert('Thanks! We’ll be in touch shortly.');
      form.reset();
      return;
    }

    // Append page + recaptcha
    fd.append('page', location.pathname + location.hash);
    try {
      if (window.grecaptcha && window.__zenithRecaptchaWidgetId != null) {
        fd.append('recaptcha', grecaptcha.getResponse(window.__zenithRecaptchaWidgetId) || '');
      }
    } catch (_) {}

    // 👉 REPLACE with your Zapier Catch Hook URL
    const ZAP_URL = 'https://hooks.zapier.com/hooks/catch/xxxx/yyyy';

    const btn = form.querySelector('button[type="submit"]');
    const oldText = btn ? btn.textContent : '';
    if (btn) { btn.disabled = true; btn.textContent = 'Sending…'; }

    try {
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
  }
});
