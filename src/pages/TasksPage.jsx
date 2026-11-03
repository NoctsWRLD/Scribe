import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useSubjects, useTasks } from '../hooks/useFirestore';
import TaskLedger from '../components/TaskLedger';
import TaskModal from '../components/TaskModal';
import Select from '../components/Select';
import SubjectRequiredState from '../components/SubjectRequiredState';
import Skeleton from '../components/Skeleton';
import EmptyState from '../components/EmptyState';
import ErrorState from '../components/ErrorState';
import { CheckIcon, SearchIcon } from '../components/icons';
import { addDaysToDateKey, getSlovenianDateKey } from '../utils/dates';
import { filterTasks, summarizeTasks } from '../utils/tasks';
import { useI18n } from '../i18n';

const FILTER_KEYS = [
  { key: 'pending', label: 'Odprte' },
  { key: 'completed', label: 'Opravljene' },
  { key: 'all', label: 'Vse' },
];

export default function TasksPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { t } = useI18n();
  const { subjects, loading: subjectsLoading, error: subjectsError } = useSubjects();
  const { tasks, loading, error, addTask, updateTask, deleteTask, setTasksCompleted, deleteTasks } = useTasks();
  const initialSubjectId = searchParams.get('subject') || '';
  const [modalOpen, setModalOpen] = useState(false);
  const [editTask, setEditTask] = useState(null);
  const [statusFilter, setStatusFilter] = useState('pending');
  // ?subject=<id> opens the list already filtered to that subject (the
  // subjects page and the dashboard link here). With ?new=1 it only
  // preselects the subject in the form.
  const [subjectFilter, setSubjectFilter] = useState(() =>
    searchParams.get('new') === '1' ? '' : searchParams.get('subject') || '',
  );
  const [sortBy, setSortBy] = useState('dueDate');
  const [search, setSearch] = useState('');

  // The side rail links here with ?new=1. The form can only open once the
  // subjects are known, because a task always belongs to one.
  const wantsNewTask = searchParams.get('new') === '1';
  const subjectsReady = !subjectsLoading;
  const formOpen = modalOpen || (wantsNewTask && subjectsReady && subjects.length > 0);

  useEffect(() => {
    if (!wantsNewTask || !subjectsReady) return;
    if (!subjects.length) navigate('/subjects?create=1&from=task', { replace: true });
  }, [wantsNewTask, subjectsReady, subjects.length, navigate]);

  const today = getSlovenianDateKey();
  const threeDaysFromNow = addDaysToDateKey(today, 3);

  const filtered = useMemo(
    () => filterTasks(tasks, subjects, { status: statusFilter, subjectId: subjectFilter, search, sort: sortBy }),
    [tasks, subjects, statusFilter, subjectFilter, search, sortBy],
  );
  const summary = useMemo(
    () => summarizeTasks(tasks, today, threeDaysFromNow),
    [tasks, today, threeDaysFromNow],
  );

  function openNewTask() {
    if (subjectsLoading) return;
    if (!subjects.length) {
      navigate('/subjects?create=1&from=task');
      return;
    }
    setEditTask(null);
    setModalOpen(true);
  }

  function handleSave(data) {
    if (editTask) updateTask(editTask.id, data);
    else addTask(data);
    setEditTask(null);
    if (wantsNewTask) navigate('/tasks', { replace: true });
  }

  function closeTaskModal() {
    setModalOpen(false);
    setEditTask(null);
    if (wantsNewTask) navigate('/tasks', { replace: true });
  }

  if (subjectsError) return <ErrorState message={subjectsError} />;
  if (!subjectsLoading && subjects.length === 0) return <SubjectRequiredState pageTitle="Naloge" />;

  return (
    <div className="space-y-6">
      <section className="rise margin-rule flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-page text-rp-text">{t('Naloge')}</h1>
          <p className="mt-1 text-small text-rp-muted">
            {summary.overdue > 0
              ? t('{open} odprtih, {overdue} zamujenih', { open: summary.pending, overdue: summary.overdue })
              : t('{open} odprtih, {soon} z rokom v 3 dneh', { open: summary.pending, soon: summary.dueSoon })}
          </p>
        </div>
        <button id="add-task-btn" type="button" onClick={openNewTask} disabled={subjectsLoading} className="btn btn-primary">
          {t('Nova naloga')}
        </button>
      </section>

      <section className="space-y-4" aria-label={t('Seznam nalog')}>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex gap-1 self-start rounded-sm border border-rp-line p-1" role="group" aria-label={t('Prikaži naloge')}>
            {FILTER_KEYS.map((filter) => (
              <button
                key={filter.key}
                type="button"
                onClick={() => setStatusFilter(filter.key)}
                aria-pressed={statusFilter === filter.key}
                className={`min-h-9 rounded-xs px-3.5 text-small font-semibold transition-colors ${
                  statusFilter === filter.key
                    ? 'bg-rp-mark text-rp-mark-ink'
                    : 'text-rp-subtle hover:bg-rp-overlay hover:text-rp-text'
                }`}
              >
                {t(filter.label)}
              </button>
            ))}
          </div>

          <div className="grid gap-2 sm:grid-cols-[minmax(12rem,1fr)_auto_auto] lg:ml-auto">
            <label className="relative block">
              <span className="sr-only">{t('Poišči nalogo')}</span>
              <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-rp-muted" />
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder={t('Poišči nalogo…')}
                className="field !py-2.5 !pl-9 !text-small"
              />
            </label>
            <Select
              value={subjectFilter}
              onChange={(event) => setSubjectFilter(event.target.value)}
              aria-label={t('Filtriraj po predmetu')}
              className="field !py-2.5 !text-small sm:!w-auto"
            >
              <option value="">{t('Vsi predmeti')}</option>
              {subjects.map((subject) => (
                <option key={subject.id} value={subject.id}>{subject.name}</option>
              ))}
            </Select>
            <Select
              value={sortBy}
              onChange={(event) => setSortBy(event.target.value)}
              aria-label={t('Razvrsti naloge')}
              className="field !py-2.5 !text-small sm:!w-auto"
            >
              <option value="dueDate">{t('Po roku')}</option>
              <option value="createdAt">{t('Najnovejše')}</option>
            </Select>
          </div>
        </div>

        {error ? (
          <ErrorState message={error} />
        ) : loading || subjectsLoading ? (
          <Skeleton lines={5} />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<CheckIcon className="h-6 w-6" />}
            title={search ? t('Ni zadetkov') : statusFilter === 'completed' ? t('Še ni opravljenih nalog') : t('Vse je urejeno')}
            description={
              search
                ? t('Poskusi drug izraz za »{search}«.', { search })
                : tasks.length
                  ? t('Vse naloge so opravljene. Vzemi si zaslužen odmor.')
                  : t('Dodaj novo nalogo in jo razdeli na majhen, izvedljiv korak.')
            }
          />
        ) : (
          <>
            <p className="text-small text-rp-muted">{t('Označi naloge in jih potrdi z gumbom pod seznamom.')}</p>
            <TaskLedger
              tasks={filtered}
              subjects={subjects}
              onEdit={(value) => { setEditTask(value); setModalOpen(true); }}
              onDelete={(value) => {
                if (window.confirm(t('Izbrišem nalogo »{title}«?', { title: value.title }))) deleteTask(value.id);
              }}
              onSetCompleted={setTasksCompleted}
              onDeleteMany={deleteTasks}
            />
          </>
        )}
      </section>

      <TaskModal
        isOpen={formOpen}
        onClose={closeTaskModal}
        onSave={handleSave}
        subjects={subjects}
        task={editTask}
        defaultSubjectId={initialSubjectId || subjects[0]?.id || ''}
      />
    </div>
  );
}
