import { useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { getSubjectColor } from '../utils/colors';
import { useSubjects, useTasks } from '../hooks/useFirestore';
import SubjectModal from '../components/SubjectModal';
import Skeleton from '../components/Skeleton';
import EmptyState from '../components/EmptyState';
import ErrorState from '../components/ErrorState';
import { EditIcon, SearchIcon, SparkIcon, TrashIcon } from '../components/icons';
import { useI18n } from '../i18n';

function SubjectRow({ subject, tasks, onEdit, onDelete }) {
  const { t, tn } = useI18n();
  const color = getSubjectColor(subject.colorIndex);
  const done = tasks.filter((task) => task.completed).length;
  const open = tasks.length - done;
  const progress = tasks.length ? Math.round((done / tasks.length) * 100) : 0;
  const openForms = { one: t('odprta naloga'), two: t('odprti nalogi'), few: t('odprte naloge'), other: t('odprtih nalog') };

  return (
    <li className="ledger-row flex items-center gap-2 pr-1">
      {/* The row is the link to this subject's tasks. */}
      <Link to={`/tasks?subject=${encodeURIComponent(subject.id)}`} className="flex min-w-0 flex-1 items-center gap-3 py-3">
        <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: color.colorVar }} aria-hidden="true" />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-body font-semibold text-rp-text">{subject.name}</span>
          <span className="mt-0.5 block text-small text-rp-muted">
            {tasks.length === 0 ? t('Brez nalog') : open === 0 ? t('Vse opravljeno') : tn(open, openForms)}
          </span>
        </span>
        <span className="hidden w-36 shrink-0 sm:block" aria-hidden="true">
          <span className="block h-1 overflow-hidden rounded-xs bg-rp-fill">
            <span className="block h-full rounded-xs" style={{ width: `${progress}%`, backgroundColor: color.colorVar }} />
          </span>
        </span>
        <span className="mono w-10 shrink-0 text-right text-small text-rp-muted">
          {progress}%<span className="sr-only"> {t('opravljeno')}</span>
        </span>
      </Link>
      <button
        type="button"
        onClick={onEdit}
        aria-label={t('Uredi predmet {name}', { name: subject.name })}
        className="btn btn-icon border-transparent bg-transparent text-rp-muted hover:text-rp-text"
      >
        <EditIcon className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={onDelete}
        aria-label={t('Izbriši predmet {name}', { name: subject.name })}
        className="btn btn-icon border-transparent bg-transparent text-rp-muted hover:!text-rp-danger"
      >
        <TrashIcon className="h-4 w-4" />
      </button>
    </li>
  );
}

export default function SubjectsPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { t, tn } = useI18n();
  const fromTask = searchParams.get('from') === 'task';
  const { subjects, loading, error, addSubject, updateSubject, deleteSubject } = useSubjects();
  const { tasks } = useTasks();
  const [modalOpen, setModalOpen] = useState(searchParams.get('create') === '1');
  const [editSubject, setEditSubject] = useState(null);
  const [search, setSearch] = useState('');
  const visibleSubjects = useMemo(() => {
    const term = search.trim().toLocaleLowerCase();
    return subjects.filter((subject) => subject.name.toLocaleLowerCase().includes(term));
  }, [subjects, search]);

  const taskForms = { one: t('nalogo'), two: t('nalogi'), few: t('naloge'), other: t('nalog') };

  async function handleSave(data) {
    if (editSubject) {
      updateSubject(editSubject.id, data);
    } else {
      const createdId = await addSubject(data);
      if (fromTask && createdId) navigate(`/tasks?new=1&subject=${encodeURIComponent(createdId)}`);
    }
    setEditSubject(null);
  }

  function handleDelete(subject) {
    const count = tasks.filter((task) => task.subjectId === subject.id).length;
    const message = count > 0
      ? t('Predmet »{name}« ima {count}. Ga res izbrišem?', { name: subject.name, count: tn(count, taskForms) })
      : t('Izbrišem predmet »{name}«?', { name: subject.name });
    if (window.confirm(message)) deleteSubject(subject.id);
  }

  return (
    <div className="max-w-3xl space-y-8">
      <section className="rise margin-rule flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-page text-rp-text">{t('Predmeti')}</h1>
          <p className="mt-2 max-w-xl text-body text-rp-muted">
            {t('Vsaka naloga, preverjanje in kartica pripada enemu predmetu. Odpri predmet za njegove naloge.')}
          </p>
        </div>
        <button type="button" onClick={() => { setEditSubject(null); setModalOpen(true); }} className="btn btn-primary">
          {t('Nov predmet')}
        </button>
      </section>

      {fromTask && (
        <p role="status" className="note" data-tone="warn">
          {t('Najprej ustvari predmet. Nato se odpre obrazec za nalogo, že povezan z njim.')}
        </p>
      )}

      {error ? (
        <ErrorState message={error} />
      ) : loading ? (
        <Skeleton lines={4} />
      ) : subjects.length === 0 ? (
        <EmptyState
          icon={<SparkIcon className="h-5 w-5" />}
          title={t('Začni s prvim predmetom')}
          description={t('Na primer Matematika ali Biologija. Naloge, testi in kartice se nato razvrstijo po njem.')}
          action={
            <button type="button" onClick={() => setModalOpen(true)} className="btn btn-primary">
              {t('Ustvari predmet')}
            </button>
          }
        />
      ) : (
        <section aria-label={t('Tvoji predmeti')}>
          {subjects.length > 6 && (
            <label className="relative mb-3 block sm:max-w-xs">
              <span className="sr-only">{t('Poišči predmet')}</span>
              <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-rp-muted" />
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder={t('Poišči predmet…')}
                className="field !pl-9"
              />
            </label>
          )}
          {visibleSubjects.length === 0 ? (
            <EmptyState compact title={t('Ni zadetkov')} description={t('Noben predmet se ne ujema z »{search}«.', { search })} />
          ) : (
            <ul className="ledger">
              {visibleSubjects.map((subject) => (
                <SubjectRow
                  key={subject.id}
                  subject={subject}
                  tasks={tasks.filter((task) => task.subjectId === subject.id)}
                  onEdit={() => { setEditSubject(subject); setModalOpen(true); }}
                  onDelete={() => handleDelete(subject)}
                />
              ))}
            </ul>
          )}
        </section>
      )}

      <SubjectModal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setEditSubject(null); }}
        onSave={handleSave}
        subject={editSubject}
      />
    </div>
  );
}
