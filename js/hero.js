// ====================================================================
// js/hero.js — Zenith Hero helpers (ZAPIER VERSION)
// - Phone auto-format (US)          -> (123) 456-7890
// - Date min = today                -> prevent past dates
// - Floating label fix for <select> -> has-value class
// - reCAPTCHA explicit render       -> stores widget id (token is sent, Zapier won't verify)
// - ONE submit handler (waits for injected hero form)
// - Sends JSON directly to Zapier Webhook (no Netlify function)
// ====================================================================

document.addEventListener('DOMContentLoaded', () => {
  // ---- 1) PHONE AUTO-FORMAT → (123) 456-7890 ----
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

  // ---- 2) DATE MIN (prevent past dates) ----
  const date = document.getElementById('date');
  if (date) {
    const today = new Date();
    const iso = today.toISOString().slice(0, 10);
    date.min = iso;
  }

  // ---- 3) OPTIONAL: Google Places Autocomplete on "street" ----
  if (window.google && google.maps && google.maps.places) {
    const street = document.getElementById('street');
    if (street) {
      new google.maps.places.Autocomplete(street, {
        types: ['address'],
        componentRestrictions: { country: 'us' },
      });
    }
  }

  // ---- 4) FLOATING LABEL FIX FOR <select> ----
  document.querySelectorAll('.zenith-input-group select').forEach((sel) => {
    const parent = sel.closest('.zenith-input-group');
    const toggle = () => {
      if (sel.value && sel.value !== '') parent.classList.add('has-value');
      else parent.classList.remove('has-value');
    };
    sel.addEventListener('change', toggle);
    toggle();
  });

  // ---- 5) reCAPTCHA explicit render helpers ----
  window.renderHeroRecaptchaIfReady = function () {
    var el = document.getElementById('estimate-recaptcha');
    if (!el) return; // hero not injected yet

    if (window.grecaptcha && typeof grecaptcha.render === 'function') {
      if (!el.getAttribute('data-rendered')) {
        // store widget id so we can read/reset later
        window.__zenithRecaptchaWidgetId = grecaptcha.render(el, {
          sitekey: '6LclaJ4rAAAAAEMe8ppXrEJvIgLeFVxgmkq4DBrI'
        });
        el.setAttribute('data-rendered', 'true');
      }
    }
  };
  // Called by Google script (?onload=recaptchaOnload)
  window.recaptchaOnload = function () {
    window.renderHeroRecaptchaIfReady();
  };

  // ---- 6) Bind ONE submit handler (waits for injected form) ----
  let bound = false;
  const tryBind = () => {
    if (bound) return true;
    const form = document.getElementById('estimate-form');
    if (!form) return false;

    // avoid double-binding if this runs again
    if (form.dataset.bound === 'true') return true;
    form.dataset.bound = 'true';
    bound = true;

    form.addEventListener('submit', async function (e) {
      e.preventDefault();

      // read form fields (hyphenated names)
      const fd = new FormData(form);
      const phoneRaw = String(fd.get('phone') || '');
      const phoneDigits = phoneRaw.replace(/\D/g, '');

      // get reCAPTCHA token if present (Zapier will just receive it as data)
      let recaptcha = '';
      try {
        if (window.grecaptcha && window.__zenithRecaptchaWidgetId != null) {
          recaptcha = grecaptcha.getResponse(window.__zenithRecaptchaWidgetId);
        }
      } catch (_) {}

      // Build payload for Zapier
      const payload = {
        firstName: fd.get('first-name') || '',
        lastName:  fd.get('last-name')  || '',
        phone:     phoneDigits,
        email:     fd.get('email')      || '',
        service:   fd.get('service')    || '',
        date:      fd.get('date')       || '',
        street:    fd.get('street')     || '',
        city:      fd.get('city')       || '',
        zip:       fd.get('zip')        || '',
        details:   fd.get('details')    || '',
        referral:  fd.get('referral')   || '',
        page:      location.pathname + location.hash,
        recaptcha
      };

      // ------ ZAPIER WEBHOOK (replace with your real Catch Hook URL) ------
      const ZAP_URL = "https://hooks.zapier.com/hooks/catch/xxxx/yyyy";
      // --------------------------------------------------------------------

      // UI state
      const btn = form.querySelector('button[type="submit"]');
      const oldText = btn ? btn.textContent : '';
      if (btn) { btn.disabled = true; btn.textContent = 'Sending…'; }

      try {
        const res = await fetch(ZAP_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        // Zapier returns 200 with some JSON text; we don't rely on exact shape
        const ok = res.ok;
        if (!ok) throw new Error('Submit failed');

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

    // render captcha if Google script already loaded
    window.renderHeroRecaptchaIfReady();
    return true;
  };

  // Try immediately, then poll briefly (hero injected async)
  if (!tryBind()) {
    const int = setInterval(() => {
      if (tryBind()) clearInterval(int);
    }, 150);
    // safety stop after 10s
    setTimeout(() => clearInterval(int), 10000);
  }
});
