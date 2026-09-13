# Design: `paleta-naranja-jebbs`

> **Size note**: this document exceeds the generic `sdd-design` 800-word budget for the same reason
> `proposal.md:3-7` and `sistema-material-glass/design.md:3-7` exceeded theirs. The launch prompt required
> seven literal artifacts — a resolved numeric contrast value with its arithmetic, a complete two-theme
> token table, a verified green, an exact sidebar specification, a per-site blue verdict, a chart verdict,
> and a file table. Explicit instruction wins over the generic budget.

> **Scope**: this resolves Q1-Q4 from `proposal.md:363-386`, pays off R1's measurement debt, and records
> three findings the proposal did not have. It does **not** re-litigate D1-D3, the 9 status blues, the
> out-of-scope table, or the one-PR staging.

---

## Technical Approach

One CSS commit plus two one-line markup edits. Eight accent primitives per theme become the single source
of the brand; eleven semantic aliases stop being literals and read `var()`; `--status-ready` is corrected
to the green the kanban already renders. No new dependency, no build change, no `@theme inline` edit.

```
  app/globals.css
    :root  ── 8 accent primitives ──┬──→ --primary / --sidebar-primary / --ring / --sidebar-ring   (FILLS + RINGS)
    .dark  ── 8 accent primitives ──┼──→ --primary-foreground / --sidebar-primary-foreground       (TEXT ON FILL)
                                    ├──→ --accent (tint-16) · --sidebar-accent (tint-08)           (TINT SURFACES)
                                    └──→ --accent-foreground / --sidebar-accent-foreground         (TEXT ON TINT)
                                                        │
        @theme inline (:150,156,190 — UNCHANGED) ───────┴──→ 93 sites / 50 files repaint, zero code edits
```

**The organising rule of this design, and it is new**: `--accent-brand` is for **fills and rings**;
`--accent-on-surface` is for **text and icons on light surfaces and tints**. jebbs conflates the two into
`--accent-brand`; §Decision 2 proves by measurement that the conflation is what fails in light mode.

---

## Verification pass — re-read before designing on top

Every line number below was re-confirmed against the working tree this session. The proposal's line numbers
are **all still exact**; nothing drifted.

| Proposal claim | Status |
|---|---|
| light blues `:18, 24, 30, 31, 39, 44, 46`; dark `:84, 96, 104, 109`; divergent `#3b82f6` `:97, 111`; `--accent: #27272a` `:90` | **Confirmed, line-exact** |
| `--status-ready` `#ff9500` `:48` / `#f59e0b` `:113`; `--chart-3` `#ff9500` `:33` / `#f59e0b` `:99` | **Confirmed** |
| `@theme inline` forwards at `:150, 156, 190`; `--color-sidebar-accent-foreground` at `:184` | **Confirmed** |
| `login/page.tsx:45` `bg-blue-600/10 blur-[120px]` | **Confirmed** |
| `sidebar.tsx:116` `bg-primary/10 text-primary font-medium`, `:117` `hover:bg-sidebar-accent`, `:121` icon `text-primary` | **Confirmed** |
| kanban renders green for `ready` | **Confirmed and enlarged — 5 files, 9 sites, not 3** (see F1) |
| `text-primary` reaches many sites | **Quantified: 35 sites / 21 files** (see F2) |
| Q1 figures 2.70 / 2.42 / 9.32 / 9.68 / 3.60 | **Reproduced independently, to 2 decimals** (§Decision 1) |
| `#b85c00` is "4.60:1, passes AA" (`proposal.md:293, 370`) | **Corrected — that is on pure white. On the real light canvas `#f2f2f7` it is 4.12:1 and FAILS AA** (F3) |

### Three findings the proposal did not have

**F1 — the ready-green is Tailwind's `green-500`, and it is in 5 files / 9 sites, not 3.** Beyond
`order-status.ts:20`, `order-card.tsx:31,38` and `order-card-mobile.tsx:30,37`, the kanban column headers
and the column component also hardcode it: `orders-dashboard.tsx:320, 346, 376`. Every one is literally
`green-500`. That removes all judgement from D2 — see §Decision 3.

**F2 — `text-primary` is 35 sites across 21 files** (counted this session; the non-text `--primary` roles —
`bg-primary`, `border-primary`, `ring-primary`, `fill-primary`, `stroke-primary`, `text-primary-foreground` —
are a further **40 sites / 29 files**). Enumerated: `historial:244`, `sidebar.tsx:116,121`,
`precios:112,130,217`, `menu:305`, `burger-card:43`, `summary-step:487,500,508,602,614,622,675`,
`combos-step:149`, `side-step:70,104,158`, `customer-step:90`, `extra-selector:92`, `burger-item-card:182`,
`burgers-step:100`, `edit-recipe-dialog:640`, `order-details-modal:127,442`, `edit-customer-modal:92`,
`order-wizard-drawer.OLD:752,917,1303`, `button.tsx:21`, `empty.tsx:76`, `field.tsx:148`, `item.tsx:138`,
`radio-group.tsx:30`. Repointing them is a 21-file sweep — **out of scope**, and §Decision 2 records why a
token cannot fix them.

**F3 — the proposal's fallback orange was measured against the wrong surface.** `#b85c00` is 4.60:1 on
`#ffffff` but the light canvas is `--background: #f2f2f7` (`:12`) and the worst real surface is the accent
tint over `--sidebar`. Both are darker than white, so the ratio drops below AA. The mitigation the proposal
leaned on would not have worked. §Decision 2 extends the ramp one rung instead.

---

## Architecture Decisions

### Decision 1 — Q1 resolved: `--accent-contrast: #180d00` in **both** themes

**Choice**: one value, `#180d00`, in `:root` and `.dark`. Light gets dark text on orange — jebbs' dark-mode
pattern, applied to light — and the value is jebbs' own, so no hue is invented.

**Alternatives considered**: (a) jebbs' literal light value `#ffffff`; (b) pure black `#000000`;
(c) darken light `--accent-brand` to `#b85c00` so white survives (`proposal.md:293` mitigation b).

**Rationale — the arithmetic, in full, so it is independently checkable.** WCAG 2.x: per channel
`c' = c/12.92` if `c ≤ 0.04045` else `((c+0.055)/1.055)^2.4`; `L = 0.2126R' + 0.7152G' + 0.0722B'`;
ratio `= (L_light + 0.05) / (L_dark + 0.05)`.

| Colour | R' | G' | B' | **L** |
|---|---|---|---|---|
| `#ffffff` | 1.000000 | 1.000000 | 1.000000 | **1.000000** |
| `#f2f2f7` (light `--background`) | 0.887923 | 0.887923 | 0.930118 | **0.890969** |
| `#fbfbfd` (light `--card` = `material-thin` over bg) | 0.964687 | 0.964687 | 0.982250 | **0.965954** |
| `#fce9d5` (tint-16 over `--sidebar`/`--popover`) | 0.973445 | 0.814835 | 0.665443 | **0.837769** |
| `#f57c00` (light `--accent-brand`) | 0.913110 | 0.201556 | 0.000000 | **0.338280** |
| `#b85c00` (`--accent-pressed`) | 0.479317 | 0.107022 | 0.000000 | **0.178444** |
| `#a05000` (**new** `--accent-on-surface`) | 0.351530 | 0.080219 | 0.000000 | **0.132108** |
| `#180d00` (`--accent-contrast`) | 0.009132 | 0.004025 | 0.000000 | **0.004820** |
| `#007aff` (today's light brand) | 0.000000 | 0.194618 | 1.000000 | **0.211391** |
| `#ff9f0a` (dark `--accent-brand`) | 1.000000 | 0.346703 | 0.003035 | **0.460781** |
| `#09090b` (dark `--background`) | 0.002732 | 0.002732 | 0.003347 | **0.002776** |
| `#35250f` (dark tint-16 over dark `--sidebar`) | 0.035601 | 0.018500 | 0.004778 | **0.021145** |

**The decisive numbers:**

| Pairing | Ratio | AA (4.5) | AAA (7.0) |
|---|---|---|---|
| `#ffffff` on `#f57c00` — jebbs' literal light value | `1.05 / 0.388280` = **2.70:1** | **FAIL** | FAIL |
| **`#180d00` on `#f57c00` — the choice, light** | `0.388280 / 0.054820` = **7.08:1** | **PASS** | **PASS** |
| `#180d00` on `#ff9f0a` — dark, unchanged from jebbs | `0.510781 / 0.054820` = **9.32:1** | **PASS** | **PASS** |
| `#180d00` on `bg-primary/90` light (`rgb(245,136,25)`, L = 0.370911 — `button.tsx:12` hover) | `0.420911 / 0.054820` = **7.68:1** | **PASS** | **PASS** |
| `#000000` on `#f57c00` — alternative (b) | `0.388280 / 0.05` = **7.77:1** | PASS | PASS |
| `#180d00` on `#b85c00` — alternative (c) | `0.228444 / 0.054820` = **4.17:1** | **FAIL** | FAIL |

1. **Dark confirmed unchanged.** `#180d00` on `#ff9f0a` = **9.32:1**, reproducing `proposal.md:195` to two
   decimals. The dark primitive ships byte-identical to `jebbs/globals.css:158`, comment included.
2. **Alternative (b), pure black, is rejected on a 0.69 margin.** `7.77` vs `7.08` — both clear AAA, so the
   extra contrast buys nothing measurable, while `#180d00` is a *warm* near-black on hue 30 that keeps the
   two themes on one literal. One value in both blocks is also a structural win: `--accent-contrast` becomes
   the only accent primitive that does **not** need a per-theme value, which is itself documentation.
3. **Alternative (c) is now provably incompatible with the closed decision.** Darkening the brand to
   `#b85c00` drops dark-text-on-orange to **4.17:1 — below AA**. Once `--accent-contrast` is dark text, the
   brand fill *must stay light*. `#f57c00` is not merely allowed by the closed decision; it is **required**
   by it. This retires `proposal.md:293` mitigation (b) permanently.
4. **The whole reason jebbs' comment is wrong.** `jebbs/globals.css:41` claims *"AA sobre blanco"* for
   `#f57c00`; white-on-`#f57c00` is 2.70:1. The comment we ship says what is true and measured.

**Not tool-measured — and stated plainly.** No contrast tool is available in this environment, so these are
hand computations from the WCAG 2.x formula. They are **verifiable**, not asserted: the luminance table above
is the intermediate state, and the method reproduces all five of the proposal's independently-derived figures
(2.70 / 2.42 / 9.32 / 9.68 / 3.60) to two decimals. `apply-progress` must still record one tool reading on
the default button in light mode (`proposal.md:408`); the expected value is **7.08:1**. If the tool disagrees
by more than 0.1, stop and re-derive.

### Decision 2 — the accent role splits: `--accent-brand` fills, **`--accent-on-surface`** (new, `#a05000` light) is text on tints

**Choice**: add a ninth primitive, `--accent-on-surface` — light `#a05000`, dark `var(--accent-brand)` — and
point `--accent-foreground` and `--sidebar-accent-foreground` at it in both themes. **Zero markup change for
the 42 `bg-accent text-accent-foreground` sites**; the two sidebar lines are the only call sites edited, and
they were already being edited for F4.

**Alternatives considered**: (a) jebbs' `--accent-foreground: var(--accent-brand)` verbatim;
(b) `--accent-pressed` (`#b85c00`) as the foreground token, per `proposal.md:370`; (c) do nothing and accept.

**Rationale**: the closed decision fixed *text on a solid orange fill*. It does nothing for the **inverse
pairing** — orange text on a pale tint — which D3 creates in 42 places and which nobody measured.

| Pairing (worst light surface = tint-16 over `--sidebar`, `#fce9d5`) | Ratio | Verdict |
|---|---|---|
| (a) `#f57c00` on `#fce9d5` — jebbs verbatim | `0.887769 / 0.388280` = **2.29:1** | **FAIL**, 42 sites |
| (b) `#b85c00` on `#fce9d5` — the proposal's leaning | `0.887769 / 0.228444` = **3.89:1** | **FAIL** (F3) |
| **`#a05000` on `#fce9d5` — the choice** | `0.887769 / 0.182108` = **4.87:1** | **PASS** |
| `#a05000` on `#f2f2f7` | `0.940969 / 0.182108` = **5.17:1** | PASS |
| `#a05000` on `#ffffff` | `1.05 / 0.182108` = **5.77:1** | PASS |
| `#a05000` on `#fbfbfd` (card) | `1.015954 / 0.182108` = **5.58:1** | PASS |
| dark `#ff9f0a` on `#35250f` (tint-16 over dark `--sidebar`) | `0.510781 / 0.071145` = **7.18:1** | PASS — **dark needs nothing** |

`#a05000` is **not a new hue**: `#f57c00`, `#d96c00`, `#b85c00` and `#a05000` are all HSL hue **30°** at 100%
saturation. It is the existing ramp extended one rung (L 48% → 42% → 36% → **31%**). `#b85c00` was rejected
because F3 showed it fails on the real surfaces; `#a05000` clears AA on **every** light surface in the app
with ≥0.37 of margin, worst case included.

Dark maps to `var(--accent-brand)`, so **dark mode is byte-for-byte jebbs' behaviour** and the deviation is
confined to the one theme that needed it — the same *model vs measurements* split `proposal.md:433-439`
identified.

**Deliberately not consumed**: the 35 `text-primary` sites (F2). `text-primary` reads `--primary`, which
Decision 1(3) proves must stay `#f57c00`; there is **no token value** that fixes both roles. The only fix is
repointing 21 files to `text-accent-on-surface`, which also requires a `--color-accent-on-surface` entry in
`@theme inline`. **That is a separate change** — see §Risks R11 and §Open Questions.

### Decision 3 — Q-`--status-ready`: the literal `oklch(72.3% 0.219 149.579)`, both themes

**Choice**: `--status-ready: oklch(72.3% 0.219 149.579)` — the exact value of Tailwind `green-500` in the
installed `tailwindcss@4.3.3` (`node_modules/tailwindcss/theme.css:75`). Identical in both themes.

**Alternatives considered**: (a) `var(--color-green-500)`, a live reference to Tailwind's palette;
(b) jebbs' `#34c759` light / `#30d158` dark (`jebbs:88, 202`); (c) a hex approximation such as `#00c951`.

**Rationale**: F1 removed the judgement call. All **9** kanban sites in **5** files render literally
`green-500` — `order-status.ts:20`, `order-card.tsx:31,38`, `order-card-mobile.tsx:30,37`,
`orders-dashboard.tsx:320,346,376`. The brief was "the same green the kanban already shows", and that green
has an exact name.

- **(b) is rejected** even though it is the donor's: `#34c759` ≠ `green-500`, so the token would agree with
  jebbs and still disagree with our own kanban — reproducing the exact bug D2 exists to close.
- **(a) is rejected on a documented Tailwind v4 behaviour.** v4 emits theme variables **only for values
  actually used** (that is what `@theme static` exists to override). `--color-green-500` is emitted today
  only because `bg-green-500` appears in markup. The named follow-up is to tokenise the kanban greens — the
  moment that lands, `bg-green-500` disappears, `--color-green-500` stops being emitted, and
  `--status-ready` silently resolves to nothing. A token that breaks when its own follow-up ships is not a
  token.
- **(c) is rejected**: converting oklch→hex clips gamut and guarantees a value that is *nearly* the kanban's.
  Nearly is the current bug.

**Bonus the proposal accepted but no longer needs to.** `proposal.md:112-115` accepted `--status-ready` and
`--status-paid` becoming the same green (as in jebbs). Using `green-500` instead of `#34c759` means
`--status-paid` (`#34c759` light / `#22c55e` dark, untouched) stays **distinct**. The accepted consequence
does not occur.

**Cost: 2 lines. Consumers: 1** — `precios/page.tsx:199` `text-status-ready`, the confirm-edit ✓.

### Decision 4 — Q2/F4: `--sidebar-accent` is **tint-08**; active becomes `bg-accent` (tint-16)

**Choice**: `--sidebar-accent: var(--accent-tint-08)` (hover, 8%) and `sidebar.tsx:116` moves
`bg-primary/10` → `bg-accent` (active, 16%). `--sidebar-accent-foreground: var(--accent-on-surface)`.

**Alternatives considered**: (a) jebbs' `var(--accent-tint-16)` for `--sidebar-accent`;
(b) leave `--sidebar-accent` neutral grey.

**Rationale**: (a) reproduces jebbs' 10%-active / 16%-hover ladder, which only works because jebbs adds
`nav-rail-active` (`jebbs/components/layout/sidebar.tsx:128`) to carry the active state independently of
background strength. `sistema-material-glass/proposal.md:210` deferred that utility and this change does not
introduce it, so background strength is the **only** differentiator — a hovered item would read as more
selected than the active one, on every page load. (b) re-creates in the sidebar exactly the light/dark
`--accent` incoherence D3 exists to remove.

**Exact specification — 2 lines in 1 file, `components/layout/sidebar.tsx`:**

| Line | Today | After |
|---|---|---|
| `:116` | `"bg-primary/10 text-primary font-medium"` | `"bg-accent text-sidebar-accent-foreground font-medium"` |
| `:121` | `isActive && "text-primary"` | `isActive && "text-sidebar-accent-foreground"` |
| `:117` | `… hover:bg-sidebar-accent` | **unchanged** — now resolves to tint-08 |

Resulting ladder, both themes: **active 16% > hover 8% > rest 0%.** The label reaches **4.87:1** in light
(Decision 2) and **7.18:1** in dark, against **2.29:1** if `text-primary` were kept.

`text-sidebar-accent-foreground` compiles today — `--color-sidebar-accent-foreground` already exists at
`globals.css:184`. **No `@theme inline` edit** (Q3 confirmed: add nothing).

### Decision 5 — the login blob migrates; its indigo sibling does **not**

**Choice**: `app/login/page.tsx:45` `bg-blue-600/10` → **`bg-primary/10`**, `blur-[120px]` and every other
class byte-identical. `:46` `bg-indigo-600/10 blur-[100px]` stays.

**Alternatives considered**: (a) migrate both orbs; (b) a literal such as `bg-orange-600/10`; (c) neither.

**Rationale**: `bg-primary/10` is a **token**, not a second orange literal — that is the whole invariant
(`proposal.md:389-391`), and (b) would plant exactly the eleventh literal this change deletes ten of.
`:46` is a finding the proposal missed: the panel has **two** orbs, and migrating one leaves an orange+indigo
pair. Left unchanged deliberately — both orbs are 10% alpha under 100-120px blur on hardcoded `bg-zinc-950`,
so the pair reads as ambient temperature, not as two competing brands, and (a) would either flatten the
gradient (two identical oranges) or invent a second decorative hue. **Recorded as a QA observation**, with a
one-line remedy if the pair reads muddy: `:46` → `bg-primary/5`.

**Known quirk, now visible**: `--primary` is theme-dependent (`#f57c00` / `#ff9f0a`) while `bg-zinc-950` is
not, so the orb shifts with the theme over a fixed backdrop. Pre-existing for `bg-blue-600/10`; note it, do
not fix it.

### Decision 6 — Q4: all four primitives ship; `button.tsx` hover is **not** rewired

**Choice**: port `--accent-hover`, `--accent-pressed`, `--accent-tint-32` with **no consumer**, and leave
`button.tsx:12`'s `hover:bg-primary/90` exactly as it is.

**Rationale**: the four-primitive model is the deliverable; a half-ported ladder is not a ladder. Rewiring
hover is an interaction-state change with its own QA surface, and the opacity trick is measured as safe —
`#180d00` on `bg-primary/90` is **7.68:1** (Decision 1 table). `--accent-pressed` is *not* dead weight: it is
the rung immediately above `--accent-on-surface`, and documents that the ramp is a ramp.

### Decision 7 — `--chart-1` and `--chart-3` are both byte-identical. **`--chart-3` does not become orange-the-brand**

**Choice**: `--chart-1` `#007aff` `:31` / `#3b82f6` `:97` and `--chart-3` `#ff9500` `:33` / `#f59e0b` `:99`
ship **unchanged, byte for byte**, as do `--chart-2/4/5`.

**Correcting the brief's premise**: `--chart-3` is **already** the orange chart slot. `proposal.md:117`
("`--chart-3` stays orange") means it keeps `#ff9500`/`#f59e0b` — not that it acquires a new orange. Its
"exact orange value" is the one it has.

**Alternatives considered**: (a) `--chart-3: var(--accent-brand)`; (b) a tint of the brand;
(c) re-derive the whole 5-colour palette.

**Rationale**: (a) is **strictly worse than doing nothing**. Today `--chart-3` merely *resembles* the brand
(`#ff9500` vs `#f57c00`); pointing it at `--accent-brand` makes the data series and the brand **the same
colour by construction**, so a `bg-primary` control and a chart series become indistinguishable rather than
adjacent. (b) has the same defect at lower saturation and breaks the categorical palette's equal-weight
premise. (c) is deferred twice over — `sistema-material-glass/proposal.md:211` and
`proposal.md:244` — and `jebbs/globals.css:214` states the invariant: *"NO reordenar: el orden es el
mecanismo de seguridad CVD"*. A CVD-validated categorical palette changes as a unit, with tooling.

`--chart-1` stays blue on the donor's own precedent: jebbs is an orange brand whose `--chart-1` is
`#2a78d6`, **blue** (`jebbs:103`). `dashboard-demo`'s `--chart-1 == --primary` in light is a coincidence of
two roles sharing a hex, and this change is what disambiguates them. R5 (`--chart-3` resembles the brand) is
accepted with reasons; charts carry legends and contain no `bg-primary` control.

Success criterion `proposal.md:399` — *`--chart-1`…`--chart-5` byte-identical in both themes* — holds
unmodified. `sdd-verify` should treat any diff on `:31-35` / `:97-101` as CRITICAL.

---

## Deliverable — the literal token table

### New primitives — inserted in **both** blocks, immediately before `--primary` (light `:18`, dark `:84`)

Position chosen to mirror across themes: `.dark`'s shadow block sits at the end (`:134-138`) while light's
sits at `:51-55`, so "after the shadows" cannot mean the same place twice. Adjacent-to-first-consumer does.
Forward references are already this file's convention — `--card: var(--material-thin)` at `:14` resolves from
`:61`.

| Token | Light (`:root`) | Dark (`.dark`) | Note |
|---|---|---|---|
| `--accent-brand` | `#f57c00` | `#ff9f0a` | The brand. The **only** orange literal per block. Required to stay light by Decision 1(3). |
| `--accent-hover` | `#d96c00` | `#ffb340` | Dark hover **lightens** — inverted on purpose (`jebbs:156`). No consumer (Decision 6). |
| `--accent-pressed` | `#b85c00` | `#e08600` | No consumer. Ramp rung. |
| `--accent-contrast` | **`#180d00`** | **`#180d00`** | **Decision 1.** Dark text on orange in both themes: **7.08:1** light, **9.32:1** dark. Carry the *"texto SOBRE naranja — nunca blanco"* rationale (`jebbs:158`) and the measured numbers. |
| `--accent-on-surface` | **`#a05000`** | `var(--accent-brand)` | **Decision 2 — new, not in jebbs.** Text/icons on tints: **4.87:1** worst light case, **7.18:1** dark. |
| `--accent-tint-08` | `rgba(245, 124, 0, 0.08)` | `rgba(255, 159, 10, 0.08)` | Sidebar hover. |
| `--accent-tint-16` | `rgba(245, 124, 0, 0.16)` | `rgba(255, 159, 10, 0.16)` | `--accent`, sidebar active. |
| `--accent-tint-32` | `rgba(245, 124, 0, 0.32)` | `rgba(255, 159, 10, 0.32)` | Ported for ladder completeness. **No consumer, deliberately.** |

**Not ported**: `--jebbs` / `--color-jebbs` (`jebbs:42, 154`). R7 — they sit one line from `--accent-brand`
in the donor. `sdd-verify` greps both; non-empty = CRITICAL.

### Repointed aliases — the blue hex is **deleted**, not joined

| Token | Light: from (line) → to | Dark: from (line) → to | Resolves to (light / dark) |
|---|---|---|---|
| `--primary` | `#007aff` `:18` → `var(--accent-brand)` | `#0a84ff` `:84` → `var(--accent-brand)` | `#f57c00` / `#ff9f0a` |
| `--primary-foreground` | `#ffffff` `:19` → `var(--accent-contrast)` | `#ffffff` `:85` → `var(--accent-contrast)` | `#180d00` / `#180d00` |
| `--accent` | `#007aff` `:24` → `var(--accent-tint-16)` | `#27272a` `:90` → `var(--accent-tint-16)` | `rgba(245,124,0,.16)` / `rgba(255,159,10,.16)` |
| `--accent-foreground` | `#ffffff` `:25` → `var(--accent-on-surface)` | `#fafafa` `:91` → `var(--accent-on-surface)` | `#a05000` / `#ff9f0a` |
| `--ring` | `#007aff` `:30` → `var(--accent-brand)` | `#0a84ff` `:96` → `var(--accent-brand)` | `#f57c00` / `#ff9f0a` |
| `--sidebar-primary` | `#007aff` `:39` → `var(--accent-brand)` | `#0a84ff` `:104` → `var(--accent-brand)` | `#f57c00` / `#ff9f0a` |
| `--sidebar-primary-foreground` | `#ffffff` `:40` → `var(--accent-contrast)` | `#ffffff` `:105` → `var(--accent-contrast)` | `#180d00` / `#180d00` |
| `--sidebar-accent` | `rgba(120,120,128,.16)` `:41` → `var(--accent-tint-08)` | `#27272a` `:106` → `var(--accent-tint-08)` | `rgba(245,124,0,.08)` / `rgba(255,159,10,.08)` |
| `--sidebar-accent-foreground` | `#1c1c1e` `:42` → `var(--accent-on-surface)` | `#fafafa` `:107` → `var(--accent-on-surface)` | `#a05000` / `#ff9f0a` |
| `--sidebar-ring` | `#007aff` `:44` → `var(--accent-brand)` | `#0a84ff` `:109` → `var(--accent-brand)` | `#f57c00` / `#ff9f0a` |
| `--status-ready` | `#ff9500` `:48` → `oklch(72.3% 0.219 149.579)` | `#f59e0b` `:113` → `oklch(72.3% 0.219 149.579)` | Tailwind `green-500`, both |

**`--accent-foreground` is the token nobody asks about and the one that breaks things.** `--accent` stops
being a solid and becomes a 16% tint; leaving `#ffffff`/`#fafafa` renders white-on-near-white in 18 files.
It **must** move in the same commit. Decision 2 makes it `--accent-on-surface` rather than jebbs'
`--accent-brand`, which is the same requirement satisfied with 2.58 more contrast.

### Explicitly **unchanged** — requirements, not omissions

| Token | Light | Dark | Why |
|---|---|---|---|
| `--status-new` | `#007aff` `:46` | `#3b82f6` `:111` | Blue is the `new` **state**, not the old brand. The donor kept it (`jebbs:87, 201`). |
| `--status-paid` | `#34c759` `:47` | `#22c55e` `:112` | Out of scope; stays distinct from the new ready-green (Decision 3). |
| `--status-completed` / `--status-canceled` | `:49-50` | `:114-115` | Out of scope. |
| `--chart-1` … `--chart-5` | `:31-35` | `:97-101` | Decision 7. Byte-identical. |
| `@theme inline` `:141-193` | — | — | Q3: `:150, 156, 184, 190` already forward the new values. **Zero edits.** |
| `globals.css:195-465` | — | — | `@layer base`, materials, utilities, a11y. Provably accent-independent (`proposal.md:245`). |

---

## Data Flow

```
  --accent-brand ──→ --primary ──→ bg-primary / ring-* / border-primary  ── 40 sites / 29 files, 0 code edits
        │                     └──→ text-primary ──────── 35 sites / 21 files, UNFIXED in light (R11)
        │
        ├─→ --accent-tint-16 ──→ --accent ──→ bg-accent  ── 42 sites / 18 files, 0 code edits
        │                                       │            + sidebar.tsx:116 (active)
        ├─→ --accent-tint-08 ──→ --sidebar-accent ──→ hover:bg-sidebar-accent  (sidebar.tsx:117, unchanged)
        │
        ├─→ --accent-contrast ──→ --primary-foreground / --sidebar-primary-foreground   7.08:1 · 9.32:1
        └─→ --accent-on-surface → --accent-foreground / --sidebar-accent-foreground     4.87:1 · 7.18:1
```

---

## File Changes — one PR

| File | Action | Description |
|---|---|---|
| `app/globals.css` | Modify | 8 primitives + comments inserted before `:18` and before `:84`; the 11 aliases in the repoint table changed in both blocks (`:18,19,24,25,30,39,40,41,42,44,48` and `:84,85,90,91,96,104,105,106,107,109,113`). **`@theme inline` untouched.** |
| `app/login/page.tsx` | Modify | `:45` `bg-blue-600/10` → `bg-primary/10`. **1 line.** `:46` unchanged (Decision 5). |
| `components/layout/sidebar.tsx` | Modify | `:116` → `bg-accent text-sidebar-accent-foreground font-medium`; `:121` → `text-sidebar-accent-foreground`. **2 lines** (Decision 4). |
| `lib/utils/order-status.ts`, `components/orders/order-card.tsx`, `order-card-mobile.tsx`, `orders-dashboard.tsx`, `order-column.tsx` | **Unchanged** | The 9 status blues **and** the 9 kanban greens stay hardcoded. R6. |
| `app/(dashboard)/historial/page.tsx` | **Unchanged** | `:297` payment-method blue is not brand. |
| `app/(dashboard)/precios/page.tsx` | **Unchanged** | `:199` is the single `--status-ready` consumer; the ✓ turns green through the token. |
| `rendimiento/page.tsx`, `demo-banner.tsx`, `summary-step.tsx`, `edit-customer-modal.tsx` | **Unchanged** | F2/R4. Medal colours protected. |
| the other 24 `text-primary` files (F2) | **Unchanged** | R11. Named follow-up, not work here. |
| `lib/**`, `services/**`, `components/finanzas/*`, `components/costos/*`, `package.json` | **Unchanged** | Repaint through the primitives. |

**Estimate**: 18 new token lines + ~12 comment lines + 22 repointed lines + 3 markup lines ≈ **55 additions /
~25 deletions ≈ 80 changed lines in 3 files** — inside `proposal.md:326-332`'s 75-90 forecast, ~20% of the
400-line budget.

`Chained PRs recommended: No` · `400-line budget risk: Low` · `Decision needed before apply: No — Q1 is
resolved (Decision 1)`

**Review note to carry into the PR description**: an 80-line diff repaints 50+ files. This needs a reviewer
with the app open in **both themes**, not one reading a diff.

---

## Interfaces / Contracts

```css
/* The contract, in one place. Light shown; dark differs only in the 4 marked values.
   Brand literal appears EXACTLY ONCE per theme block. */
--accent-brand:      #f57c00;                     /* FILLS + RINGS. Must stay light — see below. */
--accent-contrast:   #180d00;                     /* TEXT ON FILL. 7.08:1 light / 9.32:1 dark.
                                                     Never white: white on #f57c00 is 2.70:1.
                                                     Corollary: --accent-brand may not be darkened —
                                                     #180d00 on #b85c00 is 4.17:1 and fails AA. */
--accent-on-surface: #a05000;                     /* TEXT/ICONS ON TINTS. 4.87:1 worst light surface.
                                                     Dark: var(--accent-brand) — 7.18:1, no override needed. */
--accent-tint-08:    rgba(245, 124, 0, 0.08);     /* hover  */
--accent-tint-16:    rgba(245, 124, 0, 0.16);     /* active */
--accent-tint-32:    rgba(245, 124, 0, 0.32);     /* unconsumed, ladder completeness */
--status-ready:      oklch(72.3% 0.219 149.579);  /* = Tailwind green-500 (theme.css:75), the value the
                                                     kanban already renders in 9 sites across 5 files.
                                                     Literal, NOT var(--color-green-500): v4 only emits
                                                     theme vars that are used. */
```

**Invariant for `sdd-verify`**: after this change,
`grep -iE '#007aff|#0a84ff' app/globals.css` → **empty**; `grep -c '#f57c00' app/globals.css` → **1**;
`grep -c '#ff9f0a' app/globals.css` → **1**; `grep -E '\-\-jebbs|\-\-color-jebbs' app/globals.css` →
**empty**; `git diff --stat` → exactly **3 files**.

---

## Testing Strategy

| Layer | What to test | Approach |
|---|---|---|
| Static | the 2 `.tsx` edits compile | `tsc --noEmit -p tsconfig.demo.json` (`package.json:11`) |
| Static | nothing else regressed | `npm test` (`vitest run`, `package.json:10`) — **asserts zero colours**; compilation only |
| Static | invariants | the four greps in §Interfaces |
| Visual | everything that matters | **manual, both themes, every route** — `proposal.md:337-361` is the gate |
| A11y | the resolved decision | one tool reading of the default `Button` in **light**; expected **7.08:1** (Decision 1) |
| A11y | the new token | one tool reading of an open `Select`/`DropdownMenu` highlighted item in **light**; expected **≈4.87:1** (Decision 2) |
| A11y | the known failure | one tool reading of a `text-primary` price (`menu:305`) in **light**; expected **2.42:1** — **record it, do not fix it** (R11) |

**R9 restated as fact, not risk**: no test in this repo asserts a colour, and jsdom cannot evaluate
`oklch()`, alpha compositing, or theme switching. Manual visual QA **is** the gate.

### QA items this design adds to the proposal's gate

- **Decision 4** — sidebar: active vs hovered vs collapsed, both themes. **Hover must never look more
  selected than active.** Read the active label for legibility, not just colour.
- **Decision 2** — open `Select`, `DropdownMenu`, `Command`, `Calendar`, `ContextMenu`, `Menubar` in
  **light**: the highlighted row is dark-orange text on a pale orange tint, not orange-on-orange.
  In **dark**, confirm the highlight stopped being zinc grey (D3).
- **Decision 1** — the default `Button` in **light** now has near-black text. It is deliberate and measured
  (R8); confirm it reads as intentional, not as a missing style.
- **Decision 3** — `/precios` ✓ is green and **matches the kanban's "Listo" badge exactly**. Put them
  side by side; any perceptible difference means the oklch literal drifted.
- **Decision 5** — `/login` left panel: orange orb beside the untouched indigo orb. Record whether the pair
  reads muddy; remedy is `:46` → `bg-primary/5`, **not** in this PR.
- **R11** — a `text-primary` price on `/menu` or `/precios` in light. Record the number. Expect it to look
  washed out. **This is the follow-up's evidence, not this PR's bug.**
- **F2/R4** — primary button beside an amber warning (`order-card.tsx:126-128`, `summary-step.tsx:272-276`,
  `demo-banner.tsx:7`, `edit-customer-modal.tsx:150`). Record; do not fix.
- **R6** — kanban "Nuevo" badge and left rail still **blue**; `/historial:297` blue unchanged;
  `/rendimiento` medals untouched.
- Force `prefers-contrast: more` and confirm `globals.css:416-433` still behaves.

---

## Migration / Rollout

No migration, no feature flag, no persisted state, no external consumer of these token names.
`git revert` of one commit. Partial rollbacks stay trivial:

| Slice | Rollback | Residual |
|---|---|---|
| Accent repoint | restore the 22 literal alias lines | none |
| `--accent-on-surface` (Decision 2) | delete 2 token lines; point `--accent-foreground`/`--sidebar-accent-foreground` at `var(--accent-brand)` | light drops to 2.29:1 on 42 sites |
| `--status-ready` | 2 lines back to `#ff9500` / `#f59e0b` | restores a token the UI contradicts |
| `login/page.tsx:45` | 1 line | none |
| `sidebar.tsx:116,121` | 2 lines | hover outranks active again (R3) |

---

## Risks — delta on `proposal.md:289-302`

| # | Risk | Status after this design |
|---|---|---|
| **R1** | Light brand contrast fails AA | **Closed.** Decision 1: `#180d00` both themes → 7.08:1 light, 9.32:1 dark. Both AAA. |
| **R2** | `--accent` changes kind, 42 sites assume a solid | **Mitigated harder than planned.** `--accent-foreground` → `--accent-on-surface` (4.87:1) rather than `--accent-brand` (2.29:1). `dialog.tsx:72` pairs `bg-accent` with `text-muted-foreground` — broken today, improves after; **verify, don't assume.** |
| **R3** | Sidebar hover outranks active | **Closed.** Decision 4: 16% active / 8% hover, 2 lines. |
| **R4** | Brand orange collides with the pre-existing orange warning language | **Unchanged.** Certain, accepted, QA observation only. Medals protected. |
| **R5** | `--chart-3` resembles the brand | **Unchanged and reinforced.** Decision 7 shows the "fix" (chart-3 = accent-brand) is strictly worse. |
| **R6** | The reflex "make every blue orange" | **Unchanged.** 1 of 10 migrates. `orders-dashboard.tsx:336,364` pass a prop named `accentColor` carrying a **status** colour — must not be renamed or recoloured. |
| **R7** | Copying `--jebbs` / `--color-jebbs` | **Unchanged.** Grep gate in §Interfaces. |
| **R8** | Dark `--primary-foreground: #180d00` looks like a mistake in review | **Widened and answered.** It is now the value in **both** themes. Ship the measured numbers in the comment so review has the answer in the diff. |
| **R9** | No automated safety net | **Unchanged — a fact.** Manual QA is the gate. |
| **R10** | Scope creep into typography | **Unchanged.** Zero typography tokens. |
| **R11** | **NEW — `text-primary` on light surfaces fails AA and this change makes it worse: 3.60:1 → 2.42:1, across 35 sites in 21 files** | **Accepted, measured, not fixed.** Decision 1(3) proves no token value fixes both roles; Decision 2 proves the remedy exists (`#a05000`) but needs 21 files + a `@theme inline` entry. **Pre-existing failure deepened, not introduced.** Follow-up: "repoint `text-primary` to `text-accent-on-surface`". |
| **R12** | **NEW — the login panel has a second orb (`login/page.tsx:46`, indigo) the proposal missed** | Left unchanged by decision (Decision 5). QA observation; 1-line remedy recorded. |

---

## Open Questions

- [x] **Q1 — light foreground orange**: **resolved.** `--accent-contrast: #180d00` in both themes
      (Decision 1), and the inverse pairing resolved separately via `--accent-on-surface` (Decision 2).
      **No longer blocking `sdd-apply`.**
- [x] **Q2 — `--sidebar-accent` tint-16 or tint-08**: **resolved.** tint-08 hover + `bg-accent` active
      (Decision 4).
- [x] **Q3 — `@theme inline` exposure**: **resolved — add nothing.** `--color-sidebar-accent-foreground`
      already exists at `:184`; `--accent-on-surface` is consumed only through `var()` inside other tokens,
      so it needs no utility. An entry becomes necessary only when R11's follow-up ships.
- [x] **Q4 — port `--accent-hover`/`--accent-pressed` unconsumed**: **resolved.** Port all; do not rewire
      `button.tsx:12` (Decision 6).
- [ ] **R11 is a decision the user may want to make now rather than later.** This design accepts a
      deepened, pre-existing AA failure on 35 `text-primary` sites. The fix is mechanical
      (`text-primary` → `text-accent-on-surface` + 1 `@theme inline` line) but touches **21 files**, which
      roughly doubles the PR and changes its review shape from "token diff" to "sweep". **Recommendation:
      separate PR, immediately after this one.** If the user prefers one PR, say so before apply.
- [ ] **Not tool-measured.** Every ratio here is hand-computed from the WCAG 2.x formula with the luminance
      table shown for checking; the method reproduces all five of the proposal's independent figures to two
      decimals. `apply-progress` must still record the three tool readings in §Testing Strategy.
- [ ] **Nothing was rendered.** Every appearance claim is an inference from CSS values and alpha
      compositing arithmetic. `#fce9d5` and `#35250f` are *computed* composites of tint-16 over
      `--material-thick` over `--background`; a browser's blur/saturate on `material-thick` will shift them
      slightly. The margins (≥0.37 over AA) are sized to absorb that, but the QA readings are what confirm it.
