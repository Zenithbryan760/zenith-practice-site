// js/header.js
document.addEventListener('DOMContentLoaded', () => {
  // We may have two toggle buttons (desktop + mobile)
  const toggleButtons = document.querySelectorAll('.menu-toggle');
  const navBar = document.querySelector('.nav-bar');
  const navLinks = document.querySelector('.nav-links');

  if (!toggleButtons.length || !navBar || !navLinks) return;

  // Helper: set ARIA state for accessibility
  const setAria = (expanded) => {
    toggleButtons.forEach(btn => btn.setAttribute('aria-expanded', expanded ? 'true' : 'false'));
  };

  // Toggle menu on click
  toggleButtons.forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation(); // don’t bubble to document
      const isOpen = navBar.classList.toggle('open');
      setAria(isOpen);
    });

    // Keyboard support (Enter/Space)
    btn.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        btn.click();
      }
    });
  });

  // Close when clicking/tapping outside
  document.addEventListener('click', (e) => {
    const clickedToggle = [...toggleButtons].some(btn => btn.contains(e.target));
    const clickedNav = navBar.contains(e.target);
    if (!clickedToggle && !clickedNav && navBar.classList.contains('open')) {
      navBar.classList.remove('open');
      setAria(false);
    }
  });

  // Close menu if window is resized larger than mobile breakpoint
  let lastWidth = window.innerWidth;
  window.addEventListener('resize', () => {
    const now = window.innerWidth;
    // If we cross from mobile to desktop, ensure menu is closed
    if (now > 768 && lastWidth <= 768) {
      navBar.classList.remove('open');
      setAria(false);
    }
    lastWidth = now;
  });
});
