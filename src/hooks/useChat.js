import { useState, useEffect, useMemo } from 'react';
import {
  collection, query, orderBy, limit, where, startAt, endAt,
  onSnapshot, addDoc, deleteDoc, doc, updateDoc, setDoc, getDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firebaseDb';
import { useAuth } from '../contexts/AuthContext';
import { requestPairId } from '../utils/friendCode';

// ─── User profile (Firestore) ─────────────────────────────────────────────────
export function useUserProfile(uid) {
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    if (!uid) return;
    const unsub = onSnapshot(doc(db, 'users', uid), (snap) => {
      if (snap.exists()) setProfile({ uid: snap.id, ...snap.data() });
    });
    return unsub;
  }, [uid]);

  return { profile };
}

// ─── Messages ─────────────────────────────────────────────────────────────────
export function useMessages(chatId) {
  const [messageState, setMessageState] = useState({ chatId: null, messages: [], loading: true });

  useEffect(() => {
    if (!chatId) return undefined;
    // The newest 200, not the oldest: an ascending query with a limit stops
    // showing new messages once a channel passes the limit. The page reads
    // top to bottom, so the result is reversed after it arrives.
    const q = query(
      collection(db, 'chats', chatId, 'messages'),
      orderBy('timestamp', 'desc'),
      limit(200)
    );
    const unsub = onSnapshot(q,
      (snap) => setMessageState({
        chatId,
        messages: snap.docs.map((d) => ({ id: d.id, ...d.data() })).reverse(),
        loading: false,
      }),
      (err) => { console.error('useMessages:', err); setMessageState({ chatId, messages: [], loading: false }); }
    );
    return unsub;
  }, [chatId]);

  if (messageState.chatId !== chatId) return { messages: [], loading: Boolean(chatId) };
  return { messages: messageState.messages, loading: messageState.loading };
}

// ─── All users (for search in Profile) ───────────────────────────────────────
export function useAllUsers(searchTerm = '') {
  const { currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const normalizedSearch = searchTerm.trim().toLocaleLowerCase('sl-SI');

  useEffect(() => {
    if (!currentUser || normalizedSearch.length < 2) return undefined;
    const unsub = onSnapshot(
      query(
        collection(db, 'publicProfiles'),
        orderBy('searchName'),
        startAt(normalizedSearch),
        endAt(`${normalizedSearch}\uf8ff`),
        limit(20),
      ),
      (snap) => {
        setUsers(
          snap.docs
            .map((d) => ({ uid: d.id, ...d.data() }))
            .filter((u) => u.uid !== currentUser.uid)
        );
      },
      (err) => {
        console.error("Napaka pri pridobivanju uporabnikov:", err);
      }
    );
    return unsub;
  }, [currentUser, normalizedSearch]);

  // A term that became too short must not keep showing the last results.
  return { users: normalizedSearch.length >= 2 ? users : [] };
}

// ─── Friends (accepted requests) ──────────────────────────────────────────────
/**
 * A friendship is one accepted request document. The document id is derived
 * from the two uids, so a pair can only ever have one request — accepting,
 * rejecting or deleting it is the same operation for both sides.
 */
export function useFriends() {
  const { currentUser } = useAuth();
  const [sent, setSent] = useState({});
  const [received, setReceived] = useState({});

  useEffect(() => {
    if (!currentUser) return undefined;
    const uid = currentUser.uid;

    const qSent = query(
      collection(db, 'friendRequests'),
      where('fromUid', '==', uid),
      where('status', '==', 'accepted')
    );
    const qRecv = query(
      collection(db, 'friendRequests'),
      where('toUid', '==', uid),
      where('status', '==', 'accepted')
    );

    const toMap = (snapshot) => {
      const map = {};
      snapshot.docs.forEach((doc) => {
        map[doc.id] = { id: doc.id, ...doc.data() };
      });
      return map;
    };

    const unsubSent = onSnapshot(
      qSent,
      (snap) => setSent(toMap(snap)),
      (err) => console.error('useFriends (poslano):', err),
    );
    const unsubRecv = onSnapshot(
      qRecv,
      (snap) => setReceived(toMap(snap)),
      (err) => console.error('useFriends (prejeto):', err),
    );

    return () => { unsubSent(); unsubRecv(); };
  }, [currentUser]);

  const friends = useMemo(() => {
    const list = [];
    Object.values(sent).forEach((request) => {
      list.push({ uid: request.toUid, displayName: request.toName, requestId: request.id });
    });
    Object.values(received).forEach((request) => {
      list.push({ uid: request.fromUid, displayName: request.fromName, requestId: request.id });
    });
    return list;
  }, [sent, received]);

  return { friends };
}

// ─── Incoming friend requests (pending) ──────────────────────────────────────
export function useFriendRequests() {
  const { currentUser } = useAuth();
  const [requests, setRequests] = useState([]);

  useEffect(() => {
    if (!currentUser) return;
    const q = query(
      collection(db, 'friendRequests'),
      where('toUid', '==', currentUser.uid),
      where('status', '==', 'pending')
    );
    const unsub = onSnapshot(q, (snap) => {
      setRequests(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return unsub;
  }, [currentUser]);

  return { requests };
}

// ─── Sent pending requests ────────────────────────────────────────────────────
export function useSentRequests() {
  const { currentUser } = useAuth();
  const [sent, setSent] = useState([]);

  useEffect(() => {
    if (!currentUser) return;
    const q = query(
      collection(db, 'friendRequests'),
      where('fromUid', '==', currentUser.uid),
      where('status', '==', 'pending')
    );
    const unsub = onSnapshot(q, (snap) => {
      setSent(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return unsub;
  }, [currentUser]);

  return { sent };
}

// ─── The account's own friend code ────────────────────────────────────────────
/**
 * Every account has one code. It is created on first use and can be replaced
 * from the settings if it leaks.
 */
export function useFriendCode(currentUser, savedCode, profile) {
  const [code, setCode] = useState(savedCode || '');
  const [loading, setLoading] = useState(Boolean(currentUser?.uid));
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!currentUser?.uid) {
      setLoading(false);
      return undefined;
    }
    let cancelled = false;

    (async () => {
      try {
        const { ensureFriendCode } = await import('../services/friendService');
        const result = await ensureFriendCode(currentUser.uid, savedCode, profile);
        if (!cancelled) {
          setCode(result);
          setError(null);
        }
      } catch (err) {
        console.error('Koda prijatelja ni bila ustvarjena:', err);
        if (!cancelled) setError('Kode prijatelja trenutno ni mogoče ustvariti.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [currentUser?.uid, savedCode, profile]);

  const regenerate = useMemo(() => async () => {
    const { regenerateFriendCode } = await import('../services/friendService');
    const next = await regenerateFriendCode(currentUser.uid, code, profile);
    setCode(next);
    return next;
  }, [currentUser?.uid, code, profile]);

  return { code, loading, error, regenerate };
}

// ─── Send friend request ──────────────────────────────────────────────────────
/**
 * One request per pair. The document id is derived from the two uids, so a
 * second attempt collides with the first one instead of creating a duplicate.
 * The names are read from the server-side profiles, so a request cannot carry
 * a name the sender made up.
 */
export async function sendFriendRequest(fromUser, toUid, toName) {
  if (!fromUser?.uid || !toUid) return { ok: false, reason: 'invalid' };
  if (fromUser.uid === toUid) return { ok: false, reason: 'self' };

  // The rules compare the names with the profiles on the server, so the
  // request carries exactly those names — never a name typed by hand.
  const [senderProfile, targetProfile] = await Promise.all([
    getDoc(doc(db, 'publicProfiles', fromUser.uid)),
    getDoc(doc(db, 'publicProfiles', toUid)),
  ]);
  const fromName = senderProfile.exists()
    ? senderProfile.data()?.displayName
    : fromUser.displayName || 'Učenec';
  const resolvedToName = targetProfile.exists()
    ? targetProfile.data()?.displayName
    : toName || 'Učenec';

  // The document id is derived from the two accounts, so a second attempt
  // collides with the first one instead of creating a duplicate. The rules
  // refuse that collision, and the refusal is the answer: the request is
  // already there.
  const requestId = requestPairId(fromUser.uid, toUid);
  const requestRef = doc(db, 'friendRequests', requestId);

  try {
    await setDoc(requestRef, {
      fromUid: fromUser.uid,
      fromName,
      toUid,
      toName: resolvedToName,
      status: 'pending',
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    if (error.code === 'permission-denied') {
      return { ok: false, reason: 'exists' };
    }
    throw error;
  }

  return { ok: true, requestId };
}

// ─── Respond to friend request ────────────────────────────────────────────────
export async function respondToRequest(reqId, status) {
  await updateDoc(doc(db, 'friendRequests', reqId), { status });
}

// ─── Withdraw a request, or end a friendship ──────────────────────────────────
/**
 * Deleting the request document is what ends a friendship: both sides watch
 * the same document, so the friend disappears for the other person too.
 */
export async function deleteFriendRequest(reqId) {
  await deleteDoc(doc(db, 'friendRequests', reqId));
}

// ─── Send text message ────────────────────────────────────────────────────────
export async function sendMessage(chatId, user, text, fileData = null) {
  const clean = text.trim().slice(0, 2000);
  if (!clean && !fileData) return;
  const senderName = user.displayName || 'Učenec';

  await addDoc(collection(db, 'chats', chatId, 'messages'), {
    text: clean,
    senderId: user.uid,
    senderName,
    senderInitial: (senderName[0] || '?').toUpperCase(),
    timestamp: serverTimestamp(),
    ...(fileData || {}),
  });
}


// ─── Delete message ───────────────────────────────────────────────────────────
export async function deleteMessage(chatId, msgId) {
  await deleteDoc(doc(db, 'chats', chatId, 'messages', msgId));
}

// ─── DM chat ID (alphabetically sorted UIDs) ─────────────────────────────────
export function getDmChatId(uid1, uid2) {
  return [uid1, uid2].sort().join('_');
}
