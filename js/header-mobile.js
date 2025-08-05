/* css/header-mobile.css — Mobile submenu & toggle overrides */
@media (max-width: 768px) {

  /* Hide the desktop “Services” <a> links on mobile */
  .nav-links .dropdown > a,
  .nav-links .dropdown-submenu > a {
    display: none;
  }

  /* Hide all nested lists until the user taps */
  .nav-links .dropdown-menu,
  .nav-links .submenu {
    display: none;
  }

  /* Show the accordion buttons */
  .submenu-toggle {
    display: flex;
    justify-content: space-between;
    width: 100%;
    background: none;
    border: none;
    padding: 0.75rem 1rem;
    font: inherit;
    text-align: left;
    cursor: pointer;
  }

  /* Reveal when its <li> has .open */
  .nav-links li.open > .dropdown-menu,
  .nav-links li.open > .submenu {
    display: block;
  }

  /* Rotate the chevron */
  .nav-links li.open .chevron {
    transform: rotate(90deg);
  }

}
