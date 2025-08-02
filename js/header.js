/* ===================================================================
   js/nav.js — Mobile Toggle for .nav-links
   =================================================================== */
document.addEventListener('DOMContentLoaded', () => {
  const toggle = document.querySelector('.menu-toggle');
  const links  = document.querySelector('.nav-links');
  if (!toggle || !links) return;

  // Toggle mobile menu
  toggle.addEventListener('click', () => {
    links.classList.toggle('open');
  });

  // Close menu when clicking outside
  document.addEventListener('click', e => {
    if (
      !toggle.contains(e.target) &&
      !links.contains(e.target) &&
      links.classList.contains('open')
    ) {
      links.classList.remove('open');
    }
  });
});
