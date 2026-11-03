import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSubjects } from '../hooks/useFirestore';
import { useExams } from '../hooks/useStudy';
import ExamModal from '../components/ExamModal';
import Skeleton from '../components/Skeleton';
import EmptyState from '../components/EmptyState';
import ErrorState from '../components/ErrorState';
import { EditIcon, TrashIcon } from '../components/icons';
import { countdown } from '../utils/countdown';
import { formatDate, getSlovenianDateKey } from '../utils/dates';
import { getSubjectColor } from '../utils/colors';
import { useI18n } from '../i18n';

function ExamRow({ exam, subject, today, onEdit, onDelete }) {
  const { t, tn, localeTag } = useI18n();
  const info = countdown(exam.date, today);
  const dayForms = { one: t('dan'), two: t('dneva'), few: t('dnevi'), other: t('dni') };
  const when = info.past
    ? null
    : info.days === 0
      ? t('Danes')
      : info.days === 1
        ? t('Jutri')
        : t('Čez {count}', { count: tn(info.days, dayForms) });
  const color = subject ? getSubjectColor(subject.colorIndex) : null;

  return (
    <li className="ledger-row flex items-center gap-3 py-3 pr-1 sm:gap-4">
      <div className="w-11 shrink-0 text-center" aria-hidden="true">
        <p className="tnum text-xl font-bold leading-none text-rp-text">{formatDate(exam.date, { day: 'numeric' }, localeTag)}</p>
        <p className="mt-1 text-[11px] text-rp-muted">{formatDate(exam.date, { month: 'short' }, localeTag)}</p>
      </div>
      <div className="min-w-0 flex-1">
        <h3 className="truncate text-body font-semibold text-rp-text">{exam.title}</h3>
        <p className="mt-0.5 flex min-w-0 items-center gap-1.5 text-small text-rp-muted">
          {color && <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: color.colorVar }} aria-hidden="true" />}
          <span className="truncate">{subject?.name || t('Predmet')}</span>
          <span className="sr-only">, {formatDate(exam.date, { weekday: 'long', day: 'numeric', month: 'long' }, localeTag)}</span>
        </p>
      </div>
      {when && (
        <span className={`mono shrink-0 text-small font-semibold ${info.urgent ? 'text-rp-danger' : 'text-rp-subtle'}`}>
          {when}
        </span>
      )}
      <span className="flex shrink-0">
        <button
          type="button"
          onClick={() => onEdit(exam)}
          aria-label={t('Uredi preverjanje {title}', { title: exam.title })}
          className="btn btn-icon border-transparent bg-transparent text-rp-muted hover:text-rp-text"
        >
          <EditIcon className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => onDelete(exam)}
          aria-label={t('Izbriši preverjanje {title}', { title: exam.title })}
          className="btn btn-icon border-transparent bg-transparent text-rp-muted hover:!text-rp-danger"
        >
          <TrashIcon className="h-4 w-4" />
        </button>
      </span>
    </li>
  );
}

export default function ExamsPage() {
  const navigate = useNavigate();
  const { t } = useI18n();
  const { subjects, loading: subjectsLoading } = useSubjects();
  const { exams, loading, error, addExam, updateExam, deleteExam } = useExams();
  const [modalOpen, setModalOpen] = useState(false);
  const [editExam, setEditExam] = useState(null);
  const [subjectFilter, setSubjectFilter] = useState('');

  const today = getSlovenianDateKey();
  const filtered = useMemo(
    () =>
      exams
        .filter((exam) => !subjectFilter || exam.subjectId === subjectFilter)
        .sort((a, b) => a.date.localeCompare(b.date)),
    [exams, subjectFilter],
  );
  const upcoming = filtered.filter((exam) => exam.date >= today);
  const past = filtered.filter((exam) => exam.date < today).reverse();

  function openNew() {
    if (subjectsLoading) return;
    if (!subjects.length) {
      navigate('/subjects?create=1&from=task');
      return;
    }
    setEditExam(null);
    setModalOpen(true);
  }

  const rowProps = {
    today,
    onEdit: (exam) => { setEditExam(exam); setModalOpen(true); },
    onDelete: (exam) => {
      if (window.confirm(t('Izbrišem preverjanje »{title}«?', { title: exam.title }))) deleteExam(exam.id);
    },
  };
  const subjectOf = (exam) => subjects.find((subject) => subject.id === exam.subjectId) || null;

  return (
    <div className="space-y-8">
      <section className="rise margin-rule">
        <h1 className="text-page text-rp-text">{t('Preverjanja')}</h1>
        <p className="mt-2 max-w-xl text-body text-rp-muted">
          {t('Testi, spraševanja in izpiti z odštevanjem, da veš, kdaj začeti z učenjem.')}
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <button type="button" onClick={openNew} className="btn btn-primary">{t('Novo preverjanje')}</button>
          {subjects.length > 1 && (
            <select
              value={subjectFilter}
              onChange={(event) => setSubjectFilter(event.target.value)}
              className="field !w-auto"
              aria-label={t('Filtriraj po predmetu')}
            >
              <option value="">{t('Vsi predmeti')}</option>
              {subjects.map((subject) => (
                <option key={subject.id} value={subject.id}>{subject.name}</option>
              ))}
            </select>
          )}
        </div>
      </section>

      {error ? (
        <ErrorState message={error} />
      ) : loading ? (
        <Skeleton lines={4} />
      ) : filtered.length === 0 ? (
        <EmptyState
          title={t('Ni zapisanih preverjanj')}
          description={t('Zapiši prvi test. Odštevanje se prikaže tudi na začetni strani.')}
          action={<button type="button" onClick={openNew} className="btn btn-primary">{t('Dodaj preverjanje')}</button>}
        />
      ) : (
        <>
          <section aria-labelledby="exams-upcoming">
            <h2 id="exams-upcoming" className="mb-2 text-subtitle text-rp-text">{t('Prihajajo')}</h2>
            {upcoming.length ? (
              <ul className="ledger">
                {upcoming.map((exam) => <ExamRow key={exam.id} exam={exam} subject={subjectOf(exam)} {...rowProps} />)}
              </ul>
            ) : (
              <p className="border-t border-rp-line py-4 text-body text-rp-muted">{t('Nič ni napovedano.')}</p>
            )}
          </section>
          {past.length > 0 && (
            <section aria-labelledby="exams-past">
              <h2 id="exams-past" className="mb-2 text-small font-semibold text-rp-muted">{t('Pretekla')}</h2>
              <ul className="ledger opacity-75">
                {past.map((exam) => <ExamRow key={exam.id} exam={exam} subject={subjectOf(exam)} {...rowProps} />)}
              </ul>
            </section>
          )}
        </>
      )}

      <ExamModal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setEditExam(null); }}
        onSave={(data) => { if (editExam) updateExam(editExam.id, data); else addExam(data); setEditExam(null); }}
        subjects={subjects}
        exam={editExam}
      />
    </div>
  );
}
