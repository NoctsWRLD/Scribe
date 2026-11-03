import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import SiteHeader from '../components/SiteHeader';
import SiteFooter from '../components/SiteFooter';
import LanguageSelect from '../components/LanguageSelect';
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
          className="flex min-h-14 w-full items-center justify-between gap-4 py-3 text-left text-subtitle text-rp-text transition-colors hover:text-rp-accent"
        >
          {t(question)}
          <svg
            className={`h-4 w-4 shrink-0 text-rp-muted transition-transform ${open ? 'rotate-180' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 9l6 6 6-6" />
          </svg>
        </button>
      </h3>
      {open && <p className="max-w-2xl pb-4 text-body text-rp-muted">{t(answer)}</p>}
    </li>
  );
}

export default function LandingPage() {
  const { t, localeTag } = useI18n();
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
      <SiteHeader />

      <main>
        {/* The hero is the rail: the product's one device, at full width. */}
        <section className="mx-auto max-w-6xl px-4 pb-16 pt-12 md:px-6 md:pb-24 md:pt-20">
          <h1 className="max-w-3xl text-display text-rp-text">
            {t('Vsaka naloga in vsak test, preden te presenetita.')}
          </h1>
          <p className="mt-5 max-w-xl text-subtitle font-normal text-rp-subtle">
            {t('Scribe je šolski dnevnik za učence in študente. Brezplačen, brez oglasov, za vsako šolo.')}
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link to="/register" className="btn btn-primary btn-lg">{t('Ustvari račun')}</Link>
            <Link to="/login" className="btn btn-lg">{t('Prijava')}</Link>
          </div>

          <figure className="mt-16 md:mt-20">
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
            <h2 className="text-page text-rp-text">{t('Kaj je v njem')}</h2>
            <ul className="grid gap-x-10 sm:grid-cols-2">
              {FEATURES.map((feature) => {
                const Icon = feature.icon;
                return (
                  <li key={feature.title} className="border-t border-rp-line py-5">
                    <h3 className="flex items-center gap-2.5 text-subtitle text-rp-text">
                      <Icon className="h-4 w-4 shrink-0 text-rp-accent" />
                      {t(feature.title)}
                    </h3>
                    <p className="mt-1.5 text-body text-rp-muted">{t(feature.copy)}</p>
                  </li>
                );
              })}
            </ul>
          </div>
        </section>

        <section id="kako-deluje" className="border-t border-rp-line py-16 md:py-24">
          <div className="mx-auto grid max-w-6xl gap-10 px-4 md:px-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
            <h2 className="text-page text-rp-text">{t('Kako začneš')}</h2>
            <ol className="grid gap-x-10 sm:grid-cols-3">
              {STEPS.map(([title, copy], index) => (
                <li key={title} className="border-t-2 border-rp-mark pt-4">
                  <p className="tnum text-small font-semibold text-rp-accent">{index + 1}</p>
                  <h3 className="mt-1 text-subtitle text-rp-text">{t(title)}</h3>
                  <p className="mt-1.5 text-body text-rp-muted">{t(copy)}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section id="jeziki" className="border-t border-rp-line py-16 md:py-24">
          <div className="mx-auto grid max-w-6xl gap-10 px-4 md:px-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
            <h2 className="text-page text-rp-text">{t('Pet jezikov')}</h2>
            <div>
              <ul className="flex flex-wrap gap-x-6 gap-y-2 text-title text-rp-text" lang="">
                {LOCALES.map((locale) => (
                  <li key={locale.id} lang={locale.htmlLang}>{locale.label}</li>
                ))}
              </ul>
              <p className="mt-4 max-w-lg text-body text-rp-muted">
                {t('Vsak sošolec lahko uporablja svoj jezik. Klepet in naloge delujejo enako.')}
              </p>
              <div className="mt-5">
                <LanguageSelect />
              </div>
            </div>
          </div>
        </section>

        <section id="vprasanja" className="border-t border-rp-line py-16 md:py-24">
          <div className="mx-auto grid max-w-6xl gap-10 px-4 md:px-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
            <h2 className="text-page text-rp-text">{t('Vprašanja')}</h2>
            <ul className="border-t border-rp-line">
              {FAQ.map(([question, answer]) => (
                <FaqItem key={question} question={question} answer={answer} />
              ))}
            </ul>
          </div>
        </section>

        <section className="border-t border-rp-line py-16 md:py-20">
          <div className="mx-auto flex max-w-6xl flex-wrap items-end justify-between gap-6 px-4 md:px-6">
            <h2 className="max-w-xl text-page text-rp-text">{t('Zapiši prvi rok še danes.')}</h2>
            <Link to="/register" className="btn btn-primary btn-lg">{t('Ustvari račun')}</Link>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
