# Scribe — design system

The app is a **ruled schoolbook**: paper ground, ink text, one pen colour,
hairline rules instead of shadows, and a study rail that shows claimed time.
Nothing here is decorative. If a line does not separate two things, it is not
drawn.

This document is the contract. `src/design-system/tokens.test.js` enforces the
parts a machine can check (contrast ratios, theme completeness, no gradients).
The rest is enforced by review.

---

## 1. Where the colour comes from

The palette is the four swatches the product owner chose, used literally and
as **roles**, not as a rainbow:

| Swatch | Value | Dark "Noč" (default) | Light "Dan" |
| --- | --- | --- | --- |
| Charcoal-violet | `#3A3843` | page canvas | text |
| Slate | `#44454E` | raised surface (`--rp-raised`) | secondary text |
| Muted mauve | `#725C5C` | `--rp-mark`: primary buttons, own chat messages, selection | same |
| Pale sage | `#D6DBDA` | secondary text | page canvas |

Two mauve tokens, because one value cannot do both jobs:

- `--rp-mark` is the swatch itself. It is a **fill** with `--rp-mark-ink` on
  it (≥ 4.5:1 in both themes). It is never text.
- `--rp-accent` is the mauve adjusted for **text and lines**: links, focus
  rings, the active nav marker. Lightened (`#DCB8B2`) on the dark canvas,
  deepened (`#5E4A4A`) on the light one, so it clears 4.5:1 as text.

Rules:

- **One accent hue.** Mauve, in those two tokens, is the only action colour.
  It never appears as a large background wash.
- **No cards.** Content sits on the page. Groups are separated by a hairline
  (`--rp-line`) and space, never by a box with a fill, four borders and a
  radius. Floating layers (menus, dialogs, the mobile tab bar) are the only
  surfaces with their own fill, because they really are above the page.
- **Status colours are separate from the accent** and are only used for
  status: warning is ochre, danger is brick, success is pine, info is
  steel-blue.
- **Subject hues are data.** Ten fixed hues carry a subject's identity across
  both themes. They are the only other colours in the product and they are
  never used for decoration.
- **Never a gradient.** Not for the hero, not for a button, not for a chart.
  The test fails the build if the word appears in `index.css`.

## 2. Type

- **Display — Space Grotesk** (self-hosted). Headlines, numerals, the wordmark.
  Tight tracking (`-0.03em`) at large sizes, never below 1.05 line-height.
- **Reading — DM Sans** (self-hosted). Body copy, labels, controls.
- **Mono — system stack.** Times, dates, codes, counts. Data is read in
  columns, so numbers are tabular.

Both faces are bundled from `src/assets/fonts/`; the app makes no third-party
font request. Adding a webfont would be a privacy-policy change, not a style
choice.

**Scale** (`--text-*` in `src/index.css`): `display` 40–68px, `hero` 34–52px,
`page` 28–36px, `title` 22px, `subtitle` 17px, `body` 15px, `small` 13px,
`label` 12px. Body copy is capped at `62ch`; a paragraph that runs wider than
the measure is a bug.

## 3. Space, radius, shape

- **4px base unit.** Every vertical interval is a step on the scale in
  `@theme` (`--spacing-1` … `--spacing-24`).
- **Radius is a family, not a pill:** `xs 4px`, `sm 6px`, `md 8px`, `lg 10px`,
  `xl 12px`. Sheets and rows use `md`; buttons use `sm`. `rounded-full` is
  reserved for a circle that means something (avatar, toggle knob, progress
  dot).
- **Elevation is a hairline.** `--rp-shadow-*` exists only for menus and
  modals that genuinely float above the sheet. Cards are separated by
  `--rp-line`, not by a shadow.

## 4. Structure

- **The study rail** is the product's signature: a horizontal run of time,
  one segment per day, filled by how much of that day is claimed. It appears on
  the landing hero, the auth panel and the dashboard. Three places, no more.
- **The margin rule** (`--rp-rule`, 2px, mauve) marks the start of a page's
  title block. It is the gutter line of an exercise book.
- **The ledger** is the list primitive: rows separated by hairlines, no boxes,
  a fixed column for dates and counts.
- **The shell**: fixed side rail from `lg`, top bar, bottom tab bar below `lg`.
  The active destination is marked with a 3px accent bar and accent text — not
  with a filled pill.

## 5. Components

| Primitive | File | Notes |
| --- | --- | --- |
| `.btn`, `.btn-primary`, `.btn-danger`, `.btn-sm`, `.btn-icon` | `index.css` | one geometry, fill changes |
| `.field`, `.field-label` | `index.css` | 6px radius, accent ring on focus |
| `.panel`, `.card`, `.sheet`, `.row-item` | `index.css` | legacy names, now only a hairline — do not use in new markup |
| `.ledger`, `.ledger-row` | `index.css` | list with hairlines; the default for any list |
| `.note` + `data-tone` | `index.css` | a warning or error: a coloured rule in the margin, not a tinted box |
| `.task-check` | `index.css` | native checkbox in `--rp-mark` |
| `.rail`, `.rail-seg` | `index.css` | time claimed |
| `Modal` | `components/` | every dialog; a bottom sheet on phones, keeps focus, closes on Escape |
| `EmptyState`, `ErrorState` | `components/` | every non-content state; flat, left-aligned |
| `TaskLedger` | `components/` | any list of tasks: tick to select, then confirm in the bar under the list |

New screens compose these. A screen that invents a second button shape, a
boxed card or a coloured hero block is out of system.

**Touch.** Under `pointer: coarse` every `.btn` and `.field` is at least 44px
tall and fields use 16px text, so iOS does not zoom when one takes focus.

**Selecting is not completing.** A tick in a task list only selects. Nothing is
written until the student presses the button in the selection bar, also when
one task is selected — a stray tap never changes the list.

## 6. Motion

One orchestrated moment — the page rise — and everything else answers an
action. Durations: 120ms fast, 200ms base, 340ms slow. Easing is
`cubic-bezier(0.2, 0.8, 0.2, 1)`.

Both the system preference (`prefers-reduced-motion`) and the in-app switch
(`data-motion="reduced"`) collapse all duration to 0.01ms. Never animate a
layout property; animate transform and opacity.

## 7. Language

The UI ships in **Slovenian (default), English, German, Italian and Croatian**.

- The i18n layer is in `src/i18n/`. A message key **is its Slovenian source
  string**, so an untranslated screen degrades to Slovenian instead of showing
  a raw key.
- `en` is a complete translation and is the fallback for `de`, `it` and `hr`.
  Coverage of the deeper screens is tracked in `src/i18n/messages.test.js`.
- Dates and numbers go through `Intl` with the active locale; Slovenian
  timestamps stay in `Europe/Ljubljana` because that is the school day the app
  is built around.
- Plurals are not string concatenation. `countNoun` in `src/i18n/plural.js`
  asks `Intl.PluralRules` for the category and picks a form.
- **The legal pages stay Slovenian.** They are the authoritative text of a
  Slovenian service; a translation would be a different legal document. The
  footer says so.

## 8. What is deliberately not here

These are intentional, not oversights:

- No dark/light illustration set. The product has no illustrations; the rail
  and the ledger carry the identity.
- No drop shadows on cards, no glass panels, no blurred colour blobs.
- No icon set dependency. The eleven icons in `components/icons.jsx` are
  hand-written paths on a 24px grid.
- No component library. The primitives above are ~80 lines of CSS.
- No page transitions. Only the first paint rises.

## 9. Accessibility

- Every foreground/background pairing meets **WCAG AA** in both themes, checked
  by ratio in `tokens.test.js`.
- Focus is always visible: a 2px accent outline with 3px offset.
- The shell has a skip link; dialogs trap focus and close on Escape; live
  regions announce async notes.
- The high-contrast switch strengthens lines and secondary text without
  introducing new colours.
