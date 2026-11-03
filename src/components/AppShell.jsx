import { useEffect, useRef, useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ACCOUNT_LINKS, NAV_GROUPS, isPathActive } from '../navigation';
import { useSeo } from '../hooks/useSeo';
import { getPageTitle } from '../utils/pageTitles';
import { useI18n } from '../i18n';
import SideNav from './SideNav';
import TopBar from './TopBar';
import MobileTabBar from './MobileTabBar';
import NavIcon from './NavIcon';
import Logo from './Logo';
import LanguageSelect from './LanguageSelect';
import { LogOutIcon, XIcon } from './icons';

function MoreSheet({ pathname, onClose }) {
  const sheetRef = useRef(null);
  const closeRef = useRef(null);
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { t } = useI18n();

  useEffect(() => {
    closeRef.current?.focus();
  }, []);

  useEffect(() => {
    function onKey(event) {
      if (event.key === 'Escape') {
        onClose();
        return;
      }
      if (event.key !== 'Tab') return;
      const focusable = sheetRef.current?.querySelectorAll(
        'a[href], button:not([disabled]), select:not([disabled])',
      );
      if (!focusable?.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  async function handleLogout() {
    try {
      await logout();
      onClose();
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  }

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <div className="overlay-fade absolute inset-0 bg-rp-canvas/80 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
      <div
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        aria-label={t('Meni')}
        className="modal-pop absolute inset-y-0 left-0 flex w-[min(20rem,88vw)] flex-col border-r border-rp-line bg-rp-panel"
      >
        <div className="flex h-16 items-center justify-between border-b border-rp-line px-4">
          <span className="flex items-center gap-2.5">
            <Logo size={28} />
            <span className="font-display text-[15px] font-bold tracking-tight text-rp-text">Scribe</span>
          </span>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label={t('Zapri meni')}
            className="btn btn-icon !h-9 !w-9"
          >
            <XIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-4">
          {NAV_GROUPS.map((group) => (
            <div key={group.label} className="mb-5">
              <p className="mb-1.5 px-3 text-small font-semibold text-rp-muted">{t(group.label)}</p>
              <ul className="grid gap-0.5">
                {group.items.map((item) => {
                  const active = isPathActive(pathname, item.to);
                  return (
                    <li key={item.to}>
                      <NavLink
                        to={item.to}
                        onClick={onClose}
                        aria-current={active ? 'page' : undefined}
                        className={`relative flex items-center gap-3 rounded-sm px-3 py-2.5 text-body transition-colors ${
                          active
                            ? 'font-semibold text-rp-accent'
                            : 'font-medium text-rp-subtle hover:bg-rp-overlay hover:text-rp-text'
                        }`}
                      >
                        {active && (
                          <span
                            className="absolute left-0 top-1/2 h-4 w-[3px] -translate-y-1/2 rounded-full bg-rp-accent"
                            aria-hidden="true"
                          />
                        )}
                        <NavIcon name={item.icon} className="h-[18px] w-[18px] shrink-0" />
                        {t(item.label)}
                      </NavLink>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}

          <div className="grid gap-0.5 border-t border-rp-line pt-4">
            {ACCOUNT_LINKS.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                onClick={onClose}
                className="flex items-center gap-3 rounded-sm px-3 py-2.5 text-body font-medium text-rp-subtle transition-colors hover:bg-rp-overlay hover:text-rp-text"
              >
                <NavIcon name={link.icon} className="h-[18px] w-[18px] shrink-0" />
                {t(link.label)}
              </NavLink>
            ))}
            <div className="mt-2 px-3">
              <LanguageSelect />
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="btn btn-danger mt-2 w-full !justify-start !px-3 !py-2.5 !text-body"
            >
              <LogOutIcon className="h-[18px] w-[18px] shrink-0" />
              {t('Odjava')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AppShell({ children }) {
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const { t } = useI18n();
  const isChat = location.pathname === '/chat';

  useSeo({ title: t(getPageTitle(location.pathname)), path: location.pathname });

  useEffect(() => {
    if (!menuOpen) return undefined;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [menuOpen]);

  return (
    <div className="min-h-dvh bg-rp-canvas">
      <a
        href="#main-content"
        className="sr-only z-[100] rounded-sm bg-rp-accent px-4 py-2 font-semibold text-rp-accent-ink focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
      >
        {t('Preskoči na vsebino')}
      </a>

      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 border-r border-rp-line bg-rp-panel lg:block">
        <SideNav pathname={location.pathname} />
      </aside>

      {/* The chat is a fixed-height screen: the conversation scrolls, the
          composer stays above the tab bar. Every other page scrolls whole. */}
      <div className={`flex flex-col lg:pl-60 ${isChat ? 'h-dvh overflow-hidden' : 'min-h-dvh'}`}>
        <TopBar onOpenMenu={() => setMenuOpen(true)} />
        <main
          id="main-content"
          className={
            isChat
              ? 'mx-auto flex min-h-0 w-full max-w-6xl flex-1 flex-col pb-[calc(3.9rem+env(safe-area-inset-bottom))] lg:pb-0'
              : 'mx-auto w-full max-w-6xl flex-1 px-4 pb-28 pt-6 md:px-6 lg:pb-14 lg:pt-9'
          }
        >
          {children}
        </main>
      </div>

      <MobileTabBar pathname={location.pathname} />

      {menuOpen && (
        <MoreSheet pathname={location.pathname} onClose={() => setMenuOpen(false)} />
      )}
    </div>
  );
}
