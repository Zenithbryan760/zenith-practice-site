// js/about.js — fade/stagger animations + lightweight parallax
document.addEventListener('DOMContentLoaded', () => {
  const root = document.querySelector('#about');
  if (!root) return;

  // 1) Fade/stagger reveal
  const animEls = [...root.querySelectorAll('[data-animate]')];
  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      // Stagger children as they first appear
      animEls.forEach((el, i) => setTimeout(() => el.classList.add('in'), i * 70));
      io.disconnect();
    });
  }, { threshold: 0.15 });
  io.observe(root);

  // 2) Parallax (respect reduced motion)
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReduced) return;

  const layers = [...root.querySelectorAll('[data-parallax]')];
  if (!layers.length) return;

  let lastY = window.scrollY;
  let ticking = false;

  function onScroll() {
    lastY = window.scrollY;
    if (!ticking) {
      window.requestAnimationFrame(() => {
        const rect = root.getBoundingClientRect();
        const viewY = rect.top; // position relative to viewport
        layers.forEach(layer => {
          const speed = parseFloat(layer.getAttribute('data-speed') || '0.2');
          const translate = (viewY * speed);
          layer.style.transform = `translate3d(0, ${translate}px, 0)`;
        });
        ticking = false;
      });
      ticking = true;
    }
  }

  // init + bind
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
});
