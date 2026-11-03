/**
 * One navigation definition.
 *
 * Učenje and Skupnost are the destinations; the account links are the two
 * things that belong to the person rather than to the school day. The shell
 * renders the groups in the top bar (inline from `lg`, in the menu sheet
 * below it) and the account links in the account menu and that sheet. This
 * file is the only place that decides what exists.
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

export const ACCOUNT_LINKS = [
  { to: '/profile', label: 'Moj profil', icon: 'user' },
  { to: '/settings', label: 'Nastavitve', icon: 'gear' },
];

export function isPathActive(pathname, to) {
  if (to === '/dashboard') return pathname === '/dashboard';
  return pathname === to || pathname.startsWith(`${to}/`);
}
