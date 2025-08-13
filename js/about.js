// js/about.js — small progressive enhancement
document.addEventListener('DOMContentLoaded', () => {
  const about = document.querySelector('#about');
  if (!about) return;

  about.style.opacity = '0';
  about.style.transform = 'translateY(8px)';
  about.style.transition = 'opacity .35s ease, transform .35s ease';

  const obs = new IntersectionObserver((entries, o) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        about.style.opacity = '1';
        about.style.transform = 'translateY(0)';
        o.disconnect();
      }
    });
  }, { threshold: 0.15 });

  obs.observe(about);
});
