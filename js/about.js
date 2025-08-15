// js/about.js — robust init whether the section is injected before/after DOMContentLoaded
(function () {
  let state = {
    inited: false,
    aboutEl: null,
    io: null,
    mo: null,
    onScroll: null,
    onResize: null,
    parallaxLayers: [],
    prefersReduced: false
  };

  function addClassNowIfNoIO(els) {
    // Fallback: if IntersectionObserver not supported, reveal immediately
    if (!('IntersectionObserver' in window)) {
      els.forEach(el => el.classList.add('in'));
      return true;
    }
    return false;
  }

  function setupAnimations() {
    const animateEls = [...state.aboutEl.querySelectorAll('[data-animate]')];
    if (!animateEls.length) return;

    if (addClassNowIfNoIO(animateEls)) return;

    state.io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('in');

        const kids = entry.target.querySelectorAll('[data-animate-child]');
        kids.forEach((child, idx) => {
          child.style.animationDelay = `${idx * 0.1 + 0.1}s`;
        });

        state.io.unobserve(entry.target);
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -50px 0px' });

    animateEls.forEach(el => state.io.observe(el));
  }

  function setupParallax() {
    state.prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (state.prefersReduced) return;

    state.parallaxLayers = [...state.aboutEl.querySelectorAll('[data-parallax]')];
    if (!state.parallaxLayers.length) return;

    let ticking = false;
    const updateParallax = () => {
      const rect = state.aboutEl.getBoundingClientRect();
      if (rect.top < window.innerHeight && rect.bottom > 0) {
        const progress = (rect.top - window.innerHeight * 0.3) / (window.innerHeight * 0.6);
        state.parallaxLayers.forEach(layer => {
          const speed = parseFloat(layer.getAttribute('data-speed') || '0.2');
          const y = progress * 100 * speed;
          layer.style.transform = `translate3d(0, ${y}px, 0)`;
        });
      }
      ticking = false;
    };

    state.onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(updateParallax); } };
    state.onResize = updateParallax;

    updateParallax();
    window.addEventListener('scroll', state.onScroll, { passive: true });
    window.addEventListener('resize', state.onResize);
  }

  function teardown() {
    if (state.io) { state.io.disconnect(); state.io = null; }
    if (state.mo) { state.mo.disconnect(); state.mo = null; }
    if (state.onScroll) { window.removeEventListener('scroll', state.onScroll); state.onScroll = null; }
    if (state.onResize) { window.removeEventListener('resize', state.onResize); state.onResize = null; }
    state.parallaxLayers = [];
    state.aboutEl = null;
    state.inited = false;
  }

  function initAbout() {
    // If already initialized and section still present, skip
    const el = document.querySelector('#about');
    if (!el) return false;

    if (state.inited && state.aboutEl === el) return true;

    teardown(); // in case we’re re-initting after reinjection
    state.aboutEl = el;

    setupAnimations();
    setupParallax();

    state.inited = true;
    return true;
  }

  // Expose helpers so index.html can init right after HTML injection
  window.initAboutSection = initAbout;
  window.destroyAboutSection = teardown;

  // Try on DOM ready; if not present yet, watch the placeholder until it appears
  document.addEventListener('DOMContentLoaded', () => {
    if (initAbout()) return;

    const target = document.getElementById('about-placeholder') || document.body;
    state.mo = new MutationObserver(() => { if (initAbout()) { state.mo.disconnect(); state.mo = null; } });
    state.mo.observe(target, { childList: true, subtree: true });
  });

  // Optional: if user navigates via hash to #about before IO fires, ensure visible
  window.addEventListener('hashchange', () => {
    if (location.hash === '#about') {
      if (initAbout()) {
        // Force immediate reveal of top-level animated containers
        [...document.querySelectorAll('#about [data-animate]')].forEach(el => el.classList.add('in'));
      }
    }
  });
})();
