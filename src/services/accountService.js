/**
 * The account's own data: export, import, and the deletion that removes both
 * the Firestore documents and the login.
 *
 * Every write goes through the Firestore rules, so the service never needs to
 * widen what a client is allowed to do — it only reads and writes the
 * documents that belong to the signed-in account.
 */
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  where,
  writeBatch,
} from 'firebase/firestore';
import {
  EmailAuthProvider,
  deleteUser,
  reauthenticateWithCredential,
  updatePassword,
  verifyBeforeUpdateEmail,
} from 'firebase/auth';
import { db } from '../firebaseDb';
import { validatePassword } from '../utils/password';

/** Collections that belong to one account and are deleted with it. */
const OWNED_COLLECTIONS = ['subjects', 'tasks', 'exams', 'flashcards', 'focusSessions'];

/** Confirm the current password before a sensitive change. */
export async function reauthenticate(user, password) {
  if (!user?.email) throw new Error('Ta račun nima e-pošte in gesla.');
  await reauthenticateWithCredential(user, EmailAuthProvider.credential(user.email, password));
}

/** Change the e-mail address. Firebase sends a verification link to the new address. */
export async function changeAccountEmail(user, password, newEmail) {
  await reauthenticate(user, password);
  await verifyBeforeUpdateEmail(user, newEmail.trim());
}

/** Change the password. */
export async function changeAccountPassword(user, password, newPassword) {
  // The same rule as registration; Firebase alone would accept 6 characters.
  if (!validatePassword(newPassword).ok) {
    const error = new Error('Password too short');
    error.code = 'auth/weak-password';
    throw error;
  }
  await reauthenticate(user, password);
  await updatePassword(user, newPassword);
}

/**
 * Collect the account's data. The caller decides what to do with the result;
 * nothing leaves the device here.
 */
export function collectAccountData({ account, subjects, tasks, exams, cards, sessions }) {
  return {
    format: 'scribe-export',
    version: 1,
    exportedAt: new Date().toISOString(),
    account: {
      displayName: account.displayName || '',
      email: account.email || '',
      school: account.school || '',
    },
    subjects: subjects.map(({ id, name, colorIndex }) => ({ id, name, colorIndex })),
    tasks: tasks.map(({ id, title, description, subjectId, dueDate, completed }) => ({
      id,
      title,
      description,
      subjectId,
      dueDate,
      completed,
    })),
    exams: exams.map(({ id, title, subjectId, date }) => ({ id, title, subjectId, date })),
    flashcards: cards.map(({ id, subjectId, front, back, known }) => ({ id, subjectId, front, back, known })),
    focusSessions: sessions.map(({ id, minutes, mode, day }) => ({ id, minutes, mode, day })),
  };
}

/**
 * Validate an imported file before anything is written. The check is about
 * shape and size — the Firestore rules check the rest.
 */
export function validateImport(data) {
  if (!data || typeof data !== 'object') {
    return { ok: false, error: 'Datoteka ni v obliki JSON.' };
  }
  if (!Array.isArray(data.subjects) || !Array.isArray(data.tasks)) {
    return { ok: false, error: 'Datoteka nima seznama predmetov in nalog.' };
  }
  if (data.subjects.length > 200 || data.tasks.length > 2000) {
    return { ok: false, error: 'Datoteka vsebuje preveč zapisov.' };
  }
  const badSubject = data.subjects.find(
    (subject) => !subject || typeof subject.name !== 'string' || !subject.name.trim() || subject.name.length > 80,
  );
  if (badSubject) {
    return { ok: false, error: 'En predmet nima imena ali je ime predolgo.' };
  }
  const badTask = data.tasks.find(
    (task) => !task || typeof task.title !== 'string' || !task.title.trim() || task.title.length > 120,
  );
  if (badTask) {
    return { ok: false, error: 'Ena naloga nima naslova ali je naslov predolg.' };
  }
  return { ok: true };
}

/**
 * Write an exported file back into the account. Subjects are written first
 * and keep their old ids, so the tasks still point at the right subject.
 */
export async function importAccountData(uid, data) {
  const subjects = Array.isArray(data.subjects) ? data.subjects : [];
  const tasks = Array.isArray(data.tasks) ? data.tasks : [];
  const exams = Array.isArray(data.exams) ? data.exams : [];
  const cards = Array.isArray(data.flashcards) ? data.flashcards : [];

  const batch = writeBatch(db);

  subjects.forEach((subject) => {
    batch.set(doc(db, 'subjects', subject.id), {
      name: subject.name,
      colorIndex: Number.isInteger(subject.colorIndex) ? subject.colorIndex : 0,
      uid,
      createdAt: serverTimestamp(),
    });
  });

  tasks.forEach((task) => {
    batch.set(doc(db, 'tasks', task.id), {
      title: task.title,
      description: typeof task.description === 'string' ? task.description : '',
      subjectId: typeof task.subjectId === 'string' ? task.subjectId : '',
      dueDate: typeof task.dueDate === 'string' ? task.dueDate : '',
      completed: Boolean(task.completed),
      uid,
      createdAt: serverTimestamp(),
    });
  });

  exams.forEach((exam) => {
    batch.set(doc(db, 'exams', exam.id), {
      title: exam.title,
      subjectId: typeof exam.subjectId === 'string' ? exam.subjectId : '',
      date: typeof exam.date === 'string' ? exam.date : '',
      uid,
      createdAt: serverTimestamp(),
    });
  });

  cards.forEach((card) => {
    batch.set(doc(db, 'flashcards', card.id), {
      subjectId: typeof card.subjectId === 'string' ? card.subjectId : '',
      front: card.front,
      back: card.back,
      known: Boolean(card.known),
      uid,
      createdAt: serverTimestamp(),
    });
  });

  await batch.commit();

  return {
    subjects: subjects.length,
    tasks: tasks.length,
    exams: exams.length,
    flashcards: cards.length,
  };
}

/**
 * Remove every document that belongs to the account: its study data, its
 * requests, its own messages, its friend code and its profile.
 *
 * `chatIds` are the conversations the account takes part in. A group query
 * over every message cannot be proved against the rules, so the chats are
 * visited one by one.
 *
 * Every step is attempted before anything is reported, and a failure that can
 * still be retried throws: the login is only removed once the data is gone,
 * because a document whose owner no longer exists can never be deleted again.
 */
export async function deleteAccountData(uid, chatIds = []) {
  // Read the code before the profile that names it is deleted.
  const profile = await getDoc(doc(db, 'users', uid));
  const friendCode = profile.exists() ? profile.data()?.friendCode : null;

  for (const name of OWNED_COLLECTIONS) {
    const snapshot = await getDocs(query(collection(db, name), where('uid', '==', uid)));
    await Promise.all(snapshot.docs.map((document) => deleteDoc(document.ref)));
  }

  const outgoing = await getDocs(
    query(collection(db, 'friendRequests'), where('fromUid', '==', uid)),
  );
  await Promise.all(outgoing.docs.map((document) => deleteDoc(document.ref)));

  const incoming = await getDocs(
    query(collection(db, 'friendRequests'), where('toUid', '==', uid)),
  );
  await Promise.all(incoming.docs.map((document) => deleteDoc(document.ref)));

  // Only the messages this account wrote are removed — the other person's
  // messages stay with them. A channel the account never joined answers with
  // permission-denied; that is not a failure, there is nothing there to remove.
  const failedChats = [];
  for (const chatId of chatIds) {
    if (!chatId) continue;
    try {
      const messages = await getDocs(
        query(collection(db, 'chats', chatId, 'messages'), where('senderId', '==', uid)),
      );
      await Promise.all(messages.docs.map((document) => deleteDoc(document.ref)));
    } catch (error) {
      if (error?.code !== 'permission-denied') failedChats.push(chatId);
      else console.warn(`Sporočil v klepetu ${chatId} ni bilo mogoče prebrati:`, error);
    }
  }

  if (failedChats.length) {
    const error = new Error('Nekaterih sporočil ni bilo mogoče izbrisati.');
    error.code = 'app/account-delete-messages';
    throw error;
  }

  if (friendCode) {
    // The code points at an account that is about to stop existing, and no
    // one could ever reclaim it afterwards.
    await deleteDoc(doc(db, 'userCodes', friendCode)).catch((error) => {
      console.warn('Kode prijatelja ni bilo mogoče izbrisati:', error);
    });
  }

  await deleteDoc(doc(db, 'publicProfiles', uid));
  await deleteDoc(doc(db, 'users', uid));
}

/**
 * Delete the account for good: the data first, then the login. If the login
 * cannot be removed, the data is already gone and the error says so.
 */
export async function deleteAccount(user, password, chatIds = []) {
  const hasPassword = user?.providerData?.some((provider) => provider.providerId === 'password');
  if (hasPassword && !password) {
    // Deleting the login needs a recent sign-in, so the data must not go
    // first: without the password the account could not be removed at all.
    const error = new Error('Za brisanje računa je potrebno geslo.');
    error.code = 'app/account-delete-no-password';
    throw error;
  }
  if (password) await reauthenticate(user, password);
  await deleteAccountData(user.uid, chatIds);
  await deleteUser(user);
}

/** A fresh subject, used when a new account is created from an import. */
export async function createSubject(uid, { name, colorIndex = 0 }) {
  const created = await addDoc(collection(db, 'subjects'), {
    name,
    colorIndex,
    uid,
    createdAt: serverTimestamp(),
  });
  return created.id;
}
