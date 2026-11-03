import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../contexts/SettingsContext';
import { useSubjects, useTasks } from '../hooks/useFirestore';
import { useExams, useFlashcards, useFocusSessions } from '../hooks/useStudy';
import { useFriends, useFriendCode, getDmChatId } from '../hooks/useChat';
import SettingsSection from '../components/settings/SettingsSection';
import DeleteAccountModal from '../components/settings/DeleteAccountModal';
import LanguageSelect from '../components/LanguageSelect';
import { THEMES } from '../utils/themes';
import { formatDate, getSlovenianDateKey } from '../utils/dates';
import {
  DEFAULT_PREFERENCES,
  FOCUS_OPTIONS,
  WARNING_OPTIONS,
  WEEK_STARTS,
  normalizePreferences,
} from '../utils/preferences';
import { authErrorMessage } from '../utils/authErrors';
import { schoolChatId, subjectChatId } from '../utils/chatChannels';
import { MIN_PASSWORD_LENGTH } from '../utils/password';
import { useI18n } from '../i18n';

function Toggle({ id, title, description, checked, onChange }) {
  return (
    <div className="flex items-center justify-between gap-4 border-t border-rp-line py-4">
      <div>
        <p id={`${id}-label`} className="text-body font-semibold text-rp-text">{title}</p>
        <p id={`${id}-hint`} className="mt-0.5 max-w-lg text-small text-rp-muted">{description}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-labelledby={`${id}-label`}
        aria-describedby={`${id}-hint`}
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${checked ? 'bg-rp-mark' : 'bg-rp-line-strong'}`}
      >
        <span
          className={`absolute left-1 top-1 h-5 w-5 rounded-full bg-rp-raised transition-transform ${checked ? 'translate-x-5' : 'translate-x-0'}`}
        />
      </button>
    </div>
  );
}

/** A status line. Its tone is data, never guessed from the wording. */
function Note({ note }) {
  if (!note) return null;
  const tones = { good: 'text-rp-success', bad: 'text-rp-danger', muted: 'text-rp-muted' };
  return (
    <p className={`mt-3 text-small ${tones[note.tone] || tones.muted}`} role="status" aria-live="polite">
      {note.text}
    </p>
  );
}

export default function SettingsPage() {
  const { t, tn, localeTag } = useI18n();
  const {
    currentUser,
    userProfile,
    updateUserProfile,
    updatePreferences,
    changeEmail,
    changePassword,
    deleteAccount,
  } = useAuth();
  const { theme, setTheme, highContrast, setHighContrast, reduceMotion, setReduceMotion } = useSettings();
  const { subjects } = useSubjects();
  const { tasks } = useTasks();
  const { exams } = useExams();
  const { cards } = useFlashcards();
  const { sessions } = useFocusSessions();
  const { friends } = useFriends();
  const { code: friendCode, regenerate } = useFriendCode(currentUser, userProfile?.friendCode, userProfile);
  const navigate = useNavigate();

  const [displayName, setDisplayName] = useState(currentUser?.displayName || '');
  const [school, setSchool] = useState(userProfile?.school || '');
  const [profileNote, setProfileNote] = useState(null);

  const [newEmail, setNewEmail] = useState('');
  const [emailPassword, setEmailPassword] = useState('');
  const [emailNote, setEmailNote] = useState(null);

  const [newPassword, setNewPassword] = useState('');
  const [passwordCurrent, setPasswordCurrent] = useState('');
  const [passwordNote, setPasswordNote] = useState(null);

  const [codeNote, setCodeNote] = useState(null);
  const [copied, setCopied] = useState(false);

  const [preferences, setPreferences] = useState(DEFAULT_PREFERENCES);
  const [preferenceNote, setPreferenceNote] = useState(null);

  const [dataNote, setDataNote] = useState(null);
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef(null);

  const [deleteOpen, setDeleteOpen] = useState(false);

  useEffect(() => {
    if (userProfile?.school !== undefined) setSchool(userProfile.school);
  }, [userProfile?.school]);

  useEffect(() => {
    setPreferences(normalizePreferences(userProfile?.preferences));
  }, [userProfile?.preferences]);

  useEffect(() => {
    if (currentUser?.displayName) setDisplayName(currentUser.displayName);
  }, [currentUser?.displayName]);

  const good = (text) => ({ tone: 'good', text });
  const bad = (text) => ({ tone: 'bad', text });

  async function handleProfileSave(event) {
    event.preventDefault();
    setProfileNote(null);
    const name = displayName.trim();
    if (!name) {
      setProfileNote(bad(t('Vpiši ime, ki ga vidijo sošolci.')));
      return;
    }
    try {
      await updateUserProfile({ displayName: name.slice(0, 60), school: school.trim().slice(0, 120) });
      setProfileNote(good(t('Spremembe so shranjene.')));
    } catch (error) {
      console.error('Shranjevanje profila ni uspelo:', error);
      setProfileNote(bad(t('Profila ni bilo mogoče shraniti. Poskusi znova.')));
    }
  }

  async function handleEmailChange(event) {
    event.preventDefault();
    setEmailNote(null);
    try {
      await changeEmail(newEmail, emailPassword);
      setEmailNote(good(t('Na novi naslov je poslana povezava. Odpri jo, da spremembo potrdiš.')));
      setNewEmail('');
      setEmailPassword('');
    } catch (error) {
      setEmailNote(bad(t(authErrorMessage(error))));
    }
  }

  async function handlePasswordChange(event) {
    event.preventDefault();
    setPasswordNote(null);
    try {
      await changePassword(newPassword, passwordCurrent);
      setPasswordNote(good(t('Geslo je spremenjeno.')));
      setNewPassword('');
      setPasswordCurrent('');
    } catch (error) {
      setPasswordNote(bad(t(authErrorMessage(error))));
    }
  }

  async function handleCopyCode() {
    if (!friendCode) return;
    try {
      await navigator.clipboard.writeText(friendCode);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Kopiranje kode ni uspelo:', error);
      setCodeNote({ tone: 'muted', text: t('Kopiranje ni uspelo. Kodo prepiši ročno: {code}', { code: friendCode }) });
    }
  }

  async function handleRegenerateCode() {
    if (!window.confirm(t('Ustvarim novo kodo? Stara takoj neha delovati.'))) return;
    setCodeNote(null);
    try {
      await regenerate();
      setCodeNote(good(t('Nova koda je ustvarjena. Stara ne deluje več.')));
    } catch (error) {
      console.error('Nova koda ni bila ustvarjena:', error);
      setCodeNote(bad(t('Nove kode ni bilo mogoče ustvariti. Poskusi znova.')));
    }
  }

  async function handlePreferencesSave() {
    setPreferenceNote(null);
    try {
      await updatePreferences(preferences);
      setPreferenceNote(good(t('Nastavitve so shranjene.')));
    } catch (error) {
      console.error('Shranjevanje nastavitev ni uspelo:', error);
      setPreferenceNote(bad(t('Nastavitev ni bilo mogoče shraniti. Poskusi znova.')));
    }
  }

  function handleExport() {
    import('../services/accountService').then(({ collectAccountData: collect }) => {
      const data = collect({
        account: {
          displayName: currentUser?.displayName || '',
          email: currentUser?.email || userProfile?.email || '',
          school: userProfile?.school || '',
        },
        subjects,
        tasks,
        exams,
        cards,
        sessions,
      });
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `scribe-${getSlovenianDateKey()}.json`;
      link.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      setDataNote(good(t('Datoteka je prenesena.')));
    });
  }

  async function handleImportFile(event) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    // An export of a real account is far below this; a bigger file is not ours.
    if (file.size > 5 * 1024 * 1024) {
      setDataNote(bad(t('Datoteka je prevelika. Izberi datoteko, ki jo je izvozil Scribe.')));
      return;
    }

    setImporting(true);
    setDataNote(null);
    try {
      let data;
      try {
        data = JSON.parse(await file.text());
      } catch {
        setDataNote(bad(t('Datoteke ni mogoče prebrati. Izberi datoteko, ki jo je izvozil Scribe.')));
        return;
      }

      const { validateImport, importAccountData } = await import('../services/accountService');
      const check = validateImport(data);
      if (!check.ok) {
        setDataNote(bad(t(check.error)));
        return;
      }

      const result = await importAccountData(currentUser.uid, data);
      setDataNote(good(t('Uvoženo: {subjects} predmetov, {tasks} nalog, {exams} preverjanj, {cards} kartic.', {
        subjects: result.subjects,
        tasks: result.tasks,
        exams: result.exams,
        cards: result.flashcards,
      })));
    } catch (error) {
      console.error('Uvoz podatkov ni uspel:', error);
      setDataNote(bad(t('Podatkov ni bilo mogoče uvoziti. Poskusi znova.')));
    } finally {
      setImporting(false);
    }
  }

  async function handleDeleteAccount(password) {
    const chatIds = [
      'general',
      ...subjects.map((subject) => subjectChatId(subject.name)),
      schoolChatId(userProfile?.school),
      ...friends.map((friend) => getDmChatId(currentUser.uid, friend.uid)),
    ];
    await deleteAccount(password, chatIds);
    navigate('/login', { replace: true });
  }

  const focusMinutes = sessions.reduce((sum, session) => sum + (session.minutes || 0), 0);
  const minuteForms = { one: t('minuta'), two: t('minuti'), few: t('minute'), other: t('minut') };
  const dayForms = { one: t('dan'), two: t('dneva'), few: t('dnevi'), other: t('dni') };
  const joined = userProfile?.createdAt?.toDate
    ? formatDate(getSlovenianDateKey(userProfile.createdAt.toDate()), { day: 'numeric', month: 'long', year: 'numeric' }, localeTag)
    : '—';

  return (
    <div className="max-w-3xl space-y-10">
      <section className="rise margin-rule">
        <h1 className="text-page text-rp-text">{t('Nastavitve')}</h1>
      </section>

      <SettingsSection id="profil" title={t('Profil')} description={t('Tako te vidijo sošolci v klepetu in med prijatelji.')}>
        <form onSubmit={handleProfileSave} className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="field-label" htmlFor="settings-name">{t('Ime')}</label>
            <input
              id="settings-name"
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              maxLength={60}
              autoComplete="nickname"
              className="field"
            />
          </div>
          <div>
            <label className="field-label" htmlFor="settings-school">{t('Šola')}</label>
            <input
              id="settings-school"
              value={school}
              onChange={(event) => setSchool(event.target.value)}
              maxLength={120}
              autoComplete="organization"
              className="field"
            />
          </div>
          <div className="sm:col-span-2">
            <button type="submit" className="btn btn-primary">{t('Shrani profil')}</button>
            <Note note={profileNote} />
          </div>
        </form>
      </SettingsSection>

      <SettingsSection id="jezik" title={t('Jezik')} description={t('Jezik vmesnika. Shrani se v tvoj račun in velja na vseh napravah.')}>
        <LanguageSelect />
      </SettingsSection>

      <SettingsSection id="koda" title={t('Koda prijatelja')} description={t('S to kodo te sošolci dodajo med prijatelje.')}>
        <div className="flex flex-wrap items-center gap-3">
          {friendCode ? (
            <span className="mono text-2xl tracking-[0.2em] text-rp-text">{friendCode}</span>
          ) : (
            <span className="skel h-8 w-36" aria-hidden="true" />
          )}
          <button type="button" onClick={handleCopyCode} disabled={!friendCode} className="btn">
            {copied ? t('Kopirano') : t('Kopiraj')}
          </button>
          <button type="button" onClick={handleRegenerateCode} disabled={!friendCode} className="btn btn-link">
            {t('Ustvari novo kodo')}
          </button>
        </div>
        <Note note={codeNote} />
      </SettingsSection>

      <SettingsSection id="videz" title={t('Videz')} description={t('Tema, kontrast in gibanje. Velja takoj in se shrani v tem brskalniku.')}>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="field-label" htmlFor="pref-theme">{t('Tema')}</label>
            <select
              id="pref-theme"
              value={theme}
              onChange={(event) => setTheme(event.target.value)}
              className="field"
            >
              {THEMES.map((item) => (
                <option key={item.id} value={item.id}>{t(item.name)}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="mt-4">
          <Toggle
            id="pref-contrast"
            title={t('Močnejši kontrast')}
            description={t('Izrazitejše črte in besedilo.')}
            checked={highContrast}
            onChange={setHighContrast}
          />
          <Toggle
            id="pref-motion"
            title={t('Manj gibanja')}
            description={t('Izklopi premike in prehode.')}
            checked={reduceMotion}
            onChange={setReduceMotion}
          />
        </div>
      </SettingsSection>

      <SettingsSection id="ucenje" title={t('Učenje')}>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="field-label" htmlFor="pref-focus">{t('Dolžina seje fokusa')}</label>
            <select
              id="pref-focus"
              value={preferences.focusMinutes}
              onChange={(event) => setPreferences((previous) => ({ ...previous, focusMinutes: Number(event.target.value) }))}
              className="field"
            >
              {FOCUS_OPTIONS.map((minutes) => (
                <option key={minutes} value={minutes}>{tn(minutes, minuteForms)}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="field-label" htmlFor="pref-start">{t('Kdaj se dan začne')}</label>
            <input
              id="pref-start"
              type="time"
              value={preferences.startTime}
              onChange={(event) => setPreferences((previous) => ({ ...previous, startTime: event.target.value }))}
              className="field mono"
            />
          </div>
          <div>
            <label className="field-label" htmlFor="pref-warning">{t('Opozori na rok')}</label>
            <select
              id="pref-warning"
              value={preferences.deadlineWarningDays}
              onChange={(event) => setPreferences((previous) => ({ ...previous, deadlineWarningDays: Number(event.target.value) }))}
              className="field"
            >
              {WARNING_OPTIONS.map((days) => (
                <option key={days} value={days}>{t('{count} prej', { count: tn(days, dayForms) })}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="field-label" htmlFor="pref-week">{t('Teden se začne z')}</label>
            <select
              id="pref-week"
              value={preferences.weekStart}
              onChange={(event) => setPreferences((previous) => ({ ...previous, weekStart: event.target.value }))}
              className="field"
            >
              {WEEK_STARTS.map((option) => (
                <option key={option.id} value={option.id}>{t(option.label)}</option>
              ))}
            </select>
          </div>
        </div>
        <button type="button" onClick={handlePreferencesSave} className="btn btn-primary mt-5">
          {t('Shrani nastavitve')}
        </button>
        <Note note={preferenceNote} />
      </SettingsSection>

      <SettingsSection id="racun" title={t('Račun')}>
        <dl className="ledger">
          <div className="ledger-row flex justify-between gap-4 py-3">
            <dt className="text-body text-rp-muted">{t('E-pošta')}</dt>
            <dd className="truncate text-body font-medium text-rp-text">{currentUser?.email || '—'}</dd>
          </div>
          <div className="ledger-row flex justify-between gap-4 py-3">
            <dt className="text-body text-rp-muted">{t('Račun od')}</dt>
            <dd className="text-body font-medium text-rp-text">{joined}</dd>
          </div>
        </dl>

        <form onSubmit={handleEmailChange} className="mt-8">
          <h3 className="text-body font-semibold text-rp-text">{t('Spremeni e-pošto')}</h3>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <div>
              <label className="field-label" htmlFor="settings-email">{t('Nova e-pošta')}</label>
              <input id="settings-email" type="email" value={newEmail} onChange={(event) => setNewEmail(event.target.value)} autoComplete="email" className="field" />
            </div>
            <div>
              <label className="field-label" htmlFor="settings-email-password">{t('Trenutno geslo')}</label>
              <input id="settings-email-password" type="password" value={emailPassword} onChange={(event) => setEmailPassword(event.target.value)} autoComplete="current-password" className="field" />
            </div>
          </div>
          <button type="submit" disabled={!newEmail || !emailPassword} className="btn mt-3">{t('Spremeni e-pošto')}</button>
          <Note note={emailNote} />
        </form>

        <form onSubmit={handlePasswordChange} className="mt-8">
          <h3 className="text-body font-semibold text-rp-text">{t('Spremeni geslo')}</h3>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <div>
              <label className="field-label" htmlFor="settings-new-password">{t('Novo geslo')}</label>
              <input
                id="settings-new-password"
                type="password"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                autoComplete="new-password"
                minLength={MIN_PASSWORD_LENGTH}
                aria-describedby="settings-new-password-hint"
                className="field"
              />
              <p id="settings-new-password-hint" className="mt-1 text-small text-rp-muted">{t('Vsaj 10 znakov.')}</p>
            </div>
            <div>
              <label className="field-label" htmlFor="settings-current-password">{t('Trenutno geslo')}</label>
              <input id="settings-current-password" type="password" value={passwordCurrent} onChange={(event) => setPasswordCurrent(event.target.value)} autoComplete="current-password" className="field" />
            </div>
          </div>
          <button type="submit" disabled={newPassword.length < MIN_PASSWORD_LENGTH || !passwordCurrent} className="btn mt-3">{t('Spremeni geslo')}</button>
          <Note note={passwordNote} />
        </form>
      </SettingsSection>

      <SettingsSection id="podatki" title={t('Tvoji podatki')} description={t('Prenesi kopijo vsega, kar imaš v Scribe, ali jo uvozi nazaj.')}>
        <p className="text-small text-rp-muted">
          {t('{subjects} predmetov, {tasks} nalog, {exams} preverjanj, {cards} kartic in {minutes} fokusa.', {
            subjects: subjects.length,
            tasks: tasks.length,
            exams: exams.length,
            cards: cards.length,
            minutes: tn(focusMinutes, minuteForms),
          })}
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <button type="button" onClick={handleExport} className="btn">{t('Izvozi podatke')}</button>
          <button type="button" onClick={() => fileInputRef.current?.click()} disabled={importing} className="btn">
            {importing ? t('Uvažam…') : t('Uvozi podatke')}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json,.json"
            onChange={handleImportFile}
            className="sr-only"
            tabIndex={-1}
            aria-hidden="true"
          />
        </div>
        <Note note={dataNote} />
      </SettingsSection>

      <SettingsSection
        id="brisanje"
        title={t('Izbriši račun')}
        description={t('Predmeti, naloge, preverjanja, kartice, seje fokusa in sporočila se izbrišejo. Tega ni mogoče razveljaviti.')}
      >
        <button type="button" onClick={() => setDeleteOpen(true)} className="btn btn-danger">{t('Izbriši račun')}</button>
      </SettingsSection>

      <DeleteAccountModal
        isOpen={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDeleteAccount}
        displayName={currentUser?.displayName || ''}
      />
    </div>
  );
}
