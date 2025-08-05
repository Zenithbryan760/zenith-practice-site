// js/header.js
document.addEventListener('DOMContentLoaded', () => {
  // ======= MOBILE / DESKTOP MENU TOGGLE =======
  const toggleButtons = document.querySelectorAll('.menu-toggle');
  const navBar = document.querySelector('.nav-bar');
  const navLinks = document.querySelector('.nav-links');

  if (toggleButtons.length && navBar && navLinks) {
    // Helper to update ARIA
    const setAria = (expanded) => {
      toggleButtons.forEach(btn =>
        btn.setAttribute('aria-expanded', expanded ? 'true' : 'false')
      );
    };

    // Click to open/close
    toggleButtons.forEach(btn => {
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

    // Click outside to close
    document.addEventListener('click', (e) => {
      const clickedToggle = [...toggleButtons].some(btn => btn.contains(e.target));
      const clickedNav = navBar.contains(e.target);
      if (!clickedToggle && !clickedNav && navBar.classList.contains('open')) {
        navBar.classList.remove('open');
        setAria(false);
      }
    });

    // Resize past mobile breakpoint => close
    let lastWidth = window.innerWidth;
    window.addEventListener('resize', () => {
      const now = window.innerWidth;
      if (now > 768 && lastWidth <= 768) {
        navBar.classList.remove('open');
        setAria(false);
      }
      lastWidth = now;
    });
  }

  // ======= ACCORDION FOR MOBILE SUB-MENUS =======
  // Attach to any button with data-accordion-target
  document.querySelectorAll('[data-accordion-target]').forEach(button => {
    const targetId = button.getAttribute('data-accordion-target');
    const panel = document.getElementById(targetId);
    const icon = button.querySelector('.arrow');

    if (!panel) return;

    button.addEventListener('click', (e) => {
      e.preventDefault();
      const isExpanded = button.getAttribute('aria-expanded') === 'true';
      button.setAttribute('aria-expanded', String(!isExpanded));
      panel.classList.toggle('hidden');
      // rotate arrow ▶ to ▼
      if (icon) {
        icon.style.transform = isExpanded ? 'rotate(0deg)' : 'rotate(90deg)';
      }
    });
  });
});
