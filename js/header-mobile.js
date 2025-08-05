/* off-canvas container, hidden by default */
.mobile-nav {
  position: fixed;
  top: 0; right: -100%;
  width: 80%;
  height: 100%;
  background: var(--zenith-blue);
  color: var(--white);
  overflow-y: auto;
  transition: right 0.3s ease;
  z-index: 2000;
  padding: 1rem;
}

/* Slide in when open */
.mobile-nav.open {
  right: 0;
}

/* Basic reset */
.mobile-nav .submenu,
.mobile-nav .mobile-links {
  list-style: none;
  padding: 0;
  margin: 0;
}

/* Accordion buttons */
.accordion-toggle {
  background: none;
  border: none;
  color: var(--white);
  font-size: 1rem;
  width: 100%;
  text-align: left;
  padding: 0.75rem 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
}

/* Hide all submenus by default */
.mobile-nav .submenu {
  display: none;
}

/* Show when its parent <li> has .open */
.mobile-nav li.open > .submenu {
  display: block;
}

/* Indent nested levels */
.mobile-nav .submenu .submenu {
  padding-left: 1rem;
}

/* Chevron transition */
.chevron {
  display: inline-block;
  transition: transform 0.2s ease;
}
li.open > .accordion-toggle .chevron {
  transform: rotate(90deg);
}
