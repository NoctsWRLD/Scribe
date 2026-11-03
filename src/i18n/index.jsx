import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { app } from '../firebase';
import { DEFAULT_LOCALE, detectLocale, getLocale, isLocale, normalizeLocale } from './locales';
import { translate } from './messages';
import { counted, nounForm } from './plural';

const STORAGE_KEY = 'scribe.locale';
const I18nContext = createContext(null);

function readStoredLocale() {
  try {
    const stored = normalizeLocale(localStorage.getItem(STORAGE_KEY));
    if (stored) return stored;
  } catch {
    // Private mode can block storage; the browser language still applies.
  }
  if (typeof navigator !== 'undefined' && Array.isArray(navigator.languages)) {
    return detectLocale(navigator.languages);
  }
  return DEFAULT_LOCALE;
}

/**
 * Language state.
 *
 * The choice lives in this browser immediately and on the account as a
 * convenience; the page renders before either write completes.
 */
export function I18nProvider({ children }) {
  const { currentUser, userProfile } = useAuth();
  const currentUid = currentUser?.uid;
  const [local, setLocal] = useState(readStoredLocale);

  // A language saved on the account wins over this browser's last choice.
  const locale = normalizeLocale(userProfile?.locale) || local;

  const meta = getLocale(locale);

  useEffect(() => {
    document.documentElement.lang = meta.htmlLang;
  }, [meta.htmlLang]);

  const setLocale = useCallback(
    async (next) => {
      if (!isLocale(next)) return;
      setLocal(next);
      try {
        localStorage.setItem(STORAGE_KEY, next);
      } catch {
        // The session still uses the language.
      }
      if (!currentUid) return;
      try {
        const { doc, getFirestore, updateDoc } = await import('firebase/firestore');
        const db = app ? getFirestore(app) : null;
        if (!db) return;
        await updateDoc(doc(db, 'users', currentUid), { locale: next });
      } catch (error) {
        // The language is already applied in this browser.
        console.warn('Shranjevanje jezika v račun ni uspelo.', error);
      }
    },
    [currentUid],
  );

  const value = useMemo(() => {
    const t = (key, params) => translate(locale, key, params);
    return {
      locale,
      localeMeta: meta,
      localeTag: meta.tag,
      t,
      tn: (count, forms) => counted(count, forms, meta.tag),
      noun: (count, forms) => nounForm(count, forms, meta.tag),
      setLocale,
    };
  }, [locale, meta, setLocale]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useI18n() {
  const context = useContext(I18nContext);
  if (context) return context;
  // A component rendered outside the provider (a test, a story) still gets
  // readable Slovenian rather than a crash.
  return {
    locale: DEFAULT_LOCALE,
    localeMeta: getLocale(DEFAULT_LOCALE),
    localeTag: getLocale(DEFAULT_LOCALE).tag,
    t: (key, params) => translate(DEFAULT_LOCALE, key, params),
    tn: (count, forms) => counted(count, forms, getLocale(DEFAULT_LOCALE).tag),
    noun: (count, forms) => nounForm(count, forms, getLocale(DEFAULT_LOCALE).tag),
    setLocale: async () => {},
  };
}
