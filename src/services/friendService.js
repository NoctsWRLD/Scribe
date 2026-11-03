import {
  deleteDoc,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firebaseDb';
import { generateCode, isValidCode, normalizeCode } from '../utils/friendCode';

/**
 * Friend codes live in their own collection so a code can be looked up with a
 * single read and two accounts can never share one.
 *
 * The user's own document keeps the current code, which lets the Firestore
 * rules check that a code document may only be created for the account that
 * owns it.
 */

/** Who owns this code document, if anyone? `null` means the code is unused. */
async function codeOwner(code) {
  const snapshot = await getDoc(doc(db, 'userCodes', code));
  if (!snapshot.exists()) return null;
  return snapshot.data()?.uid || null;
}

/** Write the code into the user's own document, creating it when needed. */
async function storeCodeInProfile(uid, code, profile) {
  const userRef = doc(db, 'users', uid);
  const snapshot = await getDoc(userRef);

  if (!snapshot.exists()) {
    await setDoc(userRef, {
      displayName: profile?.displayName || 'Učenec',
      email: profile?.email || '',
      school: profile?.school || '',
      photoURL: '',
      createdAt: serverTimestamp(),
      friendCode: code,
    });
    return;
  }

  await updateDoc(userRef, { friendCode: code });
}

/**
 * The account's code. It is created on first use and can be replaced from the
 * settings if it leaks.
 */
export async function ensureFriendCode(uid, currentCode, profile) {
  if (currentCode && isValidCode(currentCode)) {
    const owner = await codeOwner(currentCode);
    // The profile may hold a code that was written before this account had a
    // code document, or one that belongs to someone else. Only the first case
    // is repaired; the second one gets the account a code of its own.
    if (owner === uid) return currentCode;
    if (owner === null) {
      await storeCodeInProfile(uid, currentCode, profile);
      await setDoc(doc(db, 'userCodes', currentCode), { uid, createdAt: serverTimestamp() });
      return currentCode;
    }
  }

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const code = generateCode();
    if ((await codeOwner(code)) !== null) continue;

    // The profile knows the code first, so a half-finished write never leaves
    // an account without a usable code.
    await storeCodeInProfile(uid, code, profile);

    // Two devices can ask for a code at the same moment. The profile holds
    // the one that actually stuck, so both runs settle on the same code.
    const stored = (await getDoc(doc(db, 'users', uid))).data()?.friendCode;
    const effective = stored && isValidCode(stored) ? stored : code;

    if ((await codeOwner(effective)) === null) {
      await setDoc(doc(db, 'userCodes', effective), { uid, createdAt: serverTimestamp() });
    }
    return effective;
  }

  throw new Error('Kode prijatelja ni bilo mogoče ustvariti. Poskusi znova.');
}

/**
 * Replace the user's code. The new code is written first, so a failure
 * halfway through never leaves the account without a usable code.
 */
export async function regenerateFriendCode(uid, previousCode, profile) {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const code = generateCode();
    if ((await codeOwner(code)) !== null) continue;

    await storeCodeInProfile(uid, code, profile);
    await setDoc(doc(db, 'userCodes', code), { uid, createdAt: serverTimestamp() });

    if (previousCode && previousCode !== code) {
      try {
        await deleteDoc(doc(db, 'userCodes', previousCode));
      } catch {
        // The old code is harmless on its own: it only points at this account.
      }
    }
    return code;
  }

  throw new Error('Nove kode ni bilo mogoče ustvariti. Poskusi znova.');
}

/**
 * Resolve a code to one person. Returns `null` when the code is unknown, and
 * the profile is missing when the account behind the code no longer exists.
 */
export async function lookupUserByCode(rawCode) {
  const code = normalizeCode(rawCode);
  if (!isValidCode(code)) {
    return { status: 'invalid' };
  }

  const codeDoc = await getDoc(doc(db, 'userCodes', code));
  if (!codeDoc.exists()) {
    return { status: 'not-found' };
  }

  const uid = codeDoc.data()?.uid;
  if (!uid) return { status: 'not-found' };

  const profileDoc = await getDoc(doc(db, 'publicProfiles', uid));
  if (!profileDoc.exists()) {
    return { status: 'gone' };
  }

  return {
    status: 'found',
    user: { uid, ...profileDoc.data() },
  };
}
