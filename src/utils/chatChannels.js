/**
 * Channel ids.
 *
 * A channel is discovered by its name, not stored as a document: every account
 * with a subject called "Matematika" writes into `subject_matematika`, and
 * every account at a school called "Gimnazija Ljubljana" into
 * `school_gimnazija_ljubljana`. The derivation therefore has to be the same
 * everywhere — the chat screen opens the channel with it, and account deletion
 * uses it to find the messages that account wrote.
 */
export function channelSlug(name) {
  return String(name ?? '').trim().toLowerCase().replace(/\s+/g, '_');
}

export function subjectChatId(name) {
  const slug = channelSlug(name);
  return slug ? `subject_${slug}` : null;
}

export function schoolChatId(school) {
  const slug = channelSlug(school);
  return slug ? `school_${slug}` : null;
}
