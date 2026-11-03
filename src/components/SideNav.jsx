import { NavLink } from 'react-router-dom';
import { NAV_GROUPS, isPathActive } from '../navigation';
import NavIcon from './NavIcon';
import Logo from './Logo';
import LanguageSelect from './LanguageSelect';
import { PlusIcon } from './icons';
import { useI18n } from '../i18n';
import { formatDate, getSlovenianDateKey } from '../utils/dates';

function NavRow({ item, active, onClick }) {
  const { t } = useI18n();
  return (
    <NavLink
      to={item.to}
      onClick={onClick}
      aria-current={active ? 'page' : undefined}
      className={`group relative flex items-center gap-3 rounded-sm px-3 py-2 text-body transition-colors ${
        active
          ? 'font-semibold text-rp-accent'
          : 'font-medium text-rp-subtle hover:bg-rp-overlay hover:text-rp-text'
      }`}
    >
      <span
        className={`absolute left-0 top-1/2 h-4 w-[3px] -translate-y-1/2 rounded-full transition-opacity ${
          active ? 'bg-rp-accent opacity-100' : 'opacity-0'
        }`}
        aria-hidden="true"
      />
      <NavIcon name={item.icon} className="h-[18px] w-[18px] shrink-0" />
      <span className="truncate">{t(item.label)}</span>
    </NavLink>
  );
}

export default function SideNav({ pathname, onNavigate }) {
  const { t, localeTag } = useI18n();

  return (
    <div className="flex h-full flex-col gap-5 px-3 py-5">
      <NavLink
        to="/dashboard"
        onClick={onNavigate}
        aria-label={t('Scribe domov')}
        className="flex items-center gap-2.5 rounded-sm px-2 transition-opacity hover:opacity-80"
      >
        <Logo size={32} />
        <span className="font-display text-[17px] font-bold tracking-tight text-rp-text">
          Scribe
        </span>
      </NavLink>

      <div className="border-y border-rp-line px-2 py-3">
        <p className="text-small font-semibold text-rp-muted">{t('Danes')}</p>
        <p className="mono mt-1 text-small text-rp-text">
          {formatDate(getSlovenianDateKey(), { weekday: 'long', day: 'numeric', month: 'long' }, localeTag)}
        </p>
      </div>

      <nav className="flex-1 overflow-y-auto" aria-label={t('Glavna navigacija')}>
        {NAV_GROUPS.map((group) => (
          <div key={group.label} className="mb-5">
            <p className="mb-1.5 px-3 text-small font-semibold text-rp-muted">{t(group.label)}</p>
            <ul className="grid gap-0.5">
              {group.items.map((item) => (
                <li key={item.to}>
                  <NavRow item={item} active={isPathActive(pathname, item.to)} onClick={onNavigate} />
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      <div className="grid gap-2 border-t border-rp-line pt-4">
        <LanguageSelect />
        <NavLink to="/tasks?new=1" onClick={onNavigate} className="btn btn-primary w-full">
          <PlusIcon className="h-4 w-4" />
          {t('Nova naloga')}
        </NavLink>
      </div>
    </div>
  );
}
