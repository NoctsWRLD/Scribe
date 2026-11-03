import { useState } from 'react';
import Modal from './Modal';
import SUBJECT_COLORS from '../utils/colors';
import { useI18n } from '../i18n';

function SubjectForm({ onClose, onSave, subject }) {
  const { t } = useI18n();
  const [name, setName] = useState(subject?.name || '');
  const [colorIndex, setColorIndex] = useState(subject?.colorIndex ?? 0);

  function handleSubmit(event) {
    event.preventDefault();
    if (!name.trim()) return;
    onSave({ name: name.trim().slice(0, 80), colorIndex });
    onClose();
  }

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={subject ? t('Uredi predmet') : t('Nov predmet')}
      size="sm"
      footer={
        <>
          <button type="button" onClick={onClose} className="btn">{t('Prekliči')}</button>
          <button type="submit" form="subject-form" className="btn btn-primary">
            {subject ? t('Shrani spremembe') : t('Dodaj predmet')}
          </button>
        </>
      }
    >
      <form id="subject-form" onSubmit={handleSubmit} className="grid gap-5">
        <div>
          <label className="field-label" htmlFor="subject-name">{t('Ime predmeta')}</label>
          <input
            id="subject-name"
            type="text"
            required
            maxLength={80}
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder={t('npr. Matematika')}
            className="field"
          />
        </div>

        <fieldset>
          <legend className="field-label">{t('Barva')}</legend>
          <div className="flex flex-wrap gap-2.5" role="radiogroup">
            {SUBJECT_COLORS.map((color, index) => {
              const active = colorIndex === index;
              return (
                <button
                  key={index}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  aria-label={t(color.label)}
                  title={t(color.label)}
                  onClick={() => setColorIndex(index)}
                  className={`h-9 w-9 rounded-full outline-offset-2 transition-[outline-color] ${
                    active ? 'outline-2 outline-rp-text [outline-style:solid]' : ''
                  }`}
                  style={{ backgroundColor: color.colorVar }}
                />
              );
            })}
          </div>
        </fieldset>
      </form>
    </Modal>
  );
}

export default function SubjectModal({ isOpen, onClose, onSave, subject }) {
  if (!isOpen) return null;
  return <SubjectForm key={subject?.id || 'new'} onClose={onClose} onSave={onSave} subject={subject} />;
}
