// Enhanced about.js — Intersection Observer with refined animations
document.addEventListener('DOMContentLoaded', () => {
  const aboutSection = document.querySelector('#about');
  if (!aboutSection) return;

  // 1) Enhanced animations with Intersection Observer
  const animateElements = [...aboutSection.querySelectorAll('[data-animate]')];
  
  const animationObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in');
        
        // Animate children with staggered delays
        const children = entry.target.querySelectorAll('[data-animate-child]');
        children.forEach((child, index) => {
          child.style.animationDelay = `${index * 0.1 + 0.1}s`;
        });
        
        observer.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.15,
    rootMargin: '0px 0px -50px 0px'
  });

  animateElements.forEach(el => animationObserver.observe(el));

  // 2) Smooth parallax effect (respects reduced motion)
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReducedMotion) return;

  const parallaxLayers = [...aboutSection.querySelectorAll('[data-parallax]')];
  if (!parallaxLayers.length) return;

  let ticking = false;
  let lastScrollY = window.scrollY;

  function updateParallax() {
    const rect = aboutSection.getBoundingClientRect();
    const sectionTop = rect.top;
    const sectionHeight = rect.height;
    
    // Only animate when section is in view
    if (sectionTop < window.innerHeight && sectionTop + sectionHeight > 0) {
      const scrollProgress = (sectionTop - window.innerHeight * 0.3) / (window.innerHeight * 0.6);
      
      parallaxLayers.forEach(layer => {
        const speed = parseFloat(layer.getAttribute('data-speed') || '0.2');
        const translateY = scrollProgress * 100 * speed;
        layer.style.transform = `translate3d(0, ${translateY}px, 0)`;
      });
    }
    
    ticking = false;
  }

  function onScroll() {
    lastScrollY = window.scrollY;
    if (!ticking) {
      window.requestAnimationFrame(updateParallax);
      ticking = true;
    }
  }

  // Initialize and bind events
  updateParallax();
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', updateParallax);

  // 3) Hover effects for interactive elements
  function setupHoverEffects() {
    const interactiveElements = [
      ...aboutSection.querySelectorAll('.about-bullets li, .image-card, .about-card, .btn-orange, .btn-outline')
    ];
    
    interactiveElements.forEach(el => {
      el.addEventListener('mouseenter', () => {
        el.style.transition = 'all 0.4s var(--ease-out)';
      });
      
      el.addEventListener('mouseleave', () => {
        el.style.transition = 'all 0.6s var(--ease-out)';
      });
    });
  }
  
  setupHoverEffects();
});
