# Spec: paleta-naranja-jebbs — Orange brand accent for `dashboard-demo`

> **Size note**: this document exceeds the generic `sdd-spec` 650-word budget, at the same rigor bar as
> `.atl/sdd/sistema-material-glass/spec.md:3-8`. The launch prompt required eight explicit requirement
> areas with concrete file/line evidence and contrast arithmetic for both themes; compressing that into
> the generic budget would lose the exact tokens `sdd-verify` needs to grep for. Explicit instruction
> wins over the generic budget.

Delta spec — what MUST be true after this change is applied. Grounded entirely in the approved
proposal (`.atl/sdd/paleta-naranja-jebbs/proposal.md`): the four-primitive donor model, decisions
D1-D3, findings F1-F4, and the per-case verdicts on the ten hardcoded blues and the chart palette.
**Nothing below adds scope beyond that proposal**, except where explicitly marked as the closing
decision for the proposal's Q1 (see Domain 1's first requirement) — a decision the user confirmed
after the proposal was written and that this spec treats as a closed requirement, not a discovery.

Domains map to the proposal's capability contract: one new capability (`brand-accent-tokens`) and two
modified capabilities (`semantic-colour-aliases`, `order-status-colour-language`), plus a
non-regression guardrail section for behavior this change must leave untouched.

---

## Domain 1: brand-accent-tokens (new capability)

The four-primitive accent model (`--accent-brand`, `--accent-hover`, `--accent-pressed`,
`--accent-contrast`) plus `--accent-tint-08/16/32`, per theme. Covers D3's primitive layer, F1's
closure, and R7/R8.

### Requirement: `--accent-contrast` MUST resolve to dark text on orange in BOTH themes — never white, in either theme (closes proposal's Q1)

The proposal flagged light-mode foreground contrast as **Q1, blocking `sdd-apply`**: copying jebbs'
`--accent-contrast: #ffffff` for light gives white text on `#f57c00` at **2.70:1**, failing AA (4.5:1)
and AA-large (3:1) (proposal F1). The confirmed product decision closes this differently from the
proposal's own leaning (which proposed inventing a separate light-only foreground token at `#b85c00`):
**`--accent-contrast` MUST use dark/near-black text on orange in both light and dark**, reusing the
pattern jebbs already applies in dark (`jebbs:158`, *"texto SOBRE naranja — nunca blanco"*) instead of
copying jebbs' light-mode value literally. `--accent-contrast` in light MUST achieve at least AA
(4.5:1) against `--accent-brand: #f57c00`; in dark it MUST keep jebbs' own `#180d00` against
`--accent-brand: #ff9f0a` (9.32:1 per proposal F1, dark was never the problem).

- **Scenario**: no `--accent-contrast` value is white in either theme
  - **Given** the change is applied
  - **When** `--accent-contrast` is read from both `:root` and `.dark` in `app/globals.css`
  - **Then** neither value is `#ffffff` (or any equivalent white)
  - **And** both values are dark/near-black colors

- **Scenario [tool-measured — same caveat as proposal F1]**: light `--accent-contrast` passes AA against `--accent-brand`
  - **Given** the closing decision's chosen light value (candidate: reuse `#180d00`, which this spec's
    own hand-computed WCAG 2.x arithmetic puts at **~7.08:1** on `#f57c00` — **to be re-confirmed with a
    contrast tool in `sdd-design`, not trusted as final**, exactly as the proposal required for its own
    F1 numbers)
  - **When** the chosen value is measured against `--accent-brand` in light with a real contrast tool
  - **Then** the ratio is **at least 4.5:1** (AA) — if the candidate value fails re-measurement, a
    different dark value MUST be chosen until it passes; **the requirement is the threshold, not the
    specific hex**

- **Scenario**: `--primary-foreground` and `--sidebar-primary-foreground` inherit the fix for free
  - **Given** both consumers repoint to `var(--accent-contrast)` per the proposal's token table
  - **When** the default `Button` variant (`button.tsx:12`) and the sidebar's primary elements render
    in light mode
  - **Then** their foreground text is the dark `--accent-contrast` value, not white — closing the
    50-file blast radius F1 identified for `bg-primary text-primary-foreground`

### Requirement: the four accent primitives and three tints MUST exist in both themes with jebbs' verbatim values, except `--accent-contrast` (previous requirement)

`--accent-brand`, `--accent-hover`, `--accent-pressed`, `--accent-tint-08/16/32` MUST match jebbs'
values byte-for-byte per theme (`jebbs/app/globals.css:41-49` light, `:153-161` dark). The brand hex
(`#f57c00` light, `#ff9f0a` dark) MUST appear as a literal in **exactly one place per theme**
(`--accent-brand`) — every other accent-bearing token MUST read `var(--accent-*)`.

- **Scenario**: the brand hex has exactly one literal occurrence per theme
  - **Given** the change is applied
  - **When** `app/globals.css` is grepped for `#f57c00` and `#ff9f0a`
  - **Then** each appears exactly once, at its `--accent-brand` declaration

- **Scenario**: the blue literals are gone, not joined
  - **Given** the change is applied
  - **When** `app/globals.css` is grepped for `#007aff` and `#0a84ff`
  - **Then** the result is empty — the blues were replaced, not kept alongside the new tokens

### Requirement: `--jebbs` / `--color-jebbs` MUST NOT exist in `dashboard-demo` (R7 guardrail)

`dashboard-demo` has no wordmark token and no destination for one (its wordmark is "Morfito" in
`Baloo_2`, no color class, per proposal's verification). This token sits one line from
`--accent-brand` in the donor file, making accidental adjacency-copying the whole risk.

- **Scenario**: neither token nor its font artifacts exist after the change
  - **Given** the change is applied
  - **When** the repo is grepped for `--jebbs`, `--color-jebbs`, `font-brand`, and `Pacifico`
  - **Then** all four return zero matches

---

## Domain 2: semantic-colour-aliases (modified capability)

`--primary`, `--primary-foreground`, `--accent`, `--accent-foreground`, `--ring`,
`--sidebar-primary(-foreground)`, `--sidebar-ring`, `--sidebar-accent(-foreground)` stop being literals
and become derivations. Covers D3, F3, F4, R2, R3, plus guardrails on the chart tokens.

### Requirement: `--accent` and `--accent-foreground` MUST change in the same commit, never one without the other

`--accent` changes kind (solid → `var(--accent-tint-16)`) in both themes. If `--accent-foreground`
were left at its current `#ffffff` (light) / `#fafafa` (dark), every `bg-accent text-accent-foreground`
pair across the 12 shadcn primitives that use it (button, badge, calendar, command, context-menu,
dropdown-menu, item, menubar, navigation-menu, select, toggle, dialog — 42 call sites, 18 files) would
render near-white text on a 16%-alpha tint in light mode. `--accent-foreground` MUST become
`var(--accent-brand)` in the identical diff/commit that repoints `--accent`.

- **Scenario**: both tokens change together, no intermediate state
  - **Given** the change is applied
  - **When** the commit/diff that touches `--accent` in `app/globals.css` is inspected
  - **Then** `--accent-foreground` is repointed to `var(--accent-brand)` in the same diff, both themes
  - **And** no commit in the change's history has `--accent` repointed while `--accent-foreground`
    still reads its old literal

- **Scenario [Manual QA]**: no shadcn primitive renders low-contrast text on the new tint
  - **Given** the change is applied, light theme active
  - **When** any of `button.tsx`, `badge.tsx`, `calendar.tsx`, `command.tsx`, `context-menu.tsx`,
    `dropdown-menu.tsx`, `item.tsx`, `menubar.tsx`, `navigation-menu.tsx`, `select.tsx`, `toggle.tsx`, or
    `dialog.tsx` renders its `bg-accent`/`text-accent-foreground` combination
  - **Then** the foreground text is the brand orange on a light orange tint, legible — not
    near-white-on-near-white

### Requirement: `--sidebar-accent` MUST use `--accent-tint-08` for hover; the active state MUST use `bg-accent` (tint-16), not `--sidebar-accent` (F4)

jebbs pairs a 10%-active / 16%-hover ladder with `nav-rail-active`, an expressive utility
`dashboard-demo` deliberately does not have (deferred by `sistema-material-glass`). Without it, copying
jebbs' `--sidebar-accent: var(--accent-tint-16)` verbatim would make sidebar hover render *stronger*
than active, inverting the visual hierarchy. `--sidebar-accent` MUST be `var(--accent-tint-08)` in both
themes, and `layout/sidebar.tsx`'s active-state class MUST be raised from `bg-primary/10` to `bg-accent`
(`:116`), giving a 16%-active / 8%-hover ladder with no new utility.

- **Scenario**: `--sidebar-accent` is the lighter tint
  - **Given** the change is applied
  - **When** `--sidebar-accent` is read from both themes
  - **Then** it is `var(--accent-tint-08)`, not `var(--accent-tint-16)`

- **Scenario [Manual QA]**: active never looks weaker than hover
  - **Given** the change is applied
  - **When** a sidebar nav item is hovered while a different item is active, both themes
  - **Then** the active item's background is visibly stronger than the hovered item's

### Requirement: `--chart-1` MUST remain unchanged (byte-identical) — it stays blue, not the brand

jebbs' own `--chart-1` is blue (`#2a78d6`/`#3987e5`) even though jebbs' brand is orange — the donor
never tied its most-consumed chart token (12 call sites) to its accent. `dashboard-demo`'s
`--chart-1 == --primary` today is a coincidence of two roles sharing a hex, not a design rule, and this
change is precisely what disambiguates them. Turning `--chart-1` orange would also leave the 5-colour
categorical palette with two oranges (`--chart-1` and `--chart-3`) and no blue — a dataviz regression.

- **Scenario**: `--chart-1` keeps its current value, both themes
  - **Given** the change is applied
  - **When** `--chart-1` is read from `:root` and `.dark`
  - **Then** it is still `#007aff` (light) / `#3b82f6` (dark) — unchanged by this commit

### Requirement: `--chart-3` MUST remain unchanged (byte-identical) despite being the one confirmed collision with the brand

`--chart-3` is `#ff9500` (light) / `#f59e0b` (dark) today — the **same literal** as the current
`--status-ready` value, both derived from the pre-change iOS system-orange. Unlike `--status-ready`,
this is not a semantically wrong value the UI already contradicts; it is an arbitrary categorical slot
in a 5-colour palette whose order is a CVD-safety invariant (`jebbs:214`, *"NO reordenar"*). Re-deriving
the chart palette is a separate change with separate tooling — already deferred by
`sistema-material-glass/proposal.md:211`. The collision is accepted, not fixed, because charts always
carry legends/direct labels and never place a `bg-primary` control inside the plot area.

- **Scenario**: `--chart-3` keeps its current value, both themes
  - **Given** the change is applied
  - **When** `--chart-3` is read from `:root` and `.dark`
  - **Then** it is still `#ff9500` (light) / `#f59e0b` (dark) — unchanged by this commit
  - **And** `--chart-2`, `--chart-4`, `--chart-5` are also unchanged (only `--chart-3` collides, by
    the proposal's own grep)

---

## Domain 3: order-status-colour-language (modified capability)

`--status-ready` moves orange → green in both themes, aligning the token with what the kanban already
renders. `--status-new` stays blue — a requirement, not an omission. Covers D2 and the ten
hardcoded-blue verdicts.

### Requirement: `--status-ready` MUST become green in BOTH themes, correcting a pre-existing token/UI mismatch

`--status-ready` today is `#ff9500` (light) / `#f59e0b` (dark) while every site that actually renders
the "Listo" state already hardcodes green: `lib/utils/order-status.ts:20`,
`components/orders/order-card.tsx:31`, and `order-card-mobile.tsx` all say `bg-green-500`. This change
does not create the mismatch — it **corrects one that predates it**: the token and the rendered UI have
disagreed since both existed. `--status-ready` MUST become `#34c759` (light) / `#30d158` (dark),
matching jebbs' own correction (`jebbs:88`, `:202`) and, more importantly, matching what
`order-status.ts`/`order-card.tsx`/`order-card-mobile.tsx` already paint.

- **Scenario**: the token now agrees with the hardcoded green it always should have matched
  - **Given** the change is applied
  - **When** `--status-ready` is read from both themes
  - **Then** it is `#34c759` (light) / `#30d158` (dark) — green, not orange or amber
  - **And** this brings the token in line with `order-status.ts:20`'s and `order-card.tsx:31`'s
    pre-existing `bg-green-500`, which this change does not touch

- **Scenario**: the sole token consumer improves, not just changes
  - **Given** `app/(dashboard)/precios/page.tsx:199`, the only `var(--status-ready)`/`text-status-ready`
    consumer repo-wide
  - **When** the confirm-edit ✓ button renders after the change
  - **Then** it renders green (a "confirm" affordance), replacing the orange it rendered before (which
    now would have collided with the brand)

### Requirement: `--status-new` MUST remain unchanged (still blue) in both themes — explicit, not incidental

jebbs kept `--status-new` blue (`#007aff`/`#0a84ff`) even after orange became its brand — blue is the
*state* `new` in a five-value order lifecycle, independent of branding, not a leftover of the old
`dashboard-demo` brand. This token MUST NOT move to orange or to any accent-derived value.

- **Scenario**: `--status-new` is byte-identical before and after
  - **Given** the change is applied
  - **When** `--status-new` is read from both themes
  - **Then** it is still `#007aff` (light) / `#0a84ff` (dark)

### Requirement: 9 of the 10 hardcoded-blue sites MUST stay blue; only the login blob MUST migrate to a token

Ten hardcoded-blue sites exist across six files. Nine of them render the `new` order state (a lifecycle
color, per the previous requirement) or an unrelated payment-method encoding, and MUST NOT change:
`lib/utils/order-status.ts:12`, `components/orders/order-card.tsx:30,37`,
`order-card-mobile.tsx:29,36`, `orders-dashboard.tsx:305,336,364` (status/lifecycle blue), and
`app/(dashboard)/historial/page.tsx:297` (payment-method blue, paired with `text-emerald-600` for
cash). The tenth — `app/login/page.tsx:45`, `bg-blue-600/10 blur-[120px]`, a decorative atmosphere
blob — is the only site that was ever *brand* rather than *state*, and MUST migrate to `bg-primary/10`.

- **Scenario**: nine sites are byte-identical after the change
  - **Given** the change is applied
  - **When** the nine listed non-login sites are diffed against their pre-change state
  - **Then** each is byte-identical — no `bg-blue-*`/`border-l-blue-*`/`accentColor="bg-blue-*"`
    literal at any of those nine sites was touched

- **Scenario**: only the login blob reads a token instead of a literal
  - **Given** the change is applied
  - **When** `app/login/page.tsx:45` is inspected
  - **Then** it reads `bg-primary/10` (a token), not `bg-blue-600/10` (a second hardcoded literal)

---

## Non-regression guardrails (span multiple domains, not their own capability)

### Requirement: the pre-existing warning/attention and metal-color vocabulary MUST NOT be touched

Six files already use orange/amber for meanings unrelated to branding — warnings (`demo-banner.tsx:7`,
`summary-step.tsx:272-276`, `order-card.tsx:126-128`, `order-card-mobile.tsx:114-116`,
`edit-customer-modal.tsx:125,144,150,151`) and literal medal colors (`rendimiento/page.tsx:107-110,
130-132,594,651,662,670` — gold/bronze rank colors). This change knowingly costs some semantic
distance between "brand" and "warning" (proposal F2) but MUST NOT attempt to fix that distance by
recoloring these six files — that is out of scope, and the medal colors specifically MUST never change
because they are literal, not thematic.

- **Scenario**: all six files are byte-identical after the change
  - **Given** the change is applied
  - **When** `demo-banner.tsx`, `summary-step.tsx`, `order-card.tsx`'s delay-timer block,
    `order-card-mobile.tsx`'s delay-timer block, `edit-customer-modal.tsx`, and `rendimiento/page.tsx`'s
    medal-color block are diffed against their pre-change state
  - **Then** none has a diff attributable to this change

- **Scenario [Manual QA — observation, not a bug to fix here]**: brand and warning stay visually distinguishable
  - **Given** the change is applied
  - **When** a primary (orange) button is shown beside an amber warning badge on the same screen (e.g.
    a delayed order card, or the order-wizard summary warning)
  - **Then** the result — distinguishable or not — is recorded in `apply-progress` as an observation;
    it is explicitly NOT a defect this change is required to fix

### Requirement: the material/glass surface system MUST have zero diff from this change

`--specular*`, `--hairline*`, `--material-*`, `--surface-*`, `--well`, `--blur-*` and their `@utility`
consumers are 100% accent-independent (closed by `sistema-material-glass`). This change MUST NOT touch
`app/globals.css:233-464` (materials, utilities, accessibility blocks) or any `@utility` body.

- **Scenario**: the material system region has zero diff
  - **Given** the change is applied
  - **When** `app/globals.css:233-464` is diffed against its pre-change state
  - **Then** the diff is empty

---

## Open design questions (NOT decided by this spec — routed to `sdd-design`)

- **Q3 (from proposal, unchanged)** — does `@theme inline` need a new `--color-accent-brand` mapping?
  `--color-primary`/`--color-accent`/`--color-status-ready` already forward the new values, so no
  mapping is needed for the repoint itself. Leaning (proposal's, carried forward): add nothing unless
  Q-below's exact `--accent-contrast` value produces a utility that needs it.
- **The exact hex for light `--accent-contrast`** — the closing decision fixes the *pattern* (dark text,
  both themes) but not a tool-verified *value*. This spec's Domain 1 scenario computes a candidate
  (`#180d00`, reused from jebbs' dark value, ~7.08:1 by this spec's own hand arithmetic) but requires
  re-measurement with a real contrast tool before `sdd-apply` relies on it — the same caveat the
  proposal placed on all of its own F1 numbers. **This is the one real ambiguity this spec found**: the
  confirmed decision closes the "which pattern" question but leaves "which exact dark value" for design
  to measure and lock.

## Risks / assumptions requiring follow-up (spec-level gaps only)

1. **The `#180d00`-in-light candidate is hand-computed, not tool-verified** — see the open question
   above. If it fails AA on re-measurement, `sdd-design` must pick a different dark value; the
   threshold (≥4.5:1) is the requirement, not the specific hex.
2. **No automated coverage exists for any color/contrast requirement above** — `package.json`'s
   `vitest run` (jsdom) asserts zero colors (proposal R9). Every scenario marked **[Manual QA]** or
   **[tool-measured]** has no automated substitute; the manual QA gate in the proposal's own "Visual QA
   gate" section is this spec's enforcement mechanism for those scenarios.
3. **F2's collision between brand-orange and warning-amber is recorded as an observation, not resolved**
   by any requirement above — consistent with the proposal's explicit choice not to fix it here.
