import { Link } from 'react-router-dom';
import { useI18n } from '../i18n';
import Logo from './Logo';
import { MenuIcon } from './icons';

export default function TopBar({ onOpenMenu }) {
  const { t } = useI18n();

  return (
    <header className="sticky top-0 z-20 border-b border-rp-line bg-rp-canvas lg:hidden">
      <div className="flex h-14 items-center gap-3 px-4">
        <Link to="/dashboard" className="flex shrink-0 items-center gap-2.5" aria-label={t('Scribe domov')}>
          <Logo size={27} />
          <span className="font-display text-[16px] font-semibold tracking-tight text-rp-text">Scribe</span>
        </Link>
        <button
          id="mobile-menu-button"
          type="button"
          onClick={onOpenMenu}
          aria-label={t('Odpri meni')}
          aria-haspopup="dialog"
          className="btn btn-icon ml-auto"
        >
          <MenuIcon className="h-5 w-5" />
        </button>
      </div>
    </header>
  );
}
