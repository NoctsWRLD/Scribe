import { useState } from 'react';
import Modal from './Modal';
import Select from './Select';
import { useI18n } from '../i18n';

function TaskForm({ onClose, onSave, subjects, task, defaultSubjectId, defaultDueDate }) {
  const { t } = useI18n();
  const [title, setTitle] = useState(task?.title || '');
  const [description, setDescription] = useState(task?.description || '');
  const [subjectId, setSubjectId] = useState(task?.subjectId || defaultSubjectId || '');
  const [dueDate, setDueDate] = useState(task?.dueDate || defaultDueDate || '');

  function handleSubmit(event) {
    event.preventDefault();
    if (!title.trim() || !subjectId) return;
    onSave({
      title: title.trim().slice(0, 120),
      description: description.trim().slice(0, 1200),
      subjectId,
      dueDate,
    });
    onClose();
  }

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={task ? t('Uredi nalogo') : t('Nova naloga')}
      footer={
        <>
          <button type="button" onClick={onClose} className="btn">{t('Prekliči')}</button>
          <button type="submit" form="task-form" className="btn btn-primary">
            {task ? t('Shrani spremembe') : t('Dodaj nalogo')}
          </button>
        </>
      }
    >
      <form id="task-form" onSubmit={handleSubmit} className="grid gap-4">
        <div>
          <label className="field-label" htmlFor="task-title">{t('Naslov naloge')}</label>
          <input
            id="task-title"
            type="text"
            required
            maxLength={120}
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder={t('npr. Domača naloga iz matematike')}
            className="field"
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="field-label" htmlFor="task-subject">{t('Predmet')}</label>
            <Select id="task-subject" required value={subjectId} onChange={(event) => setSubjectId(event.target.value)} className="field">
              <option value="" disabled>{t('Izberi predmet')}</option>
              {subjects.map((subject) => (
                <option key={subject.id} value={subject.id}>{subject.name}</option>
              ))}
            </Select>
          </div>
          <div>
            <label className="field-label" htmlFor="task-due">{t('Rok oddaje')}</label>
            <input id="task-due" type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} className="field" />
          </div>
        </div>
        <div>
          <label className="field-label" htmlFor="task-description">{t('Opomba')} <span className="font-normal text-rp-muted">({t('neobvezno')})</span></label>
          <textarea
            id="task-description"
            maxLength={1200}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            rows={2}
            className="field resize-none"
          />
        </div>
      </form>
    </Modal>
  );
}

export default function TaskModal({ isOpen, onClose, onSave, subjects, task, defaultSubjectId = '', defaultDueDate = '' }) {
  if (!isOpen) return null;
  return (
    <TaskForm
      key={`${task?.id || 'new'}-${defaultSubjectId}-${defaultDueDate}`}
      onClose={onClose}
      onSave={onSave}
      subjects={subjects}
      task={task}
      defaultSubjectId={defaultSubjectId}
      defaultDueDate={defaultDueDate}
    />
  );
}
