import { useEffect, useMemo, useRef, useState } from 'react';
import Modal from './Modal';
import { useAuth } from '../contexts/AuthContext';
import { useAllUsers, useFriendCode, sendFriendRequest } from '../hooks/useChat';
import { lookupUserByCode } from '../services/friendService';
import { CODE_LENGTH, isValidCode, normalizeCode } from '../utils/friendCode';
import { useI18n } from '../i18n';
import { SearchIcon } from './icons';

/**
 * Adding a friend — one field.
 *
 * The student types either the six-character code a classmate gave them or
 * the classmate's name. A complete code is looked up exactly; anything else
 * searches by name. Each result has one button that sends the request.
 *
 * The student's own code sits at the top, because the most common reason to
 * open this dialog is "my friend asked for my code".
 */

/** Typed text that is shaped like a code: six code characters, nothing else. */
function asCode(raw) {
  const compact = raw.replace(/[\s-]/g, '');
  const code = normalizeCode(compact);
  return code.length === CODE_LENGTH && compact.length === CODE_LENGTH ? code : null;
}

function Avatar({ name }) {
  return (
    <span
      className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-rp-overlay text-small font-bold text-rp-text"
      aria-hidden="true"
    >
      {(name?.[0] || '?').toUpperCase()}
    </span>
  );
}

export default function AddFriendModal({ isOpen, onClose, onSent, excludeUids = [] }) {
  const { currentUser, userProfile } = useAuth();
  const { t } = useI18n();
  const inputRef = useRef(null);
  const [term, setTerm] = useState('');
  const [codeMatch, setCodeMatch] = useState({ state: 'idle' });
  const [sentTo, setSentTo] = useState([]);
  const [sendingUid, setSendingUid] = useState(null);
  const [message, setMessage] = useState(null);
  const [copied, setCopied] = useState(false);

  const { code: ownCode, loading: codeLoading } = useFriendCode(currentUser, userProfile?.friendCode, userProfile);

  const code = asCode(term);
  // A complete code is an exact lookup, not a name search.
  const { users } = useAllUsers(code ? '' : term);

  useEffect(() => {
    if (!isOpen) return;
    setTerm('');
    setCodeMatch({ state: 'idle' });
    setSentTo([]);
    setMessage(null);
    setCopied(false);
  }, [isOpen]);

  useEffect(() => {
    if (!code || !isValidCode(code)) {
      setCodeMatch({ state: 'idle' });
      return undefined;
    }
    let cancelled = false;
    setCodeMatch({ state: 'loading' });
    lookupUserByCode(code)
      .then((result) => {
        if (cancelled) return;
        if (result.status === 'found') {
          setCodeMatch(
            result.user.uid === currentUser?.uid ? { state: 'self' } : { state: 'found', user: result.user },
          );
        } else {
          setCodeMatch({ state: result.status === 'gone' ? 'gone' : 'missing' });
        }
      })
      .catch((error) => {
        console.error('Iskanje po kodi ni uspelo:', error);
        if (!cancelled) setCodeMatch({ state: 'error' });
      });
    return () => { cancelled = true; };
  }, [code, currentUser?.uid]);

  const results = useMemo(() => {
    const list = code ? (codeMatch.state === 'found' ? [codeMatch.user] : []) : users;
    return list.filter((user) => user && !excludeUids.includes(user.uid));
  }, [code, codeMatch, users, excludeUids]);

  const alreadyConnected = code && codeMatch.state === 'found' && excludeUids.includes(codeMatch.user.uid);

  async function copyOwnCode() {
    if (!ownCode) return;
    try {
      await navigator.clipboard.writeText(ownCode);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setMessage(t('Kopiranje ni uspelo. Kodo prepiši ročno: {code}', { code: ownCode }));
    }
  }

  async function add(user) {
    setSendingUid(user.uid);
    setMessage(null);
    try {
      const result = await sendFriendRequest(currentUser, user.uid, user.displayName || t('Učenec'));
      if (result.ok) {
        setSentTo((previous) => [...previous, user.uid]);
        onSent?.();
        return;
      }
      setMessage(
        result.reason === 'exists'
          ? t('Zahteva je že poslana ali pa sta že prijatelja.')
          : t('Zahteve ni bilo mogoče poslati. Poskusi znova.'),
      );
    } catch (error) {
      console.error('Pošiljanje zahteve ni uspelo:', error);
      setMessage(t('Zahteve ni bilo mogoče poslati. Poskusi znova.'));
    } finally {
      setSendingUid(null);
    }
  }

  const trimmed = term.trim();
  let hint = null;
  if (code) {
    if (codeMatch.state === 'loading') hint = t('Preverjam kodo…');
    else if (codeMatch.state === 'self') hint = t('To je tvoja koda. Vpiši kodo sošolca.');
    else if (codeMatch.state === 'missing') hint = t('Nihče nima te kode. Preveri, ali je prepisana pravilno.');
    else if (codeMatch.state === 'gone') hint = t('Ta račun ne obstaja več.');
    else if (codeMatch.state === 'error') hint = t('Kode ni bilo mogoče preveriti. Poskusi znova.');
    else if (alreadyConnected) hint = t('S to osebo sta že povezana.');
  } else if (trimmed.length === 1) {
    hint = t('Vpiši vsaj 2 črki imena.');
  } else if (trimmed.length >= 2 && results.length === 0) {
    hint = t('Nihče s tem imenom. Poskusi s kodo.');
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t('Dodaj prijatelja')} initialFocusRef={inputRef}>
      <div className="flex items-center gap-3 rounded-md bg-rp-sunken px-3 py-2.5">
        <div className="min-w-0 flex-1">
          <p className="text-small text-rp-muted">{t('Tvoja koda')}</p>
          <p className="mono text-subtitle tracking-[0.18em] text-rp-text">
            {ownCode || (codeLoading ? '······' : '—')}
          </p>
        </div>
        <button type="button" onClick={copyOwnCode} disabled={!ownCode} className="btn btn-sm shrink-0">
          {copied ? t('Kopirano') : t('Kopiraj')}
        </button>
      </div>

      <label htmlFor="friend-term" className="field-label mt-5">{t('Koda ali ime sošolca')}</label>
      <div className="relative">
        <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-rp-muted" />
        <input
          ref={inputRef}
          id="friend-term"
          type="search"
          value={term}
          onChange={(event) => setTerm(event.target.value.slice(0, 60))}
          placeholder={t('npr. K7M2QX ali Ana Novak')}
          autoComplete="off"
          autoCapitalize="none"
          spellCheck="false"
          enterKeyHint="search"
          className={`field !pl-9 ${code ? 'mono uppercase tracking-[0.18em]' : ''}`}
        />
      </div>

      {hint && (
        <p className="mt-2 text-small text-rp-muted" aria-live="polite">{hint}</p>
      )}

      {results.length > 0 && (
        <ul className="ledger mt-3" aria-label={t('Zadetki')}>
          {results.map((user) => {
            const sent = sentTo.includes(user.uid);
            const name = user.displayName || t('Učenec');
            return (
              <li key={user.uid} className="ledger-row flex items-center gap-3 py-2 pl-1 pr-1">
                <Avatar name={name} />
                <span className="min-w-0 flex-1 truncate text-body font-medium text-rp-text">{name}</span>
                {sent ? (
                  <span className="shrink-0 px-2 text-small font-semibold text-rp-success" role="status">
                    {t('Zahteva poslana')}
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => add(user)}
                    disabled={sendingUid === user.uid}
                    className="btn btn-primary btn-sm shrink-0"
                    aria-label={t('Dodaj {name} med prijatelje', { name })}
                  >
                    {sendingUid === user.uid ? t('Pošiljam…') : t('Dodaj')}
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {message && (
        <p className="mt-3 text-small text-rp-subtle" role="status" aria-live="polite">{message}</p>
      )}
    </Modal>
  );
}
