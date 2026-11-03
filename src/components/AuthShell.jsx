import { Link } from 'react-router-dom';
import Logo from './Logo';
import LanguageSelect from './LanguageSelect';
import { useI18n } from '../i18n';
import { addDaysToDateKey, formatDate, getSlovenianDateKey } from '../utils/dates';
import { getWeekStart } from '../utils/rail';

/* An illustrative week: how much of each day is claimed. */
const SAMPLE_WEEK = [
  ['accent', 90], ['accent', 55], ['empty', 0], ['warn', 100], ['accent', 40], ['empty', 0], ['muted', 25],
];

/**
 * The sign-in and registration screen.
 *
 * On a wide screen the left half says what Scribe is and shows the study
 * rail — the one device the whole product is built on. On a phone that half
 * is gone and the form is the screen: wordmark, title, fields, button.
 */
export function AuthShell({ title, subtitle, error, notice, children, footer }) {
  const { t, localeTag } = useI18n();
  const weekStart = getWeekStart(getSlovenianDateKey());

  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      <aside className="hidden flex-col justify-between border-r border-rp-line p-10 lg:flex xl:p-14">
        <Link to="/" className="flex items-center gap-3 self-start" aria-label={t('Scribe domov')}>
          <Logo size={36} />
          <span className="font-display text-lg font-bold tracking-tight text-rp-text">Scribe</span>
        </Link>

        <div className="max-w-md">
          <p className="font-display text-4xl font-bold leading-[1.08] tracking-tight text-rp-text xl:text-5xl">
            {t('Vsak rok na enem mestu, preden te preseneti.')}
          </p>
          <div className="mt-10" aria-hidden="true">
            <ul className="rail !h-3">
              {SAMPLE_WEEK.map(([tone, fill], index) => (
                <li key={index} className="rail-seg" data-tone={tone}>
                  <span style={{ width: `${fill}%` }} />
                </li>
              ))}
            </ul>
            <ul className="mt-2 flex gap-[3px]">
              {SAMPLE_WEEK.map((_, index) => (
                <li key={index} className="flex-1 text-[11px] text-rp-muted">
                  {formatDate(addDaysToDateKey(weekStart, index), { weekday: 'short' }, localeTag)}
                </li>
              ))}
            </ul>
          </div>
          <p className="mt-4 max-w-sm text-small text-rp-muted">
            {t('Pas pokaže, koliko vsakega dneva je že zasedenega z nalogami in testi.')}
          </p>
        </div>

        <p className="text-small text-rp-muted">{t('Brez oglasov. Brez sledenja.')}</p>
      </aside>

      <main className="flex flex-col px-5 pb-10 pt-4 sm:px-8">
        <div className="flex items-center justify-between gap-3">
          <Link to="/" className="flex items-center gap-2.5 lg:invisible" aria-label={t('Scribe domov')}>
            <Logo size={30} />
            <span className="font-display text-[17px] font-bold tracking-tight text-rp-text">Scribe</span>
          </Link>
          <LanguageSelect compact />
        </div>

        <div className="rise mx-auto my-auto w-full max-w-sm py-10">
          <h1 className="text-page text-rp-text">{title}</h1>
          {subtitle && <p className="mt-2 text-body text-rp-muted">{subtitle}</p>}

          {error && (
            <p className="note mt-6 text-body" data-tone="danger" role="alert">{error}</p>
          )}
          {notice && (
            <p className="note mt-6 text-body" role="status">{notice}</p>
          )}

          <div className="mt-6">{children}</div>
          {footer && <p className="mt-8 border-t border-rp-line pt-5 text-body text-rp-muted">{footer}</p>}
        </div>
      </main>
    </div>
  );
}

export function AuthField({ label, id, hint, ...props }) {
  return (
    <div>
      <label className="field-label" htmlFor={id}>{label}</label>
      <input id={id} {...props} className="field" aria-describedby={hint ? `${id}-hint` : undefined} />
      {hint && <p id={`${id}-hint`} className="mt-1.5 text-small text-rp-muted">{hint}</p>}
    </div>
  );
}

export function AuthSubmit({ loading, idle, busy }) {
  return (
    <button type="submit" disabled={loading} aria-busy={loading} className="btn btn-primary btn-lg w-full">
      {loading ? busy : idle}
    </button>
  );
}

export default AuthShell;
