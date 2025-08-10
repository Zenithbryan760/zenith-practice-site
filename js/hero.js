// ====================================================================
// js/hero.js — ZAPIER-ONLY VERSION (no Netlify)
// - Phone auto-format
// - Date min = today
// - Floating label fix for <select>
// - reCAPTCHA explicit render (token sent as a field)
// - ONE submit handler
// - Sends FormData (incl. files) directly to Zapier Webhook
// ====================================================================

document.addEventListener('DOMContentLoaded', () => {
  // 1) PHONE AUTO-FORMAT → (123) 456-7890
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

  // 2) DATE MIN (prevent past dates)
  const date = document.getElementById('date');
  if (date) {
    const today = new Date().toISOString().slice(0, 10);
    date.min = today;
  }

  // 3) OPTIONAL: Google Places Autocomplete on "street"
  if (window.google && google.maps && google.maps.places) {
    const street = document.getElementById('street');
    if (street) {
      new google.maps.places.Autocomplete(street, {
        types: ['address'],
        componentRestrictions: { country: 'us' },
      });
    }
  }

  // 4) FLOATING LABEL FIX FOR <select>
  document.querySelectorAll('.zenith-input-group select').forEach((sel) => {
    const parent = sel.closest('.zenith-input-group');
    const toggle = () => (sel.value ? parent.classList.add('has-value') : parent.classList.remove('has-value'));
    sel.addEventListener('change', toggle);
    toggle();
  });

  // 5) reCAPTCHA explicit render helpers
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

  // 6) Bind ONE submit handler (waits for injected form)
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

      // Normalize phone to digits (keep validation simple)
      const phoneRaw = String(fd.get('phone') || '');
      fd.set('phone', phoneRaw.replace(/\D/g, ''));

      // Add page context
      fd.append('page', location.pathname + location.hash);

      // Add reCAPTCHA token if present (Zapier will just receive it)
      try {
        if (window.grecaptcha && window.__zenithRecaptchaWidgetId != null) {
          const token = grecaptcha.getResponse(window.__zenithRecaptchaWidgetId);
          fd.append('recaptcha', token || '');
        }
      } catch (_) {}

      // Honeypot (if you added <input name="company" style="display:none">)
      if ((fd.get('company') || '').trim() !== '') {
        alert('Thanks! We’ll be in touch shortly.');
        form.reset();
        return;
      }

      // 👉 ZAPIER WEBHOOK (replace with your real Catch Hook URL)
      const ZAP_URL = 'https://hooks.zapier.com/hooks/catch/xxxx/yyyy';

      // UI state
      const btn = form.querySelector('button[type="submit"]');
      const oldText = btn ? btn.textContent : '';
      if (btn) { btn.disabled = true; btn.textContent = 'Sending…'; }

      try {
        // IMPORTANT: do NOT set Content-Type; browser sets multipart boundary
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
