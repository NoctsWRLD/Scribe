import { SparkIcon } from './icons';
import { useI18n } from '../i18n';
import LanguageSelect from './LanguageSelect';

/** Shown when Firebase environment variables are missing. */
export default function FirebaseSetupNotice() {
  const { t } = useI18n();
  return (
    <main className="relative grid min-h-dvh place-items-center overflow-hidden px-4 py-10">
      <div className="absolute right-4 top-4">
        <LanguageSelect compact />
      </div>
      <section className="relative w-full max-w-xl" aria-labelledby="setup-title">
        <div className="text-rp-accent" aria-hidden="true"><SparkIcon className="h-6 w-6" /></div>
        <p className="mt-5 text-label text-rp-accent">{t('Nastavitev')}</p>
        <h1 id="setup-title" className="mt-2 text-page text-rp-text">{t('Firebase ni nastavljen')}</h1>
        <p className="mt-3 text-body leading-6 text-rp-subtle">
          {t('Prijava in shranjevanje podatkov sta onemogočena, ker manjkajo Firebase spremenljivke okolja.')}
        </p>
        <p className="mt-6 text-body leading-6 text-rp-subtle">
          {t('VITE_FIREBASE spremenljivke okolja dodaj v .env.local za lokalni razvoj ali v nastavitve okolja gostovanja:')}{' '}
          <code className="rounded bg-rp-overlay px-1.5 py-0.5 text-rp-text">VITE_FIREBASE_API_KEY</code>,{' '}
          <code className="rounded bg-rp-overlay px-1.5 py-0.5 text-rp-text">VITE_FIREBASE_AUTH_DOMAIN</code>,{' '}
          <code className="rounded bg-rp-overlay px-1.5 py-0.5 text-rp-text">VITE_FIREBASE_PROJECT_ID</code>,{' '}
          {t('in')} <code className="rounded bg-rp-overlay px-1.5 py-0.5 text-rp-text">VITE_FIREBASE_APP_ID</code>.
        </p>
        <p className="note mt-6 text-small" data-tone="warn">
          {t('Firebase vrednosti VITE_FIREBASE_* so javna konfiguracija spletne aplikacije. Sem nikoli ne dodajaj zasebnega Admin SDK ključa.')}
        </p>
      </section>
    </main>
  );
}
