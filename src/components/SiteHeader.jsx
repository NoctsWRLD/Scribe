import { useState } from 'react';
import { Link } from 'react-router-dom';
import Logo from './Logo';
import LanguageSelect from './LanguageSelect';
import { useI18n } from '../i18n';
import { MenuIcon, XIcon } from './icons';

const LINKS = [
  { href: '#moznosti', label: 'Kaj je v njem' },
  { href: '#kako-deluje', label: 'Kako začneš' },
  { href: '#jeziki', label: 'Jeziki' },
  { href: '#vprasanja', label: 'Vprašanja' },
];

export default function SiteHeader() {
  const [open, setOpen] = useState(false);
  const { t } = useI18n();

  return (
    <header className="sticky top-0 z-40 border-b border-rp-line bg-rp-canvas/85 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4 md:px-6">
        <Link to="/" className="flex items-center gap-2.5" aria-label={t('Scribe domov')}>
          <Logo size={32} />
          <span className="font-display text-[17px] font-bold tracking-tight text-rp-text">Scribe</span>
        </Link>

        <nav className="ml-8 hidden items-center gap-1 md:flex" aria-label={t('Navigacija po strani')}>
          {LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="rounded-sm px-3 py-2 text-body font-medium text-rp-subtle transition-colors hover:bg-rp-overlay hover:text-rp-text"
            >
              {t(link.label)}
            </a>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <LanguageSelect compact className="hidden sm:inline-flex" />
          <Link to="/login" className="btn hidden sm:inline-flex">{t('Prijava')}</Link>
          <Link to="/register" className="btn btn-primary whitespace-nowrap">
            <span className="sm:hidden">{t('Ustvari')}</span>
            <span className="hidden sm:inline">{t('Ustvari račun')}</span>
          </Link>
          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            aria-label={open ? t('Zapri meni') : t('Odpri meni')}
            aria-expanded={open}
            className="btn btn-icon border-transparent bg-transparent md:hidden"
          >
            {open ? <XIcon className="h-5 w-5" /> : <MenuIcon className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {open && (
        <nav className="border-t border-rp-line bg-rp-canvas px-4 py-3 md:hidden" aria-label={t('Navigacija po strani')}>
          <ul className="grid gap-1">
            {LINKS.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="block rounded-sm px-3 py-2.5 text-body font-medium text-rp-subtle transition-colors hover:bg-rp-overlay hover:text-rp-text"
                >
                  {t(link.label)}
                </a>
              </li>
            ))}
            <li className="mt-1 flex items-center justify-between gap-3 border-t border-rp-line px-3 pt-3">
              <span className="text-small text-rp-muted">{t('Jezik')}</span>
              <LanguageSelect compact />
            </li>
            <li>
              <Link to="/login" onClick={() => setOpen(false)} className="block rounded-sm px-3 py-2.5 text-body font-semibold text-rp-accent">
                {t('Prijava')}
              </Link>
            </li>
          </ul>
        </nav>
      )}
    </header>
  );
}
