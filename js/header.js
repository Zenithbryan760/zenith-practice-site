/* =======================================================================
   js/header.js — Desktop submenu + Mobile off-canvas menu (single file)
   - Handles desktop ".submenu-toggle" (closes siblings, sets aria-expanded)
   - Handles mobile ".menu-toggle" + ".mobile-nav" open/close
   - Handles mobile ".accordion-toggle" panels inside .mobile-nav
   - Click-outside + ESC to close, resize cleanup, safe re-init
   - Exposes window.ZenithHeader.init() and a legacy alias window.initMobileMenu()
   ======================================================================= */
(() => {
  'use strict';

  let initialized = false;

  function init() {
    if (initialized) return;
    initialized = true;

    const body       = document.body;
    const menuToggle = document.querySelector('.menu-toggle');
    const mobileNav  = document.querySelector('.mobile-nav');

    /* -------------------------------------------------------------------
       [A] DESKTOP: Dropdown submenus
       - Any element with ".submenu-toggle" toggles its closest <li>.
       - Only one sibling <li> stays open at a time at the same level.
       ------------------------------------------------------------------- */
    document.addEventListener('click', (e) => {
      const toggle = e.target.closest('.submenu-toggle');
      if (!toggle) return;

      const li = toggle.closest('li');
      const parentUl = li?.parentElement;
      if (!li || !parentUl) return;

      // Close other open siblings at the same level
      parentUl.querySelectorAll(':scope > li.open').forEach((openLi) => {
        if (openLi !== li) {
          openLi.classList.remove('open');
          openLi
            .querySelectorAll('.submenu-toggle,[aria-expanded]')
            .forEach((b) => b.setAttribute('aria-expanded', 'false'));
        }
      });

      // Toggle the clicked one
      const nowOpen = li.classList.toggle('open');
      toggle.setAttribute('aria-expanded', String(nowOpen));

      // Prevent accidental navigation if toggle is an <a>
      if (toggle.tagName === 'A') e.preventDefault();
    }, { passive: false });

    /* -------------------------------------------------------------------
       [B] MOBILE: Off-canvas menu open/close
       - .menu-toggle toggles .mobile-nav .open
       - Body scroll is locked when open
       - Click outside & ESC to close
       - Resize to desktop cleans state
       ------------------------------------------------------------------- */
    if (menuToggle && mobileNav) {
      const closeMobile = () => {
        mobileNav.classList.remove('open');
        menuToggle.setAttribute('aria-expanded', 'false');
        body.style.overflow = '';
      };

      const openMobile = () => {
        mobileNav.classList.add('open');
        menuToggle.setAttribute('aria-expanded', 'true');
        body.style.overflow = 'hidden';
      };

      // Toggle button (hamburger)
      menuToggle.addEventListener('click', () => {
        const isOpen = mobileNav.classList.toggle('open');
        menuToggle.setAttribute('aria-expanded', String(isOpen));
        body.style.overflow = isOpen ? 'hidden' : '';
      });

      // Click outside to close
      document.addEventListener('click', (e) => {
        if (!mobileNav.classList.contains('open')) return;
        if (mobileNav.contains(e.target) || menuToggle.contains(e.target)) return;
        closeMobile();
      });

      // ESC to close
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && mobileNav.classList.contains('open')) {
          closeMobile();
        }
      });

      // Cleanup when switching to desktop
      let lastIsMobile = isMobile();
      window.addEventListener('resize', () => {
        const nowIsMobile = isMobile();
        if (lastIsMobile && !nowIsMobile) {
          closeMobile();
        }
        lastIsMobile = nowIsMobile;
      });

      function isMobile() {
        // Keep this breakpoint in sync with your CSS
        return window.matchMedia('(max-width: 768px)').matches;
      }

      /* ---------------------------------------------------------------
         [C] MOBILE: Accordion panels inside .mobile-nav
         - Use ".accordion-toggle" for items that expand submenus
         - Only one sibling open at a time (same level)
         ---------------------------------------------------------------- */
      mobileNav.addEventListener('click', (e) => {
        const btn = e.target.closest('.accordion-toggle');
        if (!btn) return;

        // Don’t let it bubble to document’s click-outside handler
        e.stopPropagation();

        const li = btn.closest('li');
        if (!li) return;

        // Close sibling panels at same level
        li.parentElement?.querySelectorAll(':scope > li.open').forEach((openLi) => {
          if (openLi !== li) {
            openLi.classList.remove('open');
            openLi
              .querySelectorAll('.accordion-toggle,[aria-expanded]')
              .forEach((b) => b.setAttribute('aria-expanded', 'false'));
          }
        });

        const nowOpen = li.classList.toggle('open');
        btn.setAttribute('aria-expanded', String(nowOpen));
      });
    } else {
      // Fine on pages without mobile nav.
      console.debug('[header.js] Mobile controls not found (ok on desktop-only pages).');
    }
  }

  // Auto-init on DOM ready (safe re-run guard)
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }

  // Export for manual re-init after dynamic DOM updates (optional)
  window.ZenithHeader = { init };

  // Legacy alias so existing inline calls to initMobileMenu() won’t break
  window.initMobileMenu = () => window.ZenithHeader.init();
})();
