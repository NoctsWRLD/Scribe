import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useSubjects, useTasks } from '../hooks/useFirestore';
import ErrorState from '../components/ErrorState';
import { useFlashcards } from '../hooks/useStudy';
import TaskLedger from '../components/TaskLedger';
import TaskModal from '../components/TaskModal';
import Skeleton from '../components/Skeleton';
import FocusTimer from '../components/FocusTimer';
import StudyTipCard from '../components/StudyTipCard';
import ExamCountdown from '../components/ExamCountdown';
import WeekFocus from '../components/WeekFocus';
import StudyRail from '../components/StudyRail';
import StatTile from '../components/StatTile';
import EmptyState from '../components/EmptyState';
import { getSubjectColor } from '../utils/colors';
import { buildWeekRail } from '../utils/rail';
import { formatDate, getHourInSlovenia, getSlovenianDateKey } from '../utils/dates';
import { useI18n } from '../i18n';

export default function DashboardPage() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { t, tn, localeTag } = useI18n();
  const [now, setNow] = useState(() => new Date());
  const { subjects, loading: subjectsLoading, error: subjectsError } = useSubjects();
  const { tasks, loading: tasksLoading, error: tasksError, addTask, updateTask, deleteTask, setTasksCompleted } = useTasks();
  const { cards } = useFlashcards();
  const [modalOpen, setModalOpen] = useState(false);
  const [editTask, setEditTask] = useState(null);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 30_000);
    return () => window.clearInterval(timer);
  }, []);

  const today = getSlovenianDateKey(now);
  const pending = useMemo(() => tasks.filter((task) => !task.completed), [tasks]);
  const completed = useMemo(() => tasks.filter((task) => task.completed), [tasks]);
  const dueToday = pending.filter((task) => task.dueDate === today).length;
  const overdue = pending.filter((task) => task.dueDate && task.dueDate < today).length;
  const upcoming = useMemo(
    () =>
      [...pending]
        .sort((a, b) => {
          if (!a.dueDate && !b.dueDate) return 0;
          if (!a.dueDate) return 1;
          if (!b.dueDate) return -1;
          return a.dueDate.localeCompare(b.dueDate);
        })
        .slice(0, 4),
    [pending],
  );
  const completion = tasks.length ? Math.round((completed.length / tasks.length) * 100) : 0;
  const dueCards = useMemo(() => cards.filter((card) => !card.known).length, [cards]);
  const rail = useMemo(() => buildWeekRail(tasks, today), [tasks, today]);

  const hour = getHourInSlovenia(now);
  const greeting = hour < 12 ? t('Dobro jutro') : hour < 18 ? t('Dober dan') : t('Dober večer');
  const dateLabel = formatDate(today, { weekday: 'long', day: 'numeric', month: 'long' }, localeTag);
  const displayName = currentUser?.displayName?.trim().split(/\s+/)[0] || t('učenec');

  const subjectTaskForms = {
    one: t('naloga'),
    two: t('nalogi'),
    few: t('naloge'),
    other: t('nalog'),
  };
  const cardForms = {
    one: t('kartica'),
    two: t('kartici'),
    few: t('kartice'),
    other: t('kartic'),
  };

  function openTaskModal() {
    if (subjectsLoading) return;
    if (!subjects.length) {
      navigate('/subjects?create=1&from=task');
      return;
    }
    setEditTask(null);
    setModalOpen(true);
  }

  return (
    <div className="space-y-6">
      <section className="rise margin-rule" aria-labelledby="dash-title">
        <p className="eyebrow">{dateLabel}</p>
        <h1 id="dash-title" className="mt-3 max-w-2xl text-page text-rp-text">
          {greeting}, {displayName}.
        </h1>
        <p className="mt-3 max-w-xl text-body text-rp-muted">
          {pending.length === 0
            ? t('Nič odprtega. Dodaj naslednjo stvar ali ponovi kartice.')
            : t('Izberi eno nalogo in ji nameni 25 minut fokusa.')}
        </p>

        <StudyRail
          className="mt-7 max-w-2xl"
          segments={rail}
          label={t('Učni pas tedna')}
          caption={t('Učni pas tedna')}
        />

        <div className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-3">
          <button type="button" onClick={openTaskModal} disabled={subjectsLoading} className="btn btn-primary disabled:opacity-60">
            {t('Nova naloga')}
          </button>
          <Link to="/flashcards" className="link-signal">
            {t('Ponovi kartice')}{dueCards > 0 ? ` (${dueCards})` : ''}
          </Link>
        </div>
      </section>

      {(tasksError || subjectsError) && (
        <ErrorState message={tasksError || subjectsError} />
      )}

      <section
        className="rise grid grid-cols-2 divide-x divide-y divide-rp-line border-y border-rp-line py-5 sm:grid-cols-4 sm:divide-y-0"
        aria-label={t('Pregled napredka')}
      >
        <StatTile className="px-4 first:pl-0 sm:first:pl-0" value={pending.length} label={t('odprtih nalog')} />
        <StatTile className="px-4" value={dueToday} label={t('zapade danes')} tone="text-rp-accent" />
        <StatTile className="px-4 sm:pl-4" value={overdue} label={t('zamujenih')} tone={overdue > 0 ? 'text-rp-danger' : 'text-rp-text'} />
        <StatTile className="px-4" value={`${completion}%`} label={t('narejeno')} tone="text-rp-success" />
      </section>

      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1.45fr)_minmax(17rem,.85fr)]">
        <section className="min-w-0" aria-labelledby="upcoming-heading">
          <div className="mb-3 flex items-baseline justify-between gap-3">
            <h2 id="upcoming-heading" className="text-title text-rp-text">{t('Naslednje naloge')}</h2>
            <Link to="/tasks" className="link-signal">{t('Vse naloge')}</Link>
          </div>
          {tasksLoading ? (
            <Skeleton lines={4} />
          ) : upcoming.length ? (
            <TaskLedger
              tasks={upcoming}
              subjects={subjects}
              onEdit={(value) => { setEditTask(value); setModalOpen(true); }}
              onDelete={(value) => {
                if (window.confirm(t('Izbrišem nalogo »{title}«?', { title: value.title }))) deleteTask(value.id);
              }}
              onSetCompleted={setTasksCompleted}
            />
          ) : (
            <EmptyState
              compact
              title={t('Prazno. In to je v redu.')}
              description={t('Dodaj prvo nalogo za ta teden ali ponovi kartice.')}
            />
          )}
        </section>

        <aside className="grid gap-4">
          <ExamCountdown subjects={subjects} />
          <FocusTimer />
          <WeekFocus />
          <StudyTipCard />
        </aside>
      </div>

      <section aria-labelledby="subjects-heading">
        <div className="mb-3 flex items-baseline justify-between gap-3">
          <h2 id="subjects-heading" className="text-title text-rp-text">{t('Predmeti')}</h2>
          <Link to="/subjects" className="link-signal">{t('Uredi')}</Link>
        </div>
        {subjectsLoading ? (
          <Skeleton lines={2} />
        ) : subjects.length === 0 ? (
          <EmptyState
            compact
            title={t('Dodaj prvi predmet')}
            description={t('Dodaj prvi predmet, da razvrstiš naloge, preverjanja in kartice.')}
            action={<Link to="/subjects" className="btn btn-primary !py-2.5 !text-small">{t('Odpri predmete')}</Link>}
          />
        ) : (
          <ul className="ledger grid sm:grid-cols-2 sm:gap-x-8">
            {subjects.slice(0, 6).map((subject) => {
              const color = getSubjectColor(subject.colorIndex);
              const subjectTasks = tasks.filter((task) => task.subjectId === subject.id);
              const done = subjectTasks.filter((task) => task.completed).length;
              const progress = subjectTasks.length ? Math.round((done / subjectTasks.length) * 100) : 0;
              const subjectCards = cards.filter((card) => card.subjectId === subject.id);
              return (
                <li key={subject.id} className="ledger-row">
                <Link to={`/tasks?subject=${subject.id}`} className="block py-3 pr-1">
                  <span className="flex items-baseline gap-2.5">
                    <span className="h-2 w-2 shrink-0 translate-y-[-1px] rounded-full" style={{ backgroundColor: color.colorVar }} aria-hidden="true" />
                    <span className="min-w-0 flex-1 truncate text-body font-semibold text-rp-text">{subject.name}</span>
                    <span className="mono shrink-0 text-small text-rp-muted">
                      {tn(subjectTasks.length, subjectTaskForms)}, {tn(subjectCards.length, cardForms)}
                    </span>
                  </span>
                  <div
                    className="mt-2 h-1 overflow-hidden rounded-xs bg-rp-fill"
                    role="progressbar"
                    aria-valuenow={progress}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={t('Napredek pri predmetu {name}', { name: subject.name })}
                  >
                    <div className="h-full rounded-xs" style={{ width: `${progress}%`, backgroundColor: color.colorVar }} />
                  </div>
                </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <TaskModal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setEditTask(null); }}
        onSave={(data) => { if (editTask) updateTask(editTask.id, data); else addTask(data); setEditTask(null); }}
        subjects={subjects}
        task={editTask}
      />
    </div>
  );
}
