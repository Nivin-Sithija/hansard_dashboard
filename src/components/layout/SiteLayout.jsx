import React, { useEffect, useMemo, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { PRIMARY_NAV, SECONDARY_NAV } from '../../lib/topics';
import { useUiLanguage } from '../../lib/uiLanguage';

function navClass({ isActive }) {
  return `site-nav__link${isActive ? ' is-active' : ''}`;
}

export function SiteLayout() {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const { locale, setLocale, t } = useUiLanguage();

  const activeSection = useMemo(() => {
    const match = [...PRIMARY_NAV, ...SECONDARY_NAV].find((item) => item.to === location.pathname);
    return match ? t(match.labelKey, match.label) : t('navOverview', 'Overview');
  }, [location.pathname, t]);

  useEffect(() => {
    document.title = `${activeSection} | Hansard Lens`;
  }, [activeSection]);

  const languagePicker = (
    <label className="site-language-switcher">
      <span>{t('languageLabel')}</span>
      <select value={locale} onChange={(event) => setLocale(event.target.value)} aria-label={t('languageLabel')}>
        <option value="en">{t('uiEnglish')}</option>
        <option value="si">{t('uiSinhala')}</option>
      </select>
    </label>
  );

  return (
    <div className="site-shell">
      <header className="site-header">
        <div className="site-header__brand-row">
          <NavLink to="/" className="site-brand" onClick={() => setIsOpen(false)}>
            <img src="/logo.svg" alt="Hansard Lens logo" className="site-brand__logo" />
            <div>
              <div className="site-brand__eyebrow">{t('brandEyebrow')}</div>
              <div className="site-brand__title">Hansard Lens</div>
            </div>
          </NavLink>
          <div className="site-header__controls">
            {languagePicker}
            <button className="site-header__menu" type="button" onClick={() => setIsOpen((current) => !current)} aria-label="Toggle navigation">
              {isOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
        <div className="site-header__nav-wrap">
          <nav className="site-nav site-nav--primary" aria-label="Primary navigation">
            {PRIMARY_NAV.map((item) => <NavLink key={item.to} to={item.to} className={navClass}>{t(item.labelKey, item.label)}</NavLink>)}
          </nav>
          <nav className="site-nav site-nav--secondary" aria-label="Secondary navigation">
            {SECONDARY_NAV.map((item) => <NavLink key={item.to} to={item.to} className={navClass}>{t(item.labelKey, item.label)}</NavLink>)}
          </nav>
        </div>
        {isOpen && (
          <div className="site-drawer">
            {languagePicker}
            <div className="site-drawer__section-label">{t('drawerExplore')}</div>
            {PRIMARY_NAV.map((item) => <NavLink key={item.to} to={item.to} className={navClass} onClick={() => setIsOpen(false)}>{t(item.labelKey, item.label)}</NavLink>)}
            <div className="site-drawer__section-label">{t('drawerNext')}</div>
            {SECONDARY_NAV.map((item) => <NavLink key={item.to} to={item.to} className={navClass} onClick={() => setIsOpen(false)}>{t(item.labelKey, item.label)}</NavLink>)}
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
