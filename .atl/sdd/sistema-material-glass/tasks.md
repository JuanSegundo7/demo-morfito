# Tasks: sistema-material-glass — Material/glass surface system for `dashboard-demo`

Derived from the approved spec (`.atl/sdd/sistema-material-glass/spec.md`) and design
(`.atl/sdd/sistema-material-glass/design.md`). PR boundaries are design's own **five-PR** staging
(PR1 tokens → PR2 retint → PR3 aliases → PR4 modals → PR5 sidebar), broken into ordered, checkable
tasks at the rigor bar of `.atl/sdd/reconciliar-finanzas-demo/tasks.md`.

> **Size note**: this document exceeds the generic `sdd-tasks` word budget, mirroring design.md's own
> override note, at the requester's explicit rigor bar (14-file modal list, verbatim unlayered CSS,
> exact accessibility values). Explicit instruction wins over the generic budget.

> **This repo has no automated visual coverage (R6).** `package.json` runs `vitest run` under jsdom,
> which cannot evaluate `backdrop-filter`, cascade layers, or `@media`/`@supports` fallbacks. Every
> task below whose outcome is a rendered visual is marked **[Manual QA — requires a browser]**; every
> task whose outcome is a class name, token value, or grep result is marked
> **[Code-checkable via grep/tsc]**. No vitest test is invented for anything purely visual — none of
> the code-checkable tasks below claims coverage it does not have.

## Review Workload Forecast

| PR | Scope | Files | Est. changed lines (design's own estimate) | 400-line risk |
|----|-------|-------|--------------------:|---------------|
| PR1 | Tokens + new `@utility` blocks + 4 accessibility blocks | 1 (`globals.css`) | ~185 | Low |
| PR2 | `.ios-*` → `@utility`, retinted; `button.tsx` shadow fix | 2 | ~65 | Low |
| PR3 | `--card`/`--popover`/`--sidebar`/`--border` aliases + popover-family `material-thick` pass | 6 | ~45 | Low |
| PR4 | Modal convergence: 3 primitives + header + 10 files/16 call sites | 14 | ~50 | Low |
| PR5 | `.ios-sidebar` unlayered rules + R-MODAL guard + `data-resizing` | 2 | ~45 | Low |
| **Total** | | **18 distinct files** | **~390** | |

Decision needed before apply: No
Chained PRs recommended: Yes
Chain strategy: stacked-to-main
400-line budget risk: Low

No individual PR risks the 400-line budget (largest is PR1 at ~185); design.md's own staging is
already single-concern and independently revertible per unit (`design.md` Migration/Rollout, and
`proposal.md`'s rollback table) — no split decision is needed before `sdd-apply`. Every unit ships and
reverts with `git revert`; there is no persisted state, no migration, no external consumer of these
class names, which is why `stacked-to-main` (merge each PR to `main` in order, fix on the go) fits
better than a tracker-branch chain here.

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | Token ladder + new unreferenced `@utility` blocks + 4 unlayered accessibility blocks | PR1 | Base: main. Zero visual change by construction — nothing consumes the new classes yet. |
| 2 | `.ios-glass`/`.ios-blur`/`.ios-shadow-*` leave `@layer base`, become `@utility`; `button.tsx` sheds its now-colliding base shadow | PR2 | Base: PR1. Still opaque in dark mode — `--card` has not moved. |
| 3 | `--card`/`--popover`/`--sidebar`/`--border` become material aliases; popover family converts to `material-thick` in the SAME commit | PR3 | Base: PR2. **Hard dependency, both directions**: pointless without PR2's retint; PR2 shows no translucency without this. Highest-risk unit — its own QA pass, do not merge with anything else. |
| 4 | `Dialog`/`AlertDialog`/`Sheet` converge on `modal-surface`; overlays on `scrim`; header drops `bg-card`; 16 call sites across 10 files drop `ios-glass` | PR4 | Base: PR3. Depends only on PR1's tokens + PR2's `.ios-glass`/`modal-surface` classes; could ship ahead of PR3 if PR3's QA stalls (design.md Migration/Rollout). |
| 5 | `.ios-sidebar` unlayered rule + R-MODAL unlayered guard + `data-resizing` wiring | PR5 | Base: PR4 (or PR1, per dependency note below). |

**Note on stated PR order vs. a claim in the launch prompt.** The launch prompt asked for the PR order
to reflect "`--card` translucent + popover conversion BEFORE OR IN THE SAME PR as the `.ios-glass`
retint." That is the **reverse** of what `design.md` actually specifies and re-confirms twice:
"PR 3 without PR 2 is pointless (the aliases would feed a flat `.ios-glass`)" and "Unit 2 without Unit
3 produces no translucency in dark mode — together they are the visual payload, apart they are each
reviewable" (`design.md`, Migration/Rollout + proposal.md §Scope). `design.md`'s Decision 2(c) analysis
(`bg-card` still beats `.ios-glass` after the `@utility` move, but that no longer matters once both
resolve to the same `var(--card)` reference) promotes PR3 to a **hard prerequisite for visible
translucency**, not a prerequisite for PR2 to exist safely — PR2 ships correctly and independently
first, opaque, and PR3 is what makes it translucent. The tasks below follow `design.md`'s actual order
(PR1 → PR2 → PR3 → PR4 → PR5). If a genuine PR2/PR3 swap is wanted, that is a change to `design.md`
itself, not a `sdd-tasks` decision — flagged rather than silently "corrected" one way or the other.

---

## Phase 1 (PR1): Tokens, new `@utility` blocks, accessibility fallbacks (~185 lines, `globals.css` only)

Zero visual change by construction: every new class is unreferenced. Values from morfito, bodies from
jebbs (donor split, R7) — full literal table in `design.md` Deliverable 1.

- [x] 1.1 `[code-checkable via grep/tsc]` Add light-mode surface ladder to `:root` — `--surface-0`
      (`#f2f2f7`, already = `--background:12`), `--surface-1` (`#ffffff`), `--surface-2` (`#f5f5f7`),
      `--surface-3` (`#e9e9ee`).
- [x] 1.2 `[code-checkable via grep/tsc]` Add light-mode materials/blur/well to `:root` —
      `--material-thin` (`rgba(255,255,255,0.72)`), `--material-regular` (`rgba(255,255,255,0.78)`),
      `--material-thick` (`rgba(255,255,255,0.86)`), `--well` (`rgba(0,0,0,0.04)`), `--blur-thin`
      (`14px`), `--blur-regular` (`28px`), `--blur-thick` (`44px`), `--blur-scrim` (`6px`),
      `--material-saturate` (`165%`).
- [x] 1.3 `[code-checkable via grep/tsc]` Add light-mode hairline/specular to `:root` — `--hairline`
      (`rgba(60,60,67,0.13)`), `--hairline-strong` (`rgba(60,60,67,0.22)`), `--specular`
      (`rgba(255,255,255,0.6)`), `--specular-strong` (`rgba(255,255,255,0.85)`).
- [x] 1.4 `[code-checkable via grep/tsc]` Add dark-mode surface ladder to `.dark` — `--surface-0`
      (`#09090b`, already = `--background:61`), `--surface-1` (`#101215`), `--surface-2` (`#18181b`,
      already = `--card:62`/`--popover:66`/`--sidebar:85`), `--surface-3` (`#202024`).
- [x] 1.5 `[code-checkable via grep/tsc]` Add dark-mode materials/blur/well to `.dark` — `--material-thin`
      (`rgba(24,24,27,0.55)`), `--material-regular` (`rgba(24,24,27,0.72)`), `--material-thick`
      (`rgba(15,15,17,0.85)`), `--well` (`rgba(0,0,0,0.30)`), same blur/saturate values as 1.2.
- [x] 1.6 `[code-checkable via grep/tsc]` Add dark-mode hairline/specular to `.dark` — `--hairline`
      (`rgba(255,255,255,0.09)`), `--hairline-strong` (`rgba(255,255,255,0.16)`), `--specular`
      (`rgba(255,255,255,0.10)`), `--specular-strong` (`rgba(255,255,255,0.18)`).
- [x] 1.7 `[code-checkable via grep/tsc]` Replace dark `--shadow-sm/md/lg/xl` (currently `:100-103`)
      with jebbs' doubled contact+ambient values (Decision 1 — resolves Q1). Exact values, dark only —
      **light mode is untouched**:
      ```
      --shadow-sm: 0 1px 2px rgba(0,0,0,0.45), 0 1px 1px rgba(0,0,0,0.30);
      --shadow-md: 0 4px 14px -2px rgba(0,0,0,0.55), 0 2px 6px -2px rgba(0,0,0,0.40);
      --shadow-lg: 0 16px 40px -8px rgba(0,0,0,0.65), 0 6px 14px -6px rgba(0,0,0,0.50);
      --shadow-xl: 0 32px 80px -16px rgba(0,0,0,0.75), 0 12px 28px -12px rgba(0,0,0,0.55);
      ```
- [x] 1.8 `[code-checkable via grep/tsc]` Add 6 `@theme inline` entries after `:133`: `--color-hairline`,
      `--color-hairline-strong`, `--color-surface-0/1/2/3` (each `var(--…)`), purely additive — Tailwind
      v4 generates `bg-surface-*`/`border-hairline` on demand.
- [x] 1.9 `[code-checkable via grep/tsc]` Add new `@utility` blocks (bodies verbatim from
      `jebbs/globals.css:404-461`): `material-thin`, `material-regular`, `material-thick`,
      `material-well`, `modal-surface` (includes `box-shadow: var(--shadow-xl)`), `scrim`
      (`rgba(0,0,0,0.55)` + `backdrop-filter: blur(var(--blur-scrim)) saturate(120%)`). **Do NOT touch
      `.ios-glass`/`.ios-blur`/`.ios-shadow-*` in this task — they stay in `@layer base` untouched until
      PR2**, which is the reason PR1's own visual-change claim is exactly zero (`.ios-blur` at
      `dialog.tsx:41` keeps losing to `bg-black/40` on layer order until PR2's conversion).
- [x] 1.10 `[code-checkable via grep/tsc]` Add the `prefers-reduced-transparency: reduce` block,
      unlayered, at EOF. Removes `backdrop-filter`/`-webkit-backdrop-filter` (`!important`) from
      `.material-thin/regular/thick`, `.modal-surface`, `.scrim`, `.ios-blur`; falls each back to a
      literal `--surface-*`: `material-thin` → `--surface-1`, `material-regular` → `--surface-2`,
      `material-thick`/`modal-surface` → `--surface-3`, `scrim`/`ios-blur` → `rgba(0,0,0,0.72)`. Also
      includes the `.ios-sidebar [data-slot="sidebar-inner"]` and `.ios-glass` fallback lines even though
      neither class exists yet — inert until PR2/PR5, per design.md Deliverable 3.
- [x] 1.11 `[code-checkable via grep/tsc]` Add the `prefers-contrast: more` block. Sets, per theme:
      dark `--hairline: rgba(255,255,255,0.30)`, `--specular: rgba(255,255,255,0.45)`,
      `--muted-foreground: #e4e4e7`; light `--hairline: rgba(60,60,67,0.36)`,
      `--specular: rgba(0,0,0,0.16)`, `--muted-foreground: #3c3c43`. **Use `#e4e4e7`/`#3c3c43`, NOT the
      donors' verbatim values** — jebbs'/morfito's blue-tinted `rgba(233,238,250,0.9)` is an R7 leak
      that morfito copied through uncorrected; `dashboard-demo`'s own zinc ladder (`--muted-foreground:
      #a1a1aa` dark, `globals.css:72`) has no blue in it. `.material-thin/regular/thick`/`.modal-surface`
      fall back to `--surface-2`.
- [x] 1.12 `[code-checkable via grep/tsc]` Add the `@supports not ((backdrop-filter: blur(1px)) or
      (-webkit-backdrop-filter: blur(1px)))` block: same `--surface-2` fallback for the material
      classes, `--surface-3` for `.ios-sidebar [data-slot="sidebar-inner"]`, `rgba(0,0,0,0.72)` for
      `.scrim`/`.ios-blur`.
- [x] 1.13 `[code-checkable via grep/tsc]` Add the `prefers-reduced-motion: reduce` block: forces
      `transition-property: opacity, color, background-color, border-color, box-shadow, fill, stroke`,
      `transition-duration: 160ms`, `animation-duration: 160ms`, `animation-iteration-count: 1`,
      `scroll-behavior: auto` (all `!important`) on `*, *::before, *::after`.
- [x] 1.14 `[code-checkable via grep/tsc]` Run `grep` for `#f57c00`, `#ff9f0a`, `#08090c`, and a `14px`
      `--radius` in `app/globals.css` — MUST return empty (R7 gate: no jebbs value anywhere).
- [x] 1.15 `[gate,small]` Run `npm test` (`vitest run`) — full suite green (CSS-only change; regression
      guard only, no new cases expected).

### Manual QA — Phase 1

- [ ] QA1.1 `[Manual QA — requires a browser]` Force `prefers-reduced-transparency: reduce` in devtools
      on any route — confirm no visual change yet (nothing consumes the new classes). This is the "no
      surprise" check for PR1, not the real accessibility QA (that lands once PR2-PR5 ship consumers).
- [ ] QA1.2 `[Manual QA — requires a browser]` Open `print-modal` and `order-details` in dark mode and
      compare shadows before/after 1.7 — confirm the doubled contact+ambient shadow reads as **depth**,
      not a dark halo, against the `scrim` backdrop (design.md's own flagged QA item for Decision 1).

---

## Phase 2 (PR2): Retint `.ios-glass`/`.ios-blur`/`.ios-shadow-*`, move to `@utility` (~65 lines, 2 files)

Still opaque in dark mode — `--card` has not moved yet (PR3). Independently shippable and revertible.

- [x] 2.1 `[code-checkable via grep/tsc]` In `app/globals.css`, move `.ios-shadow-sm/md/lg/xl` out of
      `@layer base` (`:173-187`) into four `@utility` blocks, bodies unchanged
      (`box-shadow: var(--shadow-*)`), names unchanged.
- [x] 2.2 `[code-checkable via grep/tsc]` Convert `.ios-blur` (`:168-170`, currently `background:
      var(--card)`) into an `@utility` block whose body is `scrim`'s (Decision: alias, per
      `jebbs:454-458`) — `background-color: rgba(0,0,0,0.55)` + `backdrop-filter: blur(var(--blur-scrim))
      saturate(120%)` + the `-webkit-` twin.
- [x] 2.3 `[code-checkable via grep/tsc]` Convert `.ios-glass` (`:189-192`) into an `@utility` block:
      `background-color: var(--card)` (unchanged — MUST stay a reference to the same variable, never an
      independent literal, per spec Domain 1), `border-color: var(--hairline)`, `border-top-color:
      var(--specular)`. **No `backdrop-filter` anywhere in the block** — `.ios-glass` stays blur-free by
      design (R9, ~30-file reach).
- [x] 2.4 `[code-checkable via grep/tsc]` Rewrite the CSS comment on `.ios-glass` — do NOT port jebbs'
      verbatim comment (it blames stylesheet order, which is refuted). Write the corrected explanation:
      Tailwind v4 sorts custom utilities by declared CSS property then by candidate name — **never** by
      position in the file — and by that comparator `.ios-glass` (3 declarations) is emitted after
      `.modal-surface` (6) and wins `background-color`/`border`/`border-top-color`, so `.modal-surface`'s
      `box-shadow`/`backdrop-filter` survive and the bug doesn't look wrong at a glance. State the
      prohibition: **never combine `.ios-glass` (or any `.ios-shadow-*`) with `.modal-surface` on the
      same element** — enforced by the unlayered guard shipped in PR5 and by `sdd-verify`'s grep.
- [x] 2.5 `[code-checkable via grep/tsc]` In `components/ui/button.tsx:8`, delete `ios-shadow-sm
      hover:ios-shadow-md` from `buttonVariants`' base string (Decision 6 — fixes F3's alphabetical
      tie-break: `ios-shadow-sm` and `ios-shadow-md` are both `order=[box-shadow], count=1` after the
      `@utility` move, so the comparator falls through to natural-name sort and `"ios-shadow-md" <
      "ios-shadow-sm"` lexicographically ⇒ `md` is emitted first ⇒ **`sm` wins**, silently dropping the
      medium shadow from `default`/`destructive` buttons on their own element). Every variant that wants
      a shadow already declares its own (`default`/`destructive` keep `md`; `outline`'s own
      `hover:ios-shadow-md` finally renders per F2; `ghost`/`link` end up with no shadow, which is
      correct for a ghost button).
- [x] 2.6 `[code-checkable via grep/tsc]` **Evidence gate — do not re-derive, cite design.md's own
      audit.** Confirm (by reading, not re-greping from scratch) that `design.md`'s Verification pass
      table already spot-checked all 26 `ios-glass`+`bg-card` co-occurrence sites (12 of 17 files) and
      confirmed they stay safe because both classes reference the identical `var(--card)` custom
      property — not because of who wins the cascade. Also confirm `design.md`'s F2 list of
      `hover:`/`focus-visible:` variants that come alive for the first time in this PR: `card.tsx:10`
      (`hover:ios-shadow-md`), `button.tsx:16` (`outline`'s own `hover:ios-shadow-md`),
      `badge.tsx:13,15,17,19` (`[a&]:hover:ios-shadow-md`), `input.tsx:12`
      (`focus-visible:ios-shadow-md`). This is the closed evidence set for "did any component depend on
      `@layer base`'s low specificity" — `design.md` already ran it; this task only registers it as the
      record this PR relies on.
- [x] 2.7 `[gate,small]` Run `npx tsc --noEmit -p tsconfig.demo.json` — MANDATORY (touches `button.tsx`).
- [x] 2.8 `[gate,small]` Run `npm test` (`vitest run`) — full suite green, no new cases expected.

### Manual QA — Phase 2

- [ ] QA2.1 `[Manual QA — requires a browser]` Both themes, every route: `Card` hover lift, `outline`
      `Button` hover, anchor `Badge` hover, `Input` focus-ring shadow — the F2 revivals, now rendering
      for the first time. Confirm `ghost`/`link` buttons are flat (no shadow), on purpose.
- [ ] QA2.2 `[Manual QA — requires a browser]` `supply-form-dialog`'s `InputGroupButton`
      (`input-group.tsx:82,102`, `variant="ghost"` + `shadow-none`) stays visually flat — the
      `shadow-none`-vs-`ios-shadow-sm` conflict is dissolved by 2.5, not patched.
- [ ] QA2.3 `[Manual QA — requires a browser]` Dialog overlay dims **and blurs** on open (`.ios-blur` is
      no longer inert). Any dialog is sufficient — full overlay convergence is PR4's job, but the base
      `.ios-blur`/`scrim` body change is visible immediately at `dialog.tsx:41`.
- [ ] QA2.4 `[Manual QA — requires a browser]` Confirm no card/button/badge/input anywhere shows visible
      translucency yet — `--card` is still the opaque `#18181b`/`rgba(255,255,255,0.8)` literal until
      PR3. Any translucency seen here would mean PR3's alias leaked early.

---

## Phase 3 (PR3): `--card`/`--popover`/`--sidebar`/`--border` aliases + popover-family conversion (~45 lines, 6 files). **Highest risk — its own QA pass, do not merge with anything else.**

Hard, mutual dependency with PR2 (see the note in the Review Workload Forecast section): this PR makes
PR2's retint actually translucent, and would be pointless without PR2 already shipped.

- [x] 3.1 `[code-checkable via grep/tsc]` In `app/globals.css`, repoint exactly 10 lines to material
      aliases, both themes: `--card` → `var(--material-thin)` (light `:14`, dark `:62`); `--popover` →
      `var(--material-thick)` (light `:16`, dark `:66`); `--sidebar` → `var(--material-thick)` (light
      `:37`, dark `:85`); `--border` → `var(--hairline)` (light `:28`, dark `:77`); `--sidebar-border` →
      `var(--hairline)` (light `:43`, dark `:91`). No other token (`--input`, `--secondary`, `--muted`,
      `--accent`, `--ring`, chart palette, `--radius`) changes — R7 gate.
- [x] 3.2 `[code-checkable via grep/tsc]` In `components/ui/popover.tsx:33`, **replace** `bg-popover`
      with `material-thick` (Decision 7 — `material-thick`, not jebbs' `material-regular`; keeps the
      class in agreement with `--popover`'s own alias). **Replace, never append**: `bg-popover` is
      `order=[background-color]`, `material-thick` is `order=[border-top-color, background-color,
      backdrop-filter]` — appending would let `bg-popover` win the background while `material-thick`'s
      blur still applies, producing a translucent-but-wrong-background element.
- [x] 3.3 `[code-checkable via grep/tsc]` Same replace in `components/ui/select.tsx:64`.
- [x] 3.4 `[code-checkable via grep/tsc]` Same replace in `components/ui/command.tsx:24`.
- [x] 3.5 `[code-checkable via grep/tsc]` Same replace in `components/ui/dropdown-menu.tsx:45` AND
      `:233` (both sites in the same commit).
- [x] 3.6 `[code-checkable via grep/tsc]` Confirm `components/ui/calendar.tsx:77` (`bg-popover
      inset-0 opacity-0`, an invisible hit-target, not a surface) and `hover-card.tsx`, `menubar.tsx`,
      `navigation-menu.tsx`, `context-menu.tsx` (all `bg-popover`, zero import sites anywhere in the
      repo) are left **unchanged** — out of scope, no runtime exposure.
- [x] 3.7 `[gate,small]` Run `npx tsc --noEmit -p tsconfig.demo.json` — MANDATORY (4 `.tsx` files
      touched).
- [x] 3.8 `[gate,small]` Run `npm test` (`vitest run`) — full suite green.

### Manual QA — Phase 3

- [ ] QA3.1 `[Manual QA — requires a browser]` **Dark mode, translucency**: every route, confirm cards
      (`bg-card`/`.ios-glass`) now visibly show background bleed-through at `rgba(24,24,27,0.55)`, not
      opaque `#18181b`. Cross-check the 3+ of the 17 `ios-glass`+`bg-card` combo files (e.g. `header.tsx`,
      `net-revenue-card.tsx`, `daily-ledger.tsx`) for a seam or repaint artifact — none is expected, both
      classes read the same `var(--card)`.
- [ ] QA3.2 `[Manual QA — requires a browser]` **Dark mode, double shadow**: `print-modal` and
      `order-details` (or any `modal-surface`) over the new `scrim`, both themes — confirm the doubled
      contact+ambient dark shadow (PR1, Decision 1) reads correctly now that the card step it was meant
      to compensate for has shrunk under translucency (design.md's own stated rationale for Decision 1).
- [ ] QA3.3 `[Manual QA — requires a browser]` **Popovers/menus over scrolled content — legibility**: on
      `/finanzas`, open a date-range `Popover`+`Calendar` and a `Select` while the page is scrolled.
      Confirm the content behind the menu is **blurred**, not sharply visible through a translucent
      panel (R3 — this is the exact regression the same-commit popover conversion exists to prevent).
      Repeat for `command`/`dropdown-menu` consumers (25 import sites total across the 4 converted
      components).
- [ ] QA3.4 `[Manual QA — requires a browser]` **Table and input borders on `/costos`** (R5): confirm
      `--border` → `--hairline` reads correctly on every bordered element on that route — the alias
      reaches far beyond the glass surfaces via `globals.css:156-158`'s global `* { @apply border-border
      }`, and is easy to miss because nobody expects a border-color audit on a "glass" change.
- [ ] QA3.5 `[Manual QA — requires a browser]` Light mode: confirm `--card` reads visibly the same or
      only subtly different at `0.72` vs. the pre-change `0.80` — the delta is only meant to become
      visible once something blurs behind it (nothing does in light mode, `.ios-glass` is blur-free).

---

## Phase 4 (PR4): Modal family convergence — 14 files, 19 total edit sites (~50 lines). **R-MODAL is the review focus.**

`cn()` (clsx + tailwind-merge) does **not** dedupe `ios-glass`/`modal-surface` — both are unknown
utilities to tailwind-merge, so both survive into the DOM if not explicitly removed. This is why the
16 call-site deletions below are the mechanism, not optional cleanup (F1).

**3 primitives:**
- [ ] 4.1 `[code-checkable via grep/tsc]` `components/ui/dialog.tsx:41` — **replace** `bg-black/40
      ios-blur` with `scrim`. `:63` — **replace** `ios-glass ios-shadow-xl` with `modal-surface`,
      keeping `rounded-3xl p-10`. **Replace, never append** — this is the primary R-MODAL surface.
- [ ] 4.2 `[code-checkable via grep/tsc]` `components/ui/alert-dialog.tsx:39` — replace `bg-black/50`
      with `scrim`. `:57` — replace `bg-background … border … shadow-lg` with `modal-surface`, keeping
      `rounded-lg p-6`.
- [ ] 4.3 `[code-checkable via grep/tsc]` `components/ui/sheet.tsx:39` — replace `bg-black/50` with
      `scrim`. `:61` — replace `bg-background … shadow-lg` with `modal-surface`. Leave the per-side
      `border-l/r/t/b` at `:63-69` untouched — they set width only and are now redundant no-ops;
      cleaning them up is separate churn, not this PR's job.

**Header (drops now-redundant class, no blur added — Decision 4 / Q2):**
- [ ] 4.4 `[code-checkable via grep/tsc]` `components/layout/header.tsx:38` — drop `bg-card`, **keep**
      `ios-glass`. Do **NOT** add `material-regular`: `SidebarLayout`'s `<main>` is the scroller
      (`sidebar-layout.tsx:42`), `<Header>` is an ordinary `shrink-0` in-flow first child with no
      `sticky` anywhere in `components/layout/` — nothing ever scrolls behind it, so `backdrop-filter`
      would sample a flat `--background` for zero visual gain while adding a composited layer (R9).
      Revisit only if `sticky top-0` is ever added to this header.

**10 files, 16 call sites — delete the `ios-glass` token from each `<DialogContent>`/
`<AlertDialogContent>` `className`, keep `rounded-2xl` and all sizing classes (F1):**
- [ ] 4.5 `[code-checkable via grep/tsc]` `app/(dashboard)/menu/combos/page.tsx:275` and `:447`.
- [ ] 4.6 `[code-checkable via grep/tsc]` `app/(dashboard)/menu/extras/page.tsx:284` and `:368`.
- [ ] 4.7 `[code-checkable via grep/tsc]` `components/menu/edit-recipe-dialog.tsx:282`.
- [ ] 4.8 `[code-checkable via grep/tsc]` `components/costos/supply-form-dialog.tsx:300`.
- [ ] 4.9 `[code-checkable via grep/tsc]` `components/costos/supplies-tab.tsx:510`.
- [ ] 4.10 `[code-checkable via grep/tsc]` `components/clientes/customer-detail.tsx:286` and `:311`.
- [ ] 4.11 `[code-checkable via grep/tsc]` `components/clientes/create-customer-dialog.tsx:72`.
- [ ] 4.12 `[code-checkable via grep/tsc]` `components/clientes/address-form-dialog.tsx:93`.
- [ ] 4.13 `[code-checkable via grep/tsc]` `components/finanzas/recurring-expenses-tab.tsx:326`, `:460`,
      and `:567`.
- [ ] 4.14 `[code-checkable via grep/tsc]` `components/finanzas/expenses-tab.tsx:383` and `:553`.
- [ ] 4.15 `[code-checkable via grep/tsc]` R-MODAL grep gate — `grep -rn 'ios-glass' --include=*.tsx` on
      every `DialogContent`/`AlertDialogContent` call site MUST return empty after 4.1 and 4.5-4.14.
      `grep` for any single `className`/`class` string containing **both** `ios-glass` (or any
      `ios-shadow-sm/md/lg/xl`) and `modal-surface` MUST return empty repo-wide — this is the primary
      enforcement mechanism `sdd-verify` re-runs; a non-empty result is CRITICAL.
- [ ] 4.16 `[code-checkable via grep/tsc]` Confirm `ui/sidebar.tsx:190`'s `SheetContent
      className="bg-sidebar …"` (mobile sidebar) is **left as is** — `bg-sidebar` (1 declaration) still
      wins `background-color` over `modal-surface` by the same comparator (Decision 2), so the mobile
      sidebar correctly keeps `--sidebar` (= `material-thick` after PR3) with `modal-surface`'s blur.
      This is intentional and already verified in design.md — do not "fix" it.
- [ ] 4.17 `[gate,small]` Run `npx tsc --noEmit -p tsconfig.demo.json` — MANDATORY (14 `.tsx` files).
- [ ] 4.18 `[gate,small]` Run `npm test` (`vitest run`) — full suite green.

### Manual QA — Phase 4

- [ ] QA4.1 `[Manual QA — requires a browser]` Every dialog from the spec's manual gate:
      `create-customer`, `edit-recipe`, `supply-form`, `order-details`, `print-modal`, `tour-overlay` —
      confirm one surface definition (`modal-surface`), never `ios-glass` visible as a separate/half-
      opaque layer.
- [ ] QA4.2 `[Manual QA — requires a browser]` The order wizard drawer — same convergence check.
- [ ] QA4.3 `[Manual QA — requires a browser]` Mobile sidebar (`SheetContent` + `bg-sidebar`, 4.16):
      confirm it renders as `--material-thick`, single-tinted — not a double-tint artifact.
- [ ] QA4.4 `[Manual QA — requires a browser]` Header, both themes: confirm it reads as before (no
      blur added), only the redundant `bg-card` removed — no visual delta expected on this element.

---

## Phase 5 (PR5): Sidebar glass — `.ios-sidebar` + R-MODAL guard + `data-resizing` (~45 lines, 2 files)

- [ ] 5.1 `[code-checkable via grep/tsc]` In `app/globals.css`, add the unlayered `.ios-sidebar` rule,
      placed after the `@utility` blocks and **before** the 4 accessibility blocks (PR1) that already
      reference its selector. Exact CSS (Decision 8 — unlayered plain rule, not `@utility`, no
      `!important`, because `sidebar-inner`'s `group-data-[variant=floating]:{rounded-lg,border,
      shadow-sm}` are variant utilities that always sort after any variant-less `@utility` under
      Tailwind's own comparator, per Decision 2 — an `@utility` here would need `!important` on every
      property):
      ```css
      .ios-sidebar [data-slot="sidebar-inner"] {
        backdrop-filter: blur(var(--blur-thick)) saturate(var(--material-saturate));
        -webkit-backdrop-filter: blur(var(--blur-thick)) saturate(var(--material-saturate));
        background-color: var(--material-thick);
        border: 1px solid var(--hairline);
        border-top-color: var(--specular-strong);
        border-radius: var(--radius-xl);     /* 16px here (--radius: 12px), not jebbs' 18px */
        box-shadow: var(--shadow-lg);
      }

      .ios-sidebar[data-resizing="true"] [data-slot="sidebar-inner"] {
        backdrop-filter: none;
        -webkit-backdrop-filter: none;
        background-color: var(--surface-3);
      }
      ```
- [ ] 5.2 `[code-checkable via grep/tsc]` Immediately after 5.1's block, add the R-MODAL unlayered guard
      (belt-and-braces only — the binding requirement stays "the two classes never coexist," enforced
      by 4.15's grep). Exact CSS:
      ```css
      /* R-MODAL guard. Belt-and-braces ONLY: the requirement is that these two classes
         never land on the same element (sdd-verify greps for it). Unlayered, so it beats
         both utilities regardless of how Tailwind's sorter orders them — which is the
         only thing that works, because the sorter never reads source position.
         Fires solely on the accident; normal modal-surface usage is untouched. */
      .modal-surface.ios-glass {
        background-color: var(--material-thick);
        border-color: var(--hairline);
        border-top-color: var(--specular-strong);
      }
      ```
- [ ] 5.3 `[code-checkable via grep/tsc]` In `components/ui/sidebar.tsx`, declare `const [isResizing,
      setIsResizing] = useState(false)` next to `useSidebar()` (`:166`), mirroring
      `jebbs/ui/sidebar.tsx:181`.
- [ ] 5.4 `[code-checkable via grep/tsc]` `sidebar-container` (`:229-243`) gains `data-resizing=
      {isResizing}`, `onTransitionStart={(e) => e.propertyName === 'width' && setIsResizing(true)}`,
      `onTransitionEnd={(e) => e.propertyName === 'width' && setIsResizing(false)}` — both handlers
      MUST check `propertyName === 'width'` so a `left`/`right` transition never toggles the flag,
      mirroring `jebbs/ui/sidebar.tsx:246-252`.
- [ ] 5.5 `[code-checkable via grep/tsc]` Confirm `components/layout/sidebar.tsx:66` is left
      **byte-identical** — its `className="ios-sidebar"` finally resolves, no edit needed there
      (spec.md's own explicit requirement).
- [ ] 5.6 `[code-checkable via grep/tsc]` Re-run 4.15's R-MODAL grep repo-wide as a final gate — must
      still return empty after this PR's additions.
- [ ] 5.7 `[gate,small]` Run `npx tsc --noEmit -p tsconfig.demo.json` — MANDATORY (`sidebar.tsx`
      touched).
- [ ] 5.8 `[gate,small]` Run `npm test` (`vitest run`) — full suite green.

### Manual QA — Phase 5

- [ ] QA5.1 `[Manual QA — requires a browser]` Sidebar expanded, at rest: devtools computed style on
      `sidebar-inner` shows a non-`none` `backdrop-filter`; content behind its edges (if any) appears
      blurred.
- [ ] QA5.2 `[Manual QA — requires a browser]` **Sidebar resize fallback (`data-resizing`)**: toggle
      collapse/expand repeatedly, both directions. Confirm no stutter/frame drop during the `width`
      transition (the `--surface-3`, no-blur fallback is doing its job) and that blur visibly returns
      by itself once the transition ends, without user action. Confirm `left`/`right`-only transitions
      (if any exist elsewhere) do **not** toggle `data-resizing`.
- [ ] QA5.3 `[Manual QA — requires a browser]` Force `prefers-reduced-transparency: reduce` with the
      sidebar expanded — confirm it falls back to opaque `--surface-3` with no `backdrop-filter`.

---

## Full Manual QA Gate — accessibility fallbacks (cross-phase, walk once PR1's blocks have real consumers, i.e. after PR5)

These four fallbacks are additive from PR1 but have no real consumer to test against until later PRs
ship the classes they target. Walk this gate once, end to end, both themes, after PR5 lands — record
the result in `apply-progress`. There is no automated substitute (R6).

- [ ] QA-A1 `[Manual QA — requires a browser]` **`prefers-reduced-transparency: reduce`**: force in
      devtools on any route with a header, an open popover, the sidebar, and a modal visible at once (or
      walked in sequence). Confirm **no surface anywhere** still shows a `backdrop-filter` in computed
      style — every material surface (`material-thin/regular/thick`, `modal-surface`, `.ios-sidebar`,
      `.scrim`) falls back to its opaque `--surface-*`.
- [ ] QA-A2 `[Manual QA — requires a browser]` **`prefers-contrast: more`**: force in devtools with a
      card or popover with a hairline border visible. Confirm the border/text contrast is visibly higher
      than default in both themes (exact ladder step is a judgement call per design.md, not a measured
      ratio — worth a spot contrast check).
- [ ] QA-A3 `[Manual QA — requires a browser]` **`@supports not (backdrop-filter)`**: simulate via
      devtools' `@supports` override (or a documented manual substitute if the tool lacks one). Confirm
      every material/modal/sidebar/scrim surface falls back to a solid `--surface-*` background with no
      visible bleed-through.
- [ ] QA-A4 `[Manual QA — requires a browser]` **`prefers-reduced-motion: reduce`**: force in devtools,
      toggle the sidebar. Confirm the width transition is skipped or reduced to near-zero duration
      (~160ms), consistent with the donor's rule — motion is softened, not silently removed (opacity/
      color transitions still play).

---

## Ordering / Dependency Summary

```
Phase 1 (PR1: tokens + utilities + accessibility — zero visual change)
   -> Phase 2 (PR2: retint .ios-glass/.ios-blur/.ios-shadow-*, @layer base -> @utility)
      -> Phase 3 (PR3: --card/--popover/--sidebar/--border aliases + popover material pass — HIGHEST RISK)
         -> Phase 4 (PR4: modal convergence, 14 files — depends only on PR1+PR2, could ship ahead of PR3)
            -> Phase 5 (PR5: sidebar glass + R-MODAL guard — depends only on PR1's tokens)
```

- PR2 requires PR1's tokens/utilities to exist.
- PR3 requires PR2 to have shipped the retint (hard, mutual dependency — see the Review Workload
  Forecast note above): PR3 without PR2 is pointless (feeds a flat `.ios-glass`); PR2 without PR3 shows
  no translucency in dark mode.
- PR4 and PR5 depend only on PR1's tokens (`modal-surface`, `scrim` exist from PR1; `.ios-glass` exists
  from PR2) — **either could ship ahead of PR3** if PR3's QA stalls, per design.md's own
  Migration/Rollout note. The task list above keeps them last only because that is design.md's stated
  order, not because of a hard dependency on PR3.
- Rollback is `git revert` per PR, in any order — no migrations, no persisted state, no external
  consumer of these class names (proposal.md's rollback table, unchanged except PR4 growing from 4 to
  14 files).
- `npm test` (`vitest run`) is a regression guard every PR, even CSS-only ones — it cannot verify any
  visual requirement, only that nothing crashes. `npx tsc --noEmit -p tsconfig.demo.json` is MANDATORY
  wherever a PR touches a `.tsx` file (PR2, PR3, PR4, PR5) — **not required for PR1**, which is
  `globals.css` only.
- Every `[Manual QA — requires a browser]` task above is the only enforcement mechanism for its
  requirement — there is no vitest/jsdom substitute for `backdrop-filter`, cascade layers, or `@media`/
  `@supports` fallbacks in this repo (R6). None of the `[code-checkable via grep/tsc]` tasks claims
  visual coverage it does not have.
