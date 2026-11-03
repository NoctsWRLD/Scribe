import { Link } from 'react-router-dom';
import EmptyState from './EmptyState';
import { useI18n } from '../i18n';

export default function SubjectRequiredState({ pageTitle }) {
  const { t } = useI18n();

  return (
    <div className="max-w-3xl space-y-8">
      <section className="rise margin-rule">
        <h1 className="text-page text-rp-text">{t(pageTitle)}</h1>
      </section>
      <EmptyState
        title={t('Najprej ustvari predmet')}
        description={t('Naloge, preverjanja in kartice so povezani s predmetom. Ustvari enega, preden jih začneš uporabljati.')}
        action={(
          <Link to="/subjects?create=1" className="btn btn-primary">
            {t('Ustvari predmet')}
          </Link>
        )}
      />
    </div>
  );
}
