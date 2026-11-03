import { useI18n } from '../i18n';

/**
 * A failed read must not look like an empty account. The message says what
 * happened and what to do next; the button is the next step. Like the empty
 * state it has no box — the red rule in the margin is the signal.
 */
export default function ErrorState({ message, onRetry, compact = false }) {
  const { t } = useI18n();
  return (
    <div role="alert" className={`note ${compact ? 'my-3' : 'my-6'}`} data-tone="danger">
      <h2 className="text-subtitle font-semibold text-rp-text">{t('Podatkov ni bilo mogoče naložiti')}</h2>
      <p className="mt-1 max-w-md text-body text-rp-muted">
        {message ? t(message) : t('Preveri povezavo in poskusi znova.')}
      </p>
      {onRetry && (
        <button type="button" onClick={onRetry} className="btn mt-4">
          {t('Poskusi znova')}
        </button>
      )}
    </div>
  );
}
