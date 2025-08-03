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
   // js/header.js
document.addEventListener('DOMContentLoaded', () => {
  const toggleBtn = document.querySelector('.menu-toggle');
  const navBar   = document.querySelector('.nav-bar');

  if (!toggleBtn || !navBar) return;

  // on ☰ click, flip the .open class on the nav-bar
  toggleBtn.addEventListener('click', () => {
    navBar.classList.toggle('open');
  });

  // optional: click outside to close
  document.addEventListener('click', e => {
    if (
      !toggleBtn.contains(e.target) &&
      !navBar.contains(e.target) &&
      navBar.classList.contains('open')
    ) {
      navBar.classList.remove('open');
    }
  });
});
});
// js/header.js
document.addEventListener('DOMContentLoaded', () => {
  const toggleBtn = document.querySelector('.menu-toggle');
  const navBar   = document.querySelector('.nav-bar');

  if (!toggleBtn || !navBar) return;

  // on ☰ click, flip the .open class on the nav-bar
  toggleBtn.addEventListener('click', () => {
    navBar.classList.toggle('open');
  });

  // optional: click outside to close
  document.addEventListener('click', e => {
    if (
      !toggleBtn.contains(e.target) &&
      !navBar.contains(e.target) &&
      navBar.classList.contains('open')
    ) {
      navBar.classList.remove('open');
    }
  });
});
