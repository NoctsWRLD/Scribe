import { useState, useEffect } from 'react';
import {
  collection, query, where,
  onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, writeBatch,
} from 'firebase/firestore';
import { db } from '../firebaseDb';
import { useAuth } from '../contexts/AuthContext';

function reportWriteError(action, error) {
  console.error(`${action} failed:`, error);
  window.alert('Shranjevanje ni uspelo. Preveri povezavo in dostop do Firebase ter poskusi znova.');
}

export function useSubjects() {
  const { currentUser } = useAuth();
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!currentUser) return;
    const q = query(
      collection(db, 'subjects'),
      where('uid', '==', currentUser.uid)
    );
    const unsub = onSnapshot(
      q,
      snap => {
        const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        // Sort by createdAt ascending on the client to avoid composite index requirement
        docs.sort((a, b) => (a.createdAt?.seconds || 0) - (b.createdAt?.seconds || 0));
        setSubjects(docs);
        setLoading(false);
      },
      err => {
        console.error('UseSubjects error:', err);
        setError('Predmeti se naložijo z napako. Preveri povezavo in poskusi znova.');
        setLoading(false);
      }
    );
    return unsub;
  }, [currentUser]);

  async function addSubject(data) {
    try {
      const created = await addDoc(collection(db, 'subjects'), {
        ...data,
        uid: currentUser.uid,
        createdAt: serverTimestamp(),
      });
      return created.id;
    } catch (err) {
      reportWriteError('Adding subject', err);
      return null;
    }
  }

  async function updateSubject(id, data) {
    try {
      await updateDoc(doc(db, 'subjects', id), data);
    } catch (err) {
      reportWriteError('Updating subject', err);
    }
  }

  async function deleteSubject(id) {
    try {
      await deleteDoc(doc(db, 'subjects', id));
    } catch (err) {
      reportWriteError('Deleting subject', err);
    }
  }

  return { subjects, loading, error, addSubject, updateSubject, deleteSubject };
}

export function useTasks() {
  const { currentUser } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!currentUser) return;
    const q = query(
      collection(db, 'tasks'),
      where('uid', '==', currentUser.uid)
    );
    const unsub = onSnapshot(
      q,
      snap => {
        const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        // Sort by createdAt descending on the client to avoid composite index requirement
        docs.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
        setTasks(docs);
        setLoading(false);
      },
      err => {
        console.error('UseTasks error:', err);
        setError('Naloge se naložijo z napako. Preveri povezavo in poskusi znova.');
        setLoading(false);
      }
    );
    return unsub;
  }, [currentUser]);

  async function addTask(data) {
    try {
      await addDoc(collection(db, 'tasks'), {
        ...data,
        completed: false,
        uid: currentUser.uid,
        createdAt: serverTimestamp(),
      });
    } catch (err) {
      reportWriteError('Adding task', err);
    }
  }

  async function updateTask(id, data) {
    try {
      await updateDoc(doc(db, 'tasks', id), data);
    } catch (err) {
      reportWriteError('Updating task', err);
    }
  }

  async function toggleTask(task) {
    try {
      await updateDoc(doc(db, 'tasks', task.id), { completed: !task.completed });
    } catch (err) {
      reportWriteError('Toggling task', err);
    }
  }

  async function deleteTask(id) {
    try {
      await deleteDoc(doc(db, 'tasks', id));
    } catch (err) {
      reportWriteError('Deleting task', err);
    }
  }

  async function addTasks(rows) {
    try {
      for (let i = 0; i < rows.length; i += 400) {
        const batch = writeBatch(db);
        for (const data of rows.slice(i, i + 400)) {
          batch.set(doc(collection(db, 'tasks')), {
            ...data,
            completed: false,
            uid: currentUser.uid,
            createdAt: serverTimestamp(),
          });
        }
        await batch.commit();
      }
    } catch (err) {
      reportWriteError('Adding tasks', err);
    }
  }

  /**
   * Mark several tasks done (or open again) in one write. A batch either
   * lands completely or not at all, so a dropped connection never leaves half
   * of a selection ticked.
   */
  async function setTasksCompleted(ids, completed) {
    if (!ids.length) return true;
    try {
      for (let i = 0; i < ids.length; i += 400) {
        const batch = writeBatch(db);
        for (const id of ids.slice(i, i + 400)) {
          batch.update(doc(db, 'tasks', id), { completed: Boolean(completed) });
        }
        await batch.commit();
      }
      return true;
    } catch (err) {
      reportWriteError('Completing tasks', err);
      return false;
    }
  }

  async function deleteTasks(ids) {
    if (!ids.length) return true;
    try {
      for (let i = 0; i < ids.length; i += 400) {
        const batch = writeBatch(db);
        for (const id of ids.slice(i, i + 400)) batch.delete(doc(db, 'tasks', id));
        await batch.commit();
      }
      return true;
    } catch (err) {
      reportWriteError('Deleting tasks', err);
      return false;
    }
  }

  return {
    tasks, loading, error,
    addTask, addTasks, updateTask, toggleTask, deleteTask, setTasksCompleted, deleteTasks,
  };
}
