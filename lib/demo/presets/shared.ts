// Domain-neutral seed data — plan "Diseño" §2, "compartido" column:
// customers/addresses, salary templates + payday grid, and the "otros"
// expense descriptions (gestoría, reparaciones) are the same regardless of
// business type. Kept here so seed/expenses.ts (per-preset generator) and
// seed/customers.ts (already neutral, re-exported unchanged) both read from
// one place instead of each preset re-declaring them.

import type { Customer, CustomerAddress, ExpenseCategory, RecurringExpense } from "@/lib/types";
import { SEED_CUSTOMERS, SEED_CUSTOMER_ADDRESSES } from "../seed/customers";
import { parseDateUTC, walkOccurrenceGrid } from "@/lib/utils/expenses";

export { SEED_CUSTOMERS, SEED_CUSTOMER_ADDRESSES };
export type { Customer, CustomerAddress };

// ─── "Otros" one-off expense descriptions (shared, category-tagged) ──────
// gestoría, reparaciones, cartelería — none of this is rubro-specific.
export const SHARED_OTHER_EXPENSE_DESCRIPTIONS: { category: ExpenseCategory; description: string }[] = [
  { category: "services", description: "Reparación de heladera" },
  { category: "services", description: "Service de freidora" },
  { category: "other", description: "Compra de mantelería y descartables" },
  { category: "other", description: "Cartelería y merchandising" },
  { category: "supplies", description: "Compra de servilletas y descartables" },
  { category: "other", description: "Gestoría contable" },
];

// ─── Salary templates + payday grid ────────────────────────────────────────
// Weekly/biweekly templates are informational-only (amount: null) — see
// lib/utils/expenses.ts's isInformationalPaydayTemplate. The one-off
// "salaries" payments generated in seed/expenses.ts MUST reuse these exact
// `description` strings: paydayProgressFor matches by description equality,
// not by id.
export const SALARY_BIWEEKLY_DESCRIPTION = "Berna";
export const SALARY_WEEKLY_DESCRIPTION = "Nahuel";

function toDateOnly(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function addDays(d: Date, days: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + days);
  return r;
}

let _rxUuid = 1;
function rxId(): string {
  const n = String(_rxUuid++).padStart(12, "0");
  return `rx000000-0000-0000-${n}`;
}

// Rent + services + salary templates — identical across every business
// type today (plan §2: "plantillas de sueldos y la grilla de días de pago"
// is compartido). Includes one CLOSED template ("Rocío") so the "Cerrado
// el…" badge has something to render.
export function generateSharedRecurringExpenses(today: Date): RecurringExpense[] {
  const start = addDays(today, -150); // predates the 120-day order window
  const closedStart = addDays(today, -220);
  const closedEnd = addDays(today, -70);

  return [
    {
      id: rxId(),
      amount: 450000,
      category: "rent",
      description: "Alquiler local",
      frequency: "monthly",
      start_date: toDateOnly(start),
      end_date: null,
      created_at: toDateOnly(start) + "T00:00:00Z",
    },
    {
      id: rxId(),
      amount: 65000,
      category: "services",
      description: "Internet y servicios",
      frequency: "monthly",
      start_date: toDateOnly(start),
      end_date: null,
      created_at: toDateOnly(start) + "T00:00:00Z",
    },
    {
      id: rxId(),
      amount: null,
      category: "salaries",
      description: SALARY_BIWEEKLY_DESCRIPTION,
      frequency: "biweekly",
      start_date: toDateOnly(start),
      end_date: null,
      created_at: toDateOnly(start) + "T00:00:00Z",
    },
    {
      id: rxId(),
      amount: null,
      category: "salaries",
      description: SALARY_WEEKLY_DESCRIPTION,
      frequency: "weekly",
      start_date: toDateOnly(start),
      end_date: null,
      created_at: toDateOnly(start) + "T00:00:00Z",
    },
    {
      id: rxId(),
      amount: null,
      category: "salaries",
      description: "Rocío",
      frequency: "weekly",
      start_date: toDateOnly(closedStart),
      end_date: toDateOnly(closedEnd),
      created_at: toDateOnly(closedStart) + "T00:00:00Z",
    },
  ];
}

// Same grid walk as lib/utils/expenses.ts's walkOccurrenceGrid — every
// `intervalDays` days starting from `anchorDate`, clamped to [windowStart,
// windowEnd] — reused directly (that util is ported now) so the one-off
// "salary paid" rows land on EXACTLY the dates paydayProgressFor looks for.
export function paydayGrid(anchorDateStr: string, intervalDays: number, windowStart: Date, windowEnd: Date): Date[] {
  return walkOccurrenceGrid(parseDateUTC(anchorDateStr), intervalDays, windowStart, windowEnd);
}

// UTC-midnight of the same calendar date `d` falls on locally — paydayGrid
// does pure day-count math, so both ends of its window must be on the same
// "midnight" convention as the anchor it parses from a YYYY-MM-DD string.
export function toUTCMidnight(d: Date): Date {
  return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
}
