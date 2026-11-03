# Scribe

A student planning app: subjects, tasks, timetable, chat with classmates, and
flashcards. The interface ships in **Slovenian (default), English, German,
Italian and Croatian**; the legal pages stay Slovenian. Timestamps use the
`Europe/Ljubljana` timezone.

## Stack

- **React 19** + **React Router 7** (protected routes in `src/components/ProtectedRoute.jsx`)
- **Vite 7** — dev server and build
- **Tailwind CSS 4** via the `@tailwindcss/vite` plugin
- **Firebase 13** — Auth + Cloud Firestore, real-time via `onSnapshot`
- **tesseract.js** — OCR for importing a timetable from an image
- **Vitest 4** + Testing Library — unit tests

## Commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Vite dev server |
| `npm run build` | Production build to `dist/` |
| `npm run lint` | ESLint (flat config) |
| `npm test` | Vitest, single run |
| `npm run test:watch` | Vitest, watch mode |
| `npm run rules:check` | Runs `firestore.rules` against the Firestore emulator (needs Java) |
| `npm run preview` | Serve the production build locally |

`npm run lint` and `npm test` must pass before a change is considered done. A
change to `firestore.rules` also runs `npm run rules:check`.

## Layout

```
src/
  pages/       one file per screen (Landing, Login, Dashboard, Tasks, …)
  components/  reusable UI (AppShell, Modal, StudyRail, TaskLedger, …)
  contexts/    AuthContext, SettingsContext
  hooks/       useFirestore, useStudy, useChat — all Firestore access lives here
  services/    profileService, friendService, accountService — the account's own documents
  i18n/        the message table, locales, plurals (messages.test.js guards coverage)
  utils/       dates, colors, themes, rail, tasks, countdown, safeUrl, chatChannels
  design-system/ tokens.test.js — the contract of the token layer
  assets/fonts/ self-hosted Space Grotesk and DM Sans
  firebase.js  app initialization only
  firebaseDb.js the Firestore instance, in its own module on purpose
  navigation.js the one definition of every destination
  config.js    site address and description
scripts/       check-rules.mjs — the emulator probe for firestore.rules
DESIGN.md      the design contract
SECURITY.md    the access-control boundary, what was audited, what is accepted
```

`.opencode/` is local agent tooling and is gitignored — the repo carries the
app and its documentation, not the assistant's setup.

## Routes

`/` is the **public** page. The signed-in app starts at `/dashboard`. Every
other path is unchanged: `/tasks`, `/subjects`, `/exams`, `/flashcards`,
`/schedule`, `/chat`, `/friends`, `/profile`, `/settings`, plus
`/pravilnik-o-zasebnosti`, `/impressum` and `/dostopnost`.

## Conventions

- **Firestore access goes through `src/hooks/`.** `useFirestore.js`,
  `useStudy.js` and `useChat.js` own the `onSnapshot` listeners and the
  queries. Components and pages consume hooks, they do not call Firestore
  directly. Adding a new collection means adding a hook.
- **`src/firebase.js` is the only place that initializes the app.** It exports
  `app`, `auth` and `isFirebaseConfigured`, and reads `VITE_FIREBASE_*` from
  the environment. The `isFirebaseConfigured` guard exists so the app can
  render a setup screen instead of crashing when config is missing — do not
  remove it, and do not read `import.meta.env` for Firebase keys anywhere else.
- **The Firestore instance lives in `src/firebaseDb.js`, not in `firebase.js`.**
  That split is what keeps the database SDK out of the public page's bundle.
  Import `db` from `../firebaseDb`; import `app` and `auth` from `../firebase`.
- **SDK functions come from `firebase/firestore` / `firebase/auth`; instances
  come from the modules above.** Keep that split — it is why `db` and `auth` are
  `null` when unconfigured and every consumer can check
  `isFirebaseConfigured` first.
- **ESLint flat config** in `eslint.config.js`: `js.configs.recommended` plus
  the `reactHooks` and `reactRefresh` (Vite) presets. Only `*.js` and `*.jsx`
  are linted. `no-unused-vars` ignores `^[A-Z_]` (components and constants).
- **Tailwind 4, no separate config file.** Utilities live in `src/index.css`
  and are applied in JSX. Do not add a `tailwind.config.js`.
- **User-facing strings go through `src/i18n/`.** A message key is its
  Slovenian source string, so an untranslated screen falls back to Slovenian
  instead of showing a key. `t('…')` from `useI18n()`; never a bare literal in
  new markup. Plurals go through `tn()` / `countNoun`, never string
  concatenation. The legal pages are Slovenian by law, not by omission.

## The design system

`DESIGN.md` is the full contract; this is the part that changes decisions.

`src/index.css` is three layers: literal values, semantic tokens, and the
Tailwind bridge. **A component reads semantic tokens only** — `--rp-canvas`,
`--rp-raised`, `--rp-text`, `--rp-accent` and so on. Never write a raw hex
value in a component.

- **No cards.** Content sits on the page. A group is separated by a hairline
  (`--rp-line`) and space, never by a box with a fill, four borders and a
  radius. Menus, dialogs and the mobile tab bar may have their own surface
  because they really float above the page.
- **Never a gradient.** Not for the hero, a button, a chart or the logo. The
  token test fails the build if the word appears in `index.css`.
- **Dark is the default.** `data-theme="noc"` is dark, `data-theme="dnevnik"`
  is light, and the light theme is a full token swap — no component-level
  overrides exist.
- **Every foreground/background pairing meets WCAG AA in both themes.**
  `src/design-system/tokens.test.js` checks it by ratio and also checks that
  the dark theme defines every colour token the light one does. If you add a
  colour, that test is the thing that will catch a mistake.
- **The study rail** (`src/components/StudyRail.jsx`) is the structural device:
  a run of time whose segments are filled by how much of that time is claimed.
- **The ledger** (`.ledger`, `src/components/TaskLedger.jsx`) is the default
  list: hairline rows, a fixed column for dates and counts, selection confirmed
  in the bar under the list. A tick selects; it never writes.
- New screens go through `src/components/Modal.jsx` for dialogs and
  `EmptyState` / `ErrorState` for the states.

## Testing

Vitest is configured and runs with `npm test`. It shares the Vite config, so
there is no extra build tooling.

**Test the logic, not the layout.** Filtering, sorting, counts, the countdown,
the week rail, the token contract and the route guard are tested. Pure markup
is verified by looking at it in a browser, not by asserting on class names.
Firestore and Auth need mocks; `firebase/firestore` can be stubbed with
`vi.mock`.

**The rules are tested separately.** `npm test` must stay fast and offline, so
`firestore.rules` is checked by `npm run rules:check` against the Firestore
emulator: it seeds two accounts and asserts what a hostile client gets back.
It exits non-zero on a failure and refuses to report if the emulator started
without the rules file.

## Security

`SECURITY.md` holds the boundary, the audit and the accepted risks. The
short version:

- `VITE_FIREBASE_*` values are **bundled into the client and are public by
  design.** Never put a real secret in a `VITE_` variable, and never put
  service-account credentials in this repo. `.env.example` says so — keep it
  that way.
- Actual access control lives in **`firestore.rules`, on the server.** Any
  change that widens what a client can read or write is a rules change, checked
  with `npm run rules:check`, deployed with
  `firebase deploy --only firestore:rules`. Assume the client is hostile and
  that a new key written by the client is refused until the rules name it.
- **A URL written by another account** is rendered only through
  `src/utils/safeHttpsUrl` — plain `https`, nothing else.
- `.env.local` is gitignored. Only `.env.example` is committed.
- The app sets no analytics and no marketing cookies. It does not load
  anything from a third party — the fonts are self-hosted for exactly that
  reason. Keep it that way unless the privacy policy changes with it.

## Skills

The work in this repo is driven by five skills, installed in
`~/.config/opencode/skills/` so **every** project has them. A copy may sit in
`.opencode/skills/` for convenience; that directory is gitignored on purpose —
the repository holds the app, not the assistant's tooling.

| Skill | Use it for |
| --- | --- |
| `frontend-design` (`anthropic-frontend-design`) | a new screen or a visual direction, before markup |
| `anti-slop-design` | turning a generic layout into a specific one; reviewing "make it look professional" |
| `ai-slop` | the rubric: what makes an interface read as generated, and how to repair it |
| `security-review` | a focused pass over pending changes |
| `insecure-defaults` | secrets, auth, fail-open configuration, permissive CORS |

Read the relevant one before the first line of markup or the first rule;
`DESIGN.md` and `SECURITY.md` are where their conclusions are recorded.

## Deployment

The app ships to **both** GitHub Pages and Vercel from the same codebase.

**Base path.** `vite.config.js` uses `base: process.env.BASE_PATH || '/'`. It is
never hardcoded, because the two targets need different values:

| Target | `base` | Set by |
| --- | --- | --- |
| Local dev | `/` | unset |
| Vercel | `/` | unset |
| GitHub Pages project site | `/Scribe/` | `actions/configure-pages` `base_path` output |

**Client-side routing.** `src/App.jsx` uses `BaseRouter` (in
`src/components/BaseRouter.jsx`), not `BrowserRouter` directly. It sets the router
`basename` from `import.meta.env.BASE_URL` and restores the path stashed by the
Pages `404.html` fallback. **Use `BaseRouter` in any new entry point** — a plain
`BrowserRouter` breaks every deep link on GitHub Pages.

The `404.html` fallback is emitted by the `githubPagesSpaFallback` plugin in
`vite.config.js` at build time, with the base baked in. If you add a second build
target with a different base, that plugin is what keeps deep links working.

**Bundle splitting.** `manualChunks` in `vite.config.js` keeps React, the
router, Firebase Auth and Firestore in their own chunks. The public page must
not pull the database SDK: if you import a hook from a component on the
landing page's route chain, the public bundle grows again. `TodayCount` is
lazy for exactly this reason.

**Commands**

- GitHub Pages — push to `main`; `.github/workflows/deploy.yml` builds with the
  correct `BASE_PATH` and deploys.
- Vercel — `vercel --prod` locally, or connect the repo in the Vercel dashboard for
  automatic deploys and per-PR previews.

**Environment variables.** `VITE_FIREBASE_*` are set in the Vercel dashboard and in
the GitHub Actions environment — never in a committed file. They are baked into the
client bundle and are public.

**Response headers** are set in `vercel.json` (nosniff, no framing, referrer
policy, permissions policy, HSTS). GitHub Pages cannot set headers, so the
Pages deployment has none of them — that is a documented gap in `SECURITY.md`,
not an oversight.

**The public address** lives in `src/config.js` as `SITE_URL`. It drives the
canonical tags, the Open Graph cards, `robots.txt` and `sitemap.xml`. It is
currently a placeholder — confirm the real domain before publishing.

**Before calling a deploy done**, check the live URL: assets must resolve from the
right base, and a deep link must return the app rather than a 404. A green build
does not prove either. Check the fonts too — they are bundled from
`src/assets/fonts/`, so a stale `public/fonts/` reference breaks the base path
without breaking the build.
