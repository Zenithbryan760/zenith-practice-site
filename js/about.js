// js/about.js — subtle, brand-matched animations (staggered)
document.addEventListener('DOMContentLoaded', () => {
  const root = document.querySelector('#about');
  if (!root) return;

  // Tag elements we want to animate in
  const animTargets = [
    ...root.querySelectorAll('.about-header, .about-copy p, .about-list li, .about-aside .about-card, .about-cta')
  ];
  animTargets.forEach(el => el.setAttribute('data-animate', ''));

  // Staggered reveal using IntersectionObserver
  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;

      // Stagger children for nicer feel
      const children = animTargets;
      children.forEach((el, i) => {
        // already animated? skip
        if (el.classList.contains('in')) return;
        setTimeout(() => el.classList.add('in'), i * 60); // 60ms stagger
      });

      io.disconnect();
    });
  }, { threshold: 0.15 });

  io.observe(root);
});
