// js/about.js — robust init (works before/after fragment injection, non-repetitive)
(function () {
  let state = { inited:false, aboutEl:null, io:null, mo:null, onScroll:null, onResize:null, prefersReduced:false };

  function revealImmediatelyIfNoIO(targets){
    if (!('IntersectionObserver' in window)) {
      targets.forEach(el => el.classList.add('in'));
      return true;
    }
    return false;
  }

  function setupAnimations(){
    const els = [...state.aboutEl.querySelectorAll('[data-animate]')];
    if (!els.length) return;
    if (revealImmediatelyIfNoIO(els)) return;

    state.io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('in');

        const kids = entry.target.querySelectorAll('[data-animate-child]');
        kids.forEach((child, i) => { child.style.animationDelay = `${i * 0.1 + 0.1}s`; });

        state.io.unobserve(entry.target);
      });
    }, { threshold:0.15, rootMargin:'0px 0px -50px 0px' });

    els.forEach(el => state.io.observe(el));
  }

  function setupParallax(){
    state.prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (state.prefersReduced) return;

    const layers = [...state.aboutEl.querySelectorAll('[data-parallax]')];
    if (!layers.length) return;

    let ticking = false;
    const update = () => {
      const rect = state.aboutEl.getBoundingClientRect();
      if (rect.top < innerHeight && rect.bottom > 0) {
        const progress = (rect.top - innerHeight * 0.3) / (innerHeight * 0.6);
        layers.forEach(layer => {
          const speed = parseFloat(layer.getAttribute('data-speed') || '0.2');
          layer.style.transform = `translate3d(0, ${progress * 100 * speed}px, 0)`;
        });
      }
      ticking = false;
    };
    state.onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } };
    state.onResize = update;

    update();
    addEventListener('scroll', state.onScroll, { passive:true });
    addEventListener('resize', state.onResize);
  }

  function teardown(){
    if (state.io) { state.io.disconnect(); state.io = null; }
    if (state.mo) { state.mo.disconnect(); state.mo = null; }
    if (state.onScroll) { removeEventListener('scroll', state.onScroll); state.onScroll = null; }
    if (state.onResize) { removeEventListener('resize', state.onResize); state.onResize = null; }
    state.inited = false; state.aboutEl = null;
  }

  function initAbout(){
    const el = document.querySelector('#about');
    if (!el) return false;
    if (state.inited && state.aboutEl === el) return true;

    teardown();
    state.aboutEl = el;

    setupAnimations();
    setupParallax();

    state.inited = true;
    return true;
  }

  // Expose
  window.initAboutSection = initAbout;
  window.destroyAboutSection = teardown;

  // Auto
  document.addEventListener('DOMContentLoaded', () => {
    if (initAbout()) return;
    const target = document.getElementById('about-placeholder') || document.body;
    state.mo = new MutationObserver(() => { if (initAbout()) { state.mo.disconnect(); state.mo = null; } });
    state.mo.observe(target, { childList:true, subtree:true });
  });

  // If user jumps to #about via hash before IO fires, ensure visible
  addEventListener('hashchange', () => {
    if (location.hash === '#about') {
      if (initAbout()) {
        [...document.querySelectorAll('#about [data-animate]')].forEach(el => el.classList.add('in'));
      }
    }
  });
})();
