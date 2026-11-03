import { createContext, useCallback, useContext, useLayoutEffect, useMemo, useState } from 'react';
import { useAuth } from './AuthContext';
import { app } from '../firebase';
import { DEFAULT_THEME, normalizeThemeId } from '../utils/themes';

const STORAGE_KEY = 'scribe.settings.v1';
const THEME_KEY = 'scribe.theme';
// Accounts created before the rename keep their local preferences here.
const LEGACY_KEYS = { settings: 'smartstudy.settings.v1', theme: 'smartstudy.theme' };

const THEME_IDS = ['noc', 'dnevnik'];

const DEFAULT_SETTINGS = { highContrast: false, reduceMotion: false };
const SettingsContext = createContext(null);

function readSettings() {
  try {
    const saved = JSON.parse(
      localStorage.getItem(STORAGE_KEY) || localStorage.getItem(LEGACY_KEYS.settings) || '{}',
    );
    return {
      highContrast: typeof saved.highContrast === 'boolean' ? saved.highContrast : DEFAULT_SETTINGS.highContrast,
      reduceMotion: typeof saved.reduceMotion === 'boolean' ? saved.reduceMotion : DEFAULT_SETTINGS.reduceMotion,
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

function readLocalTheme() {
  try {
    return (
      normalizeThemeId(localStorage.getItem(THEME_KEY)) ||
      normalizeThemeId(localStorage.getItem(LEGACY_KEYS.theme))
    );
  } catch {
    return null;
  }
}

function writeLocalTheme(theme) {
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch {
    // The choice still applies for this session even without storage.
  }
}

// eslint-disable-next-line react-refresh/only-export-components
export function useSettings() {
  return useContext(SettingsContext);
}

export function SettingsProvider({ children }) {
  const { currentUser, userProfile } = useAuth();
  const currentUid = currentUser?.uid;
  const [settings, setSettings] = useState(readSettings);
  const [localTheme, setLocalTheme] = useState(readLocalTheme);

  // The profile in Firestore wins when it has one; otherwise the choice made
  // in this browser applies. The theme never depends on a successful write.
  const theme = normalizeThemeId(userProfile?.theme) || localTheme || DEFAULT_THEME;

  useLayoutEffect(() => {
    const root = document.documentElement;
    root.dataset.theme = theme;
    root.dataset.contrast = settings.highContrast ? 'high' : 'normal';
    root.dataset.motion = settings.reduceMotion ? 'reduced' : 'full';
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch {
      // The current session still works if browser storage is unavailable.
    }
  }, [settings, theme]);

  const setTheme = useCallback(async (nextTheme) => {
    if (!THEME_IDS.includes(nextTheme)) return;

    // Apply it here and now; the account copy is a convenience, not a
    // precondition for the change to take effect.
    setLocalTheme(nextTheme);
    writeLocalTheme(nextTheme);

    if (!currentUid) return;

    try {
      // The database SDK is loaded only when a theme is actually saved.
      const { doc, getFirestore, updateDoc } = await import('firebase/firestore');
      const db = app ? getFirestore(app) : null;
      if (!db) return;
      await updateDoc(doc(db, 'users', currentUid), { theme: nextTheme });
    } catch (error) {
      // The theme is already applied and stored in this browser; only the copy
      // on the account is missing, so this is not a failure of the page.
      console.warn('Shranjevanje teme v račun ni uspelo — tema ostane shranjena v tem brskalniku.', error);
    }
  }, [currentUid]);

  const value = useMemo(() => ({
    ...settings,
    theme,
    setTheme,
    setHighContrast: (highContrast) => setSettings((previous) => ({ ...previous, highContrast })),
    setReduceMotion: (reduceMotion) => setSettings((previous) => ({ ...previous, reduceMotion })),
  }), [settings, theme, setTheme]);

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}
