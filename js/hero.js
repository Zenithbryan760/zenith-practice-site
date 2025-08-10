// ====================================================================
// js/hero-form.js — Zenith Roofing "Free Estimate" form
// (drop-in file; works with your current hero-section.html)
// ====================================================================

/* ------------------ [0] CONFIG ------------------ */
// TODO: replace with your real Zapier hook:
const ZAP_URL = "https://hooks.zapier.com/hooks/catch/xxxx/yyyy";
// Your public reCAPTCHA site key:
const RECAPTCHA_SITE_KEY = "6LclaJ4rAAAAAEMe8ppXrEJvIgLeFVxgmkq4DBrI";

/* ------------------ [1] BOOTSTRAP ------------------ */
document.addEventListener("DOMContentLoaded", () => {
  // Some sites inject this section later; bind once when it exists.
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

  // reCAPTCHA explicit render (called once the script loads)
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

/* ------------------ [2] INIT ALL WIRING ------------------ */
function init(form) {
  ensureDisplayNameField(form);     // hidden "display-name"
  wireDisplayNameAutoFill();        // First+Last → display-name
  phoneMask();                      // friendly phone formatting
  stateMask();                      // always 2 uppercase letters; default CA
  zipToCityAndState();              // ZIP → City/State (doesn't overwrite a valid typed state)
  enablePlacesAutocomplete();       // optional (if Google Places is loaded)
  wireTouchedUx();                  // only show invalid after user interacts
  setupFileUpload();                // show chosen file names
  floatSelectsOnValue();            // make select labels float like inputs
  fixCopy();                        // tiny text copy tweak

  // If the browser autofills anything, float select labels again after a tick
  setTimeout(floatSelectsOnValue, 350);

  // Submit handler
  form.addEventListener("submit", onSubmit);

  // Render reCAPTCHA if script is ready
  window.renderHeroRecaptchaIfReady();
}

/* ------------------ [3] HIDDEN DISPLAY NAME ------------------ */
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

/* ------------------ [4] PHONE MASK ------------------ */
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

    // keep caret near where user was typing
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

/* ------------------ [5] STATE MASK (default CA) ------------------ */
function stateMask() {
  const stateEl = document.getElementById("state");
  if (!stateEl) return;

  // If empty on load, show CA immediately
  if (!stateEl.value) stateEl.value = "CA";

  // Always keep to 2 uppercase letters
  stateEl.addEventListener("input", () => {
    stateEl.value = stateEl.value.replace(/[^a-z]/gi, "").toUpperCase().slice(0, 2);
  });

  stateEl.addEventListener("blur", () => {
    if (!stateEl.value) stateEl.value = "CA";
  });
}

/* ------------------ [6] ZIP → CITY/STATE ------------------ */
function zipToCityAndState() {
  const zipEl = document.getElementById("zip");
  const cityEl = document.getElementById("city");
  const stateEl = document.getElementById("state");
  if (!(zipEl && cityEl && stateEl)) return;

  if (!stateEl.value) stateEl.value = "CA"; // default if nothing yet

  let zipTimer = null;
  const lookupZip = async (zip) => {
    if (!/^\d{5}$/.test(zip)) return;  // only fire when 5 digits
    try {
      const r = await fetch(`https://api.zippopotam.us/us/${zip}`);
      if (!r.ok) return;
      const data = await r.json();
      const place = data.places && data.places[0];
      if (place) {
        if (!cityEl.value) cityEl.value = place["place name"] || cityEl.value;
        // only set state if the user hasn't already entered a valid 2-letter value
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

/* ------------------ [7] FLOATING LABELS FOR SELECTS ------------------ */
function floatSelectsOnValue() {
  document.querySelectorAll(".floating-select select").forEach((sel) => {
    const wrap = sel.parentElement;     // .floating-select
    const set = () => {
      if (sel.value && sel.value !== "") wrap.classList.add("has-value");
      else wrap.classList.remove("has-value");
    };
    sel.addEventListener("change", set);
    // Sometimes browsers pre-select or autofill; nudge twice
    set();
    setTimeout(set, 0);
  });
}

/* ------------------ [8] GOOGLE PLACES (optional) ------------------ */
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

/* ------------------ [9] UX: "touched" invalids ------------------ */
function wireTouchedUx() {
  const fields = document.querySelectorAll("#estimate-form input, #estimate-form select, #estimate-form textarea");
  fields.forEach((el) => {
    const mark = () => el.classList.add("touched");
    el.addEventListener("blur", mark);
    el.addEventListener("change", mark);
  });
}

/* ------------------ [10] FILE INPUT LABEL ------------------ */
function setupFileUpload() {
  const fileInput = document.getElementById("photos");
  if (!fileInput) return;

  fileInput.addEventListener("change", (e) => {
    const label = document.querySelector(".file-name");
    if (!label) return;

    const files = Array.from(e.target.files || []);
    if (!files.length) { label.textContent = "No files selected"; return; }

    const names = files.map(f => f.name);
    const shown = names.slice(0, 3).join(", ");
    label.textContent = names.length > 3 ? `${shown} (+${names.length - 3} more)` : shown;
  });
}

/* ------------------ [11] COPY NITS ------------------ */
function fixCopy() {
  const phoneHint = document.getElementById("phone-hint");
  if (phoneHint) phoneHint.textContent = "Example: 858-900-6163";
}

/* ------------------ [12] SUBMIT → ZAPIER ------------------ */
async function onSubmit(e) {
  e.preventDefault();
  const form = e.currentTarget;

  const fd = new FormData(form);

  // Raw phone digits (keep formatted in "phone")
  const phoneRaw = String(fd.get("phone") || "");
  fd.set("phone_digits", phoneRaw.replace(/\D/g, ""));

  // Ensure display-name present
  const first = (fd.get("first-name") || "").toString().trim();
  const last  = (fd.get("last-name")  || "").toString().trim();
  const dn    = (fd.get("display-name") || "").toString().trim();
  if (!dn) fd.set("display-name", [first, last].filter(Boolean).join(" "));

  // Default state if empty
  if (!String(fd.get("state") || "").trim()) fd.set("state", "CA");

  // Honeypot (quiet success)
  if ((fd.get("company") || "").toString().trim() !== "") {
    showSuccessMessage();
    form.reset();
    return;
  }

  // Page + reCAPTCHA
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

    // Reset misc UI bits after success
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

/* ------------------ [13] TOASTS (simple for now) ------------------ */
function showSuccessMessage() {
  alert("Thank you! Your estimate request has been received. We'll contact you within 24 hours.");
}
function showErrorMessage() {
  alert("Sorry, something went wrong. Please call 858-900-6163 or try again.");
}
