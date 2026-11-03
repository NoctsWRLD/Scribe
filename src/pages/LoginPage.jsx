import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { isFirebaseConfigured } from '../firebase';
import FirebaseSetupNotice from '../components/FirebaseSetupNotice';
import { AuthField, AuthShell, AuthSubmit } from '../components/AuthShell';
import { useSeo } from '../hooks/useSeo';
import { useI18n } from '../i18n';

export default function LoginPage() {
  const { login, resetPassword, currentUser } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(false);

  useSeo({ title: t('Prijava'), description: t('Prijavi se v svoj Scribe račun.'), path: '/login' });

  useEffect(() => {
    if (currentUser) navigate('/dashboard', { replace: true });
  }, [currentUser, navigate]);

  async function handleLogin(event) {
    event.preventDefault();
    setError('');
    setNotice('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (loginError) {
      setError(
        loginError?.code === 'auth/too-many-requests'
          ? t('Preveč poskusov zaporedoma. Počakaj minuto in poskusi znova.')
          : loginError?.code === 'auth/network-request-failed'
            ? t('Povezava ni uspela. Preveri internet in poskusi znova.')
            : t('E-pošta ali geslo ni pravilno.'),
      );
    }
    setLoading(false);
  }

  async function handleReset(event) {
    event.preventDefault();
    setError('');
    setNotice('');
    setLoading(true);
    try {
      await resetPassword(email);
      // The same answer for every address, so the form does not reveal
      // which addresses have an account.
      setNotice(t('Če za ta naslov obstaja račun, smo nanj poslali povezavo za novo geslo.'));
    } catch (resetError) {
      setError(
        resetError?.code === 'auth/invalid-email'
          ? t('E-poštni naslov ni veljaven.')
          : t('Povezave ni bilo mogoče poslati. Poskusi znova.'),
      );
    }
    setLoading(false);
  }

  if (!isFirebaseConfigured) return <FirebaseSetupNotice />;

  if (mode === 'reset') {
    return (
      <AuthShell
        title={t('Novo geslo')}
        subtitle={t('Vpiši e-pošto računa. Poslali ti bomo povezavo za novo geslo.')}
        error={error}
        notice={notice}
        footer={
          <button type="button" onClick={() => { setMode('login'); setError(''); setNotice(''); }} className="font-semibold text-rp-accent hover:underline">
            {t('Nazaj na prijavo')}
          </button>
        }
      >
        <form onSubmit={handleReset} className="grid gap-4">
          <AuthField
            label={t('E-pošta')}
            id="reset-email"
            type="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="username"
            autoFocus
          />
          <AuthSubmit loading={loading} idle={t('Pošlji povezavo')} busy={t('Pošiljam…')} />
        </form>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title={t('Prijava')}
      error={error}
      notice={notice}
      footer={
        <>
          {t('Še nimaš računa?')}{' '}
          <Link to="/register" className="font-semibold text-rp-accent hover:underline">{t('Ustvari račun')}</Link>
        </>
      }
    >
      <form onSubmit={handleLogin} className="grid gap-4">
        <AuthField
          label={t('E-pošta')}
          id="login-email"
          type="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          autoComplete="username"
          inputMode="email"
        />
        <div>
          <AuthField
            label={t('Geslo')}
            id="login-password"
            type="password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
          />
          <button
            type="button"
            onClick={() => { setMode('reset'); setError(''); setNotice(''); }}
            className="link-signal -ml-1.5 mt-1.5"
          >
            {t('Pozabljeno geslo?')}
          </button>
        </div>
        <AuthSubmit loading={loading} idle={t('Prijava')} busy={t('Prijavljam…')} />
      </form>
    </AuthShell>
  );
}
