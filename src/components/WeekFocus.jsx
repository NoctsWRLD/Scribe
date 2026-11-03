import { useMemo } from 'react';
import { useFocusSessions } from '../hooks/useStudy';
import { addDaysToDateKey, formatDate, getSlovenianDateKey } from '../utils/dates';
import { useI18n } from '../i18n';

/** Seven days of focus minutes, one rail segment per day. */
export default function WeekFocus() {
  const { t, tn, localeTag } = useI18n();
  const { sessions } = useFocusSessions();
  const today = getSlovenianDateKey();

  const days = useMemo(() => {
    return Array.from({ length: 7 }, (_, index) => {
      const key = addDaysToDateKey(today, index - 6);
      const minutes = sessions
        .filter((session) => session.day === key && session.mode === 'focus')
        .reduce((sum, session) => sum + (session.minutes || 0), 0);
      return { key, minutes, isToday: key === today };
    });
  }, [sessions, today]);

  const total = days.reduce((sum, day) => sum + day.minutes, 0);
  const max = Math.max(25, ...days.map((day) => day.minutes));
  const streak = useMemo(() => {
    let count = 0;
    for (let index = days.length - 1; index >= 0; index -= 1) {
      if (days[index].minutes > 0) count += 1;
      else if (days[index].isToday) continue;
      else break;
    }
    return count;
  }, [days]);

  const minuteForms = { one: t('minuta'), two: t('minuti'), few: t('minute'), other: t('minut') };
  const dayForms = { one: t('dan'), two: t('dneva'), few: t('dnevi'), other: t('dni') };

  return (
    <section className="border-t border-rp-line pt-4" aria-label={t('Fokus ta teden')}>
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-small font-semibold text-rp-muted">{t('Fokus ta teden')}</h2>
        <p className="mono text-small font-semibold text-rp-text">{tn(total, minuteForms)}</p>
      </div>

      <ul className="rail mt-3">
        {days.map((day) => (
          <li
            key={day.key}
            className="rail-seg"
            data-tone={day.minutes === 0 ? 'empty' : day.isToday ? 'warn' : 'accent'}
          >
            <span aria-hidden="true" style={{ width: `${Math.round((day.minutes / max) * 100)}%` }} />
            <span className="sr-only">
              {formatDate(day.key, { weekday: 'long' }, localeTag)}: {tn(day.minutes, minuteForms)}
            </span>
          </li>
        ))}
      </ul>
      <ul className="mt-1.5 flex gap-[3px]" aria-hidden="true">
        {days.map((day) => (
          <li
            key={day.key}
            className={`flex-1 text-center text-[11px] leading-4 ${day.isToday ? 'font-semibold text-rp-accent' : 'text-rp-muted'}`}
          >
            {formatDate(day.key, { weekday: 'narrow' }, localeTag)}
          </li>
        ))}
      </ul>

      <p className="mt-3 text-small text-rp-muted">
        {streak >= 2
          ? t('Fokus {count} zapored.', { count: tn(streak, dayForms) })
          : total === 0
            ? t('Zaženi časovnik. Vsaka končana seja se zapiše tukaj.')
            : t('Vsaka končana seja podaljša niz.')}
      </p>
    </section>
  );
}
