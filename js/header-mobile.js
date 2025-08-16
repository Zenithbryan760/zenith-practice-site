function initMobileMenu() {
  const menuToggle = document.querySelector('.menu-toggle');
  const mobileNav = document.querySelector('.mobile-nav');

  if (!menuToggle || !mobileNav) {
    console.log('Mobile menu elements not found - will retry');
    return;
  }

  // 1) Open/close off-canvas menu
  menuToggle.addEventListener('click', () => {
    const isOpen = mobileNav.classList.toggle('open');
    menuToggle.setAttribute('aria-expanded', isOpen);
    document.body.style.overflow = isOpen ? 'hidden' : '';
  });

  // 2) Accordion toggles
  document.querySelectorAll('.accordion-toggle').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const li = btn.closest('li');
      li.classList.toggle('open');
    });
  });

  // 3) Close when clicking outside
  document.addEventListener('click', e => {
    if (!mobileNav.contains(e.target) && !menuToggle.contains(e.target)) {
      mobileNav.classList.remove('open');
      menuToggle.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    }
  });
}

// Export for loader
window.initMobileMenu = initMobileMenu;
