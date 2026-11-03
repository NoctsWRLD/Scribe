import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../contexts/SettingsContext';
import { useI18n } from '../i18n';
import { formatDate, getSlovenianDateKey } from '../utils/dates';
import Logo from './Logo';
import LanguageSelect from './LanguageSelect';

// Loaded after the first paint so the database SDK never blocks the public page.
const TodayCount = lazy(() => import('./TodayCount'));
import { GearIcon, LogOutIcon, MenuIcon, MoonIcon, SunIcon, UserIcon } from './icons';

function AccountMenu() {
  const [open, setOpen] = useState(false);
  const buttonRef = useRef(null);
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { t } = useI18n();

  useEffect(() => {
    if (!open) return undefined;
    function onKey(event) {
      if (event.key === 'Escape') {
        setOpen(false);
        buttonRef.current?.focus();
      }
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  async function handleLogout() {
    try {
      await logout();
      setOpen(false);
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  }

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        type="button"
        title={t('Profil in nastavitve')}
        aria-label={t('Profil in nastavitve')}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="btn btn-icon !h-9 !w-9"
      >
        <UserIcon className="h-[18px] w-[18px]" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40 cursor-default" onClick={() => setOpen(false)} aria-hidden="true" />
          <div
            role="menu"
            aria-label={t('Profil in nastavitve')}
            className="rise absolute right-0 top-full z-50 mt-2 w-56 overflow-hidden rounded-md border border-rp-line bg-rp-raised p-1.5 shadow-[var(--rp-shadow-3)]"
          >
            <Link
              to="/profile"
              role="menuitem"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 rounded-sm px-3 py-2 text-body font-medium text-rp-text transition-colors hover:bg-rp-overlay"
            >
              <UserIcon className="h-4 w-4 text-rp-muted" />
              {t('Moj profil')}
            </Link>
            <Link
              to="/settings"
              role="menuitem"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 rounded-sm px-3 py-2 text-body font-medium text-rp-text transition-colors hover:bg-rp-overlay"
            >
              <GearIcon className="h-4 w-4 text-rp-muted" />
              {t('Nastavitve')}
            </Link>
            <div className="my-1.5 border-t border-rp-line" role="separator" />
            <button
              type="button"
              role="menuitem"
              onClick={handleLogout}
              className="btn btn-danger w-full !justify-start !px-3 !py-2 !text-body"
            >
              <LogOutIcon className="h-4 w-4" />
              {t('Odjava')}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function ThemeToggle() {
  const { theme, setTheme } = useSettings();
  const { t } = useI18n();
  const next = theme === 'noc' ? 'dnevnik' : 'noc';
  // The label names the theme the button switches *to*, not the current one.
  const label = next === 'noc' ? t('Preklopi na temni videz') : t('Preklopi na svetli videz');
  return (
    <button
      type="button"
      onClick={() => setTheme(next)}
      title={label}
      aria-label={label}
      className="btn btn-icon !h-9 !w-9"
    >
      {theme === 'noc' ? <SunIcon className="h-[18px] w-[18px]" /> : <MoonIcon className="h-[18px] w-[18px]" />}
    </button>
  );
}

export default function TopBar({ onOpenMenu }) {
  const { localeTag, t } = useI18n();
  const dateLabel = formatDate(
    getSlovenianDateKey(),
    { weekday: 'long', day: 'numeric', month: 'long' },
    localeTag,
  );

  return (
    <header className="sticky top-0 z-30 border-b border-rp-line bg-rp-panel/90 backdrop-blur-xl">
      <div className="flex h-16 items-center gap-3 px-4 md:px-6">
        <button
          type="button"
          onClick={onOpenMenu}
          aria-label={t('Odpri meni')}
          className="btn btn-icon !h-9 !w-9 lg:hidden"
        >
          <MenuIcon className="h-5 w-5" />
        </button>

        <Link to="/dashboard" className="flex items-center gap-2 lg:hidden" aria-label={t('Scribe domov')}>
          <Logo size={28} />
          <span className="font-display text-[15px] font-bold tracking-tight text-rp-text">Scribe</span>
        </Link>

        <div className="hidden min-w-0 items-baseline gap-3 lg:flex">
          <p className="truncate text-small text-rp-muted">{dateLabel}</p>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <Suspense fallback={null}>
            <TodayCount />
          </Suspense>
          <span className="hidden sm:block">
            <LanguageSelect compact />
          </span>
          <ThemeToggle />
          <AccountMenu />
        </div>
      </div>
    </header>
  );
}
