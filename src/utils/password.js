/**
 * The password rule, in one place.
 *
 * Length is the only thing that reliably helps, so it is the only requirement.
 * The same check runs on registration and on a password change. Firebase's own
 * minimum is 6 characters and cannot be raised from the client — set it in the
 * Firebase console too (Authentication → Settings → Password policy), or a
 * determined caller can still create a 6-character account through the API.
 */
export const MIN_PASSWORD_LENGTH = 10;

export function validatePassword(password) {
  const value = typeof password === 'string' ? password : '';
  if (value.length < MIN_PASSWORD_LENGTH) {
    return { ok: false, reason: 'short' };
  }
  if (value.length > 256) {
    return { ok: false, reason: 'long' };
  }
  return { ok: true, reason: null };
}

/** 0–3, for the small meter under the field. Never a gate on its own. */
export function passwordScore(password) {
  const value = typeof password === 'string' ? password : '';
  let score = 0;
  if (value.length >= MIN_PASSWORD_LENGTH) score += 1;
  if (value.length >= 14) score += 1;
  if (/[a-z]/.test(value) && /[A-Z]/.test(value)) score += 1;
  if (/\d/.test(value) && /[^\w\s]/.test(value)) score += 1;
  return Math.min(3, score);
}
