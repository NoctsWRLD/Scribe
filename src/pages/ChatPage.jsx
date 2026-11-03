import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useMessages, useFriends, sendMessage, deleteMessage, getDmChatId } from '../hooks/useChat';
import { useSubjects } from '../hooks/useFirestore';
import { useAuth } from '../contexts/AuthContext';
import { useI18n } from '../i18n';
import { safeHttpsUrl } from '../utils/safeUrl';
import { schoolChatId, subjectChatId } from '../utils/chatChannels';
import { ChatIcon, MenuIcon, PlusIcon, TrashIcon, XIcon } from '../components/icons';

/** Messages closer together than this, from the same person, share a header. */
const GROUP_GAP_MS = 5 * 60 * 1000;

function toMillis(timestamp) {
  return timestamp?.toMillis ? timestamp.toMillis() : null;
}

function Initial({ name, className = '' }) {
  return (
    <span
      className={`grid h-8 w-8 shrink-0 place-items-center rounded-full bg-rp-overlay text-small font-bold text-rp-text ${className}`}
      aria-hidden="true"
    >
      {(name?.[0] || '?').toUpperCase()}
    </span>
  );
}

/** An attachment from an older version of the app. Only https is rendered. */
function Attachment({ msg, isOwn }) {
  const href = safeHttpsUrl(msg.fileURL);
  if (!href) return null;
  const name = typeof msg.fileName === 'string' ? msg.fileName.slice(0, 120) : 'file';
  if (typeof msg.fileType === 'string' && msg.fileType.startsWith('image/')) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className="mt-1 block">
        <img src={href} alt={name} loading="lazy" className="max-h-60 max-w-[min(15rem,100%)] rounded-md" />
      </a>
    );
  }
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`mt-1 inline-block max-w-full truncate rounded-md px-3 py-2 text-small font-medium underline underline-offset-2 ${
        isOwn ? 'bg-rp-mark text-rp-mark-ink' : 'bg-rp-raised text-rp-text'
      }`}
    >
      {name}
    </a>
  );
}

function Message({ msg, isOwn, showHeader, timeLabel, onDelete }) {
  const { t } = useI18n();
  return (
    <li className={`group flex gap-2.5 ${isOwn ? 'flex-row-reverse' : ''} ${showHeader ? 'mt-4 first:mt-0' : 'mt-1'}`}>
      {/* Others get an initial on the first message of a run; own messages
          need none — the side and the colour already say who wrote them. */}
      {!isOwn && (showHeader ? <Initial name={msg.senderName} /> : <span className="w-8 shrink-0" aria-hidden="true" />)}
      <div className={`flex min-w-0 max-w-[82%] flex-col md:max-w-[68%] ${isOwn ? 'items-end' : 'items-start'}`}>
        {showHeader && (
          <p className={`mb-1 flex items-baseline gap-2 text-small ${isOwn ? 'flex-row-reverse' : ''}`}>
            {!isOwn && <span className="font-semibold text-rp-subtle">{msg.senderName}</span>}
            <span className="mono text-[11px] text-rp-muted">{timeLabel}</span>
          </p>
        )}
        <div className={`flex max-w-full items-center gap-1 ${isOwn ? 'flex-row-reverse' : ''}`}>
          <div className="min-w-0 max-w-full">
            {msg.text && (
              <p
                className={`whitespace-pre-wrap break-words rounded-lg px-3.5 py-2 text-body ${
                  isOwn ? 'rounded-br-xs bg-rp-mark text-rp-mark-ink' : 'rounded-bl-xs bg-rp-raised text-rp-text'
                }`}
              >
                {msg.text}
              </p>
            )}
            {msg.fileURL && <Attachment msg={msg} isOwn={isOwn} />}
          </div>
          {isOwn && (
            <button
              type="button"
              onClick={() => onDelete(msg.id)}
              className="btn btn-icon shrink-0 border-transparent bg-transparent text-rp-muted opacity-0 transition-opacity hover:!text-rp-danger focus-visible:opacity-100 group-hover:opacity-100 [@media(pointer:coarse)]:opacity-60"
              aria-label={t('Izbriši sporočilo')}
            >
              <TrashIcon className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>
    </li>
  );
}

function MessageList({ chatId, currentUser }) {
  const { t, localeTag } = useI18n();
  const { messages, loading } = useMessages(chatId);
  const scrollRef = useRef(null);

  // Stay at the newest message. Layout effect, so the list never paints at
  // the top first and then jumps.
  useLayoutEffect(() => {
    const element = scrollRef.current;
    if (element) element.scrollTop = element.scrollHeight;
  }, [messages, chatId]);

  if (loading) {
    return (
      <div className="flex-1 space-y-3 px-4 py-4" aria-busy="true">
        <div className="skel h-9 w-2/3" />
        <div className="skel ml-auto h-9 w-1/2" />
        <div className="skel h-9 w-3/5" />
      </div>
    );
  }

  if (!messages.length) {
    return (
      <div className="flex flex-1 flex-col justify-end px-4 pb-6">
        <p className="max-w-sm text-body text-rp-muted">{t('Tukaj še ni sporočil. Napiši prvo.')}</p>
      </div>
    );
  }

  const timeFormat = new Intl.DateTimeFormat(localeTag, { timeZone: 'Europe/Ljubljana', hour: '2-digit', minute: '2-digit' });

  return (
    <div ref={scrollRef} className="flex-1 overflow-y-auto overflow-x-hidden overscroll-contain px-4 py-4">
      <ol aria-label={t('Sporočila')} aria-live="polite" aria-relevant="additions">
        {messages.map((msg, index) => {
          const previous = messages[index - 1];
          const at = toMillis(msg.timestamp);
          const showHeader =
            !previous ||
            previous.senderId !== msg.senderId ||
            (at && toMillis(previous.timestamp) && at - toMillis(previous.timestamp) > GROUP_GAP_MS);
          return (
            <Message
              key={msg.id}
              msg={msg}
              isOwn={msg.senderId === currentUser.uid}
              showHeader={Boolean(showHeader)}
              timeLabel={at ? timeFormat.format(new Date(at)) : t('zdaj')}
              onDelete={(id) => {
                if (window.confirm(t('Izbrišem to sporočilo?'))) deleteMessage(chatId, id);
              }}
            />
          );
        })}
      </ol>
    </div>
  );
}

/**
 * The composer. It takes focus as soon as a conversation opens — opening a
 * chat means you are about to write — and keeps it after sending.
 */
function Composer({ chatId, currentUser, roomName, autoFocus }) {
  const { t } = useI18n();
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [failed, setFailed] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (autoFocus) inputRef.current?.focus({ preventScroll: true });
  }, [chatId, autoFocus]);

  // Grow with the text up to five lines, then scroll inside.
  useLayoutEffect(() => {
    const element = inputRef.current;
    if (!element) return;
    element.style.height = 'auto';
    element.style.height = `${Math.min(element.scrollHeight, 128)}px`;
  }, [text]);

  async function send(event) {
    event?.preventDefault();
    if (!text.trim() || sending) return;
    setSending(true);
    setFailed(false);
    try {
      await sendMessage(chatId, currentUser, text);
      setText('');
    } catch (error) {
      console.error('Sporočilo ni bilo poslano:', error);
      setFailed(true);
    } finally {
      setSending(false);
      inputRef.current?.focus({ preventScroll: true });
    }
  }

  return (
    <form onSubmit={send} className="shrink-0 border-t border-rp-line bg-rp-canvas px-3 py-2.5 md:px-4">
      {failed && (
        <p className="mb-2 text-small text-rp-danger" role="alert">{t('Sporočilo ni bilo poslano. Poskusi znova.')}</p>
      )}
      <div className="flex items-end gap-2">
        <label htmlFor="chat-composer" className="sr-only">{t('Sporočilo za {room}', { room: roomName })}</label>
        <textarea
          id="chat-composer"
          ref={inputRef}
          value={text}
          onChange={(event) => setText(event.target.value.slice(0, 2000))}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) send(event);
          }}
          placeholder={t('Sporočilo za {room}', { room: roomName })}
          rows={1}
          enterKeyHint="send"
          className="field min-h-11 flex-1 resize-none !py-2.5 leading-snug"
        />
        <button type="submit" disabled={!text.trim() || sending} className="btn btn-primary min-h-11 shrink-0">
          {sending ? t('Pošiljam…') : t('Pošlji')}
        </button>
      </div>
    </form>
  );
}

function RoomButton({ label, active, onClick, marker }) {
  return (
    <li>
      <button
        type="button"
        onClick={onClick}
        aria-current={active ? 'true' : undefined}
        className={`relative flex min-h-11 w-full items-center gap-2.5 px-3 text-left text-body transition-colors ${
          active ? 'font-semibold text-rp-accent' : 'text-rp-subtle hover:bg-rp-overlay hover:text-rp-text'
        }`}
      >
        {active && <span className="absolute left-0 top-1/2 h-4 w-[3px] -translate-y-1/2 rounded-full bg-rp-accent" aria-hidden="true" />}
        <span className="w-4 shrink-0 text-center text-rp-muted" aria-hidden="true">{marker}</span>
        <span className="truncate">{label}</span>
      </button>
    </li>
  );
}

function RoomList({ rooms, activeChatId, onSelect }) {
  const { t } = useI18n();
  const navigate = useNavigate();
  const groups = [
    { key: 'channels', label: t('Kanali'), items: rooms.filter((room) => room.kind !== 'dm') },
    { key: 'dm', label: t('Prijatelji'), items: rooms.filter((room) => room.kind === 'dm') },
  ];
  return (
    <nav aria-label={t('Pogovori')} className="flex h-full flex-col overflow-y-auto py-3">
      {groups.map((group) => (
        <div key={group.key} className="mb-4">
          <h2 className="mb-1 px-3 text-small font-semibold text-rp-muted">{group.label}</h2>
          {group.items.length === 0 ? (
            <button type="button" onClick={() => navigate('/friends')} className="link-signal ml-1.5">
              {t('Dodaj prijatelja')}
            </button>
          ) : (
            <ul>
              {group.items.map((room) => (
                <RoomButton
                  key={room.id}
                  label={room.name}
                  marker={room.kind === 'dm' ? (room.name[0] || '?').toUpperCase() : '#'}
                  active={room.id === activeChatId}
                  onClick={() => onSelect(room)}
                />
              ))}
            </ul>
          )}
        </div>
      ))}
      <div className="mt-auto px-3">
        <button type="button" onClick={() => navigate('/friends')} className="btn btn-sm w-full">
          <PlusIcon className="h-4 w-4" />
          {t('Prijatelji')}
        </button>
      </div>
    </nav>
  );
}

export default function ChatPage() {
  const { t } = useI18n();
  const { currentUser, userProfile } = useAuth();
  const { subjects } = useSubjects();
  const { friends } = useFriends();
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedId, setSelectedId] = useState('general');
  const [listOpen, setListOpen] = useState(false);

  const school = userProfile?.school?.trim();
  const rooms = [
    { id: 'general', name: t('Splošni'), kind: 'channel', type: t('Skupni kanal') },
    ...subjects.map((subject) => ({
      id: subjectChatId(subject.name),
      name: subject.name,
      kind: 'channel',
      type: t('Kanal predmeta'),
    })),
    ...(school
      ? [{ id: schoolChatId(school), name: school, kind: 'channel', type: t('Šolski kanal') }]
      : []),
    ...friends.map((friend) => ({
      id: getDmChatId(currentUser.uid, friend.uid),
      uid: friend.uid,
      name: friend.displayName || t('Učenec'),
      kind: 'dm',
      type: t('Zasebni pogovor'),
    })),
  ];

  // /chat?dm=<uid> opens a conversation with a friend straight from the
  // friends page.
  const dmUid = searchParams.get('dm');
  const dmRoom = dmUid ? rooms.find((room) => room.uid === dmUid) : null;
  const active = dmRoom || rooms.find((room) => room.id === selectedId) || rooms[0];

  function select(room) {
    setSelectedId(room.id);
    if (dmUid) setSearchParams({}, { replace: true });
    setListOpen(false);
  }

  useEffect(() => {
    if (!listOpen) return undefined;
    function onKey(event) {
      if (event.key === 'Escape') setListOpen(false);
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [listOpen]);

  return (
    <div className="flex min-h-0 flex-1">
      <aside className="hidden w-60 shrink-0 border-r border-rp-line md:block">
        <RoomList rooms={rooms} activeChatId={active.id} onSelect={select} />
      </aside>

      {listOpen && (
        <div className="fixed inset-0 z-50 flex flex-col bg-rp-canvas md:hidden" role="dialog" aria-modal="true" aria-label={t('Pogovori')}>
          <div className="flex items-center justify-between border-b border-rp-line px-4 py-2">
            <p className="text-subtitle text-rp-text">{t('Pogovori')}</p>
            <button
              type="button"
              onClick={() => setListOpen(false)}
              aria-label={t('Zapri')}
              className="btn btn-icon border-transparent bg-transparent"
            >
              <XIcon className="h-5 w-5" />
            </button>
          </div>
          <div className="min-h-0 flex-1">
            <RoomList rooms={rooms} activeChatId={active.id} onSelect={select} />
          </div>
        </div>
      )}

      <section className="flex min-w-0 flex-1 flex-col" aria-label={active.name}>
        <header className="flex shrink-0 items-center gap-2 border-b border-rp-line px-2 py-2 md:px-4">
          <button
            type="button"
            onClick={() => setListOpen(true)}
            aria-label={t('Vsi pogovori')}
            className="btn btn-icon border-transparent bg-transparent md:hidden"
          >
            <MenuIcon className="h-5 w-5" />
          </button>
          <ChatIcon className="hidden h-4 w-4 shrink-0 text-rp-muted md:block" />
          <div className="min-w-0">
            <h1 className="truncate text-body font-semibold text-rp-text">{active.name}</h1>
            <p className="text-small text-rp-muted">{active.type}</p>
          </div>
        </header>

        <MessageList chatId={active.id} currentUser={currentUser} />
        <Composer chatId={active.id} currentUser={currentUser} roomName={active.name} autoFocus={!listOpen} />
      </section>
    </div>
  );
}
