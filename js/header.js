/* =======================================================================
   js/header.js — Desktop dropdowns + Mobile off-canvas (single file)
   - Desktop: hover-stable flyouts that auto-flip LEFT if near viewport edge
              and scroll ONLY inside the flyout columns
   - Mobile : .menu-toggle opens/closes off-canvas; accordions expand/collapse
   - UX     : click-outside, ESC to close, resize cleanup
   - Safe   : idempotent (window.ZenithHeader.init() can be called multiple times)
   - Legacy : window.initMobileMenu() maps to ZenithHeader.init()
   ======================================================================= */
(() => {
  'use strict';

  // Guards to avoid double-binding globals
  let desktopBound = false;
  let outsideClickBound = false;
  let escBound = false;
  let resizeBound = false;

  // Track current elements we bound to (avoid rebinding on re-renders)
  let boundMenuToggle = null;
  let boundMobileNav  = null;

  // ---------- Utilities ----------
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

  // Throttle helper
  function throttle(fn, wait){
    let t = null;
    return function(...args){
      if (t) return;
      t = setTimeout(() => { t = null; fn.apply(this, args); }, wait);
    };
  }

  // ---------- Flyout positioning (desktop) ----------
  // Decide if a flyout should open LEFT to avoid running off the right edge
  function positionFlyout(flyout) {
    if (!flyout) return;
    flyout.classList.remove('open-left');

    // Temporarily reveal if hidden to measure accurately
    const cs = getComputedStyle(flyout);
    const hidden = cs.visibility === 'hidden' || cs.opacity === '0';
    if (hidden){
      const prev = {
        visibility: flyout.style.visibility,
        opacity: flyout.style.opacity,
        transform: flyout.style.transform,
        display: flyout.style.display
      };
      flyout.style.visibility = 'hidden';
      flyout.style.opacity = '0';
      flyout.style.transform = 'translateY(0)';
      flyout.style.display = 'block';

      const rect = flyout.getBoundingClientRect();
      if (rect.right > (window.innerWidth - 8)) {
        flyout.classList.add('open-left');
      }

      // Restore inline styles
      flyout.style.visibility = prev.visibility;
      flyout.style.opacity = prev.opacity;
      flyout.style.transform = prev.transform;
      flyout.style.display = prev.display;
      return;
    }

    // If already visible, just check right overflow
    const rect = flyout.getBoundingClientRect();
    if (rect.right > (window.innerWidth - 8)) {
      flyout.classList.add('open-left');
    }
  }

  const positionAllFlyouts = throttle(() => {
    document.querySelectorAll('.dropdown-submenu > .submenu').forEach(positionFlyout);
  }, 120);

  // Prevent scroll chaining: when scrolling a flyout, don’t bubble to page
  function preventScrollChaining(el){
    if (!el) return;
    // Use non-passive listener so we can preventDefault
    el.addEventListener('wheel', (e) => {
      const delta = e.deltaY;
      const atTop    = el.scrollTop === 0;
      const atBottom = Math.ceil(el.scrollTop + el.clientHeight) >= el.scrollHeight;

      // If trying to scroll past the top or bottom, eat the event to stop page scroll
      if ((delta < 0 && atTop) || (delta > 0 && atBottom)) {
        e.preventDefault();
      }
    }, { passive: false });
  }

  // Bind hover stability (short grace period) and attach scroll containment
  function bindHoverStabilityAndScroll(){
    document.querySelectorAll('.dropdown-submenu').forEach(sub => {
      let hoverTimer;
      const flyout = sub.querySelector(':scope > .submenu');

      // Add scroll containment on each flyout column
      if (flyout) preventScrollChaining(flyout);

      sub.addEventListener('mouseenter', () => {
        clearTimeout(hoverTimer);
        sub.classList.add('is-hover');
        positionFlyout(flyout);
      });
      sub.addEventListener('mouseleave', () => {
        hoverTimer = setTimeout(() => sub.classList.remove('is-hover'), 120);
      });
    });
  }

  // ---------- [A] Desktop dropdowns (optional click support) ----------
  function bindDesktopDropdowns() {
    if (desktopBound) return;

    // Optional click-to-toggle if you add .submenu-toggle on desktop
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

      // Prevent accidental navigation if toggle is an <a>
      if (toggle.tagName === 'A') e.preventDefault();
    }, { passive: false });

    // Hover stability + initial positioning + scroll containment
    bindHoverStabilityAndScroll();
    window.addEventListener('load', positionAllFlyouts, { once: true });
    window.addEventListener('resize', positionAllFlyouts);

    desktopBound = true;
  }

  // ---------- [B] Mobile: off-canvas + accordions ----------
  function bindMobileControls() {
    const menuToggle = document.querySelector('.menu-toggle');
    const mobileNav  = document.querySelector('.mobile-nav');
    if (!menuToggle || !mobileNav) return;

    // Hamburger
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

  // Auto-init (idempotent)
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }

  // Expose for manual re-init if header HTML is hot-swapped
  window.ZenithHeader = { init };
  window.initMobileMenu = () => window.ZenithHeader.init();
})();
