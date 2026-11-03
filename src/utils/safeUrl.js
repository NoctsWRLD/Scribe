/**
 * A URL that came from another user — a chat attachment, a profile photo —
 * is only rendered when it is plain https. Anything else (`javascript:`,
 * `data:`, `http:`) is dropped, so a crafted message can neither run script
 * when clicked nor load mixed content.
 */
export function safeHttpsUrl(value) {
  if (typeof value !== 'string' || value.length > 2048) return null;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' ? url.href : null;
  } catch {
    return null;
  }
}
