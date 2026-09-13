# Proposal: `paleta-naranja-jebbs` — Adopt jebbs-dashboard's orange brand accent in `dashboard-demo`, derived from four primitives per theme

> **Size note**: this document deliberately exceeds the generic `sdd-propose` 450-word budget, for the
> same reason `.atl/sdd/sistema-material-glass/proposal.md:3-7` did. The launch prompt required a full
> token table for both themes, a case-by-case verdict on every hardcoded blue, an explicit criterion for
> the chart palette, and a staging estimate. Explicit instruction wins over the generic budget.

> **This closes the accent item that `sistema-material-glass` deferred.** That proposal listed
> *"jebbs' accent tint scale (`--accent-tint-08/16/32`) and the `--accent` remap"* as out of scope,
> because *"changing it is an interaction-state change, not a surface change"*
> (`sistema-material-glass/proposal.md:212`). This is that change. Nothing here touches the material/glass
> system, and §"Out of scope" records why it cannot be affected.

---

## Intent

`dashboard-demo` has **no brand accent**. It has a blue hex repeated 11 times and a dark theme that has
already quietly stopped agreeing with itself:

- **Light mode uses one blue for seven different roles.** `--primary` `:18`, `--accent` `:24`, `--ring`
  `:30`, `--chart-1` `:31`, `--sidebar-primary` `:39`, `--sidebar-ring` `:44` and `--status-new` `:46` are
  all literally `#007aff`. Nothing expresses which of those *is* the brand and which merely happens to
  match it. Changing the brand today means finding seven hexes and guessing which ones meant it.
- **Dark mode has already drifted three ways.** `--primary`/`--ring`/`--sidebar-primary`/`--sidebar-ring`
  are `#0a84ff` (`:84, :96, :104, :109`), but `--chart-1`/`--status-new` are `#3b82f6` (`:97, :111`) — a
  *different* blue — and `--accent` is `#27272a` (`:90`), zinc grey, fully decoupled. So `bg-accent`
  renders **brand blue in light and neutral grey in dark**. The 18 files that use it get two different
  design languages depending on the theme, and nothing in the file says that was intended.
- **`--status-ready` is already wrong.** The token says orange (`#ff9500` light `:48`, `#f59e0b` dark
  `:113`) while every place that actually renders the "Listo" state hardcodes **green**:
  `lib/utils/order-status.ts:20`, `components/orders/order-card.tsx:31` and
  `order-card-mobile.tsx` all say `bg-green-500`. The token and the UI have disagreed for as long as both
  have existed.

jebbs-dashboard solved all three by deriving everything from **four primitives per theme** and never
writing the brand hex anywhere else (`jebbs/app/globals.css:41-49, 153-161`). That is the structure being
adopted. The orange is the *visible* outcome; the *durable* outcome is that `dashboard-demo` gains a
single place where the brand lives.

## Confirmed product decisions (closed — not open questions)

| # | Decision | Consequence |
|---|---|---|
| **D1** | **Colour only.** The semantic typography ramp stays out. | Not sequenced, not promised — a separate scope decision. See "Out of scope". |
| **D2** | **`--status-ready` moves to green**, replicating jebbs' precedent rather than inventing one. | Verified below: the collision exists in **both** themes, and the token is already contradicted by the UI. 1 consumer. |
| **D3** | **The dark-mode neutral highlight becomes an orange tint**, following jebbs' `--accent: var(--accent-tint-16)` in both themes. | Ends the light/dark `--accent` asymmetry. Reaches 18 files, 42 call sites. Surfaces a real ordering bug — see F4. |

## Tokens to port — the full table

Values are jebbs' verbatim (`jebbs/app/globals.css:41-49` light, `:153-161` dark). **Nothing below
derives from anything except these four primitives + the three tints.**

| Token | Light | Dark | Note |
|---|---|---|---|
| `--accent-brand` | `#f57c00` | `#ff9f0a` | The brand. The only orange literal in the file. |
| `--accent-hover` | `#d96c00` | `#ffb340` | **Dark hover LIGHTENS** — inverted vs light on purpose (`jebbs:156`). |
| `--accent-pressed` | `#b85c00` | `#e08600` | |
| `--accent-contrast` | `#ffffff` | `#180d00` | **Dark is near-black text on orange, never white** (`jebbs:158`). |
| `--accent-tint-08` | `rgba(245,124,0,.08)` | `rgba(255,159,10,.08)` | |
| `--accent-tint-16` | `rgba(245,124,0,.16)` | `rgba(255,159,10,.16)` | |
| `--accent-tint-32` | `rgba(245,124,0,.32)` | `rgba(255,159,10,.32)` | Currently unconsumed — port for completeness of the ladder. |

## Tokens that are REPLACED, not joined

Every line below is **repointed to a `var()`**. The blue hex is deleted, not kept alongside. After this
change `grep -i '#007aff\|#0a84ff'` over `app/globals.css` must return **zero**.

| Token | Light (line) | Dark (line) | Becomes |
|---|---|---|---|
| `--primary` | `#007aff` `:18` | `#0a84ff` `:84` | `var(--accent-brand)` |
| `--primary-foreground` | `#ffffff` `:19` | `#ffffff` `:85` | `var(--accent-contrast)` — **dark flips to `#180d00`** |
| `--accent` | `#007aff` `:24` | `#27272a` `:90` | `var(--accent-tint-16)` (D3) |
| `--accent-foreground` | `#ffffff` `:25` | `#fafafa` `:91` | `var(--accent-brand)` — **mandatory**: white on a 16% tint is invisible |
| `--ring` | `#007aff` `:30` | `#0a84ff` `:96` | `var(--accent-brand)` |
| `--sidebar-primary` | `#007aff` `:39` | `#0a84ff` `:104` | `var(--accent-brand)` |
| `--sidebar-primary-foreground` | `#ffffff` `:40` | `#ffffff` `:105` | `var(--accent-contrast)` |
| `--sidebar-ring` | `#007aff` `:44` | `#0a84ff` `:109` | `var(--accent-brand)` |
| `--sidebar-accent` | `rgba(120,120,128,.16)` `:41` | `#27272a` `:106` | tint — **but see F4, jebbs' `tint-16` reproduces an inversion here** |
| `--sidebar-accent-foreground` | `#1c1c1e` `:42` | `#fafafa` `:107` | `var(--accent-brand)` |
| `--status-ready` | `#ff9500` `:48` | `#f59e0b` `:113` | green (D2) — see below |

**`--accent-foreground` is the one nobody asks about and the one that breaks things.** `--accent` stops
being a solid and becomes a 16% tint; if `--accent-foreground` stays `#ffffff`/`#fafafa`, every
`bg-accent text-accent-foreground` pair in the 12 shadcn primitives renders white-on-near-white in light
mode. It **must** move to `var(--accent-brand)` in the same commit. This is not a style choice.

## The `--status-ready` correction (D2) — verified in both themes

| | light | dark |
|---|---|---|
| `--status-ready` today | `#ff9500` (`:48`) | `#f59e0b` (`:113`) |
| New `--accent-brand` | `#f57c00` | `#ff9f0a` |
| Collides? | **Yes** — adjacent oranges | **Yes** — adjacent ambers |

So the correction applies to **both themes**, not just dark. The exploration only confirmed dark; light
is the *worse* case, because `#ff9500` and `#f57c00` are nearly the same colour.

jebbs moved it in both themes too — `--status-ready: #34c759` light (`jebbs:88`) and `#30d158` dark
(`jebbs:202`) — with the reason in the source: *"El naranja está DELIBERADAMENTE ausente: ahora pertenece
al acento. `ready` pasa de naranja a verde para coincidir con lo que el kanban realmente renderiza"*
(`jebbs:198-200`).

**Both halves of that sentence hold here, and the second one is the stronger argument.** The kanban
already renders green (`order-status.ts:20`, `order-card.tsx:31`, `order-card-mobile.tsx`). This is not a
palette change dressed as a bugfix — it is a bugfix that the palette change makes unavoidable.

**Cost: one call site.** `--status-ready` has exactly **one** consumer repo-wide:
`app/(dashboard)/precios/page.tsx:199`, `text-status-ready` on the confirm-edit ✓ button. A green check
reads as *confirm*; an orange check reads as *warning*. That call site gets **better**, not different.

Accepted consequence: `--status-ready` and `--status-paid` become the same green, exactly as in jebbs
(`jebbs:88-89`, `:202-203`). Safe here because `--status-paid` is consumed only by Finanzas/Costos
(income-vs-expense) and `--status-ready` only by that one Precios button — **they never render on the
same screen.** Verified by grep.

## The chart palette — `--chart-1` stays blue, `--chart-3` stays orange

Asked directly, answered directly, and the two answers differ on purpose.

**`--chart-1` does NOT become orange.** The decisive evidence is the donor itself: jebbs' brand is orange
and jebbs' `--chart-1` is **blue** — `#2a78d6` light (`jebbs:103`), `#3987e5` dark (`jebbs:215`). jebbs
never tied chart-1 to its accent. `dashboard-demo`'s `--chart-1 == --primary` in light mode is a
**coincidence of two roles sharing a hex**, not a design rule, and this change is precisely what
disambiguates them. Three further reasons:

1. `--chart-1` is the most-consumed chart token — 12 call sites: `rendimiento/page.tsx:208, 252, 258,
   494, 509, 510, 805`, `expenses-by-category-chart.tsx:68, 71`, `order-source.ts:19`,
   `gastos-summary-row.tsx:74`, `expenses.ts:45`. At `:509-510` it is an area chart's stroke **and** fill.
2. Orange `--chart-1` next to orange `--chart-3` would leave a 5-colour categorical palette with **two
   oranges and no blue** — a dataviz regression, not a restyle.
3. A `bg-primary` control the same colour as the primary data series makes chart and chrome indistinguishable.

**`--chart-3` also stays as-is**, even though it *is* the one real collision. The asymmetry with
`--status-ready` is deliberate and worth stating, because "both are orange tokens" is the lazy reading:

| | `--status-ready` → green | `--chart-3` → unchanged |
|---|---|---|
| Is the current value semantically wrong? | **Yes** — UI renders green | **No** — it is an arbitrary categorical slot |
| Consumers | 1 | 6 (`expenses.ts:47`, `costos-summary-row.tsx:70`, `margin-by-burger-chart.tsx:60, 63`, `rendimiento/page.tsx:226`, `source-breakdown.tsx:28`) |
| Can it be changed in isolation? | Yes | **No** — jebbs' own file says *"NO reordenar: el orden es el mecanismo de seguridad CVD"* (`jebbs:214`) |
| Precedent | jebbs moved it explicitly | `sistema-material-glass/proposal.md:211` already deferred the chart palette as *"its own exercise with its own tooling"* |

Charts always carry legends or direct labels and never contain a `bg-primary` control inside the plot
area, so a series that resembles the brand is **mildly confusing, not illegible**. Re-deriving a
CVD-validated 5-colour palette is a separate change with a separate tool. Confirmed by grep: of
`--chart-1`…`--chart-5`, **only `--chart-3` collides** — `--chart-2` green (`:32`/`:98`), `--chart-4`
purple (`:34`/`:100`), `--chart-5` pink (`:35`/`:101`).

## The 10 hardcoded blues — verdict per case

The exploration reported **7 sites in 5 files**. The real count is **10 sites in 6 files**; it missed a
shared util and two border variants. All 10 re-verified this session:

| # | Site | What it is | Verdict |
|---|---|---|---|
| 1 | `app/login/page.tsx:45` `bg-blue-600/10 blur-[120px]` | Decorative atmosphere blob on the login screen | **MIGRATE.** This is the only one that was ever *brand*. Leaving it means the most brand-forward screen in the app glows blue while every control on it is orange. Use `bg-primary/10` — a token, not a second literal. |
| 2 | `app/(dashboard)/historial/page.tsx:297` `text-blue-600` | Payment method: blue = transferencia, paired with `text-emerald-600` = cash | **STAY BLUE.** A two-valued encoding whose only job is to be *not green*. Orange here would make "transferencia" look brand-highlighted and would collide with the accent. It *is* an untokenised colour, but tokenising payment methods is its own change. |
| 3 | **`lib/utils/order-status.ts:12`** `bg-blue-500` | "Nuevo" badge, shared config — **missed by the exploration** | **STAY BLUE** (see principle below). |
| 4 | `components/orders/order-card.tsx:30` `bg-blue-500` | "Nuevo" badge (duplicate of #3) | **STAY BLUE.** |
| 5 | **`components/orders/order-card.tsx:37`** `border-l-blue-500` | "Nuevo" left-edge rail — **missed** | **STAY BLUE** — mirrors its own badge. |
| 6 | `components/orders/order-card-mobile.tsx:29` `bg-blue-500` | "Nuevo" badge (duplicate of #3) | **STAY BLUE.** |
| 7 | **`components/orders/order-card-mobile.tsx:36`** `border-l-blue-500` | "Nuevo" left rail — **missed** | **STAY BLUE.** |
| 8 | `components/orders/orders-dashboard.tsx:305` `bg-blue-500` | Kanban column dot, "new" column | **STAY BLUE.** |
| 9 | `components/orders/orders-dashboard.tsx:336` `accentColor="bg-blue-500"` | → `order-column.tsx:50` dot | **STAY BLUE.** |
| 10 | `components/orders/orders-dashboard.tsx:364` `accentColor="bg-blue-500"` | → `order-column.tsx:50` dot | **STAY BLUE.** |

**The principle, and it is not a generic rule — it is the donor's own answer.** jebbs kept
`--status-new: #007aff` light (`jebbs:87`) and `#0a84ff` dark (`jebbs:201`) **after** orange became its
brand. Blue survived in jebbs as the "new order" state. So in sites 3-10, blue was never the old brand:
it is the *state* `new`, sitting in a five-value lifecycle language (new / paid / ready / completed /
canceled) that is independent of branding. The exploration framed these as "hardcoded blues that bypass
the token change", which implies they should follow the accent. **That framing is wrong for 9 of 10.**
1 migrates, 9 stay.

**Trap to name explicitly**: `orders-dashboard.tsx:336, 364` pass a prop literally called
`accentColor` (`order-column.tsx:20, 30, 50`) that carries a **status** colour. Anyone auditing "the
accent" by name will find it and be wrong. It must not be renamed or recoloured here.

**Deliberately NOT fixed in this change** (each is a refactor, not a palette change): the "Nuevo" status
map exists in **three** copies (#3, #4, #6); `--status-new` has **zero** `var()` consumers repo-wide, so
it stays a dead token that the hardcoded blues should eventually read from. Both belong to a
"tokenise the order-status language" change.

## Findings that change the risk picture (not anticipated by the confirmed decisions)

**F1 — Light-mode contrast REGRESSES; dark-mode contrast improves dramatically. This is the top risk.**
Computed via the WCAG 2.x relative-luminance formula (**to be re-confirmed with a tool in `sdd-design` —
these are my arithmetic, not a tool's output**):

| Pairing | Today | After | Verdict |
|---|---|---|---|
| light `--primary-foreground` on `--primary` (white on orange) | `#fff` on `#007aff` = **4.02:1** | `#fff` on `#f57c00` = **2.70:1** | fails AA **and** AA-large (3:1) |
| light `text-primary` on `--background` `#f2f2f7` | **3.60:1** | **2.42:1** | worse |
| dark `--primary-foreground` on `--primary` | `#fff` on `#0a84ff` = **2.06:1** | `#180d00` on `#ff9f0a` = **9.32:1** | **+7.3 — a large win** |
| dark `text-primary` on `--background` `#09090b` | — | `#ff9f0a` = **9.68:1** | excellent |

This lands on `button.tsx:12` (`bg-primary text-primary-foreground`, the **default** variant) and
`button.tsx:21` (`link: text-primary`) — 93 call sites across 50 files. jebbs' own comment claims
*"AA sobre blanco"* for `#f57c00` (`jebbs:41`); **that claim does not survive the arithmetic.** jebbs'
four primitives are the right *structure*; its light-mode `--accent-contrast: #ffffff` is the one value
that should not be copied without a decision. Routed to `sdd-design` as **Q1** with a leaning, because it
is a visual-identity call and the user asked to replicate jebbs.

**F2 — The app already speaks orange, for warnings and for medals.** Missed entirely by the exploration.
Six files use orange/amber today, in two unrelated semantic families:

- *Warning / attention*: `demo-banner.tsx:7` (amber demo badge), `summary-step.tsx:272-276` (orange
  alert), `order-card.tsx:126-128` + `order-card-mobile.tsx:114-116` (amber delay timer),
  `edit-customer-modal.tsx:125, 144, 150, 151` (amber unsaved indicator).
- *Literal metals*: `rendimiento/page.tsx:107-110` (`#F59E0B` + amber = gold, rank 1), `:130-132`
  (orange-800/700 = bronze, rank 3), `:594, 651, 662, 670`.

**This is the genuine product tradeoff of the whole change**, and it is larger than `--status-ready`:
adopting orange as the brand costs `dashboard-demo` some of its warning vocabulary. An orange primary
button beside an amber delay badge no longer reads as "brand vs alert". **Recommendation: do not touch
any of them here** — they are hardcoded Tailwind colours in feature components, and a 6-file
re-semanticising sweep would drown the token diff. Instead: named as a QA item, and flagged as a
follow-up ("tokenise the warning/attention language"). The **medal colours must never change** — gold and
bronze are literal, not thematic.

**F3 — `bg-primary/10 text-primary` is already a hand-rolled accent tint.** `layout/sidebar.tsx:116, 121`
implements exactly the pattern D3 formalises. It turns orange for free, with **zero** markup change —
which is the best evidence that the token repoint is the whole job.

**F4 — porting `--sidebar-accent` as jebbs' `tint-16` would invert active and hover.** jebbs' nav is
byte-for-byte the same shape as ours: active `bg-primary/10 text-primary`, hover `hover:bg-sidebar-accent`
(`jebbs/components/layout/sidebar.tsx:128-129` vs `dashboard-demo:116-117`) — with
`--sidebar-accent: var(--accent-tint-16)`. jebbs gets away with 10%-active / 16%-hover because it adds
**`nav-rail-active`** (`jebbs:128`), an expressive utility that carries the active state independently of
background strength. **`dashboard-demo` does not have it** — `sistema-material-glass/proposal.md:210`
explicitly deferred `nav-rail-active`. Without the rail, background strength is the *only* differentiator,
so a hovered item would look more selected than the active one. **Recommendation**: `--sidebar-accent:
var(--accent-tint-08)` **and** raise the active state at `layout/sidebar.tsx:116` from `bg-primary/10` to
`bg-accent` (= tint-16), giving a clean 16%-active / 8%-hover ladder in one extra line. Exact values →
`sdd-design` **Q2**. `nav-rail-active` stays out of scope.

## Out of scope (non-goals, with reasons)

| Non-goal | Why |
|---|---|
| **Semantic typography ramp** | D1. `jebbs/globals.css:292-364` defines it; adopting it means remapping **599** `text-xs`/`text-sm` call sites with no 1:1 mapping — an order of magnitude larger than this change, and it would bury every token line in the diff. A separate change. **Not a promised next step.** |
| **`--jebbs` / `--color-jebbs`** (`jebbs:42, 154`) | Brand-literal, not a system token — jebbs uses it for the "Jebbs" wordmark with `font-brand`/Pacifico. Verified: `dashboard-demo` has **no such token and no destination for one**. Its wordmark is "Morfito" (`layout/sidebar.tsx:85`) in `Baloo_2` (`:33-36, :84`) with **no colour class at all** — it inherits `text-sidebar-foreground`. Porting it would create a token with zero consumers. |
| **The chart palette** | See above. `--chart-1` stays blue on the donor's own precedent; `--chart-3` stays orange because a categorical palette changes as a unit under a CVD-ordering invariant (`jebbs:214`). Already deferred at `sistema-material-glass/proposal.md:211`. |
| **Material / glass system** | Closed by `sistema-material-glass`. **Provably unaffected**: `--specular`, `--hairline*`, `--material-*`, `--surface-*`, `--well`, `--blur-*` are 100% neutral (white/black with alpha, `globals.css:57-73, 116-138`) and **not one derives from `--primary` or the accent**. No `@utility` body (`:238-327`) references `--primary`/`--accent`. Re-verified by reading the file end to end. |
| **Product model / business logic** | Closed by `reconciliar-finanzas-demo`. Zero `lib/**` or `services/**` edits, with one exception noted only to be rejected: `lib/utils/order-status.ts:12` **stays as it is**. |
| **The 9 status-blue call sites, and tokenising them** | See the table. Blue is the `new` state, not the old brand — the donor kept it (`jebbs:87, 201`). Making them read `--status-new` is a separate tokenisation change. |
| **Re-semanticising the 6 pre-existing orange/amber files** | F2. Hardcoded colours in feature components; a sweep would drown the token diff. QA item + follow-up, not work here. |
| **The 3 duplicated "Nuevo" status maps** | #3/#4/#6. A dedup refactor with zero visual delta — exactly the diff shape that hides a real one. |
| **`nav-rail-active`** | Already deferred by `sistema-material-glass/proposal.md:210`. F4 is solved with tint values, not a new utility. |
| **`--accent-tint-32`** | Ported for ladder completeness; deliberately given **no consumer** in this change. |

## Capabilities (contract with `sdd-spec`)

### New capabilities
- `brand-accent-tokens`: the four-primitive accent model (`--accent-brand`, `--accent-hover`,
  `--accent-pressed`, `--accent-contrast`) plus `--accent-tint-08/16/32`, per theme, and the rule that
  **the brand hex appears in exactly one place per theme** and every other accent-bearing token derives
  from it via `var()`.

### Modified capabilities
- `semantic-colour-aliases`: `--primary`, `--primary-foreground`, `--accent`, `--accent-foreground`,
  `--ring`, `--sidebar-primary`, `--sidebar-primary-foreground`, `--sidebar-ring`, `--sidebar-accent`,
  `--sidebar-accent-foreground` stop being literals and become derivations. **`--accent` changes kind**:
  solid → tint, in both themes, which forces `--accent-foreground` to become the brand colour.
- `order-status-colour-language`: `--status-ready` moves orange → green in both themes, aligning the token
  with what the kanban already renders and vacating orange for the brand. `--status-new` stays **blue** —
  explicitly unchanged, and that is a requirement, not an omission.

## Affected areas

| Path | Impact | What changes |
|---|---|---|
| `app/globals.css` `:11-74` (light) | **Modified** | +7 accent primitives; repoint `:18, 19, 24, 25, 30, 39, 40, 41, 42, 44`; `--status-ready` `:48` → green |
| `app/globals.css` `:77-139` (dark) | **Modified** | +7 accent primitives; repoint `:84, 85, 90, 91, 96, 104, 105, 106, 107, 109`; `--status-ready` `:113` → green |
| `app/globals.css` `:141-193` (`@theme inline`) | **Possibly modified** | Only if a utility needs `bg-accent-brand`/`text-accent-brand`. Existing `--color-primary`/`--color-accent`/`--color-status-ready` mappings (`:150, 156, 190`) already forward the new values — **no edit needed for the repoint itself** |
| `app/login/page.tsx` `:45` | **Modified** | `bg-blue-600/10` → `bg-primary/10` (1 line, the only genuine brand blue) |
| `components/layout/sidebar.tsx` `:116` | **Modified (F4)** | `bg-primary/10` → `bg-accent`, so active (16%) outranks hover (8%) |
| 12 shadcn primitives using `bg-accent`/`text-accent-foreground` — `button.tsx:16, 20`, `badge.tsx:19`, `calendar.tsx:107, 111, 113`, `command.tsx:150`, `context-menu.tsx:69, 129, 147, 172`, `dropdown-menu.tsx:77, 95, 131, 214`, `item.tsx:34`, `menubar.tsx:59, 106, 124, 149, 232`, `navigation-menu.tsx:62, 130`, `select.tsx:110`, `toggle.tsx:10, 16`, `dialog.tsx:72`, `sidebar.tsx` (9 sites) | **Unchanged markup, changed appearance** | D3. 42 call sites / 18 files repaint from the token. **Zero code edits.** |
| 50 files using `bg-primary`/`text-primary`/`ring-ring`/`border-primary` (93 sites) | **Unchanged markup, changed appearance** | Repaint from the token. **Zero code edits.** F1 lands here. |
| `app/(dashboard)/precios/page.tsx` `:199` | **Unchanged markup, changed appearance** | The only `--status-ready` consumer; ✓ turns green (an improvement) |
| `lib/utils/order-status.ts`, `components/orders/order-card.tsx`, `order-card-mobile.tsx`, `orders-dashboard.tsx`, `order-column.tsx` | **Unchanged** | The 9 status blues stay blue, by decision |
| `app/(dashboard)/historial/page.tsx` `:297` | **Unchanged** | Payment-method blue is not brand |
| `app/(dashboard)/rendimiento/page.tsx`, `demo-banner.tsx`, `summary-step.tsx`, `edit-customer-modal.tsx` | **Unchanged** | F2. Pre-existing orange/amber; QA item only |
| `lib/**`, `services/**`, `components/finanzas/*`, `components/costos/*` | **Unchanged** | Repaint through the primitives. No logic touched |
| `app/globals.css` `:233-464` (materials, utilities, a11y blocks) | **Unchanged** | Provably accent-independent |
| `package.json` | **Unchanged** | No new dependency |

## Risks

| # | Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|---|
| **R1** | **Light-mode brand contrast fails AA and AA-large** (F1): white on `#f57c00` = 2.70:1 on the *default* button variant, `button.tsx:12`, reaching 50 files | **Certain if jebbs' light values are copied verbatim** | **High** — accessibility, app-wide | Q1 to `sdd-design` **before** apply, with the measured numbers. Mitigations, cheapest first: (a) a separate darker orange for foreground roles in light only; (b) darken light `--accent-brand` toward `#b85c00` (**4.60:1, passes AA**); (c) accept and record it. **Do not let this be decided by copy-paste.** |
| **R2** | **`--accent` changes kind** (solid → tint) and 42 call sites in 18 files assume a solid background | Medium | Medium | `--accent-foreground` → `--accent-brand` in the **same** commit; QA every dropdown/select/command/calendar/menubar highlight in both themes. `dialog.tsx:72` pairs `bg-accent` with `text-muted-foreground` (not `accent-foreground`) — broken today, **improves** after; verify, don't assume |
| **R3** | **Sidebar hover outranks sidebar active** (F4) | **High if jebbs' `tint-16` is copied for `--sidebar-accent`** | Medium — visible on every page load | Q2: tint-08 for hover + `bg-accent` for active at `layout/sidebar.tsx:116` |
| **R4** | **Orange brand collides with the pre-existing orange warning language** (F2) in 4 files | **Certain — it is a fact of the palette** | Medium | Named QA item; deliberately not fixed here; follow-up change recorded. Medal colours explicitly protected |
| **R5** | **`--chart-3` resembles the brand** | Certain | **Low** | Accepted with reasons. Charts carry legends/direct labels and contain no `bg-primary` control. Palette re-derivation stays deferred |
| **R6** | **The reflex "make every blue orange"** — the exploration's own framing invites it, and 9 of 10 hardcoded blues would be wrong | **High** | Medium | The per-case table is the contract. `sdd-verify` greps: the 8 status blues and `historial:297` must be **byte-identical**; only `login/page.tsx:45` may differ |
| **R7** | **Copying `--jebbs`/`--color-jebbs`** — they sit 1 line from `--accent-brand` in the file being read (`jebbs:42, 154`) | **Medium — adjacency is the whole risk** | Low | Out-of-scope table; `sdd-verify` greps for `--jebbs` and `--color-jebbs`: non-empty = CRITICAL |
| **R8** | **Dark `--primary-foreground: #180d00` looks like a mistake in review** (near-black text on a button) | Medium | Low | It is deliberate and measured: 2.06:1 → 9.32:1. Carry jebbs' comment *"texto SOBRE naranja — nunca blanco"* (`jebbs:158`) into our file, at the token |
| **R9** | **No automated safety net, and pretending otherwise is the real danger.** `package.json:10` is `vitest run` (jsdom); **zero tests assert any colour** — verified by grep over `**/__tests__/**` | **Certain — a fact, not a risk** | High if unacknowledged | Manual visual QA is *the* gate. `npm test` and `tsc --noEmit -p tsconfig.demo.json` (`package.json:11`) cover only the 2 `.tsx` edits |
| **R10** | **Scope creep into typography** — the ramp sits in the same donor file (`jebbs:292-364`) | Medium | High | Out-of-scope table with the 599-call-site count. `sdd-verify`: zero `text-caption`/`text-title*`/`text-subheadline` anywhere |

## Rollback plan

`git revert` of a single commit. There is no persisted state, no migration, no external consumer of these
token names, and no data shape involved. Partial rollbacks are also trivial:

| Slice | Rollback | Residual |
|---|---|---|
| Accent repoint | Restore 11 literal hexes in `globals.css` | **None** |
| `--status-ready` | Flip 2 lines back to `#ff9500`/`#f59e0b` | None — restores a token the UI already contradicts |
| `login/page.tsx:45` | Revert 1 line | None |
| `layout/sidebar.tsx:116` | Revert 1 line | None |

## Dependencies

- **No new npm packages.** Tailwind v4 CSS-first; the existing `@theme inline` mappings (`:150, 156, 190`)
  already forward `--primary`/`--accent`/`--status-ready`, so the repoint needs no build change.
- `jebbs-dashboard/app/globals.css:41-49, 153-161` is read as the **value source**;
  `jebbs/components/layout/sidebar.tsx:128-129` as evidence for F4. Neither donor tree is modified.
- **Blocked on Q1** (light-mode contrast) before `sdd-apply`. Q1 is a 2-4 line decision, not a redesign.

## Suggested staging

**One PR.** My own estimate, not the exploration's: ~14 added token lines + 22 repointed lines + 2 green
lines + 2 `.tsx` lines + ~15 comment lines ≈ **75-90 changed lines** (additions + deletions), in
**3 files**. That is ~20% of the 400-line budget, and the change is not separable in a way that helps a
reviewer — splitting the token repoint from `--accent-foreground` would ship an unreadable light mode, and
`login/page.tsx:45` alone is not a PR.

`Chained PRs recommended: No` · `400-line budget risk: Low` · `Decision needed before apply: Yes — Q1`

The decision gate is **Q1 (contrast)**, not size. **This PR needs a reviewer with the app open in both
themes**, not one reading a diff: a 22-line diff repaints 50+ files. Say so in the description.

## Visual QA gate (replaces the automated coverage this repo does not have)

Manual, **both themes**, every route. `npm test` cannot see any of this (R9).

**Routes**: `/`, `/historial`, `/finanzas` (4 tabs), `/costos`, `/rendimiento`, `/clientes`, `/menu`,
`/combos`, `/extras`, `/precios`, `/login`.

**Accent surfaces**: every `Button` variant — `default` (**R1/F1, the priority**), `outline`, `ghost`,
`link`; focus rings via keyboard `Tab` (`--ring`); open `Select`, `DropdownMenu`, `Command`, `Calendar`,
`ContextMenu` highlights (**R2**, both themes — this is where dark mode stops being grey); sidebar active
vs hovered vs collapsed (**R3/F4 — hover must never look more selected than active**); `Progress`,
`Switch`, `Checkbox`, `RadioGroup`, `Slider`, `Tabs`, `InputOTP`; the order-wizard stepper.

**Regression checks**: the kanban "Nuevo" badge and its left rail are still **blue** (**R6**); the
`/historial` payment-method blue is unchanged; `/precios` ✓ is now **green** (D2); `/rendimiento` medals
are untouched (**F2**).

**Collision check (F2/R4)**: put a primary button beside an amber warning — `/` with a delayed order
(`order-card.tsx:126-128`), the order wizard summary warning (`summary-step.tsx:272-276`), the demo banner
(`demo-banner.tsx:7`), the unsaved-customer indicator (`edit-customer-modal.tsx:150`). Record whether
brand and warning are still distinguishable. **This is an observation to record, not a bug to fix here.**

**Accessibility**: measure the default button's foreground/background with a contrast tool in **light**
mode and record the number (**R1**). Force `prefers-contrast: more` and confirm `globals.css:416-433`
still behaves.

## Open design questions (for `sdd-design`)

1. **Q1 — light-mode foreground orange. BLOCKING `sdd-apply`.** White on `#f57c00` is **2.70:1** and
   `text-primary` on `#f2f2f7` is **2.42:1** (F1); both fail AA and AA-large. Dark mode is fine (9.3:1).
   **Leaning: split the role.** Keep `--accent-brand: #f57c00` for *fills* (it is the brand, and dark mode
   needs no help), and introduce one extra light-only token for *foreground* roles — `#b85c00` measures
   **4.60:1** on white and is already in the ported ladder as `--accent-pressed`, so no new hue is
   invented. Cost: 1-2 token lines. **Re-verify every number with a real contrast tool before applying —
   the figures above are my arithmetic.**
2. **Q2 — `--sidebar-accent`: jebbs' `tint-16`, or `tint-08`?** F4: jebbs' 10%-active / 16%-hover works
   only because of `nav-rail-active`, which we deliberately do not have. **Leaning: `tint-08` for hover +
   `bg-accent` (tint-16) for active at `layout/sidebar.tsx:116`.** Alternative: leave `--sidebar-accent`
   neutral grey — cheaper, but it re-creates in the sidebar exactly the light/dark incoherence D3 exists
   to remove.
3. **Q3 — does anything need `@theme inline` exposure?** `--color-primary`/`--color-accent`/
   `--color-status-ready` (`:150, 156, 190`) already forward the new values, so the repoint needs no
   mapping. Only add `--color-accent-brand` **if** Q1/Q2 produce a utility that needs it. **Leaning: add
   nothing** — unconsumed `@theme` entries are dead weight.
4. **Q4 — port `--accent-hover` / `--accent-pressed` with no consumer?** Today hover is `hover:bg-primary/90`
   (`button.tsx:12`), an opacity trick, not a designed hover — and it is exactly what jebbs' primitives
   replace. **Leaning: port all four primitives** (the four-primitive model is the deliverable, and Q1 may
   consume `--accent-pressed` anyway), but **do not rewire `button.tsx:12`'s hover in this change** — that
   is an interaction-state change with its own QA surface.

## Success criteria

- [ ] `grep -i '#007aff\|#0a84ff' app/globals.css` returns **zero** — the blues are replaced, not joined
- [ ] Each theme block contains the brand orange as a literal **exactly once** (`--accent-brand`); every
      other accent-bearing token reads `var(--accent-*)`
- [ ] All 7 accent tokens present in **both** `:root` and `.dark`, values matching the table byte for byte
- [ ] `--accent` is `var(--accent-tint-16)` in **both** themes, and `--accent-foreground` is
      `var(--accent-brand)` in both — no `bg-accent` renders zinc grey anywhere (D3)
- [ ] `--primary-foreground` is `var(--accent-contrast)`, i.e. **`#180d00` in dark**, with the rationale
      comment at the token (R8)
- [ ] `--status-ready` is green in **both** themes; `/precios` ✓ renders green (D2)
- [ ] **`--status-new` is unchanged** (`#007aff` / `#3b82f6`) — required, not omitted
- [ ] `--chart-1`…`--chart-5` are **byte-identical** in both themes
- [ ] The 9 status/payment blues are **byte-identical**: `order-status.ts:12`, `order-card.tsx:30, 37`,
      `order-card-mobile.tsx:29, 36`, `orders-dashboard.tsx:305, 336, 364`, `historial/page.tsx:297` (R6)
- [ ] `login/page.tsx:45` reads `bg-primary/10` — a token, not a second literal
- [ ] Sidebar active state is visibly stronger than hover, in both themes (R3/F4)
- [ ] **No `--jebbs` / `--color-jebbs` / `font-brand` / Pacifico wordmark anywhere** (R7)
- [ ] `globals.css:233-464` (materials, utilities, a11y) has **zero** diff
- [ ] Zero typography tokens or `text-caption`/`text-title*`/`text-subheadline` call sites (R10)
- [ ] `lib/**`, `services/**`, `components/finanzas/*`, `components/costos/*` have **zero** diff
- [ ] Q1 resolved with a **tool-measured** contrast number recorded in `design.md`, and the light-mode
      default-button ratio recorded in `apply-progress` (R1)
- [ ] The F2 collision observation is recorded in `apply-progress` — recorded, not fixed
- [ ] Visual QA gate walked end to end, both themes, result recorded in `apply-progress` — **this is the
      gate; there is no automated substitute** (R9)
- [ ] `npm test` green; `tsc --noEmit -p tsconfig.demo.json` clean (covers the 2 `.tsx` edits only)

## Proposal question round

No question round was run: three product decisions (D1-D3) were confirmed before this proposal, and the
rest was resolved by reading both working trees. **Four findings surfaced during verification that the
confirmed decisions could not have anticipated** — `sdd-spec` should treat them as requirements, not
discoveries: **F1** (light-mode contrast regression, blocking), **F2** (the app already speaks orange for
warnings and medals), **F3** (`bg-primary/10 text-primary` is already an ad-hoc accent tint), **F4** (the
sidebar active/hover inversion that jebbs hides behind `nav-rail-active`).

Three corrections to the exploration, stated plainly because each changes work:

1. **`--status-ready` collides in BOTH themes, not only dark** — and light (`#ff9500` vs `#f57c00`) is the
   worse case. The exploration only checked dark.
2. **There are 10 hardcoded blues in 6 files, not 7 in 5.** It missed `lib/utils/order-status.ts:12` and
   the two `border-l-blue-500` variants (`order-card.tsx:37`, `order-card-mobile.tsx:36`).
3. **`--accent-foreground` was not mentioned at all**, and it is the one token that *must* move or light
   mode renders white-on-white in 18 files.

The reusable framing: **a port travels with its premise** — the lesson
`sistema-material-glass/proposal.md:393-400` drew from `reconciliar-finanzas-demo`. It applies again, one
layer down. jebbs' **structure** (four primitives, derive everything, vacate colliding state colours) is
premised on facts about *design systems* and travels intact. jebbs' **light-mode values** are premised on
jebbs' own accepted contrast (F1) and on having `nav-rail-active` (F4) — neither of which is true here.
The previous change split the donor along *mechanics vs values*; this one splits it along
*model vs measurements*. Copy the model. Measure the values.

## Verification status

Verified against `dashboard-demo`'s working tree this session: the entire `app/globals.css` (465 lines) —
light tokens `:11-74`, dark `:77-139`, `@theme inline` `:141-193`, `@layer base` `:195-231`, materials and
utilities `:233-371`, accessibility blocks `:373-464`. The 11 blue literals at `:18, 24, 30, 31, 39, 44,
46` (light `#007aff`) and `:84, 96, 104, 109` (dark `#0a84ff`), plus the **divergent** `#3b82f6` at `:97,
111` and `--accent: #27272a` at `:90`. `--status-ready` `#ff9500` `:48` / `#f59e0b` `:113`; `--chart-1..5`
`:31-35` / `:97-101`; `--status-*` `:45-50` / `:110-115`; `@theme inline` forwards at `:150, 156, 190`.
Confirmed **no** `--material-*`, `--surface-*`, `--hairline*`, `--specular*`, `--well` or `--blur-*` value
(`:57-73, :116-138`) and **no** `@utility` body (`:238-327`) references `--primary` or the accent.

Counts re-run this session: `bg-primary|text-primary|ring-primary|border-primary|ring-ring|
text-primary-foreground` = **93 matches / 50 files**; `bg-accent|text-accent|accent-foreground|
sidebar-accent` = **42 matches / 18 files**; `var(--status-ready)`/`text-status-ready` = **1 call site**
(`precios/page.tsx:199`); `var(--status-new)` = **0**; `var(--chart-1)` = **12 sites**, `var(--chart-3)` =
**6 sites**; hardcoded blue = **10 sites / 6 files** (enumerated above); pre-existing orange/amber =
**6 files** (enumerated in F2); `--jebbs`/`--color-jebbs` in `dashboard-demo` = **0**; colour assertions
in `**/__tests__/**` = **0**. Components read directly: `ui/button.tsx:7-37` (default variant
`bg-primary text-primary-foreground` at `:12`, `link: text-primary` at `:21`), `layout/sidebar.tsx:30-41,
74-89, 100-127` (Pacifico imported at `:31, 38` and **never used**; wordmark "Morfito" in `Baloo_2` at
`:84-86` with **no colour class**; active `bg-primary/10 text-primary` at `:116`, hover
`bg-sidebar-accent` at `:117`), `lib/utils/order-status.ts:1-30`, `orders/order-card.tsx:29-41`,
`ui/dialog.tsx:72`, `precios/page.tsx:186-207`, `rendimiento/page.tsx:98-136`. Tooling: `package.json:8`
(`eslint .`), `:10` (`vitest run`), `:11` (`tsc --noEmit -p tsconfig.demo.json`).

Verified against `jebbs-dashboard` (value source): `app/globals.css:1-110` and `:110-219` in full — accent
primitives `:41-49` / `:153-161` with the dark-hover-lightens comment `:156` and the never-white comment
`:158`; semantic aliases `:68-69, 73-75, 79-84` / `:180-181, 185-187, 191-196`; the status language
`:86-96` / `:198-210` **with the "el naranja pertenece al acento" rationale verbatim at `:198-200`**;
`--status-ready` green in **both** themes (`:88`, `:202`); `--status-new` **blue** in both (`:87`, `:201`);
the chart palette `:98-107` / `:212-219` with `--chart-1` **blue** in both and the "NO reordenar / CVD"
note at `:214`; `--jebbs` at `:42, 154` marked *"marca inmutable, nunca derivada"*.
`components/layout/sidebar.tsx:115-136, 148-154` — active `nav-rail-active bg-primary/10 text-primary` at
`:128`, hover `bg-sidebar-accent` at `:129, 151` (the F4 evidence).

**Not verified**: nothing was rendered. Every claim about *appearance* here is an inference from CSS values,
not an observation — which is why the visual QA gate exists and why R9 states the absence of automated
coverage instead of working around it. **The contrast ratios in F1, R1 and Q1 are my own arithmetic from
the WCAG 2.x relative-luminance formula, computed by hand and not confirmed by any tool.** They are
directionally certain (orange is lighter than blue at equal saturation, so white-on-orange is necessarily
worse) but the exact figures must be re-measured in `sdd-design` before any value decision rests on them.
