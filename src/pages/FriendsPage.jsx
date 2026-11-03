import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  useFriends,
  useFriendRequests,
  useSentRequests,
  deleteFriendRequest,
  respondToRequest,
} from '../hooks/useChat';
import AddFriendModal from '../components/AddFriendModal';
import EmptyState from '../components/EmptyState';
import { ChatIcon, PlusIcon, TrashIcon, UsersIcon } from '../components/icons';
import { useI18n } from '../i18n';

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

/**
 * Friends: one button to add someone, then the people.
 *
 * The page has no search box of its own — adding happens in one dialog that
 * takes a code or a name. What stays on the page is what a student comes
 * back for: who wants to be friends, who already is, and who has not
 * answered yet.
 */
export default function FriendsPage() {
  const { t, tn } = useI18n();
  const { friends } = useFriends();
  const { requests } = useFriendRequests();
  const { sent } = useSentRequests();
  const navigate = useNavigate();

  const [modalOpen, setModalOpen] = useState(false);
  const [status, setStatus] = useState(null);

  const excluded = useMemo(
    () => [
      ...friends.map((friend) => friend.uid),
      ...sent.map((request) => request.toUid),
      ...requests.map((request) => request.fromUid),
    ],
    [friends, sent, requests],
  );

  async function run(action, done, failed) {
    setStatus(null);
    try {
      await action();
      setStatus(done);
    } catch (error) {
      console.error(error);
      setStatus(failed);
    }
  }

  const friendForms = { one: t('prijatelj'), two: t('prijatelja'), few: t('prijatelji'), other: t('prijateljev') };

  return (
    <div className="max-w-2xl space-y-8">
      <header className="rise margin-rule flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-page text-rp-text">{t('Prijatelji')}</h1>
          <p className="mt-1 text-small text-rp-muted">{tn(friends.length, friendForms)}</p>
        </div>
        <button type="button" onClick={() => setModalOpen(true)} className="btn btn-primary">
          <PlusIcon className="h-4 w-4" />
          {t('Dodaj prijatelja')}
        </button>
      </header>

      {status && (
        <p className="text-small text-rp-subtle" role="status" aria-live="polite">{status}</p>
      )}

      {requests.length > 0 && (
        <section aria-labelledby="requests-heading">
          <h2 id="requests-heading" className="mb-2 text-subtitle text-rp-text">
            {t('Želijo biti tvoji prijatelji')}
          </h2>
          <ul className="ledger">
            {requests.map((request) => (
              <li key={request.id} className="ledger-row flex flex-wrap items-center gap-3 py-2.5">
                <Avatar name={request.fromName} />
                <span className="min-w-0 flex-1 truncate text-body font-medium text-rp-text">{request.fromName}</span>
                <span className="flex shrink-0 gap-2">
                  <button
                    type="button"
                    onClick={() => run(
                      () => respondToRequest(request.id, 'rejected'),
                      t('Zahteva je zavrnjena.'),
                      t('Odgovor ni uspel. Poskusi znova.'),
                    )}
                    className="btn btn-sm"
                  >
                    {t('Zavrni')}
                  </button>
                  <button
                    type="button"
                    onClick={() => run(
                      () => respondToRequest(request.id, 'accepted'),
                      t('{name} je zdaj tvoj prijatelj.', { name: request.fromName }),
                      t('Odgovor ni uspel. Poskusi znova.'),
                    )}
                    className="btn btn-primary btn-sm"
                  >
                    {t('Sprejmi')}
                  </button>
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section aria-labelledby="friends-heading">
        <h2 id="friends-heading" className="sr-only">{t('Moji prijatelji')}</h2>
        {friends.length === 0 ? (
          <EmptyState
            icon={<UsersIcon className="h-5 w-5" />}
            title={t('Še nimaš prijateljev')}
            description={t('Dodaj sošolca s kodo, ki ti jo pošlje, ali po imenu.')}
          />
        ) : (
          <ul className="ledger">
            {friends.map((friend) => (
              <li key={friend.uid} className="ledger-row flex items-center gap-3 py-2.5">
                <Avatar name={friend.displayName} />
                <span className="min-w-0 flex-1 truncate text-body font-medium text-rp-text">{friend.displayName}</span>
                <button type="button" onClick={() => navigate(`/chat?dm=${friend.uid}`)} className="btn btn-sm shrink-0">
                  <ChatIcon className="h-4 w-4" />
                  {t('Piši')}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (!window.confirm(t('Odstranim {name} iz prijateljev?', { name: friend.displayName }))) return;
                    run(
                      () => deleteFriendRequest(friend.requestId),
                      t('{name} ni več med prijatelji.', { name: friend.displayName }),
                      t('Prijatelja ni bilo mogoče odstraniti. Poskusi znova.'),
                    );
                  }}
                  aria-label={t('Odstrani {name} iz prijateljev', { name: friend.displayName })}
                  className="btn btn-icon shrink-0 border-transparent bg-transparent text-rp-muted hover:!text-rp-danger"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {sent.length > 0 && (
        <section aria-labelledby="sent-heading">
          <h2 id="sent-heading" className="mb-2 text-small font-semibold text-rp-muted">{t('Še niso odgovorili')}</h2>
          <ul className="ledger">
            {sent.map((request) => (
              <li key={request.id} className="ledger-row flex items-center gap-3 py-2">
                <span className="min-w-0 flex-1 truncate text-body text-rp-subtle">{request.toName}</span>
                <button
                  type="button"
                  onClick={() => run(
                    () => deleteFriendRequest(request.id),
                    t('Zahteva je preklicana.'),
                    t('Zahteve ni bilo mogoče preklicati. Poskusi znova.'),
                  )}
                  className="btn btn-sm shrink-0 border-transparent bg-transparent text-rp-muted"
                >
                  {t('Prekliči')}
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      <AddFriendModal isOpen={modalOpen} onClose={() => setModalOpen(false)} excludeUids={excluded} />
    </div>
  );
}
