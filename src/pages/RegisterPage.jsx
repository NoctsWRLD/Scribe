import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { AuthField, AuthShell, AuthSubmit } from '../components/AuthShell';
import { useSeo } from '../hooks/useSeo';
import { useI18n } from '../i18n';
import { MIN_PASSWORD_LENGTH, passwordScore, validatePassword } from '../utils/password';

export default function RegisterPage() {
  const { register, currentUser } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useSeo({
    title: t('Ustvari račun'),
    description: t('Ustvari Scribe račun in dodaj prvega predmeta.'),
    path: '/register',
  });

  useEffect(() => {
    if (currentUser) navigate('/dashboard', { replace: true });
  }, [currentUser, navigate]);

  const check = validatePassword(password);
  const score = passwordScore(password);

  async function handleSubmit(event) {
    event.preventDefault();
    if (!check.ok) {
      setError(t('Geslo naj ima vsaj 10 znakov.'));
      return;
    }
    if (password !== confirm) {
      setError(t('Gesli se ne ujemata.'));
      return;
    }
    setError('');
    setLoading(true);
    try {
      await register(email, password, name.trim());
      navigate('/dashboard');
    } catch (registerError) {
      if (registerError.code === 'auth/email-already-in-use') {
        setError(t('Ta e-pošta je že v uporabi.'));
      } else if (registerError.code === 'auth/weak-password') {
        setError(t('Geslo naj ima vsaj 10 znakov.'));
      } else {
        setError(t('Registracija ni uspela. Preveri podatke in poskusi znova.'));
      }
    }
    setLoading(false);
  }

  return (
    <AuthShell
      title={t('Ustvari račun')}
      subtitle={t('Za naloge, teste in urnik. Brezplačno in brez oglasov.')}
      error={error}
      footer={
        <>
          {t('Že imaš račun?')}{' '}
          <Link to="/login" className="font-semibold text-rp-accent hover:underline">{t('Prijava')}</Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="grid gap-4">
        <AuthField
          label={t('Ime')}
          id="register-name"
          type="text"
          required
          maxLength={60}
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Tia Novak"
          autoComplete="name"
        />
        <AuthField
          label={t('E-pošta')}
          id="register-email"
          type="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="tia@sola.si"
          autoComplete="username"
        />
        <div className="grid gap-4">
          <AuthField
            label={t('Geslo')}
            id="register-password"
            type="password"
            required
            minLength={MIN_PASSWORD_LENGTH}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="••••••••••"
            autoComplete="new-password"
          />
          <AuthField
            label={t('Ponovi geslo')}
            id="register-confirm"
            type="password"
            required
            minLength={MIN_PASSWORD_LENGTH}
            value={confirm}
            onChange={(event) => setConfirm(event.target.value)}
            placeholder="••••••••••"
            autoComplete="new-password"
          />
        </div>

        <div>
          <div className="flex gap-1" aria-hidden="true">
            {[0, 1, 2].map((step) => (
              <span
                key={step}
                className={`h-1 flex-1 rounded-xs ${step < score ? 'bg-rp-mark' : 'bg-rp-fill'}`}
              />
            ))}
          </div>
          <p className="mt-1.5 text-small text-rp-muted">
            {t('Vsaj 10 znakov. Dolgo geslo je varnejše od zapletenega.')}
          </p>
        </div>

        <AuthSubmit loading={loading} idle={t('Ustvari račun')} busy={t('Ustvarjam…')} />
      </form>
    </AuthShell>
  );
}
