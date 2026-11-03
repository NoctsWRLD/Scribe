import { useEffect, useRef, useState } from 'react';
import { useFocusSessions } from '../hooks/useStudy';
import { getSlovenianDateKey } from '../utils/dates';
import { useI18n } from '../i18n';

const FOCUS_MINUTES = 25;
const BREAK_MINUTES = 5;

function formatTime(seconds) {
  return `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
}

export default function FocusTimer() {
  const { t } = useI18n();
  const [isBreak, setIsBreak] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(FOCUS_MINUTES * 60);
  const [running, setRunning] = useState(false);
  const [finished, setFinished] = useState(false);
  const { logSession } = useFocusSessions();
  const loggedRef = useRef(false);

  useEffect(() => {
    if (finished && !isBreak && !loggedRef.current) {
      loggedRef.current = true;
      logSession({ minutes: FOCUS_MINUTES, mode: 'focus', day: getSlovenianDateKey() });
    }
  }, [finished, isBreak, logSession]);

  useEffect(() => {
    if (!running) return undefined;
    const timeout = window.setTimeout(() => {
      if (secondsLeft <= 1) { setSecondsLeft(0); setRunning(false); setFinished(true); }
      else setSecondsLeft(secondsLeft - 1);
    }, 1000);
    return () => window.clearTimeout(timeout);
  }, [running, secondsLeft]);

  const total = (isBreak ? BREAK_MINUTES : FOCUS_MINUTES) * 60;
  const progress = (total - secondsLeft) / total;
  const circumference = 2 * Math.PI * 42;

  const message = finished
    ? isBreak ? t('Odmor je končan.') : t('Seja je zapisana. Vzemi si odmor.')
    : running ? t('Ena stvar naenkrat.') : t('25 minut za eno stvar, nato 5 minut odmora.');

  function switchMode() {
    setRunning(false);
    setFinished(false);
    const next = !isBreak;
    setIsBreak(next);
    setSecondsLeft((next ? BREAK_MINUTES : FOCUS_MINUTES) * 60);
    loggedRef.current = false;
  }

  return (
    <section className="border-t border-rp-line pt-4" aria-label={t('Časovnik za učenje')}>
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-small font-semibold text-rp-muted">{isBreak ? t('Odmor') : t('Fokus')}</h2>
        <button type="button" onClick={switchMode} className="link-signal">
          {isBreak ? t('Na fokus') : t('Na odmor')}
        </button>
      </div>

      <div className="mt-4 flex items-center gap-4">
        <div className="relative grid h-24 w-24 shrink-0 place-items-center" role="timer" aria-label={t('Preostalo {time}', { time: formatTime(secondsLeft) })}>
          <svg className="absolute inset-0 -rotate-90" viewBox="0 0 100 100" aria-hidden="true">
            <circle cx="50" cy="50" r="42" fill="none" stroke="var(--rp-fill)" strokeWidth="7" />
            <circle
              cx="50"
              cy="50"
              r="42"
              fill="none"
              stroke="var(--rp-accent)"
              strokeWidth="7"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={circumference * (1 - progress)}
              className="transition-[stroke-dashoffset] duration-700"
            />
          </svg>
          <span className="mono text-xl font-bold text-rp-text">{formatTime(secondsLeft)}</span>
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-small leading-5 text-rp-muted" aria-live="polite">{message}</p>
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={() => {
                setFinished(false);
                if (secondsLeft === 0) setSecondsLeft(total);
                loggedRef.current = false;
                setRunning((value) => (secondsLeft === 0 ? true : !value));
              }}
              className="btn btn-primary"
            >
              {running ? t('Pavza') : t('Začni')}
            </button>
            <button
              type="button"
              onClick={() => { setRunning(false); setFinished(false); setSecondsLeft(total); loggedRef.current = false; }}
              className="btn"
              aria-label={t('Ponastavi časovnik')}
            >
              {t('Ponastavi')}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
