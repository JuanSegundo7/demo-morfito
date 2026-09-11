import type { Expense, RecurringExpense } from "@/lib/types";
import type { BusinessPreset } from "../presets/types";
import {
  generateSharedRecurringExpenses,
  paydayGrid,
  SALARY_BIWEEKLY_DESCRIPTION,
  SALARY_WEEKLY_DESCRIPTION,
  SHARED_OTHER_EXPENSE_DESCRIPTIONS,
  toUTCMidnight,
} from "../presets/shared";

// ============================================================
// Helpers — mirrors seed/orders.ts's conventions (uid/rnd/pick/addDays)
// ============================================================

let _uuid = 1;
function uid(prefix: string): string {
  const n = String(_uuid++).padStart(12, "0");
  return `${prefix}0000-0000-0000-${n}`;
}

function rnd(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function addDays(d: Date, days: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + days);
  return r;
}

function toDateOnly(d: Date): string {
  return d.toISOString().slice(0, 10);
}

// Re-exported for anything still importing these two constants from this
// module (the salary description strings themselves live in
// presets/shared.ts now — this module is just a pass-through so
// paydayProgressFor-style matching elsewhere keeps working unchanged).
export { SALARY_BIWEEKLY_DESCRIPTION, SALARY_WEEKLY_DESCRIPTION };

export function generateSeedRecurringExpenses(today: Date): RecurringExpense[] {
  return generateSharedRecurringExpenses(today);
}

// ============================================================
// One-off expenses — anchored to the SAME 120-day window as
// generateSeedOrders() (seed/orders.ts). Using a different window here
// means the default reporting period reads zero gastos even though orders
// exist for that period — the single most common way to ship a demo that
// "looks empty" on first load.
// ============================================================

export interface SeedExpenseData {
  expenses: Expense[];
  recurring_expenses: RecurringExpense[];
}

export function generateSeedExpenses(preset: BusinessPreset): SeedExpenseData {
  const today = new Date();
  today.setHours(12, 0, 0, 0);

  const recurring_expenses = generateSharedRecurringExpenses(today);
  const expenses: Expense[] = [];

  // Purchasable supplies — preset.purchasableSupplies (ids) resolved back
  // to {id, costPerUnit, unit} against preset.supplies. Replaces today's
  // hand-copied PURCHASABLE_SUPPLIES array.
  const suppliesById = new Map(preset.supplies.map((s) => [s.id, s]));
  const purchasableSupplies = preset.purchasableSupplies
    .map((id) => suppliesById.get(id))
    .filter((s): s is NonNullable<typeof s> => !!s)
    .map((s) => ({ id: s.id, costPerUnit: Number(s.cost_per_unit), unit: s.unit }));

  const supplyPurchaseDescriptions =
    preset.expenseDescriptions.length > 0 ? preset.expenseDescriptions : ["Compra de insumos"];

  // ── Supplies purchases: ~3/week, ~40% linked to a supply_id+quantity ──
  for (let daysAgo = 120; daysAgo >= 0; daysAgo--) {
    const day = addDays(today, -daysAgo);
    // Roughly 3-per-week without hardcoding a weekly cursor: each day has
    // a 3/7 chance of a purchase.
    if (Math.random() >= 3 / 7) continue;

    const linked = purchasableSupplies.length > 0 && Math.random() < 0.4;
    if (linked) {
      const supply = pick(purchasableSupplies);
      const quantity =
        supply.unit === "kg" || supply.unit === "l"
          ? rnd(3, 15)
          : supply.unit === "g" || supply.unit === "ml"
            ? rnd(200, 2000)
            : rnd(20, 120); // unidad / fetas
      const amount = Math.round(quantity * supply.costPerUnit);
      expenses.push({
        id: uid("ex"),
        date: toDateOnly(day),
        amount,
        category: "supplies",
        description: pick(supplyPurchaseDescriptions),
        created_at: toDateOnly(day) + "T09:00:00Z",
        supply_id: supply.id,
        quantity,
      });
    } else {
      expenses.push({
        id: uid("ex"),
        date: toDateOnly(day),
        amount: rnd(15, 60) * 1000,
        category: "supplies",
        description: pick(supplyPurchaseDescriptions),
        created_at: toDateOnly(day) + "T09:00:00Z",
        supply_id: null,
        quantity: null,
      });
    }
  }

  // ── Salary one-off payments — one per payday, on the template's OWN
  // cadence grid (anchored to its start_date, not to an arbitrary
  // "daysAgo -= N" loop) — otherwise a template whose interval doesn't
  // evenly divide 120 (7 doesn't; 15 does) drifts out of phase with
  // paydayProgressFor's own grid and "loaded" ends up ≠ "expected" by one.
  // Each pushed expense carries `recurring_expense_id` pointing at its own
  // template (design D6/D7) — paydayProgressFor matches on that FK, never on
  // description, so this is the link that makes "N de M pagos cargados" read
  // correctly from the very first seed load. ──
  const windowStart = toUTCMidnight(addDays(today, -120));
  const windowEnd = toUTCMidnight(today);
  const berna = recurring_expenses.find((t) => t.description === SALARY_BIWEEKLY_DESCRIPTION)!;
  const nahuel = recurring_expenses.find((t) => t.description === SALARY_WEEKLY_DESCRIPTION)!;

  for (const day of paydayGrid(berna.start_date, 15, windowStart, windowEnd)) {
    expenses.push({
      id: uid("ex"),
      date: toDateOnly(day),
      amount: 180000,
      category: "salaries",
      description: SALARY_BIWEEKLY_DESCRIPTION,
      created_at: toDateOnly(day) + "T10:00:00Z",
      supply_id: null,
      quantity: null,
      recurring_expense_id: berna.id,
    });
  }
  for (const day of paydayGrid(nahuel.start_date, 7, windowStart, windowEnd)) {
    expenses.push({
      id: uid("ex"),
      date: toDateOnly(day),
      amount: 85000,
      category: "salaries",
      description: SALARY_WEEKLY_DESCRIPTION,
      created_at: toDateOnly(day) + "T10:00:00Z",
      supply_id: null,
      quantity: null,
      recurring_expense_id: nahuel.id,
    });
  }

  // ── A handful of services/other one-offs, spread across the window ──
  for (let i = 0; i < 8; i++) {
    const day = addDays(today, -rnd(0, 120));
    const entry = pick(SHARED_OTHER_EXPENSE_DESCRIPTIONS);
    expenses.push({
      id: uid("ex"),
      date: toDateOnly(day),
      amount: rnd(5, 40) * 1000,
      category: entry.category,
      description: entry.description,
      created_at: toDateOnly(day) + "T11:00:00Z",
      supply_id: null,
      quantity: null,
    });
  }

  return { expenses, recurring_expenses };
}
