# Design Overhaul Plan — Agent Studio

## Goal

Move Agent Studio from a Next.js starter aesthetic to a product with a distinct visual identity, without altering any behaviour, layout structure, or functionality. Every change is purely presentational: tokens, class names, and copy.

## Approach

Agent Studio is a developer/power-user tool for building and running AI agents. The audience is technical. The right register is precise, confident, and tool-like — closer to a code editor or a professional SaaS dashboard than a consumer product. The design decision: **a cool-neutral monochrome base with a single warm accent reserved exclusively for AI-generated or AI-active states**. No blue-600 as a generic interactive color; indigo replaces it for structure, and a single amber/orange accent fires only when the model is thinking or has produced something.

Token system:
- **Canvas:** `#F8F8F7` (warm off-white, not pure white, not cream)
- **Surface:** `#FFFFFF`
- **Border subtle:** `#E4E4E2`
- **Border strong:** `#C8C8C4`
- **Text primary:** `#111110`
- **Text secondary:** `#6B6B68`
- **Text tertiary:** `#9B9B97`
- **Accent (AI/active):** `#C2460A` — a muted burnt-orange; used only on: the Generate button, the step progress indicator, the active-run highlight, and the Improve accent
- **Structural (nav, focus, selection):** `#4338CA` (indigo-700) — used for focus rings and nav active state only
- **Type:** Add `IBM Plex Sans` as the display/wordmark weight; keep Geist Sans as body. If adding a second font is blocked by the no-new-dependencies rule, use Geist alone with deliberate weight choices.

These tokens are defined once in `globals.css` via `@theme` and used as Tailwind semantic tokens throughout.

---

## Sub-Tasks

---

### Sub-task 1 — Design tokens and global typography

**Status:** [ ] pending

**Intent**
Define the complete token set in `globals.css` and wire it into Tailwind's theme via `@theme inline`. Add `IBM Plex Sans` via `next/font/google` in `layout.tsx` as the wordmark/display font with a `--font-display` variable. Update `layout.tsx` body background to use the new canvas token.

**Expected Outcomes**
- `globals.css` exports CSS custom properties for all 7 tokens above plus dark-mode equivalents.
- `--font-display` is available as a Tailwind utility (`font-display`).
- Body background changes from `bg-gray-50` to the new canvas color.
- No visual regression on existing pages (tokens not yet applied to components).

**Todo List**
1. Open `app/app/globals.css` — replace `:root` block with the full token set (light + dark).
2. Add `@theme inline` entries mapping each token to a Tailwind color utility name (`--color-canvas`, `--color-surface`, `--color-border-subtle`, `--color-border-strong`, `--color-text-primary`, `--color-text-secondary`, `--color-text-tertiary`, `--color-accent`, `--color-structural`).
3. Open `app/app/layout.tsx` — import `IBM_Plex_Sans` from `next/font/google` with weights `[400, 500, 600]` and variable `--font-display`. Add it to the `<html>` className.
4. Change body `bg-gray-50 dark:bg-gray-950` to `bg-canvas`.
5. Run `npx tsc --noEmit` and `npx eslint app/` — confirm zero new errors.

**Relevant Context**
- `app/app/globals.css` — currently 21 lines, Tailwind v4 `@theme inline` syntax
- `app/app/layout.tsx` — font loaded via `next/font/google`, injected as CSS variable
- Tailwind v4: custom color tokens added in `@theme inline` as `--color-<name>: <value>` become available as `bg-<name>`, `text-<name>`, `border-<name>` utilities automatically.

---

### Sub-task 2 — NavBar redesign

**Status:** [ ] pending

**Intent**
Give the nav a distinct identity. "Agent Studio" becomes a wordmark using `font-display font-semibold` at a larger size. Active nav tab uses `text-structural` underline treatment instead of a pill background. Nav background uses `bg-surface` with a `border-border-subtle` bottom.

**Expected Outcomes**
- Brand name visually separated from nav links in weight, size, and font.
- Active tab indicated by a bottom border or a `text-structural` color shift, not a `bg-gray-100` pill.
- Nav links use `text-text-secondary` inactive / `text-text-primary` active.
- No `rounded-full` on nav tab indicators.

**Todo List**
1. Open `app/app/components/NavBar.tsx`.
2. Change header background to `bg-surface border-border-subtle`.
3. Update logo link: add `font-display text-lg font-semibold text-text-primary tracking-tight`.
4. Replace active tab pill (`bg-gray-100 rounded-full`) with a simple `border-b-2 border-structural text-text-primary` treatment (use `pb-0.5` to align).
5. Inactive tabs: `text-text-secondary hover:text-text-primary`, no `rounded-full`.
6. Run typecheck + lint.

**Relevant Context**
- `app/app/components/NavBar.tsx` — single file, fully controlled

---

### Sub-task 3 — Home page (agents list)

**Status:** [ ] pending

**Intent**
Strengthen the page-level identity and fix the three specific issues: weak brand heading, arrow suffix on CTA, and same-card-kit agent cards.

**Expected Outcomes**
- Page heading "My Agents" uses `font-display font-semibold text-3xl text-text-primary`.
- "Build your first agent" CTA has no trailing `→`.
- "New agent" primary button uses `rounded-md` (not `rounded-full`), `bg-text-primary` with `text-surface`.
- Agent cards use `bg-surface border-border-subtle` with `rounded-md` (not `rounded-xl`), no `hover:border-gray-300` micro-transition; instead a subtle `shadow-sm hover:shadow-md` depth shift.
- Card action buttons: Run uses `rounded-md bg-text-primary`, Edit uses `rounded-md border-border-strong text-text-secondary`.
- Delete `×` button becomes a plain `text-text-tertiary hover:text-red-600` text button, no shape.

**Todo List**
1. Open `app/app/page.tsx`.
2. Update heading classes.
3. Update "New agent" button shape and color.
4. Remove `→` from empty-state CTA.
5. Update agent card container classes.
6. Update card action button classes.
7. Update delete button.
8. Run typecheck + lint.

**Relevant Context**
- `app/app/page.tsx` — 142 lines, no external component dependencies beyond `AgentContext`

---

### Sub-task 4 — Build page column headers and eyebrow treatment

**Status:** [ ] pending

**Intent**
Remove the `uppercase tracking-widest text-blue-600 1 · Input` eyebrow pattern from all three column headers across both the Build page and Run page. Replace with a plain `text-sm font-semibold text-text-primary` label.

**Expected Outcomes**
- No `uppercase tracking-widest` on column headers anywhere in the app.
- No `blue-600` on column eyebrows.
- Column numbers (1, 2, 3) removed from headers — they served no navigational purpose.
- Section labels read as `text-sm font-semibold text-text-primary`, with the descriptive subtitle as `text-xs text-text-tertiary`.

**Todo List**
1. Open `app/app/build/page.tsx` — locate all three `<p className="text-xs font-semibold uppercase tracking-widest text-blue-600 ...">` elements and replace.
2. Open `app/app/run/[id]/page.tsx` — same replacement for all three column eyebrows.
3. Run typecheck + lint.

**Relevant Context**
- `app/app/build/page.tsx:385`, `:462`, `:540` (approx) — three eyebrow instances
- `app/app/run/[id]/page.tsx` — three eyebrow instances in column headers

---

### Sub-task 5 — Button system normalization

**Status:** [ ] pending

**Intent**
Apply a consistent, differentiated button system across the entire app. Three button types, each with a distinct shape and color so they carry meaning:
- **Primary action** (Run test, Run, Accept): `rounded-md bg-text-primary text-surface px-5 py-2 text-sm font-semibold`
- **Secondary action** (Save, Cancel, Reject, Edit): `rounded-md border border-border-strong text-text-secondary px-5 py-2 text-sm font-semibold`
- **AI-generated action** (Generate, Get improvement suggestion, Rate & Improve): `rounded-md border border-accent text-accent px-4 py-2 text-xs font-semibold` — this is the only place the accent color appears on a border/text element
- **Ghost / additive** (+ Add example, + Upload document, + Add step): keep `rounded-md border border-dashed border-border-subtle` — these are already correctly dashed
- **Dismiss / destructive** (×, Remove): plain `text-text-tertiary hover:text-red-600 text-sm`, no border, no background
- Remove all `▶`, `✦`, and `→` from button labels

**Expected Outcomes**
- No `rounded-full` on any action button.
- `rounded-full` is only used on the output-type chip selectors (which are genuinely tag/chip UI).
- No `→` suffix on any button.
- The accent color (`#C2460A`) appears only on the "AI generating" button variant.
- All `blue-600` primary buttons replaced.

**Todo List**
1. `app/app/page.tsx` — update all button classes.
2. `app/app/build/page.tsx` — update all button classes; remove `▶` from "Run test"; remove `✦` from "Generate"; remove `→` from modal "Continue".
3. `app/app/run/[id]/page.tsx` — update all button classes; remove `▶` from "Run".
4. `app/app/improve/page.tsx` — update all button classes; remove `→` from "Get improvement suggestion" and "Accept & update agent" and "Run agent again".
5. `app/app/process/page.tsx` — update button classes.
6. `app/app/test/page.tsx` — update button classes.
7. Run typecheck + lint on all changed files.

**Relevant Context**
- Sub-agent inventory section 6 lists every button className — use as the exhaustive checklist.
- Output chips in `build/page.tsx` keep `rounded-full` (they are chip selectors, not action buttons).
- Star rating buttons in `improve/page.tsx` keep `text-3xl` sizing (they are icon buttons, not action buttons).

---

### Sub-task 6 — Surface depth and form inputs

**Status:** [ ] pending

**Intent**
Introduce a visible surface hierarchy: canvas (`bg-canvas`) → column background (`bg-canvas`) → form elements (`bg-surface`). Update all input/textarea borders to `border-border-subtle` with `focus:ring-structural`. Update card borders to `border-border-subtle`. Remove the `blue-500` focus ring default.

**Expected Outcomes**
- All `focus:ring-blue-500` replaced with `focus:ring-structural`.
- All `border-gray-200 dark:border-gray-700` on cards/inputs replaced with `border-border-subtle`.
- All `bg-white dark:bg-gray-800` on inputs replaced with `bg-surface`.
- All `bg-gray-50 dark:bg-gray-800/50` container backgrounds replaced with `bg-canvas`.

**Todo List**
1. Global search across all page files for `border-gray-200`, `border-gray-300`, `border-gray-600`, `border-gray-700`, `bg-white`, `bg-gray-50`, `bg-gray-800` — replace with semantic tokens.
2. Replace all `focus:ring-blue-500` with `focus:ring-structural`.
3. Leave `bg-gray-900 dark:bg-gray-100` on primary buttons alone — they use `bg-text-primary` now (from sub-task 5); confirm consistency.
4. Run typecheck + lint.

**Relevant Context**
- Affects: `build/page.tsx`, `run/[id]/page.tsx`, `improve/page.tsx`, `process/page.tsx`, `test/page.tsx`, `page.tsx`

---

### Sub-task 7 — Improve page and star rating cleanup

**Status:** [ ] pending

**Intent**
The Improve page uses `text-xs font-semibold uppercase tracking-wide` on "Last run output" — this is another eyebrow pattern. Replace it. The star rating uses `★` character, which is fine but the hover `scale-110` on each star is the "scattered effects" anti-pattern. Replace with a single opacity shift.

**Expected Outcomes**
- "Last run output" label uses `text-sm font-semibold text-text-secondary`.
- Star hover uses `opacity` transition (`opacity-60` inactive → `opacity-100` active/hovered) instead of `scale-110`.
- Success banner ("Agent instructions updated") uses `border-border-subtle bg-canvas` with `text-text-primary` — not a colored banner, since it is not an error state.

**Todo List**
1. Open `app/app/improve/page.tsx`.
2. Remove `uppercase tracking-wide` from "Last run output" label.
3. Replace `hover:scale-110` on star buttons with `hover:opacity-80 transition-opacity`.
4. Change accepted state banner from `bg-green-50 border-green-200 text-green-800` to `border-border-subtle bg-canvas text-text-primary` with a plain checkmark prefix.
5. Run typecheck + lint.

**Relevant Context**
- `app/app/improve/page.tsx` — full content in sub-agent inventory section 10

---

## Validation (run after all sub-tasks)

```bash
cd app && npx tsc --noEmit
cd app && npx eslint app/
```

Both must pass with zero new errors. The one pre-existing UploadedDoc warning is acceptable.

---

## PR Strategy

Each sub-task is a separate PR:
- `feat(design): design tokens and typography` (sub-task 1)
- `feat(design): navbar identity` (sub-task 2)
- `feat(design): home page` (sub-task 3)
- `feat(design): remove eyebrow pattern` (sub-task 4)
- `feat(design): button system` (sub-task 5)
- `feat(design): surface depth and inputs` (sub-task 6)
- `feat(design): improve page cleanup` (sub-task 7)

All branch off `main`. All merge to `main` via PR. Never commit directly to main.
