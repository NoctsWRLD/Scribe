import { Link } from 'react-router-dom';
import Logo from './Logo';
import { useI18n } from '../i18n';

const LEGAL_LINKS = [
  { to: '/pravilnik-o-zasebnosti', label: 'Pravilnik o zasebnosti' },
  { to: '/impressum', label: 'Impressum' },
  { to: '/dostopnost', label: 'Dostopnost' },
];

export default function SiteFooter() {
  const { t } = useI18n();

  return (
    <footer className="border-t border-rp-line">
      <div className="mx-auto max-w-6xl px-4 py-10 md:px-6">
        <div className="flex flex-col justify-between gap-8 sm:flex-row sm:items-start">
          <div className="max-w-xs">
            <span className="flex items-center gap-2.5">
              <Logo size={30} />
              <span className="font-display text-[15px] font-bold tracking-tight text-rp-text">Scribe</span>
            </span>
            <p className="mt-3 text-small leading-6 text-rp-muted">
              {t('Šolski dnevnik za učence in študente.')}
            </p>
          </div>

          <nav aria-label={t('Pravne povezave')}>
            <ul className="grid gap-2">
              {LEGAL_LINKS.map((link) => (
                <li key={link.to}>
                  <Link
                    to={link.to}
                    className="text-small text-rp-muted transition-colors hover:text-rp-accent"
                  >
                    {t(link.label)}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className="mt-8 flex flex-col gap-2 border-t border-rp-line pt-6 text-small text-rp-muted sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Scribe</p>
          <p>{t('Pravni dokumenti so objavljeni v slovenščini.')}</p>
        </div>
      </div>
    </footer>
  );
}
