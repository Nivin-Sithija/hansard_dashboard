import React, { useMemo, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { PRIMARY_NAV, SECONDARY_NAV } from '../../lib/topics';

function navClass({ isActive }) {
  return `site-nav__link${isActive ? ' is-active' : ''}`;
}

export function SiteLayout() {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  const activeSection = useMemo(() => {
    const match = [...PRIMARY_NAV, ...SECONDARY_NAV].find((item) => item.to === location.pathname);
    return match?.label ?? 'Overview';
  }, [location.pathname]);

  return (
    <div className="site-shell">
      <header className="site-header">
        <div className="site-header__brand-row">
          <NavLink to="/" className="site-brand" onClick={() => setIsOpen(false)}>
            <img src="/logo.svg" alt="Hansard Lens logo" className="site-brand__logo" />
            <div>
              <div className="site-brand__eyebrow">Trilingual Sri Lankan Hansard Explorer</div>
              <div className="site-brand__title">Hansard Lens</div>
            </div>
          </NavLink>
          <button className="site-header__menu" type="button" onClick={() => setIsOpen((current) => !current)} aria-label="Toggle navigation">
            {isOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
        <div className="site-header__nav-wrap">
          <nav className="site-nav site-nav--primary" aria-label="Primary navigation">
            {PRIMARY_NAV.map((item) => <NavLink key={item.to} to={item.to} className={navClass}>{item.label}</NavLink>)}
          </nav>
          <nav className="site-nav site-nav--secondary" aria-label="Secondary navigation">
            {SECONDARY_NAV.map((item) => <NavLink key={item.to} to={item.to} className={navClass}>{item.label}</NavLink>)}
          </nav>
        </div>
        {isOpen && (
          <div className="site-drawer">
            <div className="site-drawer__section-label">Explore</div>
            {PRIMARY_NAV.map((item) => <NavLink key={item.to} to={item.to} className={navClass} onClick={() => setIsOpen(false)}>{item.label}</NavLink>)}
            <div className="site-drawer__section-label">Next</div>
            {SECONDARY_NAV.map((item) => <NavLink key={item.to} to={item.to} className={navClass} onClick={() => setIsOpen(false)}>{item.label}</NavLink>)}
          </div>
        )}
      </header>
      <main className="site-main">
        <div className="site-main__eyebrow">{activeSection}</div>
        <Outlet />
      </main>
    </div>
  );
}
