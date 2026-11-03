import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSubjects } from '../hooks/useFirestore';
import { useFlashcards } from '../hooks/useStudy';
import FlashcardModal from '../components/FlashcardModal';
import Select from '../components/Select';
import Skeleton from '../components/Skeleton';
import EmptyState from '../components/EmptyState';
import ErrorState from '../components/ErrorState';
import SubjectRequiredState from '../components/SubjectRequiredState';
import { CardIcon, EditIcon, TrashIcon } from '../components/icons';
import { useI18n } from '../i18n';

function shuffle(list) {
  const array = [...list];
  for (let index = array.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(Math.random() * (index + 1));
    [array[index], array[swap]] = [array[swap], array[index]];
  }
  return array;
}

export default function FlashcardsPage() {
  const navigate = useNavigate();
  const { t, tn } = useI18n();
  const { subjects, loading: subjectsLoading, error: subjectsError } = useSubjects();
  const { cards, loading, error, addCard, updateCard, deleteCard } = useFlashcards();
  const [deckId, setDeckId] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editCard, setEditCard] = useState(null);
  const [studying, setStudying] = useState(false);
  const [order, setOrder] = useState([]);
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);

  const activeDeckId = deckId || subjects[0]?.id || '';
  const deckCards = useMemo(() => cards.filter((card) => card.subjectId === activeDeckId), [cards, activeDeckId]);
  const knownCount = deckCards.filter((card) => card.known).length;
  const activeSubject = subjects.find((subject) => subject.id === activeDeckId);
  const cardForms = { one: t('kartica'), two: t('kartici'), few: t('kartice'), other: t('kartic') };

  function openNew() {
    if (subjectsLoading) return;
    if (!subjects.length) {
      navigate('/subjects?create=1&from=task');
      return;
    }
    setEditCard(null);
    setModalOpen(true);
  }

  function startStudy() {
    if (!deckCards.length) return;
    setOrder(shuffle(deckCards.map((card) => card.id)));
    setIndex(0);
    setRevealed(false);
    setStudying(true);
  }

  const card = studying ? deckCards.find((item) => item.id === order[index]) || null : null;

  function mark(known) {
    if (!card) return;
    if (card.known !== known) updateCard(card.id, { known });
    setRevealed(false);
    if (index + 1 >= order.length) setStudying(false);
    else setIndex(index + 1);
  }

  if (subjectsError) return <ErrorState message={subjectsError} />;
  if (!subjectsLoading && subjects.length === 0) return <SubjectRequiredState pageTitle="Kartice" />;

  return (
    <div className="space-y-8">
      <section className="rise margin-rule">
        <h1 className="text-page text-rp-text">{t('Kartice')}</h1>
        <p className="mt-2 max-w-xl text-body text-rp-muted">
          {t('Preberi vprašanje, odgovori na glas, nato preveri. Tako si snov zapomniš bolje kot z branjem.')}
        </p>
        {subjects.length > 0 && (
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Select
              value={activeDeckId}
              onChange={(event) => { setDeckId(event.target.value); setStudying(false); }}
              className="field !w-auto"
              aria-label={t('Izberi predmet')}
            >
              {subjects.map((subject) => (
                <option key={subject.id} value={subject.id}>{subject.name}</option>
              ))}
            </Select>
            <button type="button" onClick={startStudy} disabled={!deckCards.length} className="btn btn-primary">
              {t('Začni ponavljanje')}
            </button>
            <button type="button" onClick={openNew} className="btn">{t('Nova kartica')}</button>
          </div>
        )}
      </section>

      {error ? (
        <ErrorState message={error} />
      ) : loading || subjectsLoading ? (
        <Skeleton lines={4} />
      ) : studying && card ? (
        <section className="max-w-xl" aria-label={t('Ponavljanje')}>
          <div className="flex items-center justify-between text-small text-rp-muted">
            <span className="mono">{t('{current} od {total}', { current: index + 1, total: order.length })}</span>
            <button type="button" onClick={() => setStudying(false)} className="link-signal">{t('Končaj')}</button>
          </div>
          <ul className="rail mt-2" aria-hidden="true">
            {order.map((id, position) => (
              <li key={id} className="rail-seg" data-tone={position < index ? 'accent' : position === index ? 'warn' : 'empty'}>
                <span style={{ width: '100%' }} />
              </li>
            ))}
          </ul>

          {/* No card: the question is set on the page, the answer opens
              under it on a hairline. */}
          <div className="mt-8 min-h-48">
            <p className="text-small text-rp-muted">{activeSubject?.name}</p>
            <p className="font-display mt-1 text-2xl font-bold leading-snug text-rp-text sm:text-3xl">{card.front}</p>
            {revealed ? (
              <p className="mt-6 whitespace-pre-wrap border-t border-rp-line pt-4 text-lg leading-relaxed text-rp-text" aria-live="polite">
                {card.back}
              </p>
            ) : (
              <button type="button" onClick={() => setRevealed(true)} className="btn mt-6">{t('Pokaži odgovor')}</button>
            )}
          </div>

          {revealed && (
            <div className="mt-6 grid grid-cols-2 gap-2">
              <button type="button" onClick={() => mark(false)} className="btn btn-lg">{t('Še ne znam')}</button>
              <button type="button" onClick={() => mark(true)} className="btn btn-primary btn-lg">{t('Znam')}</button>
            </div>
          )}
        </section>
      ) : !subjects.length ? (
        <EmptyState
          icon={<CardIcon className="h-5 w-5" />}
          title={t('Najprej dodaj predmet')}
          description={t('Kartice so razvrščene po predmetih.')}
          action={<button type="button" onClick={openNew} className="btn btn-primary">{t('Ustvari predmet')}</button>}
        />
      ) : (
        <section aria-labelledby="deck-heading">
          <div className="mb-2 flex items-baseline justify-between gap-3">
            <h2 id="deck-heading" className="text-subtitle text-rp-text">{activeSubject?.name}</h2>
            {deckCards.length > 0 && (
              <p className="mono text-small text-rp-muted">
                {tn(deckCards.length, cardForms)}, {t('{count} znaš', { count: knownCount })}
              </p>
            )}
          </div>

          {deckCards.length === 0 ? (
            <EmptyState
              icon={<CardIcon className="h-5 w-5" />}
              title={t('Ta predmet še nima kartic')}
              description={t('Začni s 5 do 10 vprašanji, ki se pogosto pojavijo na testih.')}
            />
          ) : (
            <ul className="ledger">
              {deckCards.map((deckCard) => (
                <li key={deckCard.id} className="ledger-row flex items-start gap-3 py-3 pr-1">
                  <div className="min-w-0 flex-1">
                    <p className="text-body font-semibold text-rp-text">{deckCard.front}</p>
                    <p className="mt-0.5 line-clamp-2 text-small text-rp-muted">{deckCard.back}</p>
                  </div>
                  <span className={`mt-0.5 shrink-0 text-small font-semibold ${deckCard.known ? 'text-rp-success' : 'text-rp-muted'}`}>
                    {deckCard.known ? t('Znaš') : t('Učiš se')}
                  </span>
                  <span className="flex shrink-0">
                    <button
                      type="button"
                      onClick={() => { setEditCard(deckCard); setModalOpen(true); }}
                      aria-label={t('Uredi kartico {title}', { title: deckCard.front })}
                      className="btn btn-icon border-transparent bg-transparent text-rp-muted hover:text-rp-text"
                    >
                      <EditIcon className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => { if (window.confirm(t('Izbrišem kartico?'))) deleteCard(deckCard.id); }}
                      aria-label={t('Izbriši kartico {title}', { title: deckCard.front })}
                      className="btn btn-icon border-transparent bg-transparent text-rp-muted hover:!text-rp-danger"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      <FlashcardModal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setEditCard(null); }}
        onSave={(data) => { if (editCard) updateCard(editCard.id, data); else addCard(data); setEditCard(null); }}
        subjects={subjects}
        card={editCard}
        defaultSubjectId={activeDeckId}
      />
    </div>
  );
}
