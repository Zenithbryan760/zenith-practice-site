// js/header.js
document.addEventListener('DOMContentLoaded', () => {
  const toggleButtons = document.querySelectorAll('.menu-toggle');
  const navBar        = document.querySelector('.nav-bar');

  if (!toggleButtons.length || !navBar) return;

  // Helper: set ARIA state for accessibility
  const setAria = (expanded) => {
    toggleButtons.forEach(btn =>
      btn.setAttribute('aria-expanded', expanded ? 'true' : 'false')
    );
  };

  // Toggle menu on click or keyboard
  toggleButtons.forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = navBar.classList.toggle('open');
      setAria(isOpen);
    });
    btn.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        btn.click();
      }
    });
  });

  // Close when clicking/tapping outside the nav
  document.addEventListener('click', (e) => {
    const clickedToggle = [...toggleButtons].some(btn => btn.contains(e.target));
    const clickedNav    = navBar.contains(e.target);
    if (!clickedToggle && !clickedNav && navBar.classList.contains('open')) {
      navBar.classList.remove('open');
      setAria(false);
    }
  });

  // Close if window is resized above 768px
  let lastWidth = window.innerWidth;
  window.addEventListener('resize', () => {
    const now = window.innerWidth;
    if (now > 768 && lastWidth <= 768) {
      navBar.classList.remove('open');
      setAria(false);
    }
    lastWidth = now;
  });
});
