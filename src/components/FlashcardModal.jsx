import { useState } from 'react';
import Modal from './Modal';
import Select from './Select';
import { useI18n } from '../i18n';

function CardForm({ onClose, onSave, subjects, card, defaultSubjectId }) {
  const { t } = useI18n();
  const [subjectId, setSubjectId] = useState(card?.subjectId || defaultSubjectId || subjects[0]?.id || '');
  const [front, setFront] = useState(card?.front || '');
  const [back, setBack] = useState(card?.back || '');

  function handleSubmit(event) {
    event.preventDefault();
    if (!subjectId || !front.trim() || !back.trim()) return;
    onSave({ subjectId, front: front.trim().slice(0, 500), back: back.trim().slice(0, 1000) });
    onClose();
  }

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={card ? t('Uredi kartico') : t('Nova kartica')}
      footer={
        <>
          <button type="button" onClick={onClose} className="btn">{t('Prekliči')}</button>
          <button type="submit" form="card-form" className="btn btn-primary">
            {card ? t('Shrani spremembe') : t('Dodaj kartico')}
          </button>
        </>
      }
    >
      <form id="card-form" onSubmit={handleSubmit} className="grid gap-4">
        <div>
          <label className="field-label" htmlFor="card-subject">{t('Predmet')}</label>
          <Select id="card-subject" className="field" value={subjectId} onChange={(event) => setSubjectId(event.target.value)} required>
            <option value="">{t('Izberi…')}</option>
            {subjects.map((subject) => (
              <option key={subject.id} value={subject.id}>{subject.name}</option>
            ))}
          </Select>
        </div>
        <div>
          <label className="field-label" htmlFor="card-front">{t('Vprašanje')}</label>
          <textarea
            id="card-front"
            className="field min-h-20 resize-none"
            value={front}
            onChange={(event) => setFront(event.target.value)}
            placeholder={t('npr. Kaj je fotosinteza?')}
            maxLength={500}
            required
          />
        </div>
        <div>
          <label className="field-label" htmlFor="card-back">{t('Odgovor')}</label>
          <textarea
            id="card-back"
            className="field min-h-20 resize-none"
            value={back}
            onChange={(event) => setBack(event.target.value)}
            placeholder={t('Odgovor s svojimi besedami')}
            maxLength={1000}
            required
          />
        </div>
      </form>
    </Modal>
  );
}

export default function FlashcardModal({ isOpen, onClose, onSave, subjects, card, defaultSubjectId }) {
  if (!isOpen) return null;
  return (
    <CardForm
      key={`${card?.id || 'new'}-${defaultSubjectId}`}
      onClose={onClose}
      onSave={onSave}
      subjects={subjects}
      card={card}
      defaultSubjectId={defaultSubjectId}
    />
  );
}
