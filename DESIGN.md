# Scribe — design system

Scribe looks like a **scribe's book under a reading lamp**: warm paper, warm
ink, and exactly one vermilion pen. The type does the talking — Fraunces at
display sizes, Geist for everything you read — and the structure is a set of
hairlines and generous margins, not a set of boxes.

This document is the contract. `src/design-system/tokens.test.js` enforces the
parts a machine can check (contrast ratios, theme completeness, font roles, no
gradients). The rest is enforced by review.

---

## 1. Direction

The reference is a header-driven editorial portfolio: a thin top rule, an
oversized headline, small mono labels, no decoration that is not typography.
Scribe borrows that restraint and applies it to a school planner.

- **One idea per screen.** A screen opens with an eyebrow, a Fraunces
  headline, a short deck, then the work. No hero blocks, no stat-card rows,
  no ornamental illustration.
- **The page is the surface.** Content sits directly on the canvas. Groups are
  separated by a `--rp-line` hairline and space. Menus, dialogs and popovers
  are the only things with their own fill, because they float.
- **The pen is singular.** Vermilion marks the one action on a screen, the
  current destination, and data that is literally "yours". It is never a
  decorative wash.
- **The book is the metaphor, not the costume.** No paper texture images, no
  drop caps, no fake bookmarks. The book shows up in the type, the rules and
  the margin line.

## 2. Colour

Two themes, one palette. Dark is the default (`Noč`); light is `Dnevnik`. The
light theme is a full token swap — no component has a theme override.

| Role | Light `Dnevnik` | Dark `Noč` (default) |
| --- | --- | --- |
| Canvas | `#f4efe4` cream paper | `#14120f` ink-black |
| Panel | `#ede6d8` | `#1b1815` |
| Raised (floating) | `#fbf7ee` | `#23201b` |
| Overlay (hover) | `#e6ddcb` | `#2c2822` |
| Text | `#1a1814` | `#f5f0e6` |
| Subtle | `#3a342b` | `#dad3c6` |
| Muted | `#5c5447` | `#b0a899` |
| Accent (text/line) | `#b23217` | `#ff8f70` |
| Mark (fill) | `#c93a1f` | `#e2452b` |
| Rule | `#c93a1f` | `#ff6b47` |

Two action tokens, because one value cannot do both jobs:

- **`--rp-mark`** is the vermilion itself. It is a **fill** carrying
  `--rp-mark-ink` at ≥ 4.5:1 — primary buttons, own chat messages, selected
  rows, the logo tile.
- **`--rp-accent`** is vermilion adjusted for **text and lines**: links, the
  active nav marker, focus rings, the margin rule.

Rules:

- **One accent hue.** Vermilion in those two tokens is the only action colour.
- **No cards.** A group is a hairline and space, never a box with a fill, four
  borders and a radius.
- **Never a gradient.** Not for the hero, a button, a chart or the logo. The
  test fails the build if the word appears in `index.css`.
- **Status colours are only status:** ochre (warn), brick (danger), pine
  (success), steel-blue (info).
- **Subject hues are data.** Ten fixed hues carry a subject's identity across
  both themes. They are never decoration.

## 3. Type

All three faces are self-hosted from `src/assets/fonts/`; the app makes no
third-party font request.

- **Fraunces** (`--font-display`) — headlines, page titles, the wordmark.
  Variable, optical sizing on. Tight tracking at display sizes and a
  line-height of 1.02–1.06.
- **Karla** (`--font-sans`) — body copy, labels, controls, navigation. A
  grotesk with a warm, slightly irregular skeleton: it belongs to the same
  humanist family as Fraunces, and it is not the neutral system-UI face the
  category defaults to.
- **JetBrains Mono** (`--font-mono`) — dates, times, counts, codes, eyebrows.
  Data is read in columns, so numerals are tabular.

**Why not Inter / Geist.** Both are the reflex pairing for a modern product
UI, and neither says anything about a school book. Karla and JetBrains Mono
are chosen so the reading face carries some of the book's warmth and the data
reads like a ledger rather than a dashboard. `tokens.test.js` fails the build
if a retired face reappears in `index.css`.

**Scale** (`--text-*` in `src/index.css`): `display` 44–84px, `hero` 36–60px,
`page` 32–48px, `title` 22px, `subtitle` 17px, `body` 15px, `small` 13px,
`label` 11px. Body copy is capped at `62ch`; a paragraph wider than the
measure is a bug.

Homepage display type is allowed to be the loudest thing on the page. Inside
the app, `text-page` is the ceiling — an interior screen never shouts.

## 4. Space, radius, shape

- **4px base unit.** Every vertical interval is a step of the scale in
  `@theme` (`--spacing-1` … `--spacing-24`).
- **Radius is one step: 2px.** Every corner in the product — button, field,
  menu, dialog, ledger row, the logo tile — is cut to the same 2px, so the
  interface reads as printed rules rather than as soft UI. The `--radius-xs`
  … `--radius-2xl` names all resolve to 2px, so nothing drifts. `rounded-full`
  is reserved for a circle that means something (avatar, toggle knob, status
  dot); a progress bar is a 2px-capped rule, not a pill.
- **Elevation is a hairline.** `--rp-shadow-*` exists only for the things that
  genuinely float — menus, dialogs, the public settings popover.
- **Margins are wide.** The editorial reference gets its calm from emptiness;
  a screen with no breathing room is out of system.

## 5. Structure

- **One header, no second navigation.** A sticky top bar carries the wordmark,
  the destinations (inline from `lg`, where eight of them fit) and one account
  button. Below `lg` the destinations live in one menu sheet opened by one
  button. There is no separate sidebar plus bottom bar.
- **One primary action per screen.** The accent button appears once. Secondary
  routes are plain links, not a row of equal buttons.
- **Options exist once, in Settings.** Language, theme, contrast, motion and
  study preferences live on `/settings` and nowhere else in the signed-in app.
  The public header exposes the same options in one settings popover, because
  a visitor has no account yet. Duplicating a theme toggle in the top bar is
  a bug.
- **The margin rule** (`--rp-rule`, 3px) starts a page's title block, like the
  gutter line of an exercise book.
- **The ledger** is the list primitive: rows separated by hairlines, no boxes,
  a fixed column for dates and counts.
- **The study rail** is the product's one data graphic: a run of time whose
  segments are filled by how much of that time is claimed. It appears on the
  landing hero, the auth panel and the dashboard. Three places, no more.

## 6. Components

| Primitive | File | Notes |
| --- | --- | --- |
| `.btn`, `.btn-primary`, `.btn-danger`, `.btn-sm`, `.btn-lg`, `.btn-icon` | `index.css` | one geometry, fill changes |
| `.field`, `.field-label` | `index.css` | 3px radius, accent ring on focus, mono label |
| `.eyebrow` | `index.css` | the small mono line above a heading |
| `.deck` | `index.css` | the opening paragraph under a display heading |
| `.floating` | `index.css` | the one floating surface: menus, dialogs, popovers |
| `.ledger`, `.ledger-row` | `index.css` | list with hairlines; the default for any list |
| `.note` + `data-tone` | `index.css` | a warning or error: a coloured rule in the margin |
| `.task-check` | `index.css` | native checkbox in `--rp-mark` |
| `.rail`, `.rail-seg` | `index.css` | time claimed |
| `Logo` | `components/Logo.jsx` | the nib mark: flat vermilion tile + ink nib |
| `Modal` | `components/` | every dialog; a bottom sheet on phones, keeps focus, closes on Escape |
| `EmptyState`, `ErrorState` | `components/` | every non-content state; flat, left-aligned |
| `TaskLedger` | `components/` | any list of tasks: tick to select, then confirm in the bar under the list |
| `SettingsSection` | `components/settings/` | one topic on the settings page, separated by a hairline |

New screens compose these. A screen that invents a second button shape, a
boxed card or a coloured hero block is out of system.

**Touch.** Under `pointer: coarse` every `.btn` and `.field` is at least 44px
tall and fields use 16px text, so iOS does not zoom when one takes focus.

**Selecting is not completing.** A tick in a task list only selects. Nothing is
written until the student presses the button in the selection bar, also when
one task is selected — a stray tap never changes the list.

## 7. The mark

The logo is a **nib**: a flat vermilion tile with a fountain-pen nib cut in
ink. It is drawn as one SVG in `components/Logo.jsx` from tokens, so it follows
the theme. `public/scribe-logo.svg` and the raster icons are the same geometry
at build-time colours. There is no gradient and no second mark; the wordmark is
always set in Fraunces next to it.

## 8. Motion

One orchestrated moment — the page rise — and everything else answers an
action. Durations: 120ms fast, 200ms base, 340ms slow. Easing is
`cubic-bezier(0.2, 0.8, 0.2, 1)`.

Both the system preference (`prefers-reduced-motion`) and the in-app switch
(`data-motion="reduced"`) collapse all duration to 0.01ms. Never animate a
layout property; animate transform and opacity. Nothing loops except a loading
skeleton.

## 9. Language

The UI ships in **Slovenian (default), English, German, Italian and Croatian**.

- The i18n layer is in `src/i18n/`. A message key **is its Slovenian source
  string**, so an untranslated screen degrades to Slovenian instead of showing
  a raw key.
- The language is chosen once, in Settings. A visitor gets the browser
  language; the public settings popover is the only switch outside the app.
- Dates and numbers go through `Intl` with the active locale; Slovenian
  timestamps stay in `Europe/Ljubljana` because that is the school day the app
  is built around.
- Plurals are not string concatenation. `countNoun` in `src/i18n/plural.js`
  asks `Intl.PluralRules` for the category and picks a form.
- **The legal pages stay Slovenian.** They are the authoritative text of a
  Slovenian service; a translation would be a different legal document.

## 10. What is deliberately not here

These are intentional, not oversights:

- No illustration set. The type, the rail and the ledger carry the identity.
- No drop shadows on content, no glass panels, no blurred colour blobs.
- No icon-set dependency. The icons in `components/icons.jsx` are hand-written
  paths on a 24px grid.
- No component library. The primitives above are the component system.
- No page transitions. Only the first paint rises.
- No theme or language control in the header. That is what Settings is for.

## 11. Accessibility

- Every foreground/background pairing meets **WCAG AA** in both themes, checked
  by ratio in `tokens.test.js`.
- Focus is always visible: a 2px accent outline with 3px offset.
- The shell has a skip link; dialogs trap focus and close on Escape; live
  regions announce async notes.
- The high-contrast switch strengthens lines and secondary text without
  introducing new colours.
- The header nav, the account menu and the public settings popover are all
  keyboard operable and close on Escape.
