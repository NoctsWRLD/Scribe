import { useState } from 'react';
import { Link } from 'react-router-dom';
import Logo from './Logo';
import PublicSettings from './PublicSettings';
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
    <header className="sticky top-0 z-40 border-b border-rp-line bg-rp-canvas/90 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4 md:px-6">
        <Link to="/" className="flex shrink-0 items-center gap-2.5" aria-label={t('Scribe domov')}>
          <Logo size={30} />
          <span className="font-display text-[18px] font-semibold tracking-tight text-rp-text">Scribe</span>
        </Link>

        <nav className="ml-6 hidden items-center md:flex" aria-label={t('Navigacija po strani')}>
          {LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="px-3 py-2 text-[13px] font-medium text-rp-muted transition-colors hover:text-rp-text"
            >
              {t(link.label)}
            </a>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-1.5">
          <PublicSettings />
          <Link to="/login" className="hidden px-3 py-2 text-[13px] font-medium text-rp-muted transition-colors hover:text-rp-text sm:inline-flex">
            {t('Prijava')}
          </Link>
          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            aria-label={open ? t('Zapri meni') : t('Odpri meni')}
            aria-expanded={open}
            className="btn btn-icon md:hidden"
          >
            {open ? <XIcon className="h-5 w-5" /> : <MenuIcon className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {open && (
        <nav className="border-t border-rp-line bg-rp-canvas md:hidden" aria-label={t('Navigacija po strani')}>
          <ul className="mx-auto grid max-w-6xl px-4 py-3">
            {LINKS.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="block border-t border-rp-line py-3 text-body font-medium text-rp-subtle transition-colors hover:text-rp-text"
                >
                  {t(link.label)}
                </a>
              </li>
            ))}
            <li className="pt-3">
              <Link
                to="/login"
                onClick={() => setOpen(false)}
                className="block text-body font-semibold text-rp-accent"
              >
                {t('Prijava')}
              </Link>
            </li>
          </ul>
        </nav>
      )}
    </header>
  );
}
