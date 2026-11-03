import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useSubjects, useTasks } from '../hooks/useFirestore';
import { useI18n } from '../i18n';

/**
 * What the account says about you. Everything that can be changed lives in
 * Nastavitve; this page shows it and links there.
 */
export default function ProfilePage() {
  const { t, tn } = useI18n();
  const { currentUser, userProfile } = useAuth();
  const { subjects } = useSubjects();
  const { tasks } = useTasks();

  const completed = tasks.filter((task) => task.completed).length;
  const displayName = currentUser?.displayName?.trim() || t('Učenec');
  const taskForms = { one: t('naloga'), two: t('nalogi'), few: t('naloge'), other: t('nalog') };
  const subjectForms = { one: t('predmet'), two: t('predmeta'), few: t('predmeti'), other: t('predmetov') };

  const rows = [
    [t('E-pošta'), currentUser?.email || '—'],
    [t('Šola'), userProfile?.school || t('Ni dodana')],
    [t('Koda prijatelja'), userProfile?.friendCode || '—', true],
    [t('Predmeti'), tn(subjects.length, subjectForms)],
    [t('Naloge'), tasks.length ? t('{count}, od tega {done} opravljenih', { count: tn(tasks.length, taskForms), done: completed }) : tn(0, taskForms)],
  ];

  return (
    <div className="max-w-2xl space-y-8">
      <section className="rise margin-rule flex items-center gap-4">
        <span
          className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-rp-mark text-xl font-bold text-rp-mark-ink"
          aria-hidden="true"
        >
          {displayName[0].toUpperCase()}
        </span>
        <div className="min-w-0">
          <h1 className="truncate text-page text-rp-text">{displayName}</h1>
          <p className="mt-0.5 text-small text-rp-muted">{t('Moj profil')}</p>
        </div>
      </section>

      <dl className="ledger">
        {rows.map(([label, value, mono]) => (
          <div key={label} className="ledger-row flex justify-between gap-4 py-3">
            <dt className="text-body text-rp-muted">{label}</dt>
            <dd className={`truncate text-right text-body font-medium text-rp-text ${mono ? 'mono tracking-[0.14em]' : ''}`}>{value}</dd>
          </div>
        ))}
      </dl>

      <Link to="/settings" className="btn">{t('Uredi v nastavitvah')}</Link>
    </div>
  );
}
