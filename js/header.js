// js/header.js
document.addEventListener('DOMContentLoaded', () => {
  // ===== MOBILE MENU TOGGLE =====
  const menuBtn = document.querySelector('.menu-toggle');
  const mobileMenu = document.querySelector('.mobile-menu');
  if (menuBtn && mobileMenu) {
    // Toggle on click
    menuBtn.addEventListener('click', () => {
      const open = menuBtn.getAttribute('aria-expanded') === 'true';
      menuBtn.setAttribute('aria-expanded', String(!open));
      mobileMenu.classList.toggle('hidden');
    });
    // Support Enter/Space
    menuBtn.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        menuBtn.click();
      }
    });
    // Close if clicking outside
    document.addEventListener('click', (e) => {
      if (!menuBtn.contains(e.target) && !mobileMenu.contains(e.target) && 
          mobileMenu.classList.contains('') === false && // ensures hidden toggles properly
          menuBtn.getAttribute('aria-expanded') === 'true') {
        menuBtn.setAttribute('aria-expa
