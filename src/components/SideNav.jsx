import { useEffect, useId, useRef, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ACCOUNT_LINKS, COMMUNITY_LINKS, PRIMARY_LINKS, STUDY_LINKS, isPathActive } from '../navigation';
import { useI18n } from '../i18n';
import { useSubjects } from '../hooks/useFirestore';
import Logo from './Logo';
import NavIcon from './NavIcon';
import { ChevronDownIcon, GearIcon, LogOutIcon, UserIcon, XIcon } from './icons';

function DestinationLink({ item, pathname, onNavigate }) {
  const { t } = useI18n();
  const active = isPathActive(pathname, item.to);
  return (
    <NavLink
      to={item.to}
      onClick={onNavigate}
      aria-current={active ? 'page' : undefined}
      className={`group relative flex min-h-11 items-center gap-3 border-l-2 px-3 py-2.5 text-body transition-colors ${
        active
          ? 'border-rp-accent bg-rp-overlay font-semibold text-rp-text'
          : 'border-transparent font-medium text-rp-muted hover:text-rp-text'
      }`}
    >
      <NavIcon name={item.icon} className={`h-[18px] w-[18px] shrink-0 ${active ? 'text-rp-accent' : ''}`} />
      {t(item.label)}
    </NavLink>
  );
}

function AccountDropdown() {
  const [open, setOpen] = useState(false);
  const panelRef = useRef(null);
  const buttonRef = useRef(null);
  const menuRef = useRef(null);
  const navigate = useNavigate();
  const { currentUser, userProfile, logout } = useAuth();
  const { t } = useI18n();
  const name = currentUser?.displayName || userProfile?.displayName || currentUser?.email || '';
  const initial = name.trim().charAt(0).toLocaleUpperCase();

  useEffect(() => {
    if (!open) return undefined;
    requestAnimationFrame(() => menuRef.current?.querySelector('[role="menuitem"]')?.focus());
    function onPointerDown(event) {
      if (panelRef.current && !panelRef.current.contains(event.target)) setOpen(false);
    }
    function onKeyDown(event) {
      if (event.key === 'Escape') {
        setOpen(false);
        buttonRef.current?.focus();
      }
    }
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  function handleMenuKeyDown(event) {
    if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return;
    const items = [...(menuRef.current?.querySelectorAll('[role="menuitem"]') || [])];
    if (!items.length) return;
    event.preventDefault();
    const current = items.indexOf(document.activeElement);
    const next = event.key === 'Home'
      ? 0
      : event.key === 'End'
        ? items.length - 1
        : (current + (event.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length;
    items[next].focus();
  }

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
    <div className="relative" ref={panelRef}>
      <button
        ref={buttonRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={t('Račun')}
        onClick={() => setOpen((value) => !value)}
        className="flex min-h-12 w-full items-center gap-3 border-t border-rp-line px-3 py-2 text-left text-body text-rp-text transition-colors hover:bg-rp-overlay"
      >
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-rp-raised font-display text-sm font-semibold text-rp-text">
          {initial || <UserIcon className="h-4 w-4" />}
        </span>
        <span className="min-w-0 flex-1 truncate">{name || t('Račun')}</span>
        <ChevronDownIcon className={`h-4 w-4 shrink-0 text-rp-muted transition-transform duration-150 ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div ref={menuRef} role="menu" aria-label={t('Račun')} onKeyDown={handleMenuKeyDown} className="floating modal-pop absolute bottom-full left-0 z-50 mb-2 w-full p-1.5">
          {ACCOUNT_LINKS.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              role="menuitem"
              tabIndex={-1}
              onClick={() => setOpen(false)}
              className="flex min-h-10 items-center gap-3 px-3 py-2 text-body font-medium text-rp-text transition-colors hover:bg-rp-overlay"
            >
              <NavIcon name={link.icon} className="h-4 w-4 text-rp-muted" />
              {t(link.label)}
            </Link>
          ))}
          <div className="my-1 border-t border-rp-line" role="separator" />
          <button
            type="button"
            role="menuitem"
            tabIndex={-1}
            onClick={handleLogout}
            className="flex min-h-10 w-full items-center gap-3 px-3 py-2 text-left text-body font-medium text-rp-danger transition-colors hover:bg-rp-overlay"
          >
            <LogOutIcon className="h-4 w-4" />
            {t('Odjava')}
          </button>
        </div>
      )}
    </div>
  );
}

function SidebarContent({ pathname, onNavigate, onClose, closeButtonRef, hasSubjects }) {
  const { t } = useI18n();
  const studyId = useId();
  const primaryLinks = PRIMARY_LINKS.filter((item) => hasSubjects || item.to !== '/tasks');
  const studyLinks = STUDY_LINKS.filter((item) => hasSubjects || !['/exams', '/flashcards'].includes(item.to));
  const hasStudyRoute = studyLinks.some((item) => isPathActive(pathname, item.to));
  const [studyOverride, setStudyOverride] = useState(null);
  const studyExpanded = studyOverride ?? hasStudyRoute;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex h-16 shrink-0 items-center justify-between border-b border-rp-line px-5">
        <Link to="/dashboard" onClick={onNavigate} className="flex items-center gap-2.5" aria-label={t('Scribe domov')}>
          <Logo size={28} />
          <span className="font-display text-[17px] font-semibold tracking-tight text-rp-text">Scribe</span>
        </Link>
        {onClose && (
            <button ref={closeButtonRef} type="button" onClick={onClose} aria-label={t('Zapri meni')} className="btn btn-icon lg:hidden">
            <XIcon className="h-5 w-5" />
          </button>
        )}
      </div>

      <nav aria-label={t('Glavna navigacija')} className="flex min-h-0 flex-1 flex-col px-3 py-4">
        <div className="grid gap-1">
          {primaryLinks.map((item) => (
            <DestinationLink key={item.to} item={item} pathname={pathname} onNavigate={onNavigate} />
          ))}
        </div>

        <div className="mt-3 border-t border-rp-line pt-3">
          <button
            type="button"
            aria-expanded={studyExpanded}
            aria-controls={studyId}
            onClick={() => setStudyOverride((value) => !(value ?? hasStudyRoute))}
            className={`flex min-h-11 w-full items-center justify-between border-l-2 px-3 py-2.5 text-left text-body font-semibold transition-colors hover:text-rp-text ${hasStudyRoute ? 'border-rp-accent text-rp-text' : 'border-transparent text-rp-muted'}`}
          >
            <span className="flex items-center gap-3">
              <NavIcon name="book" className={`h-[18px] w-[18px] ${hasStudyRoute ? 'text-rp-accent' : ''}`} />
              {t('Učenje')}
            </span>
            <ChevronDownIcon className={`h-4 w-4 transition-transform duration-150 ${studyExpanded ? 'rotate-180' : ''}`} />
          </button>
          {studyExpanded && (
            <div id={studyId} className="ml-5 grid border-l border-rp-line py-1 pl-2">
              {studyLinks.map((item) => (
                <DestinationLink key={item.to} item={item} pathname={pathname} onNavigate={onNavigate} />
              ))}
            </div>
          )}
        </div>

        <div className="mt-auto border-t border-rp-line pt-3">
          <ul className="grid gap-1">
            {COMMUNITY_LINKS.map((item) => (
              <li key={item.to}>
                <DestinationLink item={item} pathname={pathname} onNavigate={onNavigate} />
              </li>
            ))}
          </ul>
        </div>
      </nav>
      <div className="shrink-0 px-3 pb-3">
        <AccountDropdown />
      </div>
    </div>
  );
}

export default function SideNav({ pathname, open, onClose }) {
  const dialogRef = useRef(null);
  const closeRef = useRef(null);
  const { t } = useI18n();
  const { subjects, loading: subjectsLoading } = useSubjects();
  const hasSubjects = !subjectsLoading && subjects.length > 0;

  useEffect(() => {
    if (!open) return undefined;
    closeRef.current?.focus();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    function onKeyDown(event) {
      if (event.key === 'Escape') {
        onClose();
        document.getElementById('mobile-menu-button')?.focus();
        return;
      }
      if (event.key !== 'Tab') return;
      const focusable = dialogRef.current?.querySelectorAll('a[href], button:not([disabled])');
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
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open, onClose]);

  function closeAndReturnFocus() {
    onClose();
    requestAnimationFrame(() => document.getElementById('mobile-menu-button')?.focus());
  }

  return (
    <>
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r border-rp-line bg-rp-panel lg:flex">
        <SidebarContent pathname={pathname} hasSubjects={hasSubjects} />
      </aside>
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label={t('Zapri meni')}
            className="overlay-fade absolute inset-0 bg-rp-canvas/85"
            onClick={closeAndReturnFocus}
          />
          <aside
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-label={t('Meni')}
            className="modal-pop absolute inset-y-0 left-0 flex w-[min(18rem,88vw)] flex-col border-r border-rp-line bg-rp-panel"
          >
            <SidebarContent pathname={pathname} hasSubjects={hasSubjects} onNavigate={closeAndReturnFocus} onClose={closeAndReturnFocus} closeButtonRef={closeRef} />
          </aside>
        </div>
      )}
    </>
  );
}
