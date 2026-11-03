import { useI18n } from '../i18n';
import SiteHeader from './SiteHeader';
import SiteFooter from './SiteFooter';

/** The frame every public page sits in. */
export default function SiteShell({ children }) {
  const { t } = useI18n();

  return (
    <div className="relative min-h-dvh bg-rp-canvas">
      <a
        href="#main-content"
        className="sr-only z-[100] bg-rp-accent px-4 py-2 font-semibold text-rp-accent-ink focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
      >
        {t('Preskoči na vsebino')}
      </a>
      <SiteHeader />
      <main id="main-content" className="relative mx-auto max-w-6xl px-4 py-12 md:px-6 md:py-16">
        {children}
      </main>
      <SiteFooter />
    </div>
  );
}
