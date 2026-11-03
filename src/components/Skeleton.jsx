import { useI18n } from '../i18n';

/** Placeholder rows, shaped like the ledger rows they stand in for. */
export default function Skeleton({ lines = 3, className = '' }) {
  const { t } = useI18n();
  return (
    <div className={`space-y-2 ${className}`} role="status" aria-label={t('Nalagam')}>
      {Array.from({ length: lines }, (_, i) => (
        <div key={i} className="skel h-12 w-full" style={{ opacity: 1 - i * 0.18 }} aria-hidden="true" />
      ))}
    </div>
  );
}
