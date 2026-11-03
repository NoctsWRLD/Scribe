import { Link } from 'react-router-dom';
import { useExams } from '../hooks/useStudy';
import { daysBetweenDateKeys, formatDate, getSlovenianDateKey } from '../utils/dates';
import { useI18n } from '../i18n';

const WINDOW = 7;

/** The next test, as a number of days and a rail that fills towards it. */
export default function ExamCountdown({ subjects }) {
  const { t, tn, noun, localeTag } = useI18n();
  const { exams, loading } = useExams();
  const today = getSlovenianDateKey();
  const next = exams
    .filter((exam) => exam.date >= today)
    .sort((a, b) => a.date.localeCompare(b.date))[0];

  const dayForms = { one: t('dan'), two: t('dneva'), few: t('dnevi'), other: t('dni') };

  if (loading) {
    return (
      <section className="border-t border-rp-line pt-4" aria-label={t('Naslednje preverjanje')} aria-busy="true">
        <div className="skel h-10 w-24" />
        <div className="skel mt-4 h-2 w-full" />
      </section>
    );
  }

  if (!next) {
    return (
      <section className="border-t border-rp-line pt-4" aria-label={t('Naslednje preverjanje')}>
        <h2 className="text-subtitle text-rp-text">{t('Ni napovedanih preverjanj')}</h2>
        <p className="mt-1 text-small text-rp-muted">
          {t('Ko izveš datum testa, ga zapiši. Tukaj se bo začelo odštevanje.')}
        </p>
        <Link to="/exams" className="link-signal -ml-1.5 mt-2 inline-block">{t('Dodaj preverjanje')}</Link>
      </section>
    );
  }

  const diff = daysBetweenDateKeys(next.date, today);
  const subjectName = subjects.find((subject) => subject.id === next.subjectId)?.name || '';
  const filled = Math.min(diff, WINDOW);

  return (
    <section className="border-t border-rp-line pt-4" aria-label={t('Naslednje preverjanje')}>
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-small font-semibold text-rp-muted">{t('Naslednje preverjanje')}</h2>
        <Link to="/exams" className="link-signal">{t('Vsa preverjanja')}</Link>
      </div>
      <p className="tnum mt-2 text-4xl font-bold leading-none text-rp-text">
        {diff === 0 ? t('danes') : diff}
        {diff > 0 && <span className="ml-1.5 text-base font-medium text-rp-muted">{noun(diff, dayForms)}</span>}
      </p>

      <ul className="rail mt-4" aria-label={t('Še {count} do preverjanja', { count: tn(diff, dayForms) })}>
        {Array.from({ length: WINDOW }, (_, index) => (
          <li key={index} className="rail-seg" data-tone={diff === 0 ? 'warn' : 'accent'}>
            <span aria-hidden="true" style={{ width: index < filled ? '100%' : '0%' }} />
          </li>
        ))}
      </ul>

      <h3 className="mt-4 truncate text-body font-semibold text-rp-text">{next.title}</h3>
      <p className="mt-0.5 text-small text-rp-muted">
        {[subjectName, formatDate(next.date, { weekday: 'long', day: 'numeric', month: 'long' }, localeTag)]
          .filter(Boolean)
          .join(', ')}
      </p>
    </section>
  );
}
