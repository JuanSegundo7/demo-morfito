# Tasks: reconciliar-finanzas-demo — Reconcile Finanzas/Costos with morfito's settled rules

Derived from the approved spec (`.atl/sdd/reconciliar-finanzas-demo/spec.md`) and design
(`.atl/sdd/reconciliar-finanzas-demo/design.md`). PR boundaries are design's own **four-PR** staging
(D1 resolves C7, D3 is the D1/C5 reversal ADR, D11 is C1), broken into ordered, checkable tasks at the
rigor bar of `.atl/sdd/gastos-recurrentes/tasks.md`.

> **Size note**: this document exceeds the generic `sdd-tasks` word budget, mirroring design.md's own
> override note, at the requester's explicit rigor bar. Explicit instruction wins over the generic
> budget.

> **This is a demo with no real database.** `lib/demo/mock-supabase.ts` is a synchronous in-RAM shim
> over Zustand (`type Row = Record<string, unknown>`) — no migrations, ever. `typecheck` runs against
> `tsconfig.demo.json`, not `tsconfig.json` (`package.json:11`: `tsc --noEmit -p tsconfig.demo.json`).
> `npm test` = `vitest run` (`package.json:10`).

## Review Workload Forecast

| PR | Scope | Est. changed lines (design's own estimate) | 400-line risk |
|----|-------|--------------------:|---------------|
| PR1 | `lib/utils/__tests__/expenses.test.ts` + `lib/utils/__tests__/net-revenue.test.ts`, zero production lines | ~280 | Low |
| PR2 | `use-orders-history.ts` per-day ledger rows (C7) + `page.tsx` comment fix (D4) + test additions | ~125 | Low |
| PR3 | `Expense.recurring_expense_id` + `paydayProgressFor` FK+window (D7) + 3 salaries-gate deletions + seed + quick-log | ~280 | Low |
| PR4 | Close-and-replace write order (C1/D11) + export title options object (D8) | ~70 | Low |
| **Total** | | **~755** | |

Decision needed before apply: No
Chained PRs recommended: Yes
Chain strategy: stacked-to-main (each PR merges to main in order; PR2 needs PR1's harness, PR3 is independent of PR2 but sequenced after it, PR4 is droppable at any point)
400-line budget risk: Low

No PR individually risks the 400-line budget, and design's own staging already keeps each PR
single-concern and independently revertible — no split decision needed before `sdd-apply`.

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | Characterization tests for `lib/utils/expenses.ts` (proration engine) + non-regression tests for the commission arithmetic (D3 guard) | PR1 | Base: main. Zero production lines — the safety net PR2/PR3 are written against. |
| 2 | Swap the ledger's lump-at-period-close for `expandRecurringExpensesDaily`, per-day rows (C7/D1/D2); delete `ledgerClosingBalance` (D5); fix the false chart comment (D4) | PR2 | Base: PR1. No total moves — the review contract is that `netRevenue`/`expensesTotal`/`commissionTotal` stay byte-identical. |
| 3 | `Expense.recurring_expense_id`; `paydayProgressFor` FK+window match (D7); drop 3 salaries gates; seed writes the link; quick-log carries the template's own category | PR3 | Base: PR2 (or main — independent files, sequenced for a linear chain). |
| 4 | Close-and-replace write order (INSERT-before-UPDATE, D11); export title options object (D8) | PR4 | Base: PR3. Droppable without affecting PR1-PR3. |

---

## Phase 1 (PR1, strict TDD): Characterization + non-regression tests (~280 lines, ZERO production lines)

The proration engine (`lib/utils/expenses.ts`) has never had a test despite vitest being fully wired
(`package.json:10`, `vitest.config.ts`, 4 existing `__tests__/` files elsewhere). This phase pins its
current behavior *before* PR2 changes which caller consumes it, and pins the D3 commission
non-regression (D1/C5 reverted — commission stays an operand and stays a ledger row).

- [x] 1.1 RED `[test,small]` Create `lib/utils/__tests__/expenses.test.ts`. Add: cross-month proration
      — a `monthly` template spanning two calendar months contributes `amount/daysInMonth(month A) × N
      days` + `amount/daysInMonth(month B) × M days`, tolerance `1e-9`, never `toBe`. *(spec:
      recurring-expense-templates — rule 8, `expandRecurringExpensesDaily`)*
- [x] 1.2 RED `[test,small]` Add case: **weekly/biweekly contribute exactly 0, unconditionally, even
      with a non-null `amount`** — pins the `frequency !== "monthly"` unconditional skip
      (`expenses.ts:211`) as a regression guard against a future `amount != null` "simplification".
      *(spec: recurring-expense-templates — rule 7)*
- [x] 1.3 RED `[test,small]` Add case: `end_date` inclusivity — a template ending on the period's last
      day contributes that day's row, not the day after. *(spec: rule 10)*
- [x] 1.4 RED `[test,small]` Add case: a template entirely outside the requested period produces `[]`
      — no zero-amount rows, no throw.
- [x] 1.5 RED `[test,small]` Add case: `walkOccurrenceGrid`'s window-before-anchor clamp
      (`expenses.ts:118-139`) — anchor Aug 5, window Aug 1-31 ⇒ first occurrence is Aug 5, never a
      negative-offset date before the anchor.
- [x] 1.6 RED `[test,small]` Add case: `expandRecurringExpenses` (grouped) sums to the same total as
      `expandRecurringExpensesDaily` (per-day), within `1e-9` tolerance — the structural claim D2 rests
      on once PR2 switches the hook's call site.
- [x] 1.7 GREEN `[gate,small]` Run `npx vitest run` — all of 1.1–1.6 pass against the **existing**
      `lib/utils/expenses.ts` (no production code changes in this phase; the engine is already correct
      per design finding — this phase only adds tests).
- [x] 1.8 RED `[test,small]` Create `lib/utils/__tests__/net-revenue.test.ts`. Add **rule 1
      (non-regression, D3)**: `netRevenue = totalRevenue − expensesTotal − commissionTotal` with the
      spec's concrete fixture — `totalRevenue = 90000`, `expensesTotal = 20000`, `commissionTotal =
      10000` ⇒ `netRevenue = 70000`, and explicitly assert it is NOT `80000`
      (`90000 − 20000 = 70000`, then wrongly adding back the commission). Fixture MUST use a **gross**
      `total_amount` (commission not pre-subtracted) so the premise is visible in the test data itself.
      *(spec: revenue-analytics — Domain 1, rule 1)*
      **DONE WITH A CORRECTION**: `90000 − 20000 − 10000 = 60000`, not `70000` — this task (and
      spec.md's Domain 1 scenario, lines 62-68) has an arithmetic error inherited from spec.md.
      design.md's own Domain 2 rule-4 scenario, using the SAME fixture, correctly computes
      `netRevenue = 60000` and explicitly names `70000` as the value a regression (dropping the
      commission operand) would produce. Implemented and asserts `netRevenue === 60000`, `!== 70000`
      (the actual regression value), and `!== 80000` (kept per this task's literal text). Verified
      against the real `useOrdersAnalytics` hook, not a hand-computed guess — see net-revenue.test.ts's
      header comment.
- [x] 1.9 RED `[test,small]` Add **rule 2 (non-regression, D3)**: a period containing `pedidosya`
      orders with commission on two distinct days still produces two per-day `"Comisión PedidosYa"`
      ledger rows (`kind: "expense"`, `isProrated: false`); a commission-free period produces none —
      never a zero-amount placeholder. *(spec: daily-ledger — Domain 2, rule 2)*
- [x] 1.10 RED `[test,small]` Add **rule 3**: `sum(ledger rows where kind === "expense") ≈
      expensesTotal + commissionTotal`, tolerance `1e-9` — using the spec's fixture (`20000` one-off +
      `10000` commission = `30000`), and explicitly assert it does NOT equal `expensesTotal` alone.
      This is the invariant that `page.tsx:162-166`'s comment currently misstates (fixed in PR2, D4).
      *(spec: daily-ledger — Domain 2, rule 3)*
- [x] 1.11 RED `[test,small]` Add **rule 4 (non-regression)**: the last ledger row's running `balance`
      equals `netRevenue` within tolerance, using the same fixture — both sides must subtract
      commission exactly once (the formula via its operand, the ledger via its per-day rows). This is
      the assertion that fails if either half is ever edited alone. *(spec: daily-ledger — Domain 2,
      "closing balance MUST equal netRevenue")* Implemented inside the same `it()` as rule 1 (task
      1.8), since both assert against the same fixture/hook result.
- [x] 1.12 GREEN `[gate,small]` Run `npx vitest run` — 1.8–1.11 pass against the **existing**
      `use-orders-history.ts` arithmetic (no production changes — this pins current behavior).
- [x] 1.13 `[gate,small]` Run `npx tsc --noEmit -p tsconfig.demo.json` — MANDATORY (repo's own
      `typecheck` script; `next.config.mjs` build-error-ignoring, if any, proves nothing about types).
      0 errors before and after this PR.
- [ ] 1.14 `[gate,small]` Run `eslint .` — MANDATORY (`package.json:8`). **BLOCKED, pre-existing**:
      this repo has no `eslint` package installed (not in `package.json` dependencies/devDependencies)
      and no `eslint.config.*`/`.eslintrc.*` file anywhere in the tree, despite the `lint` script
      existing. `npm run lint` fails with `'eslint' is not recognized`; `npx eslint .` fails with
      "ESLint couldn't find an eslint.config.* file". Not something this PR can fix within its
      zero-production-lines scope — flagged for a separate infra fix, not blocking PR1's merge since
      `tsc` and `vitest` both gate cleanly.

### Automated tests — Phase 1

- [x] Test1.1 `npx vitest run` green: all cases in `expenses.test.ts` (1.1–1.6) and
      `net-revenue.test.ts` (1.8–1.11). 11/11 new tests pass; full suite 141/141 (130 pre-existing +
      11 new), 7 test files.

---

## Phase 2 (PR2): Per-day prorated ledger rows — C7/D1/D2, D4, D5 (~125 lines, no total moves)

**Confirmed against design.md**: the comment fix at `page.tsx:162-166` ships in **this** PR (D4), not
PR1 — PR1 is test-only. `expandRecurringExpensesDaily` (`lib/utils/expenses.ts:183-230`) already exists
and is already correct (cross-month proration, unconditional non-monthly skip); it has **zero**
production consumers today — the hook calls the grouped `expandRecurringExpenses` instead. This phase
is a call-site swap + a date bucket, not new arithmetic. The proration engine itself is **not touched**.

- [x] 2.1 `[hook,small]` Modify `lib/hooks/orders/use-orders-history.ts` — swap the current-period call
      (`:519-523`) from `expandRecurringExpenses(...)` to `expandRecurringExpensesDaily(...)`, same
      three arguments. `recurringTotal` (`:524`) and `expensesByCategory`'s fold (`:558-560`) are
      unchanged — `DailyRecurringAllocation` is a structural superset of `RecurringExpenseAllocation`
      (adds `date`, `templateId`, `isProrated`). *(design D2)*
- [x] 2.2 `[hook,small]` Modify `use-orders-history.ts` — swap the previous-period twin call
      (`:539-543`) the same way, for symmetry with 2.1 (the two blocks are written as visual twins per
      the file's own comment). `expandRecurringExpenses` is NOT deleted — it stays exported, unused by
      this hook but correct and potentially useful elsewhere. *(design D2)*
- [x] 2.3 `[hook,small]` Modify `use-orders-history.ts` — add a `recurringByDate: Record<string,
      DailyRecurringAllocation[]>` bucket built right after the `commissionByDate` accumulator
      (`:587-594`, which stays untouched), using the same `if (!bucket[key]) bucket[key] = []` shape as
      the existing `expensesByDate` bucket (`:573-581`); skip allocations with `amount === 0`. Required
      because `expandRecurringExpensesDaily` emits template-major, not date-major.
- [x] 2.4 `[hook,medium]` Modify `use-orders-history.ts` — inside the existing `for (const day of
      dailyData)` loop (`:598-645`), after the one-off expense block closes, push one ledger row per
      bucketed allocation for that day: `date: day.date`, `concept: a.description`, `kind: "expense"`,
      `isProrated: true`, `amount: a.amount`, decrementing `runningBalance` before each push — same
      pattern as the one-off block immediately above it. *(spec: daily-ledger — C7 resolved per-day)*
- [x] 2.5 `[hook,small]` Modify `use-orders-history.ts` — **delete** the lump-at-`endDateStr` block
      (`:647-672`, the 14-line rationale comment + the loop) now that 2.4 emits the same rows per day
      instead of once at period close.
- [x] 2.6 `[hook,small]` Modify `use-orders-history.ts` — **delete** `ledgerClosingBalance` (`:674-678`)
      and its key in the returned object (`:699`). `page.tsx:263` already reads `analytics?.netRevenue`
      directly; zero other consumers exist. *(design D5)*
- [x] 2.7 `[comment,small]` Modify `app/(dashboard)/finanzas/page.tsx` — rewrite the comment above
      `dailyIncomeVsExpense` (`:162-166`), which currently asserts `sum(expense) === expensesTotal`
      ("verified by hand during implementation") — **false** for any period with a PedidosYa order.
      Correct it to state `sum(expense) === expensesTotal + commissionTotal`, naming commission rows as
      the reason, and drop the "verified by hand" claim. **Comment only — the `useMemo` body is
      untouched.** *(design D4; spec: daily-ledger — Domain 2, rule 3)*
- [x] 2.8 `[test,small]` Modify `lib/utils/__tests__/expenses.test.ts` (from PR1) — add: two monthly
      templates over a 3-day period ⇒ 6 `isProrated: true` allocations from
      `expandRecurringExpensesDaily`, 2 per day, each keeping its own `description`. Never a lump.
- [x] 2.9 `[test,small]` Modify `lib/utils/__tests__/net-revenue.test.ts` (from PR1) — add: the same
      fixture through the pre-PR2 grouped shape and the post-PR2 per-day shape produces the same
      `expensesTotal`, `expensesByCategory`, `commissionTotal`, `netRevenue` within `1e-9` tolerance —
      only ledger row count and dates differ. **This is the review contract for PR2: re-run rule 4
      (task 1.11) against the new per-day ledger and confirm it still holds.**
- [x] 2.10 `[test,small]` Add case: an allocation or expense with `amount === 0` emits no row; an empty
      period emits `[]`.
- [x] 2.11 `[gate,small]` Run `npx vitest run` — full suite green (Phase 1 + 2.8-2.10). **145/145
      passed** (141 pre-existing + 4 new), 7 test files.
- [x] 2.12 `[gate,small]` Run `npx tsc --noEmit -p tsconfig.demo.json` — MANDATORY. **0 errors**,
      same as PR1's baseline.
- [ ] 2.13 `[gate,small]` Run `eslint .` — MANDATORY. **BLOCKED, pre-existing** — same infra gap as
      task 1.14 (`eslint` not installed, no `eslint.config.*`). Not something this PR introduces or
      can fix within scope; `tsc` and `vitest` both gate cleanly.

**Explicitly NOT touched in this phase** (per design's untouched-lines table): `lib/utils/expenses.ts`
(engine unchanged), `components/finanzas/net-revenue-card.tsx`, `components/finanzas/daily-ledger.tsx`,
`lib/utils/export-ledger.ts`, and every commission line (`:441-445`, `:526`, `:546`, `:583-594`,
`:621-632`, `:697` in `use-orders-history.ts`).

### Manual QA — Phase 2 (Resumen tab, not vitest-testable)

- [ ] QA2.1 Nothing moved on the Resumen tab: "Neto", "Gastos del período", and the `−Comisión
      PedidosYa` line read exactly what they read before this PR.
- [ ] QA2.2 The last ledger row's Saldo is character-identical to "Saldo del período", on screen and in
      the exported PDF/Excel, in month/week/custom view.
- [ ] QA2.3 A single mid-period day shows one badged "prorrateo" row **per monthly template** (2 rows
      for the seed's 2 monthly templates), each with its own description; commission rows still land on
      their own sale days; the daily chart's last day no longer spikes.

---

## Phase 3 (PR3): Real link + generic frequency — C3/D6/D7 (~280 lines, most files, no aggregate moves)

No SQL migration — `lib/demo/mock-supabase.ts`'s `Row = Record<string, unknown>` (`:34`) accepts the
new field with zero shim changes.

- [x] 3.1 `[types,small]` Modify `lib/types/index.ts` — add `recurring_expense_id?: string | null;` to
      `Expense` (after `quantity`, `:166`), with a doc comment: read by ONE consumer
      (`paydayProgressFor`), which matches on this id and never on description or category. `
      RecurringExpense` is **unchanged**. *(spec: expense-tracking — Domain 5)*
- [x] 3.2 RED `[test,small]` Add to `lib/utils/__tests__/expenses.test.ts`: **rename-invariance** — a
      template with 3 linked expense rows (`recurring_expense_id` matching), one row's `description`
      edited ⇒ `paydayProgressFor`'s `loaded` stays `3`. *(spec: recurring-expense-payment-link — rule
      5)*
- [x] 3.3 RED `[test,small]` Add case: **category-independence** — a `weekly` template with `category:
      "services"` and one linked expense ⇒ that expense counts toward `loaded`, proving no `category
      === "salaries"` gate exists. *(spec: rule 6)*
- [x] 3.4 RED `[test,small]` Add case: **window scoping** — a linked expense dated outside
      `[windowStart, windowEnd]` is NOT counted, even though its FK matches (finding 4 — `loaded`
      currently ignores its own window; this closes that gap). *(design D7)*
- [x] 3.5 RED `[test,small]` Add case: an `Expense` with `recurring_expense_id` absent/`undefined`
      (legacy unlinked payment) counts toward nothing and throws nothing.
- [x] 3.6 GREEN `[pure,medium]` Modify `lib/utils/expenses.ts` — rewrite `paydayProgressFor`'s `loaded`
      predicate (`:321-324`): match `e.recurring_expense_id === template.id` AND `e.date` within
      `[windowStart, windowEnd]` (string-compare `YYYY-MM-DD`, lexicographic = chronological). Drop the
      `category === "salaries" && description === template.description` match entirely. Rewrite the
      stale doc comment above it (`:302-307`) and the stale convention comment at `:14-19` (which
      currently teaches operators to type descriptions a specific way for the counter to work — false
      the moment the FK lands). Make 3.2–3.5 pass. Signature is **unchanged**. *(design D7; spec:
      recurring-expense-payment-link — Domain 4)*
- [x] 3.7 `[hook,small]` Modify `lib/hooks/use-expenses.ts` — add `recurring_expense_id?: string |
      null;` to `useCreateExpense`'s mutation input (`:109-116`), passed straight through the existing
      `.insert(input)` call (`:117-121`). No other change — the shim accepts the new key.
- [x] 3.8 `[types,small]` Modify `components/finanzas/expenses-tab.tsx` — widen `QuickLogRequest`
      (`:67`, currently `{ description: string }`) to `{ description: string; category:
      ExpenseCategory; recurringExpenseId: string }`. *(design: quick-log request contract)*
- [x] 3.9 `[UI,small]` Modify `expenses-tab.tsx` — add `quickLogTemplateId` state; in the prefill effect
      (`:244-253`), replace the hardcoded `setExpenseCategory("salaries")` (`:247`) with
      `setExpenseCategory(quickLogRequest.category)` and add `setQuickLogTemplateId(
      quickLogRequest.recurringExpenseId)`. Amount stays empty (`:249` unchanged — proposal open
      question 3, confirmed keep). *(spec: expense-tracking — "Cargar pago prefills the template's own
      category")*
- [x] 3.10 `[UI,small]` Modify `expenses-tab.tsx` — thread `recurring_expense_id: quickLogTemplateId`
      into the create-expense mutation payload; clear `quickLogTemplateId` to `null` in
      `resetExpenseForm` so a manually opened dialog never inherits a stale link.
- [x] 3.11 `[UI,small]` Modify `app/(dashboard)/finanzas/page.tsx` — `handleQuickLogPayment`
      (`:189-193`, the "Cargar pago" click handler feeding `setQuickLogRequest`) now sends `{
      description: template.description, category: template.category, recurringExpenseId: template.id
      }` instead of `{ description }` alone.
- [x] 3.12 `[UI,small]` Modify `components/finanzas/recurring-expenses-tab.tsx` — delete the salaries
      gate at `:352` (`if (next !== "salaries") setRecurringFrequency("monthly");`); `onValueChange`
      collapses to just `setRecurringCategory(v as ExpenseCategory)`. *(spec:
      recurring-expense-templates — "changing category MUST NOT force frequency back to monthly")*
- [x] 3.13 `[UI,small]` Modify `recurring-expenses-tab.tsx` — unwrap the create dialog's Frecuencia
      `Select` from its `{recurringCategory === "salaries" && (...)}` gate at `:388` — frequency is
      offered for every category.
- [x] 3.14 `[UI,small]` Modify `recurring-expenses-tab.tsx` — unwrap the update dialog's Frecuencia
      `Select` from its `{updatingTemplate?.category === "salaries" && (...)}` gate at `:496`, same
      reason as 3.13.
- [x] 3.15 `[seed,small]` Modify `lib/demo/seed/expenses.ts` — the two salary-payment loops (`:135-158`)
      write `recurring_expense_id: berna.id` and `recurring_expense_id: nahuel.id` respectively on each
      pushed expense; rewrite the description-coupling comment (`:123-129`), which currently says
      matching depends on description text. **Ships inside this PR, never after** — otherwise every
      "N de M pagos cargados" counter reads "0 de N" on next reload. *(design: seed-drift risk,
      explicitly called out)*
- [x] 3.16 RED `[test,small]` Add case: **rule 9 regression pin (C4, already-true invariant)** —
      `RecurringExpense` has no `supply_id`/`quantity` key, and `useCreateRecurringExpense`'s input does
      not accept one, for `category: "supplies"` too. Zero production lines change; the assertion is
      the deliverable. *(spec: recurring-expense-templates — Domain 3, "no recurring template ever
      writes stock")* **Implemented as a runtime key-absence assertion PLUS a `@ts-expect-error`
      compile-time pin** (`RecurringExpense["supply_id"]` must not typecheck) — `useCreateRecurringExpense`'s
      input type was not separately duplicated in the test since it's structurally identical to
      `RecurringExpense` minus `id`/`created_at`; the same compile-time pin covers both.
- [x] 3.17 `[gate,small]` Run `npx vitest run` — full suite green, including 3.2–3.5 and 3.16 against
      the seeded fixture (non-zero `loaded` proves the seed link is wired). **151/151 passed** (145
      pre-existing + 6 new: 3.2, 3.3, 3.4, 3.5×2, 3.16), 7 test files.
- [x] 3.18 `[gate,small]` Run `npx tsc --noEmit -p tsconfig.demo.json` — MANDATORY. **0 errors**, same
      as PR1/PR2's baseline (measured via `git stash` before this PR's diff: 0 errors before, 0 after).
- [ ] 3.19 `[gate,small]` Run `eslint .` — MANDATORY. **BLOCKED, pre-existing** — same infra gap as
      tasks 1.14/2.13 (`eslint` not installed, no `eslint.config.*`). Not something this PR introduces
      or can fix within scope; `tsc` and `vitest` both gate cleanly.

**Untouched, confirmed**: `lib/demo/mock-supabase.ts`, `lib/demo/store.ts` — the shim already stores
arbitrary row shapes. `useDeleteRecurringExpense` stays unrestricted (C2 — deliberately NOT gated on
`start_date`, per spec Domain 3).

### Manual QA — Phase 3 (UI-layer, live-demo-bug regression)

- [ ] QA3.1 "Cargar pago" on a `weekly` `services`-category template: frequency selector is present at
      creation, the quick-log dialog prefills `category: "services"` (never "Sueldos"), and editing the
      prefilled description before saving leaves "N de M pagos cargados" correct — the exact live demo
      bug this unit fixes.
- [ ] QA3.2 Renaming a template's own `description` does not change its counter (matches only by FK).
- [ ] QA3.3 Deleting a template that already started still works — no `start_date >= today` guard was
      added (C2 confirmation).

---

## Phase 4 (PR4): Write order + export title — C1/D11, C6/D8 (~70 lines, droppable)

Droppable without affecting PR1-PR3. No runtime crash-safety is being purchased in this repo — the
in-RAM shim has no network and no partial-commit window — this is adopted purely so the reference code
does not teach the rejected write order forward.

- [ ] 4.1 `[hook,small]` Modify `lib/hooks/use-expenses.ts` — in `useCloseAndReplaceRecurringExpense`
      (`:405-442`), swap the two write blocks so the `INSERT` (currently `:428-434`) runs **before** the
      `UPDATE` (currently `:421-426`). Input type, return type, and `onSuccess` invalidations stay
      **byte-identical** — only statement order changes.
- [ ] 4.2 `[comment,small]` Add a code comment directly above the reordered blocks (not just in this
      task list) stating: the visible failure always beats the invisible one — `UPDATE`-then-`INSERT`
      failing mid-way silently drops the fixed cost from every later period (invisible, optimistic);
      `INSERT`-then-`UPDATE` failing mid-way double-counts the cost but shows two "Activo" rows with the
      same description (visible, conservative). Explicitly note: **this buys zero runtime safety in
      this repo** — `lib/demo/mock-supabase.ts` is a synchronous in-RAM shim with no network and no
      partial-commit window; adopted only because this file is a reference implementation people copy
      from. *(design D11)*
- [ ] 4.3 `[types,small]` Modify `lib/utils/export-ledger.ts` — replace both exporters' five positional
      parameters with a single `LedgerExportOptions` interface: `{ entries: LedgerEntry[];
      closingBalance: number; title: string; periodLabel: string; startDate: string; endDate: string
      }`. `title` is new; the rest are the same values, now named. *(design D8)*
- [ ] 4.4 `[fn,small]` Modify `export-ledger.ts` — `exportLedgerToPdf(options: LedgerExportOptions):
      void` reads `options.title` at `:30` (`doc.text(options.title, 14, 15)`) instead of the hardcoded
      `"Libro diario — Jebbs"`. Worksheet name and filenames (`libro-diario_{start}_{end}.{pdf,xlsx}`)
      stay unchanged — stable artifact identifiers, not business branding.
- [ ] 4.5 `[fn,small]` Modify `export-ledger.ts` — `exportLedgerToExcel(options: LedgerExportOptions):
      Promise<void>` reads `` `${options.title} — ${options.periodLabel}` `` at `:75` instead of the
      hardcoded `"Libro diario — Jebbs"`. `export-ledger.ts` imports **nothing** from
      `lib/demo/presets/` — stays a pure, framework-free formatter.
- [ ] 4.6 `[UI,small]` Modify `components/finanzas/daily-ledger.tsx` — add `const ledgerTitle =
      useMemo(() => \`Libro diario — ${getActivePreset().label}\`, [])`, following the repo's own
      15-call-site client-preset-access pattern (`rendimiento/page.tsx`, `print-modal.tsx`,
      `order-wizard-drawer.tsx`). Both export button handlers pass a single `LedgerExportOptions` object
      including `title: ledgerTitle`. Props on `DailyLedger` itself stay unchanged.
- [ ] 4.7 `[gate,small]` Run `npx vitest run` — full suite still green (this phase adds no new
      arithmetic, so no new test cases are required; existing suite must not regress).
- [ ] 4.8 `[gate,small]` Run `npx tsc --noEmit -p tsconfig.demo.json` — MANDATORY.
- [ ] 4.9 `[gate,small]` Run `eslint .` — MANDATORY.

### Manual QA — Phase 4 (Supabase-write-ordering and export-title, not vitest-testable)

- [ ] QA4.1 Close-and-replace an active template with a new amount: empirically confirm the new row
      appears (briefly overlapping) before the old row's `end_date` updates — don't just trust the code
      order; the mutation is async even over the in-RAM shim.
- [ ] QA4.2 Switch the active preset to a non-hamburguesería rubro (e.g. Pizzería) and export both PDF
      and Excel: the PDF header and the Excel A1 row read that preset's own "Libro diario — {label}",
      never "Jebbs"; filenames are unchanged (`libro-diario_{start}_{end}.{pdf,xlsx}`).

---

## Ordering / Dependency Summary

```
Phase 1 (PR1: characterization + non-regression tests — zero production lines)
   -> Phase 2 (PR2: per-day ledger rows, C7 — the harness PR1 built is what proves no total moves)
      -> Phase 3 (PR3: real link + generic frequency, C3 — independent files, sequenced for a linear chain)
         -> Phase 4 (PR4: write order + export title, C1/C6 — droppable at any point)
```

- PR2 requires PR1 — it re-runs PR1's rule-4 identity assertion against the new per-day ledger shape
  and must not break it.
- PR3 is independent of PR2 (different files, different concern) but is sequenced after it so the
  chain stays linear, per design's Migration/Rollout note.
- PR4 is droppable at any point without affecting PR1-PR3.
- No PR moves a rendered aggregate. `npm test` (`vitest run`) and `npx tsc --noEmit -p
  tsconfig.demo.json` are MANDATORY gates from PR1 onward — run both after every phase, not only at the
  end.
- Only Phases 1-3 add automated (vitest) coverage. Phase 4 relies on the Manual QA checklist above —
  write-order sequencing and export rendering are not unit-testable in this stack.
- Rollback is `git revert` for every PR — no migrations, no persisted state (the seed is
  `Math.random()`-driven and regenerates every reload), no external consumers.
