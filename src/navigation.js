/** One source of truth for the signed-in app's sidebar destinations. */
export const PRIMARY_LINKS = [
  { to: '/dashboard', label: 'Domov', icon: 'home' },
  { to: '/tasks', label: 'Naloge', icon: 'task' },
];

export const STUDY_LINKS = [
  { to: '/subjects', label: 'Predmeti', icon: 'book' },
  { to: '/exams', label: 'Preverjanja', icon: 'exam' },
  { to: '/flashcards', label: 'Kartice', icon: 'card' },
  { to: '/schedule', label: 'Urnik', icon: 'calendar' },
];

export const COMMUNITY_LINKS = [
  { to: '/chat', label: 'Klepet', icon: 'chat' },
  { to: '/friends', label: 'Prijatelji', icon: 'users' },
];

export const ACCOUNT_LINKS = [
  { to: '/profile', label: 'Moj profil', icon: 'user' },
  { to: '/settings', label: 'Nastavitve', icon: 'gear' },
];

export function isPathActive(pathname, to) {
  if (to === '/dashboard') return pathname === '/dashboard';
  return pathname === to || pathname.startsWith(`${to}/`);
}
