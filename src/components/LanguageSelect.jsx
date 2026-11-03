import { LOCALES } from '../i18n/locales';
import { useI18n } from '../i18n';

/**
 * The language switcher. A native select, because on a phone the platform
 * picker is better than anything we would draw, and because it keeps the
 * keyboard and screen-reader behaviour for free.
 */
export default function LanguageSelect({ compact = false, className = '' }) {
  const { locale, setLocale, t } = useI18n();

  return (
    <label className={`relative inline-flex items-center ${className}`}>
      <span className="sr-only">{t('Izberi jezik')}</span>
      <select
        value={locale}
        onChange={(event) => setLocale(event.target.value)}
        aria-label={t('Jezik')}
        className={`field !w-auto cursor-pointer appearance-none !py-0 pr-7 font-semibold ${
          compact ? '!pl-2.5 !text-[11px] !h-8' : '!pl-3 !text-small !h-9'
        }`}
      >
        {LOCALES.map((item) => (
          <option key={item.id} value={item.id}>
            {item.label}
          </option>
        ))}
      </select>
      <svg
        className="pointer-events-none absolute right-2 h-3.5 w-3.5 text-rp-muted"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        aria-hidden="true"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 9l6 6 6-6" />
      </svg>
    </label>
  );
}
