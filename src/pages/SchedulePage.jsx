import { useMemo, useState } from 'react';
import { useSubjects, useTasks } from '../hooks/useFirestore';
import { useExams, useScheduleEvents } from '../hooks/useStudy';
import TaskModal from '../components/TaskModal';
import Modal from '../components/Modal';
import { getSubjectColor } from '../utils/colors';
import { ChevronLeftIcon, ChevronRightIcon, PlusIcon, TrashIcon } from '../components/icons';
import { getWeekStart } from '../utils/rail';
import { addDaysToDateKey, formatDate, getSlovenianDateKey } from '../utils/dates';
import { useI18n } from '../i18n';

/**
 * The week. On a wide screen it is seven columns; on a phone the same week
 * is one list, day under day, because seven columns on 360px are unreadable.
 * A task opens its form; ticking it off happens in Naloge.
 */
export default function SchedulePage() {
  const { t, localeTag } = useI18n();
  const { subjects } = useSubjects();
  const { tasks, updateTask } = useTasks();
  const { exams } = useExams();
  const { events, addEvent, updateEvent, deleteEvent } = useScheduleEvents();
  const [weekOffset, setWeekOffset] = useState(0);
  const [editTask, setEditTask] = useState(null);
  const [editEvent, setEditEvent] = useState(null);
  const [eventOpen, setEventOpen] = useState(false);
  const [eventDate, setEventDate] = useState('');
  const [eventTitle, setEventTitle] = useState('');
  const [eventTime, setEventTime] = useState('');
  const [eventDescription, setEventDescription] = useState('');

  const todayStr = getSlovenianDateKey();
  const weekStart = useMemo(() => addDaysToDateKey(getWeekStart(todayStr), weekOffset * 7), [todayStr, weekOffset]);
  const weekDays = useMemo(() => Array.from({ length: 7 }, (_, index) => addDaysToDateKey(weekStart, index)), [weekStart]);

  const byDay = useMemo(() => {
    const map = new Map(weekDays.map((day) => [day, []]));
    for (const task of tasks) {
      if (!task.completed && map.has(task.dueDate)) map.get(task.dueDate).push({ kind: 'task', item: task });
    }
    for (const exam of exams) if (map.has(exam.date)) map.get(exam.date).push({ kind: 'exam', item: exam });
    for (const event of events) if (map.has(event.date)) map.get(event.date).push({ kind: 'event', item: event });
    for (const entries of map.values()) entries.sort((a, b) => (a.item.startTime || '99:99').localeCompare(b.item.startTime || '99:99'));
    return map;
  }, [tasks, exams, events, weekDays]);

  const subjectOf = (task) => subjects.find((subject) => subject.id === task.subjectId) || null;

  function addEventOn(day) {
    setEditEvent(null);
    setEventOpen(true);
    setEventDate(day);
    setEventTitle('');
    setEventTime('');
    setEventDescription('');
  }

  function edit(task) {
    setEditTask(task);
  }

  function openEvent(event) {
    setEditEvent(event);
    setEventOpen(true);
    setEventDate(event.date);
    setEventTitle(event.title);
    setEventTime(event.startTime || '');
    setEventDescription(event.description || '');
  }

  async function saveEvent(event) {
    event.preventDefault();
    const data = { title: eventTitle.trim(), date: eventDate, startTime: eventTime, description: eventDescription.trim() };
    if (!data.title || !data.date) return;
    if (editEvent) await updateEvent(editEvent.id, data);
    else await addEvent(data);
    setEditEvent(null);
    setEventOpen(false);
    setEventDate('');
  }

  const weekLabel = `${formatDate(weekDays[0], { day: 'numeric', month: 'short' }, localeTag)} – ${formatDate(weekDays[6], { day: 'numeric', month: 'short', year: 'numeric' }, localeTag)}`;

  function ScheduleItem({ entry, compact }) {
    const { kind, item } = entry;
    const subject = item.subjectId ? subjectOf(item) : null;
    const color = subject ? getSubjectColor(subject.colorIndex) : null;
    const label = kind === 'task' ? item.title : kind === 'exam' ? item.title : item.title;
    const borderColor = kind === 'exam' ? 'var(--rp-danger)' : color?.colorVar || 'var(--rp-line-strong)';
    const classes = `block w-full border-l-2 text-left transition-colors hover:bg-rp-overlay ${compact ? 'py-1 pl-2 pr-1' : 'py-2.5 pl-3 pr-2'}`;
    return (
      <div className="flex min-w-0 items-start gap-1" style={{ borderLeftColor: borderColor }}>
        <button
          type="button"
          onClick={() => kind === 'task' ? edit(item) : kind === 'event' ? openEvent(item) : undefined}
          className={`${classes} ${kind === 'exam' ? 'cursor-default' : ''}`}
          style={{ borderLeftColor: borderColor }}
          aria-label={kind === 'exam' ? `${t('Preverjanje')}: ${label}` : label}
        >
          <span className={`block truncate font-semibold text-rp-text ${compact ? 'text-[12px] leading-tight' : 'text-body'}`}>{label}</span>
          <span className={`block truncate text-rp-muted ${compact ? 'text-[11px]' : 'text-small'}`}>
            {kind === 'task' ? subject?.name : kind === 'exam' ? `${t('Preverjanje')}${subject ? ` · ${subject.name}` : ''}` : `${t('Dogodek')}${item.startTime ? ` · ${item.startTime}` : ''}`}
          </span>
        </button>
        {kind === 'event' && (
          <button type="button" onClick={() => { if (window.confirm(t('Izbrišem ta dogodek?'))) deleteEvent(item.id); }} className="btn btn-icon shrink-0 border-transparent bg-transparent text-rp-muted hover:!text-rp-danger" aria-label={t('Izbriši dogodek {title}', { title: item.title })}>
            <TrashIcon className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="rise margin-rule">
        <h1 className="text-page text-rp-text">{t('Urnik')}</h1>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setWeekOffset((value) => value - 1)}
              aria-label={t('Prejšnji teden')}
              className="btn btn-icon border-transparent bg-transparent"
            >
              <ChevronLeftIcon className="h-4 w-4" />
            </button>
            <p className="mono min-w-0 px-1 text-small text-rp-text" aria-live="polite">{weekLabel}</p>
            <button
              type="button"
              onClick={() => setWeekOffset((value) => value + 1)}
              aria-label={t('Naslednji teden')}
              className="btn btn-icon border-transparent bg-transparent"
            >
              <ChevronRightIcon className="h-4 w-4" />
            </button>
            {weekOffset !== 0 && (
              <button type="button" onClick={() => setWeekOffset(0)} className="link-signal ml-1">{t('Ta teden')}</button>
            )}
          </div>
        </div>
        <p className="mt-3 text-small text-rp-muted">{t('Prikazane so naloge, preverjanja in dogodki.')}</p>
      </section>

      {/* Wide screens: seven columns. */}
      <section className="hidden border-y border-rp-line lg:block" aria-label={t('Teden')}>
        <div className="grid grid-cols-7 divide-x divide-rp-line">
          {weekDays.map((day) => {
            const isToday = day === todayStr;
            return (
              <div key={day} className="flex min-w-0 flex-col" onContextMenu={(event) => { event.preventDefault(); addEventOn(day); }}>
                <div className={`border-b px-2 py-2 ${isToday ? 'border-rp-accent' : 'border-rp-line'}`}>
                  <div className="flex items-center justify-between gap-1">
                    <div>
                      <p className={`text-[11px] font-semibold ${isToday ? 'text-rp-accent' : 'text-rp-muted'}`}>{formatDate(day, { weekday: 'short' }, localeTag)}</p>
                      <p className={`tnum text-subtitle ${isToday ? 'text-rp-accent' : 'text-rp-text'}`}>{formatDate(day, { day: 'numeric' }, localeTag)}</p>
                    </div>
                    <button type="button" onClick={() => addEventOn(day)} aria-label={t('Dodaj dogodek za {day}', { day: formatDate(day, { weekday: 'long', day: 'numeric', month: 'long' }, localeTag) })} className="btn btn-icon border-transparent bg-transparent text-rp-muted">
                      <PlusIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <div className="flex min-h-40 flex-1 flex-col gap-1 p-1">
                  {byDay.get(day).map((entry) => <ScheduleItem key={`${entry.kind}-${entry.item.id}`} entry={entry} compact />)}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Phones and tablets: one list. */}
      <section className="lg:hidden" aria-label={t('Teden')}>
        <ol className="ledger">
          {weekDays.map((day) => {
            const isToday = day === todayStr;
            const dayTasks = byDay.get(day);
            return (
              <li key={day} className="ledger-row py-2">
                <div className="flex items-center justify-between gap-2">
                  <h2 className={`text-body font-semibold ${isToday ? 'text-rp-accent' : 'text-rp-subtle'}`}>
                    {formatDate(day, { weekday: 'long', day: 'numeric', month: 'long' }, localeTag)}
                    {isToday && <span className="sr-only"> ({t('danes')})</span>}
                  </h2>
                  <button
                    type="button"
                    onClick={() => addEventOn(day)}
                    aria-label={t('Dodaj dogodek za {day}', { day: formatDate(day, { weekday: 'long', day: 'numeric', month: 'long' }, localeTag) })}
                    className="btn btn-icon border-transparent bg-transparent text-rp-muted"
                  >
                    <PlusIcon className="h-4 w-4" />
                  </button>
                </div>
                {dayTasks.length > 0 && (
                  <div className="mb-1 grid gap-1">
                    {dayTasks.map((entry) => <ScheduleItem key={`${entry.kind}-${entry.item.id}`} entry={entry} />)}
                  </div>
                )}
              </li>
            );
          })}
        </ol>
      </section>

      <TaskModal
        isOpen={Boolean(editTask)}
        onClose={() => setEditTask(null)}
        onSave={(data) => { updateTask(editTask.id, data); setEditTask(null); }}
        subjects={subjects}
        task={editTask}
        defaultSubjectId={subjects[0]?.id || ''}
      />

      <Modal
        isOpen={eventOpen}
        onClose={() => { setEventOpen(false); setEventDate(''); setEditEvent(null); }}
        title={editEvent ? t('Uredi dogodek') : t('Dodaj dogodek')}
        footer={(
          <>
            <button type="button" onClick={() => { setEventOpen(false); setEventDate(''); setEditEvent(null); }} className="btn">{t('Prekliči')}</button>
            <button type="submit" form="schedule-event-form" className="btn btn-primary">{t('Shrani spremembe')}</button>
          </>
        )}
      >
        <form id="schedule-event-form" onSubmit={saveEvent} className="grid gap-4">
          <div>
            <label className="field-label" htmlFor="schedule-event-title">{t('Naslov dogodka')}</label>
            <input id="schedule-event-title" required maxLength={120} value={eventTitle} onChange={(event) => setEventTitle(event.target.value)} className="field" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="field-label" htmlFor="schedule-event-date">{t('Datum')}</label>
              <input id="schedule-event-date" type="date" required value={eventDate} onChange={(event) => setEventDate(event.target.value)} className="field" />
            </div>
            <div>
              <label className="field-label" htmlFor="schedule-event-time">{t('Čas')}</label>
              <input id="schedule-event-time" type="time" value={eventTime} onChange={(event) => setEventTime(event.target.value)} className="field" />
            </div>
          </div>
          <div>
            <label className="field-label" htmlFor="schedule-event-description">{t('Opomba')}</label>
            <textarea id="schedule-event-description" maxLength={600} value={eventDescription} onChange={(event) => setEventDescription(event.target.value)} rows={2} className="field resize-none" />
          </div>
        </form>
      </Modal>
    </div>
  );
}
