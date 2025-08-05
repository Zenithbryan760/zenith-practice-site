// js/header.js
document.addEventListener('DOMContentLoaded', () => {
  // Accordion submenu toggles
  document.querySelectorAll('.submenu-toggle').forEach(btn => {
    btn.addEventListener('click', () => {
      const li       = btn.closest('li');
      const parentUl = li.parentElement;

      // 1) Close any other open panel at this same level
      parentUl.querySelectorAll(':scope > li.open').forEach(openLi => {
        if (openLi !== li) {
          openLi.classList.remove('open');
          openLi.querySelectorAll('.submenu-toggle')
                .forEach(b => b.setAttribute('aria-expanded', 'false'));
        }
      });

      // 2) Toggle this panel
      const nowOpen = li.classList.toggle('open');
      btn.setAttribute('aria-expanded', nowOpen);
    });
  });
});
