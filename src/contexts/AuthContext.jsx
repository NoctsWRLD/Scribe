import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { app, isFirebaseConfigured } from '../firebase';

/**
 * The authentication SDK is loaded on demand.
 *
 * A visitor who only reads the landing page never downloads the login code:
 * the chunk is fetched when the session is actually resolved, so the public
 * page is not paying for it.
 */
let authPromise = null;

async function getAuthInstance() {
  if (!isFirebaseConfigured) return null;
  if (!authPromise) {
    authPromise = (async () => {
      const { getAuth } = await import('firebase/auth');
      return app ? getAuth(app) : null;
    })();
  }
  return authPromise;
}

const AuthContext = createContext(null);

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [sessionResolved, setSessionResolved] = useState(false);
  const authRef = useRef(null);

  async function register(email, password, displayName) {
    const auth = await getAuthInstance();
    const { createUserWithEmailAndPassword, updateProfile } = await import('firebase/auth');
    const result = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(result.user, { displayName });
    try {
      const { createUserProfile } = await import('../services/profileService');
      // `result` is a UserCredential; the uid lives on its user.
      await createUserProfile(result.user.uid, { displayName, email });
    } catch (error) {
      // The account exists even when the profile write fails; the profile is
      // created the next time the account is opened.
      console.error('Ustvarjanje profila ni uspelo:', error);
    }
    return result;
  }

  async function login(email, password) {
    const auth = await getAuthInstance();
    const { signInWithEmailAndPassword } = await import('firebase/auth');
    return signInWithEmailAndPassword(auth, email, password);
  }

  /**
   * Send a reset link. The caller shows the same message whether or not the
   * address has an account, so the form cannot be used to find out who is
   * registered.
   */
  async function resetPassword(email) {
    const auth = await getAuthInstance();
    const { sendPasswordResetEmail } = await import('firebase/auth');
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error) {
      if (error?.code === 'auth/user-not-found') return;
      throw error;
    }
  }

  async function logout() {
    const auth = authRef.current || (await getAuthInstance());
    const { signOut } = await import('firebase/auth');
    return signOut(auth);
  }

  /** Update display name and/or school */
  async function updateUserProfile({ displayName, school }) {
    const auth = authRef.current || (await getAuthInstance());
    const { updateProfile } = await import('firebase/auth');
    const user = auth.currentUser;
    if (displayName) await updateProfile(user, { displayName });
    const { updateProfileDocuments } = await import('../services/profileService');
    await updateProfileDocuments(user.uid, { displayName, school });
    setCurrentUser({ ...user, displayName: displayName || user.displayName });
  }

  /** Store the study preferences on the user's own document. */
  async function updatePreferences(preferences) {
    const auth = authRef.current || (await getAuthInstance());
    const { updatePreferences: save } = await import('../services/profileService');
    await save(auth.currentUser.uid, preferences);
  }

  /** Change the e-mail address of the account. */
  async function changeEmail(newEmail, password) {
    const auth = authRef.current || (await getAuthInstance());
    const { changeAccountEmail } = await import('../services/accountService');
    await changeAccountEmail(auth.currentUser, password, newEmail);
  }

  /** Change the password of the account. */
  async function changePassword(newPassword, password) {
    const auth = authRef.current || (await getAuthInstance());
    const { changeAccountPassword } = await import('../services/accountService');
    await changeAccountPassword(auth.currentUser, password, newPassword);
  }

  /** Delete the account and everything in it. */
  async function deleteAccount(password, chatIds = []) {
    const auth = authRef.current || (await getAuthInstance());
    const { deleteAccount: remove } = await import('../services/accountService');
    await remove(auth.currentUser, password, chatIds);
  }

  useEffect(() => {
    if (!isFirebaseConfigured) {
      setSessionResolved(true);
      return undefined;
    }

    let unsubscribe;
    let cancelled = false;

    (async () => {
      const auth = await getAuthInstance();
      // A cancelled run belongs to an unmounted tree: it must not touch the
      // state, and in particular must not declare the session resolved.
      if (cancelled) return;
      if (!auth) {
        setSessionResolved(true);
        return;
      }
      authRef.current = auth;
      const { onAuthStateChanged } = await import('firebase/auth');
      if (cancelled) return;

      unsubscribe = onAuthStateChanged(auth, async (user) => {
        setCurrentUser(user);
        setUserProfile(null);
        if (user) {
          setSessionResolved(true);
        } else {
          // The first notification can be empty while the saved session is
          // still being restored. Give it a moment before treating it as
          // "signed out", otherwise a signed-in visitor is sent to the login
          // page for a split second.
          window.setTimeout(() => {
            if (cancelled) return;
            const restored = auth.currentUser;
            if (restored) setCurrentUser(restored);
            setSessionResolved(true);
          }, 1500);
          return;
        }

        // Backfill the profile documents for accounts created before they
        // existed, or created while the write was blocked.
        try {
          const { ensureUserDocument, ensurePublicProfile } = await import('../services/profileService');
          await ensureUserDocument(user.uid, { displayName: user.displayName, email: user.email });
          await ensurePublicProfile(user.uid, user.displayName);
        } catch (error) {
          console.error('Public profile initialization failed:', error);
        }
      });

    })();

    return () => {
      cancelled = true;
      if (unsubscribe) unsubscribe();
    };
  }, []);

  // Real-time Firestore profile listener
  const currentUid = currentUser?.uid;
  useEffect(() => {
    if (!currentUid) return undefined;
    let unsubscribe;
    let cancelled = false;
    import('../services/profileService').then(({ watchUserProfile }) => {
      if (cancelled) return;
      unsubscribe = watchUserProfile(currentUid, setUserProfile);
    }).catch((error) => {
      console.error('Profile listener failed:', error);
    });
    return () => {
      cancelled = true;
      if (unsubscribe) unsubscribe();
    };
  }, [currentUid]);

  const value = {
    currentUser,
    userProfile,
    sessionResolved,
    register,
    login,
    resetPassword,
    logout,
    updateUserProfile,
    updatePreferences,
    changeEmail,
    changePassword,
    deleteAccount,
  };

  // The children render straight away. Waiting for the session would hold
  // back the public pages until the login code has been downloaded; the
  // protected screens wait for it themselves.
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
