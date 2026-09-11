// Characterization tests for the proration engine (lib/utils/expenses.ts).
// This file pins CURRENT behavior, verified against the working tree — see
// .atl/sdd/reconciliar-finanzas-demo/{spec,design,tasks}.md, Phase 1 (PR1).
// Zero production lines change in this PR: the engine is already correct,
// this is the safety net PR2/PR3 are written against.

import { describe, it, expect } from "vitest";
import type { Expense, RecurringExpense } from "@/lib/types";
import {
  expandRecurringExpensesDaily,
  expandRecurringExpenses,
  walkOccurrenceGrid,
  parseDateUTC,
  paydayProgressFor,
} from "../expenses";

// ---------------------------------------------------------------------------
// Fixture helper
// ---------------------------------------------------------------------------

function makeTemplate(overrides: Partial<RecurringExpense> = {}): RecurringExpense {
  return {
    id: "tmpl-1",
    amount: 3100,
    category: "rent",
    description: "Alquiler local",
    frequency: "monthly",
    start_date: "2026-01-01",
    end_date: null,
    created_at: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

function sumAmounts(allocations: { amount: number }[]): number {
  return allocations.reduce((acc, a) => acc + a.amount, 0);
}

function makeExpense(overrides: Partial<Expense> & Pick<Expense, "date" | "category" | "amount">): Expense {
  return {
    id: "exp-1",
    description: null,
    created_at: `${overrides.date}T00:00:00.000Z`,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// 1.1 — cross-month proration
// ---------------------------------------------------------------------------
describe("expandRecurringExpensesDaily — cross-month proration", () => {
  it("a monthly template spanning Jan 20 -> Feb 10 prorates each month's share by that month's own day count", () => {
    const template = makeTemplate({ amount: 3100, start_date: "2026-01-01" });
    const periodStart = parseDateUTC("2026-01-20");
    const periodEnd = parseDateUTC("2026-02-10");

    const allocations = expandRecurringExpensesDaily([template], periodStart, periodEnd);

    // Jan 20 -> Jan 31 inclusive = 12 days (2026 is not a leap year, Jan has 31).
    // Feb 1 -> Feb 10 inclusive = 10 days (Feb has 28 days in 2026).
    const expected = (3100 / 31) * 12 + (3100 / 28) * 10;
    const total = sumAmounts(allocations);

    expect(allocations.length).toBe(22); // 12 + 10 daily rows, never a lump
    expect(Math.abs(total - expected)).toBeLessThan(1e-9); // tolerance, never toBe
  });
});

// ---------------------------------------------------------------------------
// 1.2 — weekly/biweekly contribute exactly 0, unconditionally
// ---------------------------------------------------------------------------
describe("expandRecurringExpensesDaily — non-monthly frequencies are skipped unconditionally", () => {
  it("a weekly template with a non-null amount still contributes exactly 0", () => {
    const template = makeTemplate({
      frequency: "weekly",
      amount: 999999, // non-null on purpose — pins the unconditional skip, not an amount==null gate
      start_date: "2026-01-01",
      end_date: null,
    });
    const periodStart = parseDateUTC("2026-03-01");
    const periodEnd = parseDateUTC("2026-03-31");

    const allocations = expandRecurringExpensesDaily([template], periodStart, periodEnd);

    expect(allocations).toEqual([]);
    expect(sumAmounts(allocations)).toBe(0);
  });

  it("a biweekly template with a non-null amount still contributes exactly 0", () => {
    const template = makeTemplate({
      frequency: "biweekly",
      amount: 500000,
      start_date: "2026-01-01",
      end_date: null,
    });
    const periodStart = parseDateUTC("2026-03-01");
    const periodEnd = parseDateUTC("2026-03-31");

    const allocations = expandRecurringExpensesDaily([template], periodStart, periodEnd);

    expect(allocations).toEqual([]);
    expect(sumAmounts(allocations)).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// 1.3 — end_date inclusivity
// ---------------------------------------------------------------------------
describe("expandRecurringExpensesDaily — end_date inclusivity", () => {
  it("a template ending on the period's last covered day contributes that day, not the day after", () => {
    const template = makeTemplate({
      start_date: "2026-03-01",
      end_date: "2026-03-05",
    });
    const periodStart = parseDateUTC("2026-03-01");
    const periodEnd = parseDateUTC("2026-03-10"); // wider than the template's own end_date

    const allocations = expandRecurringExpensesDaily([template], periodStart, periodEnd);
    const dates = allocations.map((a) => a.date);

    expect(dates).toContain("2026-03-05");
    expect(dates).not.toContain("2026-03-06");
    expect(dates[dates.length - 1]).toBe("2026-03-05");
  });
});

// ---------------------------------------------------------------------------
// 1.4 — template entirely outside the requested period
// ---------------------------------------------------------------------------
describe("expandRecurringExpensesDaily — template entirely outside the period", () => {
  it("produces [] — no zero-amount rows, no throw", () => {
    const template = makeTemplate({
      start_date: "2026-01-01",
      end_date: "2026-01-31",
    });
    const periodStart = parseDateUTC("2026-03-01");
    const periodEnd = parseDateUTC("2026-03-31");

    expect(() =>
      expandRecurringExpensesDaily([template], periodStart, periodEnd)
    ).not.toThrow();
    expect(expandRecurringExpensesDaily([template], periodStart, periodEnd)).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// 1.5 — walkOccurrenceGrid's window-before-anchor clamp
// ---------------------------------------------------------------------------
describe("walkOccurrenceGrid — window-before-anchor clamp", () => {
  it("anchor Aug 5, window Aug 1-31 -> first occurrence is Aug 5, never a date before the anchor", () => {
    const anchor = parseDateUTC("2026-08-05");
    const windowStart = parseDateUTC("2026-08-01");
    const windowEnd = parseDateUTC("2026-08-31");

    const occurrences = walkOccurrenceGrid(anchor, 7, windowStart, windowEnd);
    const formatted = occurrences.map((d) => d.toISOString().slice(0, 10));

    expect(formatted[0]).toBe("2026-08-05");
    for (const date of occurrences) {
      expect(date.getTime()).toBeGreaterThanOrEqual(anchor.getTime());
    }
  });
});

// ---------------------------------------------------------------------------
// 2.8 (PR2) — two monthly templates over a 3-day period produce per-day rows,
// never a lump — see .atl/sdd/reconciliar-finanzas-demo/tasks.md Phase 2.
// ---------------------------------------------------------------------------
describe("expandRecurringExpensesDaily — multiple templates, per-day rows (PR2, C7)", () => {
  it("two monthly templates over a 3-day period yield 6 isProrated allocations, 2 per day, each keeping its own description", () => {
    const templates: RecurringExpense[] = [
      makeTemplate({ id: "tmpl-rent", description: "Alquiler local", amount: 31000, category: "rent" }),
      makeTemplate({ id: "tmpl-internet", description: "Internet y servicios", amount: 3100, category: "services" }),
    ];
    const periodStart = parseDateUTC("2026-03-10");
    const periodEnd = parseDateUTC("2026-03-12");

    const allocations = expandRecurringExpensesDaily(templates, periodStart, periodEnd);

    expect(allocations).toHaveLength(6); // 2 templates x 3 days, never a single lump row
    expect(allocations.every((a) => a.isProrated)).toBe(true);

    for (const date of ["2026-03-10", "2026-03-11", "2026-03-12"]) {
      const rowsForDay = allocations.filter((a) => a.date === date);
      expect(rowsForDay).toHaveLength(2);
      expect(rowsForDay.map((a) => a.description).sort()).toEqual(
        ["Alquiler local", "Internet y servicios"].sort()
      );
    }
  });
});

// ---------------------------------------------------------------------------
// 1.6 — expandRecurringExpenses (grouped) agrees with expandRecurringExpensesDaily
// ---------------------------------------------------------------------------
describe("expandRecurringExpenses — structural agreement with expandRecurringExpensesDaily", () => {
  it("the grouped per-template total equals the sum of the daily allocations, within tolerance", () => {
    const templates: RecurringExpense[] = [
      makeTemplate({ id: "tmpl-rent", description: "Alquiler local", amount: 300000, category: "rent" }),
      makeTemplate({ id: "tmpl-internet", description: "Internet y servicios", amount: 45000, category: "services" }),
      // A weekly template must not appear in the grouped output at all —
      // it contributes zero rows to the daily primitive this function sums.
      makeTemplate({ id: "tmpl-weekly", description: "Limpieza", amount: 20000, frequency: "weekly" }),
    ];
    const periodStart = parseDateUTC("2026-03-01");
    const periodEnd = parseDateUTC("2026-03-31");

    const daily = expandRecurringExpensesDaily(templates, periodStart, periodEnd);
    const grouped = expandRecurringExpenses(templates, periodStart, periodEnd);

    const dailyTotal = sumAmounts(daily);
    const groupedTotal = sumAmounts(grouped);

    expect(Math.abs(dailyTotal - groupedTotal)).toBeLessThan(1e-9); // tolerance, never toBe
    expect(grouped.map((g) => g.description).sort()).toEqual(
      ["Alquiler local", "Internet y servicios"].sort()
    ); // the weekly template never reaches the grouped output
  });
});

// ---------------------------------------------------------------------------
// 3.2 (PR3, C3/D7) — rename-invariance: paydayProgressFor matches by FK,
// never by description. Renaming a linked expense's description must not
// change the counter.
// ---------------------------------------------------------------------------
describe("paydayProgressFor — matches by recurring_expense_id, never by description (D7 rename-invariance)", () => {
  it("3 linked expenses keep counting toward loaded even after one's description is edited", () => {
    const template = makeTemplate({
      id: "tmpl-berna",
      description: "Berna",
      category: "salaries",
      frequency: "biweekly",
      amount: null,
      start_date: "2026-01-01",
    });
    const windowStart = parseDateUTC("2026-03-01");
    const windowEnd = parseDateUTC("2026-03-31");
    const expenses: Expense[] = [
      makeExpense({ date: "2026-03-05", category: "salaries", amount: 180000, recurring_expense_id: "tmpl-berna", description: "Berna" }),
      makeExpense({ date: "2026-03-15", category: "salaries", amount: 180000, recurring_expense_id: "tmpl-berna", description: "Berna" }),
      // Description edited by the operator after logging — must still count.
      makeExpense({ date: "2026-03-28", category: "salaries", amount: 180000, recurring_expense_id: "tmpl-berna", description: "Berna (pago corregido)" }),
    ];

    const progress = paydayProgressFor(template, expenses, windowStart, windowEnd);

    expect(progress.loaded).toBe(3);
  });
});

// ---------------------------------------------------------------------------
// 3.3 (PR3, D7) — category-independence: a non-"salaries" weekly template
// with a linked expense counts toward loaded — no category === "salaries"
// gate exists anywhere in the predicate.
// ---------------------------------------------------------------------------
describe("paydayProgressFor — category-independence (D7)", () => {
  it("a weekly 'services' template with one linked expense counts it toward loaded", () => {
    const template = makeTemplate({
      id: "tmpl-cleaning",
      description: "Limpieza semanal",
      category: "services",
      frequency: "weekly",
      amount: null,
      start_date: "2026-01-01",
    });
    const windowStart = parseDateUTC("2026-03-01");
    const windowEnd = parseDateUTC("2026-03-31");
    const expenses: Expense[] = [
      makeExpense({ date: "2026-03-10", category: "services", amount: 25000, recurring_expense_id: "tmpl-cleaning", description: "Limpieza" }),
    ];

    const progress = paydayProgressFor(template, expenses, windowStart, windowEnd);

    expect(progress.loaded).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// 3.4 (PR3, D7 — finding 4) — window scoping: a linked expense dated outside
// the window is NOT counted, even though its FK matches. `loaded` previously
// ignored its own window entirely; this closes that gap.
// ---------------------------------------------------------------------------
describe("paydayProgressFor — loaded respects its own window (D7 finding 4)", () => {
  it("a linked expense dated outside [windowStart, windowEnd] is excluded despite the FK matching", () => {
    const template = makeTemplate({
      id: "tmpl-nahuel",
      description: "Nahuel",
      category: "salaries",
      frequency: "weekly",
      amount: null,
      start_date: "2026-01-01",
    });
    const windowStart = parseDateUTC("2026-03-01");
    const windowEnd = parseDateUTC("2026-03-31");
    const expenses: Expense[] = [
      // Inside the window.
      makeExpense({ date: "2026-03-10", category: "salaries", amount: 85000, recurring_expense_id: "tmpl-nahuel", description: "Nahuel" }),
      // FK matches, but dated in April — outside [windowStart, windowEnd].
      makeExpense({ date: "2026-04-02", category: "salaries", amount: 85000, recurring_expense_id: "tmpl-nahuel", description: "Nahuel" }),
      // FK matches, but dated in February — outside on the other side.
      makeExpense({ date: "2026-02-20", category: "salaries", amount: 85000, recurring_expense_id: "tmpl-nahuel", description: "Nahuel" }),
    ];

    const progress = paydayProgressFor(template, expenses, windowStart, windowEnd);

    expect(progress.loaded).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// 3.5 (PR3, D7) — an Expense with recurring_expense_id absent/undefined
// (legacy unlinked payment) counts toward nothing and throws nothing.
// ---------------------------------------------------------------------------
describe("paydayProgressFor — legacy unlinked expenses are silently excluded (D7)", () => {
  it("expenses with no recurring_expense_id count toward nothing, and nothing throws", () => {
    const template = makeTemplate({
      id: "tmpl-berna",
      description: "Berna",
      category: "salaries",
      frequency: "biweekly",
      amount: null,
      start_date: "2026-01-01",
    });
    const windowStart = parseDateUTC("2026-03-01");
    const windowEnd = parseDateUTC("2026-03-31");
    const expenses: Expense[] = [
      // Legacy row: same category/description as the template, but no FK —
      // the pre-D7 text-based match would have counted this; the FK match
      // must not.
      makeExpense({ date: "2026-03-05", category: "salaries", amount: 180000, description: "Berna" }),
    ];

    expect(() => paydayProgressFor(template, expenses, windowStart, windowEnd)).not.toThrow();
    expect(paydayProgressFor(template, expenses, windowStart, windowEnd).loaded).toBe(0);
  });

  it("an undefined expenses array returns loaded: 0, never throws", () => {
    const template = makeTemplate({
      id: "tmpl-berna",
      description: "Berna",
      category: "salaries",
      frequency: "biweekly",
      amount: null,
      start_date: "2026-01-01",
    });
    const windowStart = parseDateUTC("2026-03-01");
    const windowEnd = parseDateUTC("2026-03-31");

    expect(() => paydayProgressFor(template, undefined, windowStart, windowEnd)).not.toThrow();
    expect(paydayProgressFor(template, undefined, windowStart, windowEnd).loaded).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// 3.16 (PR3, C4 — already-true invariant, rule 9 regression pin) —
// RecurringExpense never carries supply_id/quantity, for category
// "supplies" too. Zero production lines change here; the assertion itself
// is the deliverable.
// ---------------------------------------------------------------------------
describe("RecurringExpense — never carries supply_id/quantity, including category 'supplies' (C4)", () => {
  it("a RecurringExpense literal for category 'supplies' has no supply_id or quantity key", () => {
    const template: RecurringExpense = {
      id: "tmpl-supplies",
      amount: 12000,
      category: "supplies",
      description: "Insumo fijo mensual",
      frequency: "monthly",
      start_date: "2026-01-01",
      end_date: null,
      created_at: "2026-01-01T00:00:00.000Z",
    };

    expect("supply_id" in template).toBe(false);
    expect("quantity" in template).toBe(false);

    // Compile-time pin: RecurringExpense's type must NOT declare these keys.
    // If a future edit ever adds them, this assignment stops needing the
    // @ts-expect-error below and `tsc --noEmit` fails on an unused
    // directive — turning the regression into a build error, not just a
    // missed runtime assertion.
    // @ts-expect-error — RecurringExpense has no supply_id field, on purpose.
    const _neverCompiles: RecurringExpense["supply_id"] = undefined;
    void _neverCompiles;
  });
});
