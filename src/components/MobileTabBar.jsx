import { NavLink } from 'react-router-dom';
import { NAV_GROUPS, PRIMARY_PATHS, isPathActive } from '../navigation';
import NavIcon from './NavIcon';
import { useI18n } from '../i18n';

export default function MobileTabBar({ pathname }) {
  const { t } = useI18n();
  const items = NAV_GROUPS.flatMap((group) => group.items).filter((item) =>
    PRIMARY_PATHS.includes(item.to),
  );

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-rp-line bg-rp-panel/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl lg:hidden"
      aria-label={t('Glavna navigacija')}
    >
      <ul className="mx-auto flex max-w-md items-stretch">
        {items.map((item) => {
          const active = isPathActive(pathname, item.to);
          return (
            <li key={item.to} className="flex-1">
              <NavLink
                to={item.to}
                aria-current={active ? 'page' : undefined}
                className={`flex flex-col items-center gap-1 px-1 py-2.5 text-[11px] font-semibold transition-colors ${
                  active ? 'text-rp-accent' : 'text-rp-muted'
                }`}
              >
                <NavIcon name={item.icon} className="h-5 w-5" />
                {t(item.label)}
              </NavLink>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
