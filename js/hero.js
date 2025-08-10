// ====================================================================
// js/hero.js — Zenith Roofing "Free Estimate" form
// Works with components/hero-section.html in this project
// ====================================================================

// [0] CONFIG — replace with your real Zapier hook
const ZAP_URL = "https://hooks.zapier.com/hooks/catch/xxxx/yyyy";
const RECAPTCHA_SITE_KEY = "6LclaJ4rAAAAAEMe8ppXrEJvIgLeFVxgmkq4DBrI";

// [1] BOOTSTRAP — bind once the form exists (supports delayed injects)
document.addEventListener("DOMContentLoaded", () => {
  let bound = false;
  const tryBind = () => {
    if (bound) return true;
    const form = document.getElementById("estimate-form");
    if (!form) return false;
    if (form.dataset.bound === "true") return true;
    form.dataset.bound = "true";
    bound = true;
    init(form);
    return true;
  };

  if (!tryBind()) {
    const int = setInterval(() => { if (tryBind()) clearInterval(int); }, 150);
    setTimeout(() => clearInterval(int), 10000);
  }

  // explicit reCAPTCHA render
  window.renderHeroRecaptchaIfReady = function () {
    const el = document.getElementById("estimate-recaptcha");
    if (!el) return;
    if (window.grecaptcha && typeof grecaptcha.render === "function") {
      if (!el.getAttribute("data-rendered")) {
        window.__zenithRecaptchaWidgetId = grecaptcha.render(el, { sitekey: RECAPTCHA_SITE_KEY });
        el.setAttribute("data-rendered", "true");
      }
    }
  };
  window.recaptchaOnload = function () { window.renderHeroRecaptchaIfReady(); };
});

// [2] INIT ALL WIRING
function init(form) {
  ensureDisplayNameField(form);
  wireDisplayNameAutoFill();
  phoneMask();
  stateMask();                 // default CA + 2 uppercase
  zipToCityAndState();         // ZIP → City/State (doesn't overwrite a valid typed state)
  enablePlacesAutocomplete();  // optional if Places script is loaded
  wireTouchedUx();             // only show invalid after user interacts
  setupFileUpload();           // file picker + filenames
  floatSelectsOnValue();       // make select labels float like inputs
  fixCopy();                   // tiny text tweak

  // if autofill pre-populates, re-evaluate floating labels
  setTimeout(floatSelectsOnValue, 350);

  form.addEventListener("submit", onSubmit);
  window.renderHeroRecaptchaIfReady();
}

// [3] Hidden display-name safeguard
function ensureDisplayNameField(form) {
  let dn = document.getElementById("display-name");
  if (!dn) {
    dn = document.createElement("input");
    dn.type = "hidden";
    dn.id = "display-name";
    dn.name = "display-name";
    form.appendChild(dn);
  }
}

// [4] Display Name = First + Last
function wireDisplayNameAutoFill() {
  const first = document.getElementById("first-name");
  const last  = document.getElementById("last-name");
  const dname = document.getElementById("display-name");
  if (!(first && last && dname)) return;

  const update = () => {
    const f = (first.value || "").trim();
    const l = (last.value  || "").trim();
    dname.value = [f, l].filter(Boolean).join(" ");
  };
  first.addEventListener("input", update);
  last.addEventListener("input", update);
  update();
}

// [5] Phone mask (supports extension with x)
function phoneMask() {
  const el = document.getElementById("phone");
  if (!el) return;

  const formatPhone = (raw) => {
    const lower = String(raw || "").toLowerCase();
    const xIndex = lower.indexOf("x");
    const extDigits = xIndex >= 0 ? lower.slice(xIndex + 1).replace(/\D/g, "") : "";
    const mainDigits = (xIndex >= 0 ? lower.slice(0, xIndex) : lower)
      .replace(/\D/g, "")
      .slice(0, 10);

    let out = "";
    if (mainDigits.length > 0) out = "(" + mainDigits.slice(0, 3);
    if (mainDigits.length >= 4) out += ") " + mainDigits.slice(3, 6);
    if (mainDigits.length >= 7) out += "-" + mainDigits.slice(6, 10);
    if (extDigits) out += " x" + extDigits.slice(0, 6);
    return out;
  };

  const setFormatted = () => {
    const start = el.selectionStart ?? el.value.length;
    const rawBefore = el.value;
    const digitsBeforeCaret = rawBefore.slice(0, start).replace(/\D/g, "").length;

    const formatted = formatPhone(rawBefore);
    el.value = formatted;

    let caret = formatted.length, seen = 0;
    for (let i = 0; i < formatted.length; i++) {
      if (/\d/.test(formatted[i])) seen++;
      if (seen >= digitsBeforeCaret) { caret = i + 1; break; }
    }
    requestAnimationFrame(() => el.setSelectionRange(caret, caret));
  };

  el.addEventListener("beforeinput", (e) => {
    if (e.inputType && e.inputType.startsWith("delete")) return;
    const ok = /^[0-9xX ()-]*$/.test(e.data || "");
    if (e.data && !ok) e.preventDefault();
  });
  el.addEventListener("input", setFormatted);
  el.addEventListener("blur", () => { el.value = formatPhone(el.value); });
}

// [6] State mask — default CA, keep 2 uppercase letters
function stateMask() {
  const stateEl = document.getElementById("state");
  if (!stateEl) return;

  if (!stateEl.value) stateEl.value = "CA";

  stateEl.addEventListener("input", () => {
    stateEl.value = stateEl.value.replace(/[^a-z]/gi, "").toUpperCase().slice(0, 2);
  });
  stateEl.addEventListener("blur", () => {
    if (!stateEl.value) stateEl.value = "CA";
  });
}

// [7] ZIP → City + State
function zipToCityAndState() {
  const zipEl = document.getElementById("zip");
  const cityEl = document.getElementById("city");
  const stateEl = document.getElementById("state");
  if (!(zipEl && cityEl && stateEl)) return;

  if (!stateEl.value) stateEl.value = "CA";

  let zipTimer = null;
  const lookupZip = async (zip) => {
    if (!/^\d{5}$/.test(zip)) return;
    try {
      const r = await fetch(`https://api.zippopotam.us/us/${zip}`);
      if (!r.ok) return;
      const data = await r.json();
      const place = data.places && data.places[0];
      if (place) {
        if (!cityEl.value) cityEl.value = place["place name"] || cityEl.value;
        if (!(stateEl.value && stateEl.value.length === 2)) {
          stateEl.value = (place["state abbreviation"] || "CA").toUpperCase().slice(0, 2);
        }
      }
    } catch (_) {
      if (!stateEl.value) stateEl.value = "CA";
    }
  };

  zipEl.addEventListener("input", () => {
    clearTimeout(zipTimer);
    const val = zipEl.value.replace(/\D/g, "").slice(0, 5);
    zipTimer = setTimeout(() => lookupZip(val), 300);
  });
  zipEl.addEventListener("blur", () => {
    const val = zipEl.value.replace(/\D/g, "").slice(0, 5);
    lookupZip(val);
  });
}

// [8] Floating labels for selects (Service/Referral)
function floatSelectsOnValue() {
  document.querySelectorAll(".floating-select select").forEach((sel) => {
    const wrap = sel.parentElement; // .floating-select
    const set = () => {
      if (sel.value && sel.value !== "") wrap.classList.add("has-value");
      else wrap.classList.remove("has-value");
    };
    sel.addEventListener("change", set);
    set();              // initial
    setTimeout(set, 0); // handle autofill
  });
}

// [9] Google Places (optional)
function enablePlacesAutocomplete() {
  if (window.google && google.maps && google.maps.places) {
    const street = document.getElementById("street");
    if (street) {
      new google.maps.places.Autocomplete(street, {
        types: ["address"],
        componentRestrictions: { country: "us" }
      });
    }
  }
}

// [10] Show invalid borders only after user interacts
function wireTouchedUx() {
  const fields = document.querySelectorAll("#estimate-form input, #estimate-form select, #estimate-form textarea");
  fields.forEach((el) => {
    const mark = () => el.classList.add("touched");
    el.addEventListener("blur", mark);
    el.addEventListener("change", mark);
  });
}

// [11] File input — guaranteed click + filename list
function setupFileUpload() {
  const fileInput = document.getElementById("photos");
  const trigger   = document.querySelector(".custom-file-upload"); // the navy button
  const label     = document.querySelector(".file-name");

  if (!fileInput) return;

  // Always open the file chooser when clicking the navy button
  if (trigger) {
    trigger.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      fileInput.click();      // programmatically open the picker
    });
  }

  // Show selected file names
  fileInput.addEventListener("change", (e) => {
    if (!label) return;
    const files = Array.from(e.target.files || []);
    if (!files.length) { label.textContent = "No files selected"; return; }

    const names = files.map(f => f.name);
    const shown = names.slice(0, 3).join(", ");
    label.textContent = names.length > 3 ? `${shown} (+${names.length - 3} more)` : shown;
  });
}

// [12] Tiny copy tweak
function fixCopy() {
  const phoneHint = document.getElementById("phone-hint");
  if (phoneHint) phoneHint.textContent = "Example: 858-900-6163";
}

// [13] Submit → Zapier (FormData)
async function onSubmit(e) {
  e.preventDefault();
  const form = e.currentTarget;

  const fd = new FormData(form);

  // add raw phone digits
  const phoneRaw = String(fd.get("phone") || "");
  fd.set("phone_digits", phoneRaw.replace(/\D/g, ""));

  // ensure display-name present
  const first = (fd.get("first-name") || "").toString().trim();
  const last  = (fd.get("last-name")  || "").toString().trim();
  const dn    = (fd.get("display-name") || "").toString().trim();
  if (!dn) fd.set("display-name", [first, last].filter(Boolean).join(" "));

  // default state if empty
  if (!String(fd.get("state") || "").trim()) fd.set("state", "CA");

  // honeypot → pretend success
  if ((fd.get("company") || "").toString().trim() !== "") {
    showSuccessMessage();
    form.reset();
    return;
  }

  // page + reCAPTCHA
  fd.append("page", location.pathname + location.hash);
  try {
    if (window.grecaptcha && window.__zenithRecaptchaWidgetId != null) {
      fd.append("recaptcha", grecaptcha.getResponse(window.__zenithRecaptchaWidgetId) || "");
    }
  } catch (_) {}

  const btn = form.querySelector('button[type="submit"]');
  if (btn) { btn.disabled = true; btn.innerHTML = '<span class="submit-text">Sending...</span>'; }

  try {
    const res = await fetch(ZAP_URL, { method: "POST", body: fd });
    if (!res.ok) throw new Error("Submit failed");

    showSuccessMessage();
    form.reset();

    // reset UI bits
    if (window.grecaptcha && window.__zenithRecaptchaWidgetId != null) {
      grecaptcha.reset(window.__zenithRecaptchaWidgetId);
    }
    const label = document.querySelector(".file-name");
    if (label) label.textContent = "No files selected";
    const stateEl = document.getElementById("state");
    if (stateEl) stateEl.value = "CA";
    floatSelectsOnValue();
  } catch (err) {
    console.error(err);
    showErrorMessage();
  } finally {
    if (btn) { btn.disabled = false; btn.innerHTML = '<span class="submit-text">Request Free Estimate</span><span class="submit-icon">→</span>'; }
  }
}

// [14] Simple toasts for now
function showSuccessMessage() {
  alert("Thank you! Your estimate request has been received. We'll contact you within 24 hours.");
}
function showErrorMessage() {
  alert("Sorry, something went wrong. Please call 858-900-6163 or try again.");
}
