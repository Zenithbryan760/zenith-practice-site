// js/about.js — safe init that works whether the section is injected before or after DOMContentLoaded
(function () {
  function initAbout() {
    const aboutSection = document.querySelector('#about');
    if (!aboutSection) return false; // not injected yet

    // 1) Intersection Observer animations
    const animateElements = [...aboutSection.querySelectorAll('[data-animate]')];

    const animationObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          const children = entry.target.querySelectorAll('[data-animate-child]');
          children.forEach((child, index) => {
            child.style.animationDelay = `${index * 0.1 + 0.1}s`;
          });
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -50px 0px' });

    animateElements.forEach(el => animationObserver.observe(el));

    // 2) Parallax (respect reduced motion)
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!prefersReducedMotion) {
      const parallaxLayers = [...aboutSection.querySelectorAll('[data-parallax]')];
      if (parallaxLayers.length) {
        let ticking = false;
        function updateParallax() {
          const rect = aboutSection.getBoundingClientRect();
          if (rect.top < window.innerHeight && rect.bottom > 0) {
            const progress = (rect.top - window.innerHeight * 0.3) / (window.innerHeight * 0.6);
            parallaxLayers.forEach(layer => {
              const speed = parseFloat(layer.getAttribute('data-speed') || '0.2');
              const translateY = progress * 100 * speed;
              layer.style.transform = `translate3d(0, ${translateY}px, 0)`;
            });
          }
          ticking = false;
        }
        function onScroll() {
          if (!ticking) {
            requestAnimationFrame(updateParallax);
            ticking = true;
          }
        }
        updateParallax();
        window.addEventListener('scroll', onScroll, { passive: true });
        window.addEventListener('resize', updateParallax);
      }
    }

    // 3) Minor hover transition nicety
    const interactive = [
      ...aboutSection.querySelectorAll('.about-bullets li, .image-card, .about-card, .btn-orange, .btn-outline')
    ];
    interactive.forEach(el => {
      el.addEventListener('mouseenter', () => { el.style.transition = 'all 0.4s var(--ease-out)'; });
      el.addEventListener('mouseleave', () => { el.style.transition = 'all 0.6s var(--ease-out)'; });
    });

    return true; // initialized
  }

  // Expose so we can call after HTML injection
  window.initAboutSection = initAbout;

  // Try on DOMContentLoaded; if not yet injected, watch for it
  document.addEventListener('DOMContentLoaded', () => {
    if (initAbout()) return;
    const target = document.getElementById('about-placeholder') || document.body;
    const mo = new MutationObserver(() => { if (initAbout()) mo.disconnect(); });
    mo.observe(target, { childList: true, subtree: true });
  });
})();
