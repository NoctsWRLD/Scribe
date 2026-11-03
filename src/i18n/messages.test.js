import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { englishMissing, MESSAGE_COUNT, messages, translate } from './messages.js';
import { counted, nounForm } from './plural.js';
import { detectLocale, isLocale, LOCALES, normalizeLocale, resolveLocale } from './locales.js';

const ROOT = resolve(process.cwd(), 'src');

function sourceFiles(directory = ROOT) {
  return readdirSync(directory).flatMap((entry) => {
    const path = join(directory, entry);
    if (statSync(path).isDirectory()) {
      if (entry === 'i18n' || entry === 'assets') return [];
      return sourceFiles(path);
    }
    return /\.(jsx?|js)$/.test(entry) && !/\.test\.js$/.test(entry) ? [path] : [];
  });
}

/** Every literal first argument to `t('…')` in the source tree. */
function usedKeys() {
  const keys = new Set();
  for (const file of sourceFiles()) {
    const code = readFileSync(file, 'utf8');
    for (const match of code.matchAll(/\bt\(\s*'((?:[^'\\]|\\.)*)'/g)) {
      keys.add(match[1].replace(/\\'/g, "'"));
    }
  }
  return keys;
}

describe('i18n dictionary', () => {
  it('translates every key the interface asks for', () => {
    const missing = englishMissing([...usedKeys()]);
    expect(missing, `missing English for: ${missing.join(' | ')}`).toEqual([]);
  });

  it('ships every row in all four translated languages', () => {
    const incomplete = Object.entries(messages)
      .filter(([, row]) => row.length !== 4 || row.some((cell) => typeof cell !== 'string' || !cell.trim()))
      .map(([key]) => key);
    expect(incomplete, `incomplete rows: ${incomplete.join(' | ')}`).toEqual([]);
  });

  it('keeps every placeholder of the source in each translation', () => {
    const placeholders = (text) => [...text.matchAll(/\{(\w+)\}/g)].map((match) => match[1]).sort().join(',');
    const broken = Object.entries(messages)
      .filter(([key, row]) => row.some((cell) => placeholders(cell) !== placeholders(key)))
      .map(([key]) => key);
    expect(broken, `placeholder mismatch: ${broken.join(' | ')}`).toEqual([]);
  });

  it('falls back to English, then to the Slovenian source', () => {
    const key = 'Naloge';
    expect(translate('sl', key)).toBe('Naloge');
    expect(translate('en', key)).toBe('Tasks');
    expect(translate('de', key)).toBe('Aufgaben');
    // A key that no locale knows is still readable.
    expect(translate('en', 'Neznan stavek')).toBe('Neznan stavek');
  });

  it('fills placeholders and leaves unknown ones alone', () => {
    expect(translate('en', 'Pozdravljeni, {name}', { name: 'Tia' })).toBe('Hello, Tia');
    expect(translate('sl', 'Pozdravljeni, {name}', { name: 'Tia' })).toBe('Pozdravljeni, Tia');
    // A placeholder with no value stays visible instead of turning into "undefined".
    expect(translate('sl', 'Pozdravljeni, {name}', {})).toBe('Pozdravljeni, {name}');
  });

  it('ships more than one language and a real dictionary', () => {
    expect(LOCALES.length).toBeGreaterThanOrEqual(4);
    expect(isLocale('de')).toBe(true);
    expect(normalizeLocale('xx')).toBeNull();
    expect(MESSAGE_COUNT).toBeGreaterThan(50);
  });

  it('reads the browser language, and ignores one it does not have', () => {
    expect(detectLocale(['de-AT', 'en'])).toBe('de');
    expect(detectLocale(['fr-FR'])).toBe('sl');
  });

  it('applies the latest choice before a stale profile value and scopes it to its account', () => {
    expect(resolveLocale({ uid: 'account-1', locale: 'de' }, 'account-1', 'en', 'sl')).toBe('de');
    expect(resolveLocale({ uid: 'account-1', locale: 'de' }, 'account-2', 'en', 'sl')).toBe('en');
  });
});

describe('plural forms', () => {
  const sl = { one: 'naloga', two: 'nalogi', few: 'naloge', other: 'nalog' };
  const en = { one: 'task', other: 'tasks' };

  it('uses the Slovenian four-form pattern', () => {
    expect(counted(1, sl, 'sl-SI')).toBe('1 naloga');
    expect(counted(2, sl, 'sl-SI')).toBe('2 nalogi');
    expect(counted(3, sl, 'sl-SI')).toBe('3 naloge');
    expect(counted(5, sl, 'sl-SI')).toBe('5 nalog');
  });

  it('uses the two-form pattern in English', () => {
    expect(counted(1, en, 'en-GB')).toBe('1 task');
    expect(counted(4, en, 'en-GB')).toBe('4 tasks');
  });

  it('returns a form even when the category is not supplied', () => {
    expect(nounForm(2, { one: 'stvar', other: 'stvari' }, 'sl-SI')).toBe('stvari');
  });

  it('formats the number in the reader’s locale', () => {
    expect(counted(1000, en, 'de-DE')).toBe('1.000 tasks');
  });
});
