document.addEventListener('DOMContentLoaded', () => {
  const menuToggle = document.querySelector('.menu-toggle');
  const mobileNav  = document.querySelector('.mobile-nav');

  // 1) open/close off-canvas
  menuToggle.addEventListener('click', () => {
    const isOpen = mobileNav.classList.toggle('open');
    menuToggle.setAttribute('aria-expanded', isOpen);
  });

  // 2) accordion toggles
  document.querySelectorAll('.accordion-toggle').forEach(btn => {
    btn.addEventListener('click', () => {
      const li = btn.closest('li');

      // close siblings at this level
      const siblings = Array.from(li.parentElement.children)
        .filter(el => el !== li && el.classList.contains('open'));
      siblings.forEach(sib => sib.classList.remove('open'));

      // toggle this one
      li.classList.toggle('open');
    });
  });

  // 3) close if clicking outside
  document.addEventListener('click', e => {
    if (!mobileNav.contains(e.target) && !menuToggle.contains(e.target)) {
      mobileNav.classList.remove('open');
      menuToggle.setAttribute('aria-expanded', 'false');
    }
  });
});
