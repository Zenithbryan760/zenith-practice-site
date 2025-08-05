@media (max-width: 768px) {
  /* Hide desktop dropdown links */
  .nav-links .dropdown > a,
  .nav-links .dropdown-submenu > a {
    display: none;
  }

  /* Hide the nested ULs until tapped */
  .nav-links .dropdown-menu,
  .nav-links .submenu {
    display: none;
  }

  /* Show your manual accordion buttons */
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

  /* Reveal when you add .open to LI */
  .nav-links li.open > .dropdown-menu,
  .nav-links li.open > .submenu {
    display: block;
  }

  /* Rotate chevron */
  .nav-links li.open .chevron {
    transform: rotate(90deg);
  }
}
