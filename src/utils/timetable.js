import { addDaysToDateKey, getDateKeyDayOfWeek, getSlovenianDateKey } from './dates';

export const DAY_NAMES = ['Ponedeljek', 'Torek', 'Sreda', 'Četrtek', 'Petek', 'Sobota', 'Nedelja'];

/**
 * Weekday names a timetable photo may use, Monday first, in every language
 * the interface ships in (sl, en, de, it, hr). Two-letter German forms ("Mo",
 * "Di") only count when they stand alone or end in a dot or colon, so a lesson
 * line that happens to start with "Do" or "So" is not read as a day.
 */
const DAY_ALIASES = [
  ['ponedeljek', 'ponedjeljak', 'pon', 'monday', 'mon', 'montag', 'lunedì', 'lunedi', 'lun'],
  ['torek', 'tor', 'utorak', 'uto', 'tuesday', 'tues', 'tue', 'dienstag', 'martedì', 'martedi', 'mar'],
  ['sreda', 'srijeda', 'sre', 'sri', 'wednesday', 'wed', 'mittwoch', 'mercoledì', 'mercoledi', 'mer'],
  ['četrtek', 'cetrtek', 'četvrtak', 'cetvrtak', 'čet', 'cet', 'thursday', 'thurs', 'thur', 'thu', 'donnerstag', 'giovedì', 'giovedi', 'gio'],
  ['petek', 'petak', 'pet', 'friday', 'fri', 'freitag', 'venerdì', 'venerdi', 'ven'],
  ['sobota', 'subota', 'sob', 'sub', 'saturday', 'sat', 'samstag', 'sabato', 'sab'],
  ['nedelja', 'nedjelja', 'ned', 'sunday', 'sun', 'sonntag', 'domenica', 'dom'],
];
const SHORT_GERMAN = ['mo', 'di', 'mi', 'do', 'fr', 'sa', 'so'];

// The aliases are plain letters, so they can go into a pattern unescaped.
// Longest first, so "četrtek" wins over "čet".
const byLength = (a, b) => b.length - a.length;
const NOT_LETTER = String.raw`(?=$|[^\p{L}])`;

const DAY_PATTERNS = DAY_ALIASES.map((aliases, index) => {
  const words = [...aliases].sort(byLength).join('|');
  return new RegExp(String.raw`^\s*(?:(?:${words})${NOT_LETTER}|${SHORT_GERMAN[index]}(?=$|[.:]))`, 'iu');
});

const ALL_WORDS = DAY_ALIASES.flat().sort(byLength).join('|');
const DAY_STRIP = new RegExp(
  String.raw`^\s*(?:(?:${ALL_WORDS})${NOT_LETTER}|(?:${SHORT_GERMAN.join('|')})(?=$|[.:]))\.?[\s:–\-.)]*`,
  'iu',
);

export function detectDay(line) {
  for (let i = 0; i < DAY_PATTERNS.length; i++) {
    if (DAY_PATTERNS[i].test(line)) return i;
  }
  return -1;
}

export function cleanEntry(line) {
  return line
    .replace(/^\d{1,2}[:.]\d{2}\s*(–|-|\.)?\s*/, '')
    .replace(/^\d{1,2}\.\s*(ura\s+)?/i, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

export function guessSubject(title, subjects) {
  const low = title.toLocaleLowerCase('sl');
  for (const s of subjects) {
    const name = (s.name || '').toLocaleLowerCase('sl');
    if (name.length >= 3 && low.includes(name)) return s.id;
    const stem = name.slice(0, Math.max(3, name.length - 2));
    if (stem.length >= 4 && low.includes(stem)) return s.id;
  }
  return '';
}

export function parseTimetableText(text, subjects = []) {
  const rows = [];
  let current = -1;
  for (const raw of text.split('\n')) {
    const line = raw.trim();
    if (!line) continue;
    const dayIdx = detectDay(line);
    if (dayIdx >= 0) {
      current = dayIdx;
      const rest = cleanEntry(line.replace(DAY_STRIP, ''));
      if (rest) rows.push({ title: rest, weekday: dayIdx, subjectId: guessSubject(rest, subjects) });
      continue;
    }
    if (current < 0) current = 0;
    const title = cleanEntry(line);
    if (title) rows.push({ title, weekday: current, subjectId: guessSubject(title, subjects) });
  }
  return rows.filter((r) => r.title);
}

export function mondayOfThisWeek(today = getSlovenianDateKey()) {
  const dow = getDateKeyDayOfWeek(today);
  return addDaysToDateKey(today, dow === 0 ? -6 : 1 - dow);
}

function mondayOfWeekContaining(dateKey) {
  const dow = getDateKeyDayOfWeek(dateKey);
  return addDaysToDateKey(dateKey, dow === 0 ? -6 : 1 - dow);
}

/* Semesterja slovenskega šolskega leta: 1. sep–jan, 2. feb–jun. */
export function semesterRange(which, today = getSlovenianDateKey()) {
  const year = Number(today.slice(0, 4));
  const month = Number(today.slice(5, 7));
  const startYear = month >= 9 ? year : year - 1;
  const [start, end, label] = which === 2
    ? [`${startYear + 1}-02-01`, `${startYear + 1}-06-24`, '2. semester']
    : [`${startYear}-09-01`, `${startYear + 1}-01-31`, '1. semester'];
  const thisMonday = mondayOfThisWeek(today);
  const startMonday = mondayOfWeekContaining(start) < thisMonday ? thisMonday : mondayOfWeekContaining(start);
  const endMonday = mondayOfWeekContaining(end);
  return { startMonday, endMonday, label, past: startMonday > endMonday };
}

export function listWeekMondays(startMonday, endMonday) {
  const weeks = [];
  let cur = startMonday;
  while (cur <= endMonday) {
    weeks.push(cur);
    cur = addDaysToDateKey(cur, 7);
  }
  return weeks;
}

export function weekLabel(mondayKey) {
  const sunday = addDaysToDateKey(mondayKey, 6);
  return `${mondayKey.slice(8, 10)}.${mondayKey.slice(5, 7)}. – ${sunday.slice(8, 10)}.${sunday.slice(5, 7)}.`;
}
