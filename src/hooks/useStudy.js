import { useState, useEffect, useMemo } from 'react';
import {
  collection, query, where,
  onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firebaseDb';
import { useAuth } from '../contexts/AuthContext';

function reportWriteError(action, error) {
  console.error(`${action} failed:`, error);
  window.alert('Shranjevanje ni uspelo. Preveri povezavo in dostop do Firebase ter poskusi znova.');
}

function useUserCollection(name) {
  const { currentUser } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!currentUser) return;
    const q = query(collection(db, name), where('uid', '==', currentUser.uid));
    const unsub = onSnapshot(
      q,
      (snap) => {
        setItems(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setError(null);
        setLoading(false);
      },
      (err) => {
        console.error(`${name} error:`, err);
        setError('Podatki se naložijo z napako. Preveri povezavo in poskusi znova.');
        setLoading(false);
      },
    );
    return unsub;
  }, [currentUser, name]);

  return { items, loading, error };
}

/* Preverjanja: { title, subjectId, date: 'YYYY-MM-DD', uid, createdAt } */
export function useExams() {
  const { currentUser } = useAuth();
  const { items: raw, loading, error } = useUserCollection('exams');
  const exams = useMemo(() => [...raw].sort((a, b) => (a.date || '').localeCompare(b.date || '')), [raw]);

  async function addExam(data) {
    try {
      const created = await addDoc(collection(db, 'exams'), { ...data, uid: currentUser.uid, createdAt: serverTimestamp() });
      return created.id;
    } catch (err) { reportWriteError('Adding exam', err); return null; }
  }
  async function updateExam(id, data) {
    try { await updateDoc(doc(db, 'exams', id), data); }
    catch (err) { reportWriteError('Updating exam', err); }
  }
  async function deleteExam(id) {
    try { await deleteDoc(doc(db, 'exams', id)); }
    catch (err) { reportWriteError('Deleting exam', err); }
  }
  return { exams, loading, error, addExam, updateExam, deleteExam };
}

/* Calendar events: { title, date, startTime, description, uid, createdAt } */
export function useScheduleEvents() {
  const { currentUser } = useAuth();
  const { items: raw, loading, error } = useUserCollection('scheduleEvents');
  const events = useMemo(
    () => [...raw].sort((a, b) => `${a.date || ''}${a.startTime || ''}`.localeCompare(`${b.date || ''}${b.startTime || ''}`)),
    [raw],
  );

  async function addEvent(data) {
    try {
      const created = await addDoc(collection(db, 'scheduleEvents'), { ...data, uid: currentUser.uid, createdAt: serverTimestamp() });
      return created.id;
    } catch (err) { reportWriteError('Adding schedule event', err); return null; }
  }
  async function updateEvent(id, data) {
    try { await updateDoc(doc(db, 'scheduleEvents', id), data); }
    catch (err) { reportWriteError('Updating schedule event', err); }
  }
  async function deleteEvent(id) {
    try { await deleteDoc(doc(db, 'scheduleEvents', id)); }
    catch (err) { reportWriteError('Deleting schedule event', err); }
  }
  return { events, loading, error, addEvent, updateEvent, deleteEvent };
}

/* Kartice: { subjectId, front, back, known, uid, createdAt } */
export function useFlashcards() {
  const { currentUser } = useAuth();
  const { items: rawCards, loading, error } = useUserCollection('flashcards');
  const cards = useMemo(
    () => [...rawCards].sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)),
    [rawCards],
  );

  async function addCard(data) {
    try {
      const created = await addDoc(collection(db, 'flashcards'), { ...data, known: false, uid: currentUser.uid, createdAt: serverTimestamp() });
      return created.id;
    } catch (err) { reportWriteError('Adding card', err); return null; }
  }
  async function updateCard(id, data) {
    try { await updateDoc(doc(db, 'flashcards', id), data); }
    catch (err) { reportWriteError('Updating card', err); }
  }
  async function deleteCard(id) {
    try { await deleteDoc(doc(db, 'flashcards', id)); }
    catch (err) { reportWriteError('Deleting card', err); }
  }
  return { cards, loading, error, addCard, updateCard, deleteCard };
}

/* Fokus: { minutes, mode: 'focus'|'break', day: 'YYYY-MM-DD', uid, createdAt } */
export function useFocusSessions() {
  const { currentUser } = useAuth();
  const { items: sessions, loading, error } = useUserCollection('focusSessions');

  async function logSession({ minutes, mode, day }) {
    try {
      await addDoc(collection(db, 'focusSessions'), { minutes, mode, day, uid: currentUser.uid, createdAt: serverTimestamp() });
    } catch (err) { reportWriteError('Logging focus session', err); }
  }
  return { sessions, loading, error, logSession };
}
