import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { NAV_GROUPS, isPathActive } from '../navigation';
import { useI18n } from '../i18n';
import Logo from './Logo';
import { GearIcon, LogOutIcon, MenuIcon, UserIcon } from './icons';

const DESTINATIONS = NAV_GROUPS.flatMap((group) => group.items);

function NavRow({ item, pathname }) {
  const { t } = useI18n();
  const active = isPathActive(pathname, item.to);
  return (
    <NavLink
      to={item.to}
      aria-current={active ? 'page' : undefined}
      className={`relative flex items-center px-3 py-2 text-[13px] font-medium transition-colors ${
        active ? 'text-rp-accent' : 'text-rp-muted hover:text-rp-text'
      }`}
    >
      {t(item.label)}
      <span
        className={`absolute inset-x-3 bottom-0.5 h-[2px] bg-rp-accent transition-opacity ${
          active ? 'opacity-100' : 'opacity-0'
        }`}
        aria-hidden="true"
      />
    </NavLink>
  );
}

function AccountMenu() {
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);
  const buttonRef = useRef(null);
  const navigate = useNavigate();
  const { currentUser, userProfile, logout } = useAuth();
  const { t } = useI18n();

  const name = currentUser?.displayName || userProfile?.displayName || '';
  const initial = name.trim().charAt(0).toLocaleUpperCase() || '';
  const label = t('Račun');

  useEffect(() => {
    if (!open) return undefined;
    function onKey(event) {
      if (event.key === 'Escape') {
        setOpen(false);
        buttonRef.current?.focus();
      }
    }
    function onPointer(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) setOpen(false);
    }
    document.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onPointer);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onPointer);
    };
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
    <div className="relative" ref={menuRef}>
      <button
        ref={buttonRef}
        type="button"
        title={label}
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="btn btn-icon border border-rp-line-strong !bg-transparent font-display text-[15px] font-semibold text-rp-text"
      >
        {initial || <UserIcon className="h-[18px] w-[18px]" />}
      </button>

      {open && (
        <div
          role="menu"
          aria-label={label}
          className="floating modal-pop absolute right-0 top-full z-50 mt-2 w-60 p-1.5"
        >
          {name && (
            <p className="truncate px-3 pb-1 pt-2 text-small text-rp-muted">{name}</p>
          )}
          <Link
            to="/profile"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="flex items-center gap-3 px-3 py-2.5 text-body font-medium text-rp-text transition-colors hover:bg-rp-overlay"
          >
            <UserIcon className="h-4 w-4 text-rp-muted" />
            {t('Moj profil')}
          </Link>
          <Link
            to="/settings"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="flex items-center gap-3 px-3 py-2.5 text-body font-medium text-rp-text transition-colors hover:bg-rp-overlay"
          >
            <GearIcon className="h-4 w-4 text-rp-muted" />
            {t('Nastavitve')}
          </Link>
          <div className="my-1.5 border-t border-rp-line" role="separator" />
          <button
            type="button"
            role="menuitem"
            onClick={handleLogout}
            className="flex w-full items-center gap-3 px-3 py-2.5 text-left text-body font-medium text-rp-danger transition-colors hover:bg-rp-overlay"
          >
            <LogOutIcon className="h-4 w-4" />
            {t('Odjava')}
          </button>
        </div>
      )}
    </div>
  );
}

export default function TopBar({ pathname, onOpenMenu }) {
  const { t } = useI18n();

  return (
    <header className="sticky top-0 z-40 border-b border-rp-line bg-rp-canvas/90 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4 md:px-6">
        <Link to="/dashboard" className="flex shrink-0 items-center gap-2.5" aria-label={t('Scribe domov')}>
          <Logo size={30} />
          <span className="font-display text-[17px] font-semibold tracking-tight text-rp-text">Scribe</span>
        </Link>

        <nav className="ml-4 hidden items-center lg:flex" aria-label={t('Glavna navigacija')}>
          {DESTINATIONS.map((item) => (
            <NavRow key={item.to} item={item} pathname={pathname} />
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-1.5">
          <AccountMenu />
          <button
            type="button"
            onClick={onOpenMenu}
            aria-label={t('Odpri meni')}
            className="btn btn-icon lg:hidden"
          >
            <MenuIcon className="h-5 w-5" />
          </button>
        </div>
      </div>
    </header>
  );
}
