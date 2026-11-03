import { useMemo, useState } from 'react';
import { useSubjects, useTasks } from '../hooks/useFirestore';
import TaskModal from '../components/TaskModal';
import ScheduleImportModal from '../components/ScheduleImportModal';
import { getSubjectColor } from '../utils/colors';
import { ChevronLeftIcon, ChevronRightIcon, ImageIcon, PlusIcon } from '../components/icons';
import { getWeekStart } from '../utils/rail';
import { addDaysToDateKey, formatDate, getSlovenianDateKey } from '../utils/dates';
import { useI18n } from '../i18n';

/**
 * The week. On a wide screen it is seven columns; on a phone the same week
 * is one list, day under day, because seven columns on 360px are unreadable.
 * A task opens its form; ticking it off happens in Naloge.
 */
export default function SchedulePage() {
  const { t, tn, localeTag } = useI18n();
  const { subjects } = useSubjects();
  const { tasks, addTask, addTasks, updateTask } = useTasks();
  const [weekOffset, setWeekOffset] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [editTask, setEditTask] = useState(null);
  const [preselectedDate, setPreselectedDate] = useState('');

  const todayStr = getSlovenianDateKey();
  const weekStart = useMemo(() => addDaysToDateKey(getWeekStart(todayStr), weekOffset * 7), [todayStr, weekOffset]);
  const weekDays = useMemo(() => Array.from({ length: 7 }, (_, index) => addDaysToDateKey(weekStart, index)), [weekStart]);

  const byDay = useMemo(() => {
    const map = new Map(weekDays.map((day) => [day, []]));
    for (const task of tasks) {
      if (!task.completed && map.has(task.dueDate)) map.get(task.dueDate).push(task);
    }
    return map;
  }, [tasks, weekDays]);
  const weekTotal = weekDays.reduce((sum, day) => sum + byDay.get(day).length, 0);
  const taskForms = { one: t('odprta naloga'), two: t('odprti nalogi'), few: t('odprte naloge'), other: t('odprtih nalog') };

  const subjectOf = (task) => subjects.find((subject) => subject.id === task.subjectId) || null;

  function addOn(day) {
    setEditTask(null);
    setPreselectedDate(day);
    setModalOpen(true);
  }

  function edit(task) {
    setEditTask(task);
    setPreselectedDate('');
    setModalOpen(true);
  }

  function handleSave(data) {
    const finalData = preselectedDate && !data.dueDate ? { ...data, dueDate: preselectedDate } : data;
    if (editTask) updateTask(editTask.id, finalData);
    else addTask(finalData);
    setEditTask(null);
    setPreselectedDate('');
  }

  const weekLabel = `${formatDate(weekDays[0], { day: 'numeric', month: 'short' }, localeTag)} – ${formatDate(weekDays[6], { day: 'numeric', month: 'short', year: 'numeric' }, localeTag)}`;

  function TaskLine({ task, compact }) {
    const subject = subjectOf(task);
    const color = subject ? getSubjectColor(subject.colorIndex) : null;
    return (
      <button
        type="button"
        onClick={(event) => { event.stopPropagation(); edit(task); }}
        className={`block w-full border-l-2 text-left transition-colors hover:bg-rp-overlay ${compact ? 'py-1 pl-2 pr-1' : 'py-2.5 pl-3 pr-2'}`}
        style={{ borderLeftColor: color?.colorVar || 'var(--rp-line-strong)' }}
      >
        <span className={`block truncate font-semibold text-rp-text ${compact ? 'text-[12px] leading-tight' : 'text-body'}`}>{task.title}</span>
        {subject && <span className={`block truncate text-rp-muted ${compact ? 'text-[11px]' : 'text-small'}`}>{subject.name}</span>}
      </button>
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
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => setImportOpen(true)} className="btn">
              <ImageIcon className="h-4 w-4" />
              {t('Urnik iz slike')}
            </button>
            <button type="button" onClick={() => addOn(todayStr)} className="btn btn-primary">
              <PlusIcon className="h-4 w-4" />
              {t('Nova naloga')}
            </button>
          </div>
        </div>
        <p className="mt-3 text-small text-rp-muted">
          {weekTotal === 0 ? t('Ta teden ni odprtih nalog.') : tn(weekTotal, taskForms)}
        </p>
      </section>

      {/* Wide screens: seven columns. */}
      <section className="hidden border-y border-rp-line lg:block" aria-label={t('Teden')}>
        <div className="grid grid-cols-7 divide-x divide-rp-line">
          {weekDays.map((day) => {
            const isToday = day === todayStr;
            return (
              <div key={day} className="flex min-w-0 flex-col">
                <div className={`border-b px-2 py-2 ${isToday ? 'border-rp-accent' : 'border-rp-line'}`}>
                  <p className={`text-[11px] font-semibold ${isToday ? 'text-rp-accent' : 'text-rp-muted'}`}>
                    {formatDate(day, { weekday: 'short' }, localeTag)}
                  </p>
                  <p className={`tnum text-subtitle ${isToday ? 'text-rp-accent' : 'text-rp-text'}`}>
                    {formatDate(day, { day: 'numeric' }, localeTag)}
                  </p>
                </div>
                <div className="flex min-h-40 flex-1 flex-col gap-1 p-1">
                  {byDay.get(day).map((task) => <TaskLine key={task.id} task={task} compact />)}
                  <button
                    type="button"
                    onClick={() => addOn(day)}
                    aria-label={t('Dodaj nalogo za {day}', { day: formatDate(day, { weekday: 'long', day: 'numeric', month: 'long' }, localeTag) })}
                    className="mt-auto grid min-h-8 place-items-center text-rp-muted opacity-0 transition-opacity hover:bg-rp-overlay hover:text-rp-text focus-visible:opacity-100 [div:hover>&]:opacity-100"
                  >
                    <PlusIcon className="h-4 w-4" />
                  </button>
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
                    onClick={() => addOn(day)}
                    aria-label={t('Dodaj nalogo za {day}', { day: formatDate(day, { weekday: 'long', day: 'numeric', month: 'long' }, localeTag) })}
                    className="btn btn-icon border-transparent bg-transparent text-rp-muted"
                  >
                    <PlusIcon className="h-4 w-4" />
                  </button>
                </div>
                {dayTasks.length > 0 && (
                  <div className="mb-1 grid gap-1">
                    {dayTasks.map((task) => <TaskLine key={task.id} task={task} />)}
                  </div>
                )}
              </li>
            );
          })}
        </ol>
      </section>

      <ScheduleImportModal
        key={importOpen ? 'open' : 'closed'}
        isOpen={importOpen}
        onClose={() => setImportOpen(false)}
        subjects={subjects}
        onImport={(rows) => addTasks(rows)}
      />

      <TaskModal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setEditTask(null); setPreselectedDate(''); }}
        onSave={handleSave}
        subjects={subjects}
        task={editTask}
        defaultDueDate={preselectedDate}
        defaultSubjectId={subjects[0]?.id || ''}
      />
    </div>
  );
}
