export const SLOVENIA_TIME_ZONE = 'Europe/Ljubljana';

const slovenianFormatter = new Intl.DateTimeFormat('sl-SI', {
  timeZone: SLOVENIA_TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

export function getSlovenianDateKey(date = new Date()) {
  const parts = Object.fromEntries(slovenianParts(date).map(({ type, value }) => [type, value]));
  return `${parts.year}-${parts.month}-${parts.day}`;
}

function slovenianParts(date) {
  return slovenianFormatter.formatToParts(date);
}

export function formatSlovenianDate(dateKey, options = { day: 'numeric', month: 'short' }) {
  return formatDate(dateKey, options, 'sl-SI');
}

/** The same formatting, asked in the reader's language. */
export function formatDate(dateKey, options = { day: 'numeric', month: 'short' }, tag = 'sl-SI') {
  const [year, month, day] = dateKey.split('-').map(Number);
  const dateAtNoonUtc = new Date(Date.UTC(year, month - 1, day, 12));
  return new Intl.DateTimeFormat(tag, { ...options, timeZone: SLOVENIA_TIME_ZONE }).format(dateAtNoonUtc);
}

export function addDaysToDateKey(dateKey, amount) {
  const [year, month, day] = dateKey.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day + amount));
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(date.getUTCDate()).padStart(2, '0')}`;
}

export function daysBetweenDateKeys(firstDateKey, secondDateKey) {
  const [firstYear, firstMonth, firstDay] = firstDateKey.split('-').map(Number);
  const [secondYear, secondMonth, secondDay] = secondDateKey.split('-').map(Number);
  const first = Date.UTC(firstYear, firstMonth - 1, firstDay);
  const second = Date.UTC(secondYear, secondMonth - 1, secondDay);
  return Math.round((first - second) / 86400000);
}

export function getDateKeyDayOfWeek(dateKey) {
  const [year, month, day] = dateKey.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day, 12)).getUTCDay();
}

export function getDayOfMonth(dateKey) {
  return Number(dateKey.slice(-2));
}

export function getYearFromDateKey(dateKey) {
  return Number(dateKey.slice(0, 4));
}

export function getHourInSlovenia(date = new Date()) {
  return Number(new Intl.DateTimeFormat('en-GB', {
    timeZone: SLOVENIA_TIME_ZONE,
    hour: '2-digit',
    hourCycle: 'h23',
  }).format(date));
}

export function getDayOfYear(dateKey) {
  return daysBetweenDateKeys(dateKey, `${dateKey.slice(0, 4)}-01-00`);
}
