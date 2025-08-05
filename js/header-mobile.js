// js/header-mobile.js
document.addEventListener('DOMContentLoaded', () => {
  const menuToggle = document.querySelector('.menu-toggle');
  const navBar     = document.querySelector('.nav-bar');
  if (!menuToggle || !navBar) return;

  // 1) Hamburger open/close
  menuToggle.addEventListener('click', () => {
    const isOpen = navBar.classList.toggle('open');
    menuToggle.setAttribute('aria-expanded', isOpen);
  });

  // 2) Close when clicking outside
  document.addEventListener('click', e => {
    if (!navBar.contains(e.target) && !menuToggle.contains(e.target)) {
      if (navBar.classList.contains('open')) {
        navBar.classList.remove('open');
        menuToggle.setAttribute('aria-expanded', 'false');
      }
    }
  });

  // 3) Close if window is resized above mobile breakpoint
  let lastWidth = window.innerWidth;
  window.addEventListener('resize', () => {
    if (lastWidth <= 768 && window.innerWidth > 768) {
      navBar.classList.remove('open');
      menuToggle.setAttribute('aria-expanded', 'false');
    }
    lastWidth = window.innerWidth;
  });
});

