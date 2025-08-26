/* Mobile menu & logo home — works on every page via event delegation */
(() => {
  const body = document.body;
  const isOpen = () => body.classList.contains('nav-open');
  const openNav = () => body.classList.add('nav-open');
  const closeNav = () => body.classList.remove('nav-open');
  const toggleNav = () => body.classList.toggle('nav-open');

  document.addEventListener('click', (e) => {
    const toggle = e.target.closest('.menu-toggle,[data-nav-toggle]');
    if (toggle){ e.preventDefault(); toggleNav(); return; }

    // Close menu when clicking any nav link in mobile
    const navLink = e.target.closest('.mobile-nav a, nav a[data-close-nav], .site-nav a');
    if (navLink && isOpen()) closeNav();

    // Submenu accordions (if present)
    const acc = e.target.closest('.accordion-toggle');
    if (acc){
      e.preventDefault();
      const li = acc.closest('li');
      const submenu = li && li.querySelector(':scope > .submenu');
      if (!submenu) return;
      const open = submenu.getAttribute('data-open') === 'true';
      submenu.setAttribute('data-open', String(!open));
      // Fallback if no CSS rule exists
      if (!getComputedStyle(submenu).getPropertyValue('display')) {
        submenu.style.display = open ? 'none' : 'block';
      }
    }
  });

  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeNav(); });

  // Make sure the logo always points to /#home (works from nested folders)
  const ready = () => {
    const logo = document.querySelector('.site-logo, .logo-section.logo-link, a[data-logo-home]');
    if (logo) logo.setAttribute('href','/#home');
  };
  (document.readyState === 'loading')
    ? document.addEventListener('DOMContentLoaded', ready, { once:true })
    : ready();
})();
