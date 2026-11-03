import { useEffect, useState } from 'react';
import Modal from '../Modal';
import { useAuth } from '../../contexts/AuthContext';
import { authErrorMessage } from '../../utils/authErrors';
import { useI18n } from '../../i18n';

/**
 * Deleting an account cannot be undone, so the student types their name and
 * their password.
 */
export default function DeleteAccountModal({ isOpen, onClose, onConfirm, displayName }) {
  const { t } = useI18n();
  const { currentUser } = useAuth();
  const [typedName, setTypedName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setTypedName('');
    setPassword('');
    setError(null);
    setBusy(false);
  }, [isOpen]);

  const nameMatches = typedName.trim().toLowerCase() === (displayName || '').trim().toLowerCase();

  async function handleSubmit(event) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await onConfirm(password);
    } catch (err) {
      setError(t(authErrorMessage(err)));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('Izbriši račun')}
      description={t('Izbrišejo se vsi tvoji predmeti, naloge, preverjanja, kartice in sporočila. Tega ni mogoče razveljaviti.')}
      size="sm"
    >
      <form onSubmit={handleSubmit}>
        <input type="text" name="username" value={currentUser?.email || ''} readOnly autoComplete="username" hidden />

        <div>
          <label className="field-label" htmlFor="delete-name">{t('Za potrditev vpiši svoje ime: {name}', { name: displayName })}</label>
          <input id="delete-name" value={typedName} onChange={(event) => setTypedName(event.target.value)} className="field" autoComplete="off" />
        </div>

        <div className="mt-4">
          <label className="field-label" htmlFor="delete-password">{t('Geslo')}</label>
          <input
            id="delete-password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
            className="field"
          />
        </div>

        {error && <p className="mt-3 text-small text-rp-danger" role="alert">{error}</p>}

        <div className="mt-5 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="btn">{t('Prekliči')}</button>
          <button type="submit" disabled={busy || !nameMatches || !password} className="btn btn-danger">
            {busy ? t('Brišem…') : t('Izbriši račun')}
          </button>
        </div>
      </form>
    </Modal>
  );
}
