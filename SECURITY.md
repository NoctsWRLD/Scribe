# Security — Scribe

Everything under `src/` is public. The `VITE_FIREBASE_*` values are in the
bundle by design, the browser is assumed hostile, and the only thing that
decides who may read or write a document is `firestore.rules` in the Firebase
project. This file records what that boundary is, what was checked in the
November 2026 pass, and what is knowingly left open.

## 1. The trust boundary

| Layer | Holds, or does not |
| --- | --- |
| `src/firebase.js` | Reads `VITE_FIREBASE_*`; those keys are public. No secret belongs here. |
| `firestore.rules` | **The only access control.** Default deny; every collection is opted in. |
| `src/hooks/`, `src/services/` | Convenience and validation — never a substitute for a rule. |
| React rendering | Escapes text; there is no `dangerouslySetInnerHTML` anywhere. |

A signed-in user can open devtools, call the SDK directly and send any document
shape the rules allow. Every rule therefore checks the field set, the types,
the value ranges **and** the owner on the server.

## 2. Collection map

| Path | Read | Write |
| --- | --- | --- |
| `users/{uid}` | owner | owner; fixed key set; `email`, `createdAt`, `photoURL` immutable after create |
| `userCodes/{code}` | any signed-in account | create only for a code the creator's profile names; never rewritten; owner may delete |
| `publicProfiles/{uid}` | any signed-in account | owner; `searchName` must equal the lower-cased `displayName` |
| `subjects`, `tasks`, `exams`, `flashcards`, `focusSessions` | owner | owner; `subjectId` must be one of the writer's own subjects |
| `friendRequests/{pairId}` | the two parties | create by the sender with server-derived names; status changed only by the recipient; deleted by either side |
| `chats/{chatId}/messages` | channel members | create by the sender with a server-derived name; delete by the sender only |
| everything else | denied | denied |

`chats/general`, `chats/subject_*`, `chats/school_*` and `chats/<uidA>_<uidB>`
are the four id shapes the rules accept. A message may only carry an `https`
attachment URL, and its `senderName` has to equal the writer's own
`publicProfiles.displayName`, so a message cannot be sent under a name the
author does not own.

## 3. What this pass changed

1. **The language switch never saved.** `src/i18n/index.jsx` writes
   `locale` to `users/{uid}`, but the rules' allow-list did not name that key,
   so every change was refused and the choice only lived in `localStorage`.
   `locale` is now an allowed key with a fixed enum (`sl`, `en`, `de`, `it`,
   `hr`) — a client cannot store arbitrary text in the profile.
2. **A profile could display someone else's friend code.** The rules accepted
   any well-formed code, and `ensureFriendCode` trusted the profile, so an
   account could show a classmate's code and send everyone who typed it to the
   wrong person. The rules now refuse a code another account already owns, and
   `friendService` checks the owner of the code document instead of trusting
   the profile.
3. **Deleting an account left data behind.** The friend code survived, pointing
   at an account that no longer existed, and no one could reclaim it.
   Messages written in `subject_*` and `school_*` channels were never visited,
   and once the login was gone the rules could not delete them either — the
   sender no longer exists. Deletion now reads the code before the profile
   goes, removes the code document, reaches the channel ids through
   `src/utils/chatChannels.js` (the same derivation the chat screen uses), and
   stops **before** removing the login when a step can still be retried. It
   also refuses to run without the password.
4. **Response headers.** `vercel.json` now sends `X-Content-Type-Options`,
   `X-Frame-Options: DENY`, `Referrer-Policy`, `Permissions-Policy` and HSTS.
5. **A repeatable check.** `npm run rules:check` runs the rules against the
   Firestore emulator with a hostile client and asserts the answers
   (`scripts/check-rules.mjs`, config in `firebase.emulator.json`). It cannot
   run in `npm test` — it needs Java and the emulator — but it is the only way
   to prove a rule still refuses what it refused last month.

Nothing above widened what a hostile client can do. The one rule that grew —
`locale` — trades an unbounded string for a five-item enum.

## 4. Accepted risks

These are decisions, not oversights. Each one names the fix if it ever bites.

- **Channels are global by name.** `subject_matematika` is one channel for
  every school, and `school_<name>` is readable by any signed-in account that
  knows the name. There is no school membership document, so nothing on the
  server can prove who belongs where. Fix: add `schools/{id}` with a member
  list, store `schoolId` on the profile, and require membership in
  `canAccessChat`.
- **`publicProfiles` and `userCodes` are readable by every signed-in account.**
  Search needs the first; adding a friend by code needs the second. The code
  space is 32⁶ (~1.07 billion), so guessing one specific classmate's code is
  impractical, but a determined account could scrape them. Fix: App Check and
  rate limiting at the Firebase project level.
- **No App Check.** The Firebase project accepts requests from any client that
  has the public config. Turn on App Check (reCAPTCHA Enterprise) before the
  app has real users.
- **Renaming a subject strands its channel.** The channel id is derived from the
  name, so a rename opens a new channel and the old messages stay in the old
  one; deletion cannot find messages written under a name that no longer
  exists. Fix: store a channel document with an id that does not depend on the
  name.
- **No Content-Security-Policy yet.** A working policy has to allow the Firebase
  origins, `wss:` and inline style attributes; shipping one untested would
  break sign-in in production. The cheap headers are in place instead.
- **Importing the same export twice is refused.** `importAccountData` writes
  with `set()` and the ids from the file; against an existing document that is
  an update, and the rules keep `createdAt` immutable. Not a hole — a
  limitation of the import.
- **The rules are not deployed by the build.** `npm run build` never touches
  them. They are a manual step (below). A change to `firestore.rules` that is
  merged but not deployed is not in effect.

## 5. Operational checklist

```bash
firebase login
firebase deploy --only firestore:rules --project smartstudy-e0d05
npm run rules:check
```

- `.firebaserc` maps the project as `staging`; deploy to the project the app
  actually uses.
- Turn on App Check in the Firebase console (reCAPTCHA Enterprise) and enforce
  it for Firestore once the web app is registered.
- Confirm the headers on the live Vercel URL:
  `curl -sI https://<site>/ | findstr /i "content-security x-frame referrer permissions strict"`
- Set the real `SITE_URL` in `src/config.js`; it drives canonical tags,
  `robots.txt` and `sitemap.xml`.

## 6. Re-running the review

The two skills in `.opencode/skills/` are the rubric used here:

- `security-review` — a focused pass over pending changes.
- `insecure-defaults` — hardcoded secrets, fail-open config, permissive CORS.

The checks that matter most, in order:

1. Diff `firestore.rules` against every write in `src/hooks/` and
   `src/services/`. A client write with a field the rules do not name fails
   silently at runtime, which is exactly how the `locale` bug shipped.
2. Grep for `dangerouslySetInnerHTML`, `innerHTML`, `eval`, `new Function`,
   `window.open`, `target="_blank"` without `rel`, and every URL that comes
   from another user (it must pass `safeHttpsUrl`).
3. Check `firebase.js`, `.env.example` and `.github/workflows/deploy.yml` for
   anything that looks like a secret.
4. Re-read section 4 — an accepted risk that no longer has its mitigation is a
   finding.
