import { useEffect, useRef, useState } from 'react';
import Modal from './Modal';
import { addDaysToDateKey, formatDate } from '../utils/dates';
import { listWeekMondays, mondayOfThisWeek, parseTimetableText, semesterRange } from '../utils/timetable';
import { useI18n } from '../i18n';
import { XIcon } from './icons';

const PERIODS = [
  { id: 'week', label: 'Ta teden' },
  { id: 'sem1', label: '1. semester' },
  { id: 'sem2', label: '2. semester' },
  { id: 'custom', label: 'Po meri' },
];

/* The OCR model for each interface language. */
const OCR_LANGUAGE = { sl: 'slv', en: 'eng', de: 'deu', it: 'ita', hr: 'hrv' };

/** Read a photo of a timetable, review the rows, then create the tasks. */
export default function ScheduleImportModal({ isOpen, onClose, subjects, onImport }) {
  const { t, tn, locale, localeTag } = useI18n();
  const [imageUrl, setImageUrl] = useState('');
  const [ocrText, setOcrText] = useState('');
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrError, setOcrError] = useState('');
  const [drafts, setDrafts] = useState([]);
  const [saving, setSaving] = useState(false);
  const [period, setPeriod] = useState('week');
  const [customStart, setCustomStart] = useState(() => mondayOfThisWeek());
  const [customEnd, setCustomEnd] = useState(() => addDaysToDateKey(mondayOfThisWeek(), 21));
  const [weekChecks, setWeekChecks] = useState({});
  const fileRef = useRef(null);
  const monday = mondayOfThisWeek();

  // Release the preview when the dialog goes away.
  useEffect(() => () => { if (imageUrl) URL.revokeObjectURL(imageUrl); }, [imageUrl]);

  const taskForms = { one: t('nalogo'), two: t('nalogi'), few: t('naloge'), other: t('nalog') };
  const weekForms = { one: t('teden'), two: t('tedna'), few: t('tedni'), other: t('tednov') };
  const dayName = (index) => formatDate(addDaysToDateKey(monday, index), { weekday: 'long' }, localeTag);
  const weekRange = (start) =>
    `${formatDate(start, { day: 'numeric', month: 'short' }, localeTag)} – ${formatDate(addDaysToDateKey(start, 6), { day: 'numeric', month: 'short' }, localeTag)}`;

  const weeks = (() => {
    if (period === 'week') return [monday];
    if (period === 'sem1' || period === 'sem2') {
      const range = semesterRange(period === 'sem1' ? 1 : 2);
      return range.past ? [] : listWeekMondays(range.startMonday, range.endMonday);
    }
    if (!customStart || !customEnd || customStart > customEnd) return [];
    const startMonday = mondayOfThisWeek(customStart);
    const endMonday = mondayOfThisWeek(customEnd);
    return startMonday > endMonday ? [] : listWeekMondays(startMonday, endMonday);
  })();

  const selectedWeeks = weeks.filter((week) => weekChecks[week] !== false);
  const allChecked = weeks.length > 0 && selectedWeeks.length === weeks.length;
  const valid = drafts.filter((draft) => draft.title.trim());
  const total = valid.length * selectedWeeks.length;

  function toggleAllWeeks() {
    if (allChecked) setWeekChecks(Object.fromEntries(weeks.map((week) => [week, false])));
    else setWeekChecks({});
  }

  function handleFile(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setOcrError(t('Izberi sliko (JPG ali PNG).'));
      return;
    }
    setImageUrl(URL.createObjectURL(file));
    setOcrError('');
  }

  const toDrafts = (text) =>
    parseTimetableText(text, subjects).map((draft, index) => ({ ...draft, key: `${Date.now()}-${index}` }));

  async function runOcr() {
    if (!imageUrl) return;
    setOcrLoading(true);
    setOcrError('');
    try {
      const { createWorker } = await import('tesseract.js');
      const worker = await createWorker(OCR_LANGUAGE[locale] || 'eng');
      const { data } = await worker.recognize(imageUrl);
      await worker.terminate();
      const text = (data?.text || '').trim();
      if (!text) {
        setOcrError(t('Na sliki ni berljivega besedila. Poskusi z ostrejšo sliko ali prilepi besedilo.'));
      } else {
        setOcrText(text);
        setDrafts(toDrafts(text));
      }
    } catch {
      setOcrError(t('Branje slike potrebuje internetno povezavo. Besedilo lahko prilepiš tudi ročno.'));
    }
    setOcrLoading(false);
  }

  function updateDraft(key, patch) {
    setDrafts((list) => list.map((draft) => (draft.key === key ? { ...draft, ...patch } : draft)));
  }

  async function handleSave() {
    if (total === 0) return;
    if (total > 200 && !window.confirm(t('Ustvarjenih bo {count}. Nadaljujem?', { count: tn(total, taskForms) }))) return;
    setSaving(true);
    try {
      const rows = [];
      for (const weekMonday of selectedWeeks) {
        for (const draft of valid) {
          rows.push({
            title: draft.title.trim().slice(0, 120),
            description: '',
            subjectId: draft.subjectId || '',
            dueDate: addDaysToDateKey(weekMonday, draft.weekday),
          });
        }
      }
      await onImport(rows);
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('Urnik iz slike')}
      description={t('Naloži fotografijo urnika. Prebrane vrstice pregledaš, preden se karkoli shrani.')}
      size="lg"
      footer={
        <>
          <p className="mr-auto self-center text-small text-rp-muted">
            {total > 0
              ? t('{tasks} v {weeks}', { tasks: tn(total, taskForms), weeks: tn(selectedWeeks.length, weekForms) })
              : t('Izberi vrstice in tedne.')}
          </p>
          <button type="button" onClick={onClose} className="btn">{t('Prekliči')}</button>
          <button type="button" onClick={handleSave} disabled={total === 0 || saving} className="btn btn-primary">
            {saving ? t('Shranjujem…') : t('Ustvari naloge')}
          </button>
        </>
      }
    >
      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <label className="field-label" htmlFor="import-file">{t('Fotografija urnika')}</label>
          <input id="import-file" ref={fileRef} type="file" accept="image/*" onChange={handleFile} className="field" />
          {imageUrl && <img src={imageUrl} alt={t('Predogled urnika')} className="mt-3 max-h-48 w-full object-contain" />}
          <button type="button" onClick={runOcr} disabled={!imageUrl || ocrLoading} className="btn mt-3 w-full">
            {ocrLoading ? t('Berem sliko…') : t('Preberi besedilo')}
          </button>
          {ocrError && <p className="mt-2 text-small text-rp-danger" role="alert">{ocrError}</p>}

          <label className="field-label mt-5" htmlFor="import-text">{t('Besedilo urnika')}</label>
          <textarea
            id="import-text"
            className="field min-h-28"
            value={ocrText}
            onChange={(event) => setOcrText(event.target.value)}
            placeholder={`${dayName(0)}\n8:00 …\n${dayName(1)}\n…`}
          />
          <button type="button" onClick={() => setDrafts(toDrafts(ocrText))} disabled={!ocrText.trim()} className="btn mt-2 w-full">
            {t('Razdeli v vrstice')}
          </button>
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between gap-2">
            <h3 className="text-body font-semibold text-rp-text">{t('Vrstice')}</h3>
            <button
              type="button"
              onClick={() => setDrafts((list) => [...list, { key: `${Date.now()}-${list.length}`, title: '', weekday: 0, subjectId: subjects[0]?.id || '' }])}
              className="btn btn-sm"
            >
              {t('Dodaj vrstico')}
            </button>
          </div>
          {drafts.length === 0 ? (
            <p className="border-t border-rp-line pt-3 text-small text-rp-muted">
              {t('Še ni vrstic. Preberi sliko, prilepi besedilo ali dodaj vrstico.')}
            </p>
          ) : (
            <ul className="ledger">
              {drafts.map((draft) => (
                <li key={draft.key} className="ledger-row grid gap-2 py-2.5">
                  <div className="flex items-center gap-1">
                    <input
                      value={draft.title}
                      onChange={(event) => updateDraft(draft.key, { title: event.target.value })}
                      placeholder={t('Naslov naloge')}
                      maxLength={120}
                      className="field !py-2 !text-small"
                      aria-label={t('Naslov naloge')}
                    />
                    <button
                      type="button"
                      onClick={() => setDrafts((list) => list.filter((item) => item.key !== draft.key))}
                      aria-label={t('Odstrani vrstico')}
                      className="btn btn-icon shrink-0 border-transparent bg-transparent text-rp-muted hover:!text-rp-danger"
                    >
                      <XIcon className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <select
                      value={draft.weekday}
                      onChange={(event) => updateDraft(draft.key, { weekday: Number(event.target.value) })}
                      className="field !py-2 !text-small"
                      aria-label={t('Dan')}
                    >
                      {Array.from({ length: 7 }, (_, index) => <option key={index} value={index}>{dayName(index)}</option>)}
                    </select>
                    <select
                      value={draft.subjectId}
                      onChange={(event) => updateDraft(draft.key, { subjectId: event.target.value })}
                      className="field !py-2 !text-small"
                      aria-label={t('Predmet')}
                    >
                      <option value="">{t('Brez predmeta')}</option>
                      {subjects.map((subject) => <option key={subject.id} value={subject.id}>{subject.name}</option>)}
                    </select>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <fieldset className="mt-6 border-t border-rp-line pt-4">
        <legend className="sr-only">{t('Za katere tedne?')}</legend>
        <p className="text-body font-semibold text-rp-text" aria-hidden="true">{t('Za katere tedne?')}</p>
        <div className="mt-2 flex flex-wrap gap-1 rounded-sm border border-rp-line p-1" role="radiogroup">
          {PERIODS.map((option) => (
            <button
              key={option.id}
              type="button"
              role="radio"
              aria-checked={period === option.id}
              onClick={() => setPeriod(option.id)}
              className={`min-h-9 flex-1 rounded-xs px-3 text-small font-semibold transition-colors ${
                period === option.id ? 'bg-rp-mark text-rp-mark-ink' : 'text-rp-muted hover:text-rp-text'
              }`}
            >
              {t(option.label)}
            </button>
          ))}
        </div>

        {period === 'custom' && (
          <div className="mt-3 grid grid-cols-2 gap-2">
            <label className="field-label">
              {t('Od')}
              <input type="date" value={customStart} onChange={(event) => setCustomStart(event.target.value)} className="field mt-1" />
            </label>
            <label className="field-label">
              {t('Do')}
              <input type="date" value={customEnd} onChange={(event) => setCustomEnd(event.target.value)} className="field mt-1" />
            </label>
          </div>
        )}

        {period !== 'week' && (
          <div className="mt-3">
            {weeks.length === 0 ? (
              <p className="text-small text-rp-muted">
                {period === 'custom' ? t('Izberi veljaven razpon datumov.') : t('To obdobje je že mimo. Izberi drugo.')}
              </p>
            ) : (
              <>
                <label className="flex min-h-10 cursor-pointer items-center gap-2.5 border-b border-rp-line text-small font-semibold text-rp-text">
                  <input type="checkbox" checked={allChecked} onChange={toggleAllWeeks} className="task-check" />
                  {t('Vsi tedni ({selected} od {total})', { selected: selectedWeeks.length, total: weeks.length })}
                </label>
                <ul className="max-h-36 overflow-y-auto">
                  {weeks.map((week) => (
                    <li key={week}>
                      <label className="flex min-h-10 cursor-pointer items-center gap-2.5 text-small text-rp-text">
                        <input
                          type="checkbox"
                          checked={weekChecks[week] !== false}
                          onChange={() => setWeekChecks((previous) => ({ ...previous, [week]: previous[week] === false }))}
                          className="task-check"
                        />
                        <span className="mono">{weekRange(week)}</span>
                      </label>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        )}
      </fieldset>
    </Modal>
  );
}
