// header-mobile.js
document.addEventListener('DOMContentLoaded', () => {
  if (window.innerWidth > 768) return;    // only mobile

  document.querySelectorAll('.submenu-toggle').forEach(btn => {
    btn.addEventListener('click', () => {
      const li = btn.closest('li');
      li.classList.toggle('open');
    });
  });
});
