import { useState } from 'react';
import Modal from './Modal';
import { useI18n } from '../i18n';

function ExamForm({ onClose, onSave, subjects, exam }) {
  const { t } = useI18n();
  const [title, setTitle] = useState(exam?.title || '');
  const [subjectId, setSubjectId] = useState(exam?.subjectId || subjects[0]?.id || '');
  const [date, setDate] = useState(exam?.date || '');

  function handleSubmit(event) {
    event.preventDefault();
    if (!title.trim() || !subjectId || !date) return;
    onSave({ title: title.trim().slice(0, 120), subjectId, date });
    onClose();
  }

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={exam ? t('Uredi preverjanje') : t('Novo preverjanje')}
      footer={
        <>
          <button type="button" onClick={onClose} className="btn">{t('Prekliči')}</button>
          <button type="submit" form="exam-form" className="btn btn-primary">
            {exam ? t('Shrani spremembe') : t('Dodaj preverjanje')}
          </button>
        </>
      }
    >
      <form id="exam-form" onSubmit={handleSubmit} className="grid gap-4">
        <div>
          <label className="field-label" htmlFor="exam-title">{t('Kaj te čaka?')}</label>
          <input
            id="exam-title"
            className="field"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder={t('npr. Test iz matematike')}
            maxLength={120}
            required
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="field-label" htmlFor="exam-subject">{t('Predmet')}</label>
            <select
              id="exam-subject"
              className="field"
              value={subjectId}
              onChange={(event) => setSubjectId(event.target.value)}
              required
            >
              <option value="">{t('Izberi…')}</option>
              {subjects.map((subject) => (
                <option key={subject.id} value={subject.id}>{subject.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="field-label" htmlFor="exam-date">{t('Datum')}</label>
            <input
              id="exam-date"
              type="date"
              className="field"
              value={date}
              onChange={(event) => setDate(event.target.value)}
              required
            />
          </div>
        </div>
      </form>
    </Modal>
  );
}

export default function ExamModal({ isOpen, onClose, onSave, subjects, exam }) {
  if (!isOpen) return null;
  return <ExamForm key={exam?.id || 'new'} onClose={onClose} onSave={onSave} subjects={subjects} exam={exam} />;
}
