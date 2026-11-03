import { LOCALES } from '../i18n/locales';
import { useI18n } from '../i18n';
import Select from './Select';

export default function LanguageSelect({ compact = false, className = '' }) {
  const { locale, setLocale, t } = useI18n();

  return (
    <label className={`relative inline-flex items-center ${className}`}>
      <span className="sr-only">{t('Izberi jezik')}</span>
      <Select
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
      </Select>
    </label>
  );
}
