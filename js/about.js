// js/about.js — minimal, idempotent init (works before/after HTML injection)
(function () {
  let state = { inited:false, el:null, io:null, mo:null, onScroll:null, onResize:null, reduced:false };

  function revealNowIfNoIO(nodes){
    if (!('IntersectionObserver' in window)) {
      nodes.forEach(n => n.classList.add('in'));
      return true;
    }
    return false;
  }

  function setupAnimations(){
    const nodes = [...state.el.querySelectorAll('[data-animate]')];
    if (!nodes.length) return;
    if (revealNowIfNoIO(nodes)) return;

    state.io = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (!e.isIntersecting) return;
        e.target.classList.add('in');
        const kids = e.target.querySelectorAll('[data-animate-child]');
        kids.forEach((k,i) => { k.style.animationDelay = `${i*0.1+0.1}s`; });
        state.io.unobserve(e.target);
      });
    }, { threshold:0.15, rootMargin:'0px 0px -50px 0px' });

    nodes.forEach(n => state.io.observe(n));
  }

  function setupParallax(){
    state.reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (state.reduced) return;

    const layers = [...state.el.querySelectorAll('[data-parallax]')];
    if (!layers.length) return;

    let ticking = false;
    const update = () => {
      const r = state.el.getBoundingClientRect();
      if (r.top < innerHeight && r.bottom > 0) {
        const p = (r.top - innerHeight * 0.3) / (innerHeight * 0.6);
        layers.forEach(layer => {
          const speed = parseFloat(layer.getAttribute('data-speed') || '0.2');
          layer.style.transform = `translate3d(0, ${p*100*speed}px, 0)`;
        });
      }
      ticking = false;
    };
    state.onScroll = () => { if (!ticking){ ticking = true; requestAnimationFrame(update); } };
    state.onResize = update;

    update();
    addEventListener('scroll', state.onScroll, { passive:true });
    addEventListener('resize', state.onResize);
  }

  function teardown(){
    if (state.io){ state.io.disconnect(); state.io = null; }
    if (state.mo){ state.mo.disconnect(); state.mo = null; }
    if (state.onScroll){ removeEventListener('scroll', state.onScroll); state.onScroll = null; }
    if (state.onResize){ removeEventListener('resize', state.onResize); state.onResize = null; }
    state.el = null; state.inited = false;
  }

  function initAboutSection(){
    const el = document.querySelector('#about');
    if (!el) return false;
    if (state.inited && state.el === el) return true;

    teardown();
    state.el = el;
    setupAnimations();
    setupParallax();
    state.inited = true;
    return true;
  }

  // Expose so your fetch loader can call it after injection
  window.initAboutSection = initAboutSection;

  // Auto-init or wait for the placeholder to fill
  document.addEventListener('DOMContentLoaded', () => {
    if (initAboutSection()) return;
    const target = document.getElementById('about-placeholder') || document.body;
    state.mo = new MutationObserver(() => { if (initAboutSection()) { state.mo.disconnect(); state.mo = null; } });
    state.mo.observe(target, { childList:true, subtree:true });
  });
})();
