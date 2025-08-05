// js/header.js
document.addEventListener('DOMContentLoaded', () => {
  // ===== MOBILE MENU TOGGLE =====
  const menuBtn = document.querySelector('.menu-toggle');
  const mobileMenu = document.querySelector('.mobile-menu');
  if (menuBtn && mobileMenu) {
    menuBtn.addEventListener('click', () => {
      const open = menuBtn.getAttribute('aria-expanded') === 'true';
      menuBtn.setAttribute('aria-expanded', String(!open));
      mobileMenu.classList.toggle('hidden');
    });
  }

  // ===== ACCORDION FOR MOBILE SUB-MENUS =====
  document.querySelectorAll('[data-accordion-target]').forEach(button => {
    const panel = document.getElementById(button.dataset.accordionTarget);
    const arrow = button.querySelector('.arrow');
    if (!panel) return;

    button.addEventListener('click', (e) => {
      e.preventDefault();
      const expanded = button.getAttribute('aria-expanded') === 'true';
      button.setAttribute('aria-expanded', String(!expanded));
      panel.classList.toggle('hidden');
      if (arrow) arrow.style.transform = expanded ? 'rotate(0deg)' : 'rotate(90deg)';
    });
  });
});
