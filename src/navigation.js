/**
 * One navigation definition, three surfaces.
 *
 * The old build exposed the same eleven destinations three times — two
 * dropdowns, a hamburger sheet and a bottom bar. The new shell shows the
 * side rail on wide screens and the bottom bar on narrow ones; this file is
 * the only place that decides what exists.
 */
export const NAV_GROUPS = [
  {
    label: 'Učenje',
    items: [
      { to: '/dashboard', label: 'Domov', icon: 'home', hint: 'Pregled dneva' },
      { to: '/tasks', label: 'Naloge', icon: 'task', hint: 'Roki in kljukice' },
      { to: '/exams', label: 'Preverjanja', icon: 'exam', hint: 'Odštevanje do testov' },
      { to: '/flashcards', label: 'Kartice', icon: 'card', hint: 'Ponovi snov' },
      { to: '/schedule', label: 'Urnik', icon: 'calendar', hint: 'Teden po dnevih' },
      { to: '/subjects', label: 'Predmeti', icon: 'book', hint: 'Tvoji predmeti' },
    ],
  },
  {
    label: 'Skupnost',
    items: [
      { to: '/chat', label: 'Klepet', icon: 'chat', hint: 'Kanali in pogovori' },
      { to: '/friends', label: 'Prijatelji', icon: 'users', hint: 'Sošolci in vabila' },
    ],
  },
];

/** The five destinations the mobile bottom bar carries. */
export const PRIMARY_PATHS = ['/dashboard', '/tasks', '/exams', '/schedule', '/chat'];

export const ACCOUNT_LINKS = [
  { to: '/profile', label: 'Moj profil', icon: 'user' },
  { to: '/settings', label: 'Nastavitve', icon: 'gear' },
];

export function isPathActive(pathname, to) {
  if (to === '/dashboard') return pathname === '/dashboard';
  return pathname === to || pathname.startsWith(`${to}/`);
}
