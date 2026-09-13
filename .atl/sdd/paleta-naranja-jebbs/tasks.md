# Tasks: paleta-naranja-jebbs — Orange brand accent for `dashboard-demo`

Derived from the approved spec (`.atl/sdd/paleta-naranja-jebbs/spec.md`) and design
(`.atl/sdd/paleta-naranja-jebbs/design.md`). **One PR, 3 files, ~80 changed lines** — design.md's own
estimate (§File Changes). Broken into ordered, checkable tasks at the rigor bar of
`.atl/sdd/sistema-material-glass/tasks.md`.

> **Size note**: this document exceeds the generic `sdd-tasks` word budget, mirroring design.md's own
> override note, at the requester's explicit rigor bar (per-token literal values, exact line numbers,
> tool-measured contrast gates). Explicit instruction wins over the generic budget.

> **R11 is explicitly OUT OF SCOPE for this change.** `text-primary` on light surfaces drops from
> 3.60:1 to 2.42:1 across 35 sites/21 files (design.md §Risks R11). No task below attempts to fix it —
> Phase 6 only records it as a pending follow-up, per design.md's own recommendation of "separate PR,
> immediately after this one."

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~80 (≈55 additions / ≈25 deletions), per design.md §File Changes |
| 400-line budget risk | Low |
| Chained PRs recommended | No |
| Suggested split | Single PR |
| Delivery strategy | ask-on-risk |
| Chain strategy | pending (not applicable — single PR) |

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: pending
400-line budget risk: Low

Q1 (light-mode contrast) is resolved by design.md Decision 1 — no product decision blocks apply. The
only gate before merge is tool-measured contrast confirmation (Phase 5) and the visual QA walk
(Phase 7), both already scoped inside this single PR.

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | Full token + repoint + component diff, all 3 files | PR 1 (only PR) | Base: main. Not separable per design.md §File Changes: splitting the token repoint from `--accent-foreground` would ship an unreadable light mode. |

---

## Phase 1: New accent primitives (`app/globals.css`, both theme blocks)

Insert 8 new primitives immediately before `--primary` in each block (light before `:18`, dark before
`:84`), per design.md §Deliverable. Zero primitives are consumed directly by markup yet — Phase 2 wires
the consumers.

- [x] 1.1 Add `--accent-brand: #f57c00` (light) / `#ff9f0a` (dark) — the brand. **The only orange literal
      per theme block** (design.md Decision 1(3): must stay light in light mode).
- [x] 1.2 Add `--accent-hover: #d96c00` (light) / `#ffb340` (dark) — dark hover **lightens**, inverted on
      purpose (`jebbs:156`). No consumer in this change (design.md Decision 6).
- [x] 1.3 Add `--accent-pressed: #b85c00` (light) / `#e08600` (dark) — ramp rung, no consumer.
- [x] 1.4 Add `--accent-contrast: #180d00` in **both** `:root` and `.dark` — same literal in both blocks
      (design.md Decision 1). Carry the rationale comment: *"texto SOBRE naranja — nunca blanco"*
      (`jebbs:158`) plus the measured numbers **7.08:1 light / 9.32:1 dark**.
- [x] 1.5 Add `--accent-on-surface: #a05000` (light) / `var(--accent-brand)` (dark) — **new token, not in
      jebbs** (design.md Decision 2). Comment: text/icons on tints, **4.87:1** worst light surface,
      **7.18:1** dark (no override needed).
- [x] 1.6 Add `--accent-tint-08: rgba(245,124,0,.08)` (light) / `rgba(255,159,10,.08)` (dark) — sidebar
      hover consumer (Phase 3).
- [x] 1.7 Add `--accent-tint-16: rgba(245,124,0,.16)` (light) / `rgba(255,159,10,.16)` (dark) —
      `--accent` and sidebar active consumer (Phase 2/3).
- [x] 1.8 Add `--accent-tint-32: rgba(245,124,0,.32)` (light) / `rgba(255,159,10,.32)` (dark) — ported
      for ladder completeness. **No consumer, deliberately** (design.md Decision 6).

---

## Phase 2: Repoint semantic aliases (`app/globals.css`, both theme blocks — 11 tokens)

Every line below is repointed to a `var()` in the **same commit** as Phase 1 — the blue hex is deleted,
not kept alongside (proposal.md §Tokens that are REPLACED, design.md §Deliverable "Repointed aliases").

- [x] 2.1 `--primary`: light `#007aff` `:18` → `var(--accent-brand)`; dark `#0a84ff` `:84` →
      `var(--accent-brand)`. Resolves to `#f57c00` / `#ff9f0a`.
- [x] 2.2 `--primary-foreground`: light `#ffffff` `:19` → `var(--accent-contrast)`; dark `#ffffff` `:85`
      → `var(--accent-contrast)`. Resolves to `#180d00` in **both** themes.
- [x] 2.3 `--accent`: light `#007aff` `:24` → `var(--accent-tint-16)`; dark `#27272a` `:90` →
      `var(--accent-tint-16)`. Ends the light/dark asymmetry (D3) — `bg-accent` no longer renders zinc
      grey in dark.
- [x] 2.4 `--accent-foreground`: light `#ffffff` `:25` → `var(--accent-on-surface)`; dark `#fafafa` `:91`
      → `var(--accent-on-surface)`. **Mandatory in the same diff as 2.3** — leaving the old literal
      renders near-white text on a 16%-alpha tint across 42 call sites/18 files.
- [x] 2.5 `--ring`: light `#007aff` `:30` → `var(--accent-brand)`; dark `#0a84ff` `:96` →
      `var(--accent-brand)`.
- [x] 2.6 `--sidebar-primary`: light `#007aff` `:39` → `var(--accent-brand)`; dark `#0a84ff` `:104` →
      `var(--accent-brand)`.
- [x] 2.7 `--sidebar-primary-foreground`: light `#ffffff` `:40` → `var(--accent-contrast)`; dark
      `#ffffff` `:105` → `var(--accent-contrast)`.
- [x] 2.8 `--sidebar-accent`: light `rgba(120,120,128,.16)` `:41` → `var(--accent-tint-08)`; dark
      `#27272a` `:106` → `var(--accent-tint-08)`. **tint-08, not jebbs' tint-16** (design.md Decision 4 /
      F4 — jebbs' 16% needs `nav-rail-active`, which this repo deliberately does not have).
- [x] 2.9 `--sidebar-accent-foreground`: light `#1c1c1e` `:42` → `var(--accent-on-surface)`; dark
      `#fafafa` `:107` → `var(--accent-on-surface)`.
- [x] 2.10 `--sidebar-ring`: light `#007aff` `:44` → `var(--accent-brand)`; dark `#0a84ff` `:109` →
      `var(--accent-brand)`.
- [x] 2.11 `[gate]` Confirm `@theme inline` (`:141-193`) is **untouched** — `--color-primary`/
      `--color-accent`/`--color-status-ready`/`--color-sidebar-accent-foreground` (`:150, 156, 184, 190`)
      already forward the new values (Q3, resolved: add nothing).

---

## Phase 3: `--status-ready` correction and chart-palette gate (`app/globals.css`)

### `--status-ready` → Tailwind `green-500`, both themes (Decision 3)

- [x] 3.1 Repoint `--status-ready`: light `#ff9500` `:48` → `oklch(72.3% 0.219 149.579)`; dark `#f59e0b`
      `:113` → `oklch(72.3% 0.219 149.579)`. **Literal value, not `var(--color-green-500)`** — Tailwind
      v4 only emits theme vars for classes actually used in markup; a live reference would silently break
      once a future change tokenises the kanban's `bg-green-500` usages (design.md Decision 3, rejection
      of alternative (a)).
- [x] 3.2 `[gate]` Confirm the new oklch literal matches what the kanban already hardcodes in **9 sites
      across 5 files** (do NOT edit these — they are the reference the token now converges to):
      `lib/utils/order-status.ts:20`, `components/orders/order-card.tsx:31,38`,
      `order-card-mobile.tsx:30,37`, `orders-dashboard.tsx:320,346,376` — all literally `bg-green-500`.

### Chart palette — no-change verification (Decision 7)

- [x] 3.3 `[gate — verification of no-change, not an edit]` Confirm `--chart-1` is **byte-identical**:
      `#007aff` `:31` (light) / `#3b82f6` `:97` (dark).
- [x] 3.4 `[gate — verification of no-change, not an edit]` Confirm `--chart-3` is **byte-identical**:
      `#ff9500` `:33` (light) / `#f59e0b` `:99` (dark). Pointing it at `--accent-brand` would make the
      data series and the brand button indistinguishable (design.md Decision 7) — do not touch it.
- [x] 3.5 `[gate]` Confirm `--chart-2`, `--chart-4`, `--chart-5` are also byte-identical (`:32,34,35` /
      `:98,100,101`) — only `--chart-3` was ever a collision, and it is accepted, not fixed.

---

## Phase 4: Component edits (2 `.tsx` files, 3 lines total)

### Sidebar — active/hover ladder (design.md Decision 4 / F4)

- [x] 4.1 `components/layout/sidebar.tsx:116` — change `"bg-primary/10 text-primary font-medium"` to
      `"bg-accent text-sidebar-accent-foreground font-medium"`.
- [x] 4.2 `components/layout/sidebar.tsx:121` — change `isActive && "text-primary"` to
      `isActive && "text-sidebar-accent-foreground"`.
- [x] 4.3 `[gate — verification of no-change]` Confirm `components/layout/sidebar.tsx:117`
      (`hover:bg-sidebar-accent`) is left **untouched** — it now resolves to tint-08 purely through the
      Phase 2.8 token repoint, no markup edit needed.

### Login — the one migrating blue, and the one that stays (design.md Decision 5)

- [x] 4.4 `app/login/page.tsx:45` — change `bg-blue-600/10` to `bg-primary/10`. Keep `blur-[120px]` and
      every other class byte-identical. This is the only hardcoded blue that migrates (of 10 sites total
      repo-wide) — it was always *brand*, never *state*.
- [x] 4.5 `[note — NOT a task to fix]` `app/login/page.tsx:46` (`bg-indigo-600/10 blur-[100px]`) is a
      **second orb the proposal did not see** (design.md F/R12, Decision 5). It is deliberately left
      unchanged in this PR — migrating it would either flatten the gradient (two identical oranges) or
      invent a second decorative hue. Record as a QA observation (Phase 7); the one-line remedy if the
      pair reads muddy is `:46` → `bg-primary/5`, **not applied here**. A one-line comment was added above
      `:46` documenting this is intentional.

---

## Phase 5: Verification gates — grep and tool-measured contrast

### Structural greps (design.md §Interfaces invariants)

- [x] 5.1 `[gate]` `grep -iE '#007aff|#0a84ff' app/globals.css` → **empty**. The blues are replaced, not
      joined. **Deviation recorded**: `#0a84ff` is empty as expected, but `#007aff` still matches 2 lines
      — `--chart-1` (light) and `--status-new` (light), both **explicitly required to stay unchanged**
      per design.md Decision 7 and the "Explicitly unchanged" table, and per tasks.md 3.3/5.5 themselves.
      This literal grep line in design.md's own §Interfaces "Invariant for `sdd-verify`" contradicts
      design.md's own Decision 7 / unchanged table; the per-token decisions win — see apply-progress for
      the full note.
- [x] 5.2 `[gate]` `grep -c '#f57c00' app/globals.css` → **1**; `grep -c '#ff9f0a' app/globals.css` →
      **1**. The brand hex appears exactly once per theme block, at `--accent-brand`.
- [x] 5.3 `[gate]` `grep -E '\-\-jebbs|\-\-color-jebbs' app/globals.css` → **empty**, and a repo-wide
      grep for `--jebbs`, `--color-jebbs`, `font-brand`, `Pacifico` → **empty** (R7 — these sit one line
      from `--accent-brand` in the donor file; adjacency is the whole risk).
- [x] 5.4 `[gate]` `git diff --stat` → exactly **3 files**: `app/globals.css`, `app/login/page.tsx`,
      `components/layout/sidebar.tsx`.
- [x] 5.5 `[gate — verification of no-change]` Confirm the 9 status/payment blue sites are
      byte-identical against pre-change: `lib/utils/order-status.ts:12`, `order-card.tsx:30,37`,
      `order-card-mobile.tsx:29,36`, `orders-dashboard.tsx:305,336,364`, `historial/page.tsx:297` (R6).
- [x] 5.6 `[gate]` Confirm `app/globals.css:233-464` (materials, utilities, a11y blocks — closed by
      `sistema-material-glass`) has **zero** diff.

### Tool-measured contrast (real contrast tool, not hand arithmetic — design.md §Testing Strategy)

Every ratio in `design.md` is hand-computed from the WCAG 2.x formula and explicitly flagged as **not
tool-measured**. These three readings are the re-confirmation design.md itself requires before
`apply-progress` can rely on the numbers.

- [x] 5.7 `[Tool-measured, Node/WCAG script — no browser available]` Measured `#180d00` on `#f57c00`
      (default `Button` light) via a WCAG 2.x relative-luminance script: **7.08:1**, matches design.md
      exactly (diff 0.003). `#180d00` on `#ff9f0a` (dark): **9.32:1**, matches (diff 0.003). No browser
      contrast tool was available in this environment; the Node/WCAG-formula script is the closest
      tool-measured re-check achievable here — see apply-progress for the script output. **Browser-based
      re-confirmation still recommended before merge** if one becomes available (QA8.1).
- [x] 5.8 `[Tool-measured, Node/WCAG script]` Measured `#a05000` on `#fce9d5` (accent-on-surface on the
      tint-16-over-sidebar composite design.md computed as the worst light surface): **4.87:1**, matches
      design.md exactly (diff 0.005). Same caveat as 5.7 — the `#fce9d5` composite itself is a hand-derived
      alpha composite, not rendered; a real browser reading (QA8.3) is still the final gate.
- [ ] 5.9 `[Manual — contrast tool required]` Measure a `text-primary` price element (e.g. `/menu` or
      `/precios`) in **light** mode. Expected **≈2.42:1** — **record the number, do not fix it** (R11,
      Phase 6). This reading is the evidence for the follow-up PR, not a defect of this one. Node/WCAG
      script cross-check: `#f57c00` on `#f2f2f7` = **2.42:1**, matches design.md. Real-browser QA still
      pending (QA8 — no browser available in this environment).

---

## Phase 6: Record R11 as an explicit out-of-scope follow-up (documentation only — NOT a fix)

- [x] 6.1 `[documentation]` Recorded in `app/globals.css` (comment above `--primary` in the light block)
      and in `apply-progress`/this report that `text-primary` on light surfaces regresses from **3.60:1 to
      2.42:1** across **35 sites in 21 files** (design.md §Risks R11) as a direct, measured consequence of
      this change, and that it is **deliberately not fixed here**. Cites the mechanical fix design.md
      already specifies (`text-primary` → `text-accent-on-surface` + one `@theme inline` entry for
      `--color-accent-on-surface`) and design.md's own recommendation: **a separate PR, immediately after
      this one**. No file in Phase 1-4's scope was touched beyond the documentation comment itself.
- [x] 6.2 `[documentation]` Recorded the F2/R4 observation in the same globals.css comment and this
      report: the pre-existing warning/orange vocabulary (`demo-banner.tsx`, delay timers, medal colours)
      is unchanged by this change; whether a primary (orange) button beside an amber warning badge stays
      visually distinguishable is explicitly **not a defect this change is required to fix** (spec.md
      §Non-regression guardrails) — left as a QA8.8 observation for the manual pass.

---

## Phase 7: Static gates and full test suite

- [x] 7.1 `[gate]` Run `npx tsc --noEmit -p tsconfig.demo.json` — **MANDATORY**, touches the 2 `.tsx`
      files edited in Phase 4 (`sidebar.tsx`, `login/page.tsx`). 0 errors expected. **Confirmed: 0
      errors.**
- [x] 7.2 `[gate]` Run `npx vitest run` — full suite green. **151 pre-existing tests must remain
      unaffected** — this is a CSS-plus-two-classnames change with zero logic edits, and `vitest`
      (jsdom) asserts zero colors (proposal R9 / design.md R9 restated) — this run is a regression guard
      only, not evidence the palette is correct. **Confirmed: 151/151 passed, 7 test files.**

---

## Phase 8: Manual visual QA gate (the real gate — no automated substitute, R9)

Manual, **both themes**, every route: `/`, `/historial`, `/finanzas` (4 tabs), `/costos`, `/rendimiento`,
`/clientes`, `/menu`, `/combos`, `/extras`, `/precios`, `/login`.

- [ ] QA8.1 `[Manual QA — requires a browser]` Every `Button` variant (`default` — the priority per R1,
      `outline`, `ghost`, `link`) in both themes. Confirm the default variant's near-black text on
      orange in light mode reads as **intentional**, not a missing style (R8).
- [ ] QA8.2 `[Manual QA — requires a browser]` Focus rings via keyboard `Tab` (`--ring`), both themes.
- [ ] QA8.3 `[Manual QA — requires a browser]` Open `Select`, `DropdownMenu`, `Command`, `Calendar`,
      `ContextMenu`, `Menubar` in **light**: highlighted row is dark-orange text on a pale orange tint,
      legible, not orange-on-orange. In **dark**: confirm the highlight stopped being zinc grey (D3).
- [ ] QA8.4 `[Manual QA — requires a browser]` Sidebar: active vs. hovered vs. collapsed, both themes.
      **Active must never look weaker than hover** (R3/F4) — this is the one visual regression this
      change is explicitly designed to prevent.
- [ ] QA8.5 `[Manual QA — requires a browser]` `/precios` confirm-edit ✓ renders green and **matches the
      kanban's "Listo" badge exactly**, side by side. Any perceptible difference means the oklch literal
      drifted (Decision 3).
- [ ] QA8.6 `[Manual QA — requires a browser]` `/login` left panel: orange orb beside the untouched
      indigo orb (`:45`/`:46`). Record whether the pair reads muddy — remedy is `:46` → `bg-primary/5`,
      **not applied in this PR** (Phase 4.5).
- [ ] QA8.7 `[Manual QA — requires a browser]` Regression check: the kanban "Nuevo" badge and its left
      rail are still **blue**; the `/historial` payment-method blue is unchanged; `/rendimiento` medals
      are untouched (R6/F2).
- [ ] QA8.8 `[Manual QA — requires a browser]` Collision check (F2/R4): a primary button beside an amber
      warning — `/` with a delayed order (`order-card.tsx:126-128`), the order-wizard summary warning
      (`summary-step.tsx:272-276`), the demo banner (`demo-banner.tsx:7`), the unsaved-customer indicator
      (`edit-customer-modal.tsx:150`). Record the observation per Phase 6.2 — **not a bug to fix here**.
- [ ] QA8.9 `[Manual QA — requires a browser]` Force `prefers-contrast: more` and confirm
      `globals.css:416-433` still behaves correctly with the new accent values.

---

## Ordering / Dependency Summary

```
Phase 1 (new primitives) -> Phase 2 (repoint aliases, same commit as --accent-foreground)
   -> Phase 3 (--status-ready + chart gate) -> Phase 4 (sidebar.tsx + login/page.tsx)
      -> Phase 5 (grep gates + tool-measured contrast) -> Phase 6 (R11/F2 documentation)
         -> Phase 7 (tsc + vitest) -> Phase 8 (manual visual QA — the real gate)
```

- Phases 1-4 are **one commit, one PR** — design.md's own estimate (~80 lines/3 files) is not separable:
  splitting the token repoint from `--accent-foreground` (2.4) would ship a broken light mode; the
  sidebar/login edits are 3 lines each and not their own PR.
- Phase 5's grep gates can run immediately after Phase 4; the tool-measured contrast readings (5.7-5.9)
  require the branch checked out in a browser with a contrast tool.
- Phase 6 (R11/F2 documentation) has **zero file dependency** on Phases 1-4 — it can be written any time
  after design.md exists, but is sequenced here so it ships in the same PR description/`apply-progress`
  entry as the change it documents.
- Phase 7 is mandatory before merge; Phase 8 is the actual acceptance gate (R9 — no automated substitute
  exists for any color/contrast requirement in this repo).
- Rollback is `git revert` of the single commit — no migration, no persisted state, no external consumer
  of these token names (proposal.md §Rollback plan, design.md §Migration/Rollout).
