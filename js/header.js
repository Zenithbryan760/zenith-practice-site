/* =======================================================================
   js/header.js — Desktop dropdowns + Mobile off-canvas (single file)
   - Desktop: hover-stable flyouts that auto-flip LEFT if near viewport edge
   - Mobile: .menu-toggle opens/closes off-canvas; accordions expand/collapse
   - Click-outside, ESC to close, resize cleanup
   - Idempotent: safe to call window.ZenithHeader.init() multiple times
   - Legacy alias: window.initMobileMenu() calls the same init
   ======================================================================= */
(() => {
  'use strict';

  // Guards so we don’t double-bind global listeners
  let desktopBound = false;
  let outsideClickBound = false;
  let escBound = false;
  let resizeBound = false;

  // Cache current bound elements so we only bind once per element
  let boundMenuToggle = null;
  let boundMobileNav  = null;

  // --- Utilities ---
  const isOpen = () => document.body.classList.contains('nav-open');
  const isMobileViewport = () => window.matchMedia('(max-width: 1024px)').matches;

  const openMobile = (menuToggle) => {
    document.body.classList.add('nav-open');
    if (menuToggle) menuToggle.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
  };
  const closeMobile = (menuToggle) => {
    document.body.classList.remove('nav-open');
    if (menuToggle) menuToggle.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  };

  // --- Flyout helpers (desktop) ---
  // Compute if a flyout overflows the viewport's right edge; if so, open LEFT
  function positionFlyout(flyout) {
    if (!flyout) return;
    flyout.classList.remove('open-left');

    // Temporarily reveal if hidden to measure accurately
    const wasHidden = getComputedStyle(flyout).visibility === 'hidden';
    if (wasHidden){
      flyout.style.visibility = 'hidden';
      flyout.style.opacity = '0';
      flyout.style.transform = 'translateY(0)';
      flyout.style.display = 'block';
    }

    const rect = flyout.getBoundingClientRect();
    const overRight = rect.right > (window.innerWidth - 8);

    if (overRight) {
      flyout.classList.add('open-left');
    }

    if (wasHidden){
      flyout.style.display = '';
      flyout.style.visibility = '';
      flyout.style.opacity = '';
      flyout.style.transform = '';
    }
  }

  // Throttle utility
  function throttle(fn, wait){
    let t = null;
    return function(...args){
      if (t) return;
      t = setTimeout(() => { t = null; fn.apply(this, args); }, wait);
    };
  }

  // Apply positioning to all flyouts
  const positionAllFlyouts = throttle(() => {
    document.querySelectorAll('.dropdown-submenu > .submenu').forEach(positionFlyout);
  }, 120);

  // Keep hover stable when moving pointer from parent item into flyout
  function bindHoverStability() {
    document.querySelectorAll('.dropdown-submenu').forEach(sub => {
      let hoverTimer;
      sub.addEventListener('mouseenter', () => {
        clearTimeout(hoverTimer);
        sub.classList.add('is-hover');
        positionFlyout(sub.querySelector(':scope > .submenu'));
      });
      sub.addEventListener('mouseleave', () => {
        hoverTimer = setTimeout(() => sub.classList.remove('is-hover'), 120);
      });
    });
  }

  // --- [A] Desktop dropdowns — optional click support for .submenu-toggle
  function bindDesktopDropdowns() {
    if (desktopBound) return;

    // Optional: click-to-toggle if you add .submenu-toggle on desktop
    document.addEventListener('click', (e) => {
      const toggle = e.target.closest('.submenu-toggle');
      if (!toggle) return;

      const li = toggle.closest('li');
      const parentUl = li?.parentElement;
      if (!li || !parentUl) return;

      // Close siblings
      parentUl.querySelectorAll(':scope > li.open').forEach((openLi) => {
        if (openLi !== li) {
          openLi.classList.remove('open');
          openLi.querySelectorAll('.submenu-toggle,[aria-expanded]')
                .forEach((b) => b.setAttribute('aria-expanded', 'false'));
        }
      });

      // Toggle current
      const nowOpen = li.classList.toggle('open');
      toggle.setAttribute('aria-expanded', String(nowOpen));
      if (nowOpen) positionFlyout(li.querySelector(':scope > .submenu'));

      // Prevent accidental navigate if toggle is <a>
      if (toggle.tagName === 'A') e.preventDefault();
    }, { passive: false });

    // Hover stability + initial positioning
    bindHoverStability();
    window.addEventListener('load', positionAllFlyouts, { once: true });
    window.addEventListener('resize', positionAllFlyouts);

    desktopBound = true;
  }

  // --- [B] Mobile: off-canvas open/close & helpers ---
  function bindMobileControls() {
    const menuToggle = document.querySelector('.menu-toggle');
    const mobileNav  = document.querySelector('.mobile-nav');
    if (!menuToggle || !mobileNav) return;

    // Hamburger click
    if (boundMenuToggle !== menuToggle) {
      if (boundMenuToggle && boundMenuToggle !== menuToggle) {
        boundMenuToggle.setAttribute('aria-expanded', 'false');
      }
      menuToggle.addEventListener('click', () => {
        const opening = !isOpen();
        opening ? openMobile(menuToggle) : closeMobile(menuToggle);
      });
      boundMenuToggle = menuToggle;
    }

    // Click outside to close (bind once)
    if (!outsideClickBound) {
      document.addEventListener('click', (e) => {
        if (!isOpen()) return;
        if (mobileNav.contains(e.target) || menuToggle.contains(e.target)) return;
        closeMobile(menuToggle);
      });
      outsideClickBound = true;
    }

    // ESC to close (bind once)
    if (!escBound) {
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && isOpen()) closeMobile(menuToggle);
      });
      escBound = true;
    }

    // On resize to desktop, clean up (bind once)
    if (!resizeBound) {
      let lastIsMobile = isMobileViewport();
      window.addEventListener('resize', () => {
        const nowIsMobile = isMobileViewport();
        if (lastIsMobile && !nowIsMobile) closeMobile(menuToggle);
        lastIsMobile = nowIsMobile;
      });
      resizeBound = true;
    }

    // Mobile accordions (delegate on panel)
    if (boundMobileNav !== mobileNav) {
      mobileNav.addEventListener('click', (e) => {
        const btn = e.target.closest('.accordion-toggle');
        if (!btn) return;
        e.stopPropagation();

        const li = btn.closest('li');
        if (!li) return;

        // Close siblings at same level
        li.parentElement?.querySelectorAll(':scope > li.open').forEach((openLi) => {
          if (openLi !== li) {
            openLi.classList.remove('open');
            openLi.querySelectorAll('.accordion-toggle,[aria-expanded]')
                  .forEach((b) => b.setAttribute('aria-expanded', 'false'));
          }
        });

        const now = li.classList.toggle('open');
        btn.setAttribute('aria-expanded', String(now));
      });

      boundMobileNav = mobileNav;
    }
  }

  function init() {
    bindDesktopDropdowns();
    bindMobileControls();
  }

  // Auto-init on DOM ready (idempotent)
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }

  // Expose for manual re-init if you ever re-render header
  window.ZenithHeader = { init };
  window.initMobileMenu = () => window.ZenithHeader.init();
})();
