import { useEffect, useRef, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { ACCOUNT_LINKS, NAV_GROUPS, isPathActive } from '../navigation';
import { useSeo } from '../hooks/useSeo';
import { getPageTitle } from '../utils/pageTitles';
import { useI18n } from '../i18n';
import TopBar from './TopBar';
import NavIcon from './NavIcon';
import Logo from './Logo';
import { XIcon } from './icons';

/**
 * One navigation menu for narrow screens. It is the only surface besides the
 * header that lists destinations; there is no second bottom bar and no
 * language or theme control here — those live in Settings.
 */
function MenuSheet({ pathname, onClose }) {
  const sheetRef = useRef(null);
  const closeRef = useRef(null);
  const { t } = useI18n();

  useEffect(() => {
    closeRef.current?.focus();
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);

  useEffect(() => {
    function onKey(event) {
      if (event.key === 'Escape') {
        onClose();
        return;
      }
      if (event.key !== 'Tab') return;
      const focusable = sheetRef.current?.querySelectorAll(
        'a[href], button:not([disabled])',
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

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <div className="overlay-fade absolute inset-0 bg-rp-canvas/85" onClick={onClose} aria-hidden="true" />
      <div
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        aria-label={t('Meni')}
        className="modal-pop absolute inset-y-0 right-0 flex w-[min(21rem,90vw)] flex-col border-l border-rp-line bg-rp-panel"
      >
        <div className="flex h-16 items-center justify-between border-b border-rp-line px-4">
          <span className="flex items-center gap-2.5">
            <Logo size={26} />
            <span className="font-display text-[16px] font-semibold tracking-tight text-rp-text">Scribe</span>
          </span>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label={t('Zapri meni')}
            className="btn btn-icon"
          >
            <XIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-5">
          {NAV_GROUPS.map((group) => (
            <div key={group.label} className="mb-6">
              <p className="eyebrow mb-2 px-3">{t(group.label)}</p>
              <ul className="grid">
                {group.items.map((item) => {
                  const active = isPathActive(pathname, item.to);
                  return (
                    <li key={item.to}>
                      <NavLink
                        to={item.to}
                        onClick={onClose}
                        aria-current={active ? 'page' : undefined}
                        className={`flex items-center gap-3 border-t border-rp-line px-3 py-3 text-body transition-colors ${
                          active
                            ? 'font-semibold text-rp-accent'
                            : 'font-medium text-rp-subtle hover:text-rp-text'
                        }`}
                      >
                        <NavIcon name={item.icon} className="h-[18px] w-[18px] shrink-0" />
                        {t(item.label)}
                      </NavLink>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}

          <div className="grid border-t border-rp-line pt-3">
            {ACCOUNT_LINKS.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                onClick={onClose}
                className="flex items-center gap-3 px-3 py-3 text-body font-medium text-rp-subtle transition-colors hover:text-rp-text"
              >
                <NavIcon name={link.icon} className="h-[18px] w-[18px] shrink-0" />
                {t(link.label)}
              </NavLink>
            ))}
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

  return (
    <div className={`flex bg-rp-canvas ${isChat ? 'h-dvh flex-col overflow-hidden' : 'min-h-dvh flex-col'}`}>
      <a
        href="#main-content"
        className="sr-only z-[100] bg-rp-accent px-4 py-2 font-semibold text-rp-accent-ink focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
      >
        {t('Preskoči na vsebino')}
      </a>

      <TopBar pathname={location.pathname} onOpenMenu={() => setMenuOpen(true)} />

      <main
        id="main-content"
        className={
          isChat
            ? 'mx-auto flex min-h-0 w-full max-w-6xl flex-1 flex-col'
            : 'mx-auto w-full max-w-6xl flex-1 px-4 pb-20 pt-8 md:px-6 lg:pt-12'
        }
      >
        {children}
      </main>

      {menuOpen && <MenuSheet pathname={location.pathname} onClose={() => setMenuOpen(false)} />}
    </div>
  );
}
