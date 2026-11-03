import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import SiteHeader from '../components/SiteHeader';
import SiteFooter from '../components/SiteFooter';
import { SITE_DESCRIPTION, SITE_NAME, absoluteUrl } from '../config';
import { addDaysToDateKey, formatDate, getSlovenianDateKey } from '../utils/dates';
import { getWeekStart } from '../utils/rail';
import { LOCALES } from '../i18n/locales';
import { BookIcon, CalendarIcon, CardIcon, ClockIcon, ExamIcon, TaskIcon, UsersIcon } from '../components/icons';
import { useI18n } from '../i18n';
import { useSeo, useJsonLd } from '../hooks/useSeo';

const FEATURES = [
  { icon: TaskIcon, title: 'Naloge z roki', copy: 'Vsaka naloga ima predmet in rok. Označiš jih več hkrati in potrdiš z enim gumbom.' },
  { icon: ExamIcon, title: 'Odštevanje do testa', copy: 'Vpišeš datum testa in vidiš, koliko dni ti ostane za učenje.' },
  { icon: CalendarIcon, title: 'Teden na enem zaslonu', copy: 'Naloge po dnevih. Urnik lahko prebereš kar s fotografije.' },
  { icon: CardIcon, title: 'Kartice za ponavljanje', copy: 'Vprašanje, odgovor na glas, preverba. Kar znaš, se umakne.' },
  { icon: ClockIcon, title: 'Časovnik za fokus', copy: '25 minut za eno stvar. Vsaka končana seja se zapiše.' },
  { icon: UsersIcon, title: 'Sošolci in klepet', copy: 'Dodaš jih s kodo in si pišete o predmetu ali zasebno.' },
];

const STEPS = [
  ['Ustvari račun', 'Potrebuješ samo e-pošto in geslo.'],
  ['Dodaj predmete', 'Tiste, ki jih imaš letos. Vsak dobi svojo barvo.'],
  ['Zapiši, kaj te čaka', 'Naloge, teste in kartice. Začetna stran pokaže, kaj je na vrsti danes.'],
];

const FAQ = [
  ['Ali je Scribe brezplačen?', 'Da. Brez oglasov, brez plačljivih funkcij.'],
  ['Ali deluje za mojo šolo?', 'Da. Predmete in urnik vpišeš sam, zato Scribe deluje za osnovno, srednjo šolo ali fakulteto v kateri koli državi.'],
  ['V katerih jezikih je?', 'V slovenščini, angleščini, nemščini, italijanščini in hrvaščini. Jezik zamenjaš kadar koli.'],
  ['Ali deluje na telefonu?', 'Da. Odpreš ga v brskalniku na telefonu, tablici ali računalniku in podatki so povsod isti.'],
  ['Kaj se zgodi z mojimi podatki?', 'Ostanejo v tvojem računu. Scribe jih ne prodaja in ne deli z oglaševalci. Kadar koli jih izvoziš ali izbrišeš.'],
];

/* An illustrative week: how much of each day is already claimed. */
const SAMPLE_WEEK = [
  ['accent', 0.9], ['accent', 0.55], ['warn', 1], ['accent', 0.35], ['accent', 0.7], ['empty', 0], ['empty', 0],
];

function FaqItem({ question, answer }) {
  const [open, setOpen] = useState(false);
  const { t } = useI18n();
  return (
    <li className="border-b border-rp-line">
      <h3>
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          className="flex min-h-16 w-full items-center justify-between gap-6 py-4 text-left text-subtitle text-rp-text transition-colors hover:text-rp-accent"
        >
          {t(question)}
          <svg
            className={`h-4 w-4 shrink-0 text-rp-muted transition-transform ${open ? 'rotate-180' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M5 12h14M12 5v14" />
          </svg>
        </button>
      </h3>
      {open && <p className="max-w-2xl pb-5 text-body text-rp-muted">{t(answer)}</p>}
    </li>
  );
}

export default function LandingPage() {
  const { t, locale, localeTag, setLocale } = useI18n();
  const weekStart = getWeekStart(getSlovenianDateKey());

  useSeo({
    title: 'Scribe',
    description: t('Naloge, testi, urnik in kartice za učence in študente. Brezplačno, brez oglasov, v petih jezikih.'),
    path: '/',
  });

  const structuredData = useMemo(
    () => ({
      '@context': 'https://schema.org',
      '@graph': [
        { '@type': 'WebSite', name: SITE_NAME, url: absoluteUrl('/'), inLanguage: localeTag },
        {
          '@type': 'SoftwareApplication',
          name: SITE_NAME,
          applicationCategory: 'EducationalApplication',
          operatingSystem: 'Web',
          description: SITE_DESCRIPTION,
          url: absoluteUrl('/'),
          inLanguage: LOCALES.map((locale) => locale.htmlLang),
          offers: { '@type': 'Offer', price: '0' },
        },
      ],
    }),
    [localeTag],
  );
  useJsonLd(structuredData);

  return (
    <div className="min-h-dvh bg-rp-canvas">
      <a
        href="#main-content"
        className="sr-only z-[100] bg-rp-accent px-4 py-2 font-semibold text-rp-accent-ink focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
      >
        {t('Preskoči na vsebino')}
      </a>
      <SiteHeader />

      <main id="main-content">
        {/* The hero is the headline and the rail: the product's one device. */}
        <section className="mx-auto max-w-6xl px-4 pb-14 pt-12 md:px-6 md:pb-20 md:pt-20">
          <p className="eyebrow">Scribe · {new Date().getFullYear()}</p>
          <h1 className="mt-6 max-w-4xl text-display text-rp-text">
            {t('Vsaka naloga in vsak test, preden te presenetita.')}
          </h1>
          <p className="deck mt-7">
            {t('Scribe je šolski dnevnik za učence in študente. Brezplačen, brez oglasov, za vsako šolo.')}
          </p>
          <div className="mt-9 flex flex-wrap items-center gap-x-6 gap-y-3">
            <Link to="/register" className="btn btn-primary btn-lg">{t('Ustvari račun')}</Link>
            <Link to="/login" className="link-signal">{t('Prijava')}</Link>
          </div>

          <figure className="mt-12 md:mt-16">
            <ul className="rail !h-4 md:!h-5" aria-hidden="true">
              {SAMPLE_WEEK.map(([tone, value], index) => (
                <li key={index} className="rail-seg" data-tone={tone}>
                  <span style={{ width: `${value * 100}%` }} />
                </li>
              ))}
            </ul>
            <ul className="mt-2 flex gap-[3px]" aria-hidden="true">
              {SAMPLE_WEEK.map((_, index) => (
                <li key={index} className="flex-1 text-small text-rp-muted">
                  <span className="sm:hidden">{formatDate(addDaysToDateKey(weekStart, index), { weekday: 'narrow' }, localeTag)}</span>
                  <span className="hidden sm:inline">{formatDate(addDaysToDateKey(weekStart, index), { weekday: 'long' }, localeTag)}</span>
                </li>
              ))}
            </ul>
            <figcaption className="mt-4 max-w-md text-small text-rp-muted">
              {t('Tvoj teden kot pas: bolj kot je dan poln nalog in testov, bolj je pas zapolnjen. Sreda je tukaj dan testa.')}
            </figcaption>
          </figure>
        </section>

        <section id="moznosti" className="border-t border-rp-line py-16 md:py-24">
          <div className="mx-auto grid max-w-6xl gap-10 px-4 md:px-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
            <div>
              <p className="eyebrow">01</p>
              <h2 className="mt-3 text-page text-rp-text">{t('Kaj je v njem')}</h2>
            </div>
            <ul className="grid gap-x-10 sm:grid-cols-2">
              {FEATURES.map((feature) => {
                const Icon = feature.icon;
                return (
                  <li key={feature.title} className="border-t border-rp-line py-5">
                    <h3 className="flex items-center gap-2.5 text-subtitle text-rp-text">
                      <Icon className="h-4 w-4 shrink-0 text-rp-accent" />
                      {t(feature.title)}
                    </h3>
                    <p className="mt-2 text-body text-rp-muted">{t(feature.copy)}</p>
                  </li>
                );
              })}
            </ul>
          </div>
        </section>

        <section id="kako-deluje" className="border-t border-rp-line py-16 md:py-24">
          <div className="mx-auto grid max-w-6xl gap-10 px-4 md:px-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
            <div>
              <p className="eyebrow">02</p>
              <h2 className="mt-3 text-page text-rp-text">{t('Kako začneš')}</h2>
            </div>
            <ol className="grid gap-x-10 gap-y-8 sm:grid-cols-3">
              {STEPS.map(([title, copy], index) => (
                <li key={title} className="border-t-2 border-rp-mark pt-4">
                  <p className="mono text-small text-rp-accent">{String(index + 1).padStart(2, '0')}</p>
                  <h3 className="mt-2 font-display text-xl font-semibold text-rp-text">{t(title)}</h3>
                  <p className="mt-2 text-body text-rp-muted">{t(copy)}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section id="jeziki" className="border-t border-rp-line py-16 md:py-24">
          <div className="mx-auto grid max-w-6xl gap-10 px-4 md:px-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
            <div>
              <p className="eyebrow">03</p>
              <h2 className="mt-3 text-page text-rp-text">{t('Pet jezikov')}</h2>
            </div>
            <div>
              <ul className="flex flex-wrap gap-x-8 gap-y-2 font-display text-2xl text-rp-text" lang="">
                {LOCALES.map((item) => (
                  <li key={item.id} lang={item.htmlLang}>
                    <button
                      type="button"
                      onClick={() => setLocale(item.id)}
                      aria-pressed={locale === item.id}
                      className="transition-colors hover:text-rp-accent focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-rp-accent"
                    >
                      {item.label}
                    </button>
                  </li>
                ))}
              </ul>
              <p className="mt-5 max-w-lg text-body text-rp-muted">
                {t('Vsak sošolec lahko uporablja svoj jezik. Klepet in naloge delujejo enako.')}
              </p>
            </div>
          </div>
        </section>

        <section id="vprasanja" className="border-t border-rp-line py-16 md:py-24">
          <div className="mx-auto grid max-w-6xl gap-10 px-4 md:px-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
            <div>
              <p className="eyebrow">04</p>
              <h2 className="mt-3 text-page text-rp-text">{t('Vprašanja')}</h2>
            </div>
            <ul className="border-t border-rp-line">
              {FAQ.map(([question, answer]) => (
                <FaqItem key={question} question={question} answer={answer} />
              ))}
            </ul>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
