// ====================================================================
// js/hero.js — Form polish, file UX, basic validation, reCAPTCHA hook
// ====================================================================

// 👉 put your real site key here (v2 checkbox)
const RECAPTCHA_SITE_KEY = "6LclaJ4rAAAAAEMe8ppXrEJvIgLeFVxgmkq4DBrI"; // replace if different

(function () {
  let recaptchaWidgetId = null;
  const state = { bound: false };

  document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("estimate-form");
    if (!form || state.bound) return;
    state.bound = true;

    const first = document.getElementById("first-name");
    const last = document.getElementById("last-name");
    const display = document.getElementById("display-name");
    const phone = document.getElementById("phone");
    const zip = document.getElementById("zip");
    const fileInput = document.getElementById("photos");
    const fileName = form.querySelector(".file-name");
    const fileButton = form.querySelector(".custom-file-upload");

    // ---------- Build display-name automatically ----------
    const updateDisplayName = () => {
      const f = (first?.value || "").trim();
      const l = (last?.value || "").trim();
      display && (display.value = [f, l].filter(Boolean).join(" "));
    };
    first && first.addEventListener("input", updateDisplayName);
    last && last.addEventListener("input", updateDisplayName);

    // ---------- Phone formatter (858-900-6163) ----------
    if (phone) {
      phone.addEventListener("input", () => {
        const digits = phone.value.replace(/\D/g, "").slice(0, 10);
        const parts = [];
        if (digits.length > 0) parts.push(digits.slice(0, 3));
        if (digits.length > 3) parts.push(digits.slice(3, 6));
        if (digits.length > 6) parts.push(digits.slice(6, 10));
        phone.value = parts.join("-");
      });
    }

    // ---------- ZIP numeric guard ----------
    if (zip) {
      zip.addEventListener("input", () => {
        const cleaned = zip.value.replace(/[^\d-]/g, "").slice(0, 10);
        zip.value = cleaned;
      });
    }

    // ---------- File input UX ----------
    if (fileInput && fileName && fileButton) {
      fileButton.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          fileInput.click();
        }
      });

      fileInput.addEventListener("change", () => {
        if (!fileInput.files || fileInput.files.length === 0) {
          fileName.textContent = "No files selected";
          return;
        }
        const names = Array.from(fileInput.files).map(f => f.name);
        // If many files, show count + first file
        fileName.textContent = names.length > 3
          ? `${names.length} files selected (${names[0]} …)`
          : names.join(", ");
      });
    }

    // ---------- Client-side validation helper ----------
    const requireFields = [
      "#first-name", "#last-name", "#phone", "#email",
      "#service", "#street", "#city", "#state", "#zip"
    ];
    const markError = (el, hasError) => {
      const group = el.closest(".zenith-input-group, .select-group");
      if (!group) return;
      if (hasError) group.classList.add("has-error");
      else group.classList.remove("has-error");
    };

    form.addEventListener("submit", (e) => {
      // don’t block native form post if all good
      let hasAnyError = false;
      requireFields.forEach(sel => {
        const el = form.querySelector(sel);
        if (!el) return;
        const val = (el.value || "").trim();
        const missing = val.length === 0 || (el.id === "service" && !el.value);
        markError(el, missing);
        hasAnyError ||= missing;
      });

      // basic email check
      const email = document.getElementById("email");
      if (email) {
        const ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value);
        markError(email, !ok);
        hasAnyError ||= !ok;
      }

      // reCAPTCHA check (if present)
      if (typeof grecaptcha !== "undefined" && recaptchaWidgetId !== null) {
        const token = grecaptcha.getResponse(recaptchaWidgetId);
        if (!token) {
          hasAnyError = true;
          alert("Please complete the security verification.");
        }
      }

      if (hasAnyError) {
        e.preventDefault();
        // scroll to first error
        const firstErr = form.querySelector(".has-error");
        if (firstErr) {
          firstErr.scrollIntoView({ behavior: "smooth", block: "center" });
        }
        return;
      }

      // Optional: add a light disabled state
      const submitBtn = form.querySelector(".zenith-submit");
      if (submitBtn) {
        submitBtn.setAttribute("disabled", "true");
        submitBtn.style.filter = "saturate(.9) brightness(.95)";
      }
    });
  });

  // ---------- reCAPTCHA explicit render hook ----------
  // Keep this exactly named to match your <script … onload=recaptchaOnload>
  window.recaptchaOnload = function () {
    try {
      const target = document.getElementById("estimate-recaptcha");
      if (!target || typeof grecaptcha === "undefined") return;
      recaptchaWidgetId = grecaptcha.render(target, {
        sitekey: RECAPTCHA_SITE_KEY,
        theme: "light",
        size: "normal"
      });
    } catch (_) {
      // silently ignore
    }
  };
})();
