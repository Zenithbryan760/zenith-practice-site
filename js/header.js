/* ===================================================================
   js/header.js — Navigation Interactivity
   =================================================================== */

/* -------------------------------------------------------------------
   SECTION 1: DOMContentLoaded
   Ensure all elements exist before we wire up event handlers.
   ------------------------------------------------------------------- */
document.addEventListener('DOMContentLoaded', () => {

  /* -----------------------------------------------------------------
     SECTION 2: MOBILE MENU TOGGLE
     Toggles the visibility of the nav-links on small screens.
     ----------------------------------------------------------------- */
  const toggleBtn = document.querySelector('.menu-toggle');
  const navLinks = document.querySelector('.nav-links');
  if (toggleBtn && navLinks) {
    toggleBtn.addEventListener('click', () => {
      navLinks.classList.toggle('open');
    });
  }

  /* -----------------------------------------------------------------
     SECTION 3: SEARCH NAVIGATION
     Listens for Enter key in the search input and navigates
     to the first matching link.
     ----------------------------------------------------------------- */
  const searchInput = document.querySelector('.search-container input');
  const navItems = Array.from(document.querySelectorAll('.nav-links a'));
  if (searchInput) {
    searchInput.addEventListener('keydown', e => {
      if (e.key === 'Enter') {
        e.preventDefault();
        const query = searchInput.value.trim().toLowerCase();
        if (!query) return;

        const match = navItems.find(a =>
          a.textContent.toLowerCase().includes(query) ||
          a.getAttribute('href').toLowerCase().includes(query)
        );

        if (match) {
          window.location.href = match.href;
        } else {
          alert('No matching page found.');
        }
      }
    });
  }

  /* -----------------------------------------------------------------
     SECTION 4: CLOSE MENU ON OUTSIDE CLICK (MOBILE)
     Closes the menu if the user clicks outside of it.
     ----------------------------------------------------------------- */
  document.addEventListener('click', e => {
    if (
      toggleBtn &&
      navLinks &&
      !toggleBtn.contains(e.target) &&
      !navLinks.contains(e.target) &&
      navLinks.classList.contains('open')
    ) {
      navLinks.classList.remove('open');
    }
  });

}); // end DOMContentLoaded

