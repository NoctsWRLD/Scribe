/**
 * The languages the interface ships in.
 *
 * `sl` is the product's own language and the source of every message key.
 * `en` is complete and is the fallback for the other three. Legal pages stay
 * Slovenian on purpose — see DESIGN.md §7.
 */
export const LOCALES = [
  { id: 'sl', label: 'Slovenščina', short: 'SL', htmlLang: 'sl', tag: 'sl-SI' },
  { id: 'en', label: 'English', short: 'EN', htmlLang: 'en', tag: 'en-GB' },
  { id: 'de', label: 'Deutsch', short: 'DE', htmlLang: 'de', tag: 'de-DE' },
  { id: 'it', label: 'Italiano', short: 'IT', htmlLang: 'it', tag: 'it-IT' },
  { id: 'hr', label: 'Hrvatski', short: 'HR', htmlLang: 'hr', tag: 'hr-HR' },
];

export const DEFAULT_LOCALE = 'sl';
export const FALLBACK_LOCALE = 'en';

/** The order of the translation columns in `messages.js`. */
export const TRANSLATED_LOCALES = ['en', 'de', 'it', 'hr'];

const IDS = new Set(LOCALES.map((locale) => locale.id));

export function isLocale(value) {
  return typeof value === 'string' && IDS.has(value);
}

export function normalizeLocale(value) {
  return isLocale(value) ? value : null;
}

/** An explicit choice wins for the account session in which it was made. */
export function resolveLocale(selection, currentUid, profileLocale, localLocale) {
  const selectedLocale = selection?.uid === (currentUid ?? null) ? selection.locale : null;
  return normalizeLocale(selectedLocale)
    || normalizeLocale(profileLocale)
    || normalizeLocale(localLocale)
    || DEFAULT_LOCALE;
}

export function getLocale(id) {
  return LOCALES.find((locale) => locale.id === id) || LOCALES[0];
}

/** Best effort for a browser that has never chosen a language. */
export function detectLocale(navigatorLanguages = []) {
  for (const tag of navigatorLanguages) {
    const base = String(tag).toLowerCase().split('-')[0];
    if (IDS.has(base)) return base;
  }
  return DEFAULT_LOCALE;
}
