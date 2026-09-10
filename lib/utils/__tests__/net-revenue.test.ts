// Non-regression tests for the D3 guard (commission stays an operand of
// netRevenue, and the ledger keeps its commission row) — see
// .atl/sdd/reconciliar-finanzas-demo/{spec,design,tasks}.md, Phase 1 (PR1),
// Domain 1 (revenue-analytics) and Domain 2 (daily-ledger).
//
// This exercises the REAL `useOrdersAnalytics` hook end-to-end against the
// demo's mock Supabase client (lib/demo/mock-supabase.ts, a synchronous
// in-RAM shim over the Zustand store in lib/demo/store.ts) — not a
// reimplementation of the formula. Zero production lines change in this PR.
//
// IMPORTANT — arithmetic correction vs. the literal numbers in
// tasks.md task 1.8 / spec.md Domain 1's scenario: both state
// "totalRevenue=90000, expensesTotal=20000, commissionTotal=10000 =>
// netRevenue=70000". That is an arithmetic error inherited from spec.md
// (90000 - 20000 - 10000 = 60000, not 70000) — design.md's own Domain 2
// rule-4 scenario, using the SAME fixture, correctly computes
// "netRevenue = 90000 - 20000 - 10000 = 60000" and explicitly calls out
// 70000 as the WRONG value a future regression (dropping the commission
// operand) would produce. This file asserts the mathematically correct
// value (60000, verified below against the real hook) and treats 70000 as
// the regression guard, not the target. See the apply-progress report.
import { describe, it, expect, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import { useOrdersAnalytics } from "@/lib/hooks/orders/use-orders-history";
import { useDemoStore } from "@/lib/demo/store";
import { expandRecurringExpenses, parseDateUTC } from "@/lib/utils/expenses";
import type { Order, Expense, RecurringExpense } from "@/lib/types";

// ---------------------------------------------------------------------------
// Wrapper (no JSX — this file keeps the .test.ts extension tasks.md names)
// ---------------------------------------------------------------------------

function createWrapper() {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: qc }, children);
}

// ---------------------------------------------------------------------------
// Fixture helpers
// ---------------------------------------------------------------------------

function makeOrder(overrides: Partial<Order> & Pick<Order, "total_amount" | "updated_at">): Order {
  return {
    id: crypto.randomUUID(),
    order_number: 1,
    customer_id: null,
    customer_name: "Cliente demo",
    customer_address_id: null,
    status: "completed",
    is_paid: true,
    delivery_type: "pickup",
    delivery_fee: 0,
    payment_method: "cash",
    delivery_time: null,
    discount_type: null,
    discount_value: 0,
    discount_amount: 0,
    source: null,
    commission_amount: 0,
    commission_rate: null,
    price_adjustment: 0,
    notes: null,
    created_at: overrides.updated_at,
    ...overrides,
  };
}

function makeExpense(overrides: Partial<Expense> & Pick<Expense, "amount" | "date" | "category">): Expense {
  return {
    id: crypto.randomUUID(),
    description: null,
    created_at: `${overrides.date}T00:00:00.000Z`,
    ...overrides,
  };
}

function makeRecurringTemplate(
  overrides: Partial<RecurringExpense> = {}
): RecurringExpense {
  return {
    id: crypto.randomUUID(),
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

// A custom two-day AR-local period: 2026-03-01 and 2026-03-02.
// `from`/`to` are picked at midday UTC so the AR-local (UTC-3) calendar date
// is unambiguous. See lib/utils/date-ar.ts for the TZ conversion this relies
// on (already exercised, unmodified, by this PR).
const PERIOD = {
  selectedDate: new Date("2026-03-01T12:00:00.000Z"),
  customRange: {
    from: new Date("2026-03-01T15:00:00.000Z"),
    to: new Date("2026-03-02T15:00:00.000Z"),
  },
};

function resetStore() {
  useDemoStore.setState({
    orders: [],
    order_items: [],
    order_item_extras: [],
    external_income: [],
    expenses: [],
    recurring_expenses: [],
    customers: [],
    customer_addresses: [],
  });
}

async function runAnalytics() {
  const { result } = renderHook(
    () => useOrdersAnalytics(PERIOD.selectedDate, "custom", PERIOD.customRange),
    { wrapper: createWrapper() }
  );
  await waitFor(() => expect(result.current.isSuccess).toBe(true));
  return result.current.data!;
}

beforeEach(() => {
  resetStore();
});

// ---------------------------------------------------------------------------
// Rules 1 & 4 (non-regression, D3) — the spec's concrete fixture
// ---------------------------------------------------------------------------
describe("useOrdersAnalytics — netRevenue keeps subtracting commission (D3 non-regression)", () => {
  it("totalRevenue=90000 (gross), expensesTotal=20000, commissionTotal=10000 => netRevenue=60000, not 70000 or 80000", async () => {
    // Day 1 (2026-03-01): one local order (50000) + one PedidosYa order,
    // gross total_amount=20000, commission_amount=5000 (25%) — the order's
    // total_amount is NOT reduced by its own commission (finding 3).
    // Day 2 (2026-03-02): one PedidosYa order, gross total_amount=20000,
    // commission_amount=5000.
    // totalRevenue = 50000 + 20000 + 20000 = 90000 (gross, commission never
    // deducted upstream). commissionTotal = 5000 + 5000 = 10000.
    const orders: Order[] = [
      makeOrder({
        total_amount: 50000,
        updated_at: "2026-03-01T15:00:00.000Z",
        source: "local",
        commission_amount: 0,
      }),
      makeOrder({
        total_amount: 20000,
        updated_at: "2026-03-01T18:00:00.000Z",
        source: "pedidosya",
        commission_amount: 5000,
        commission_rate: 25,
      }),
      makeOrder({
        total_amount: 20000,
        updated_at: "2026-03-02T15:00:00.000Z",
        source: "pedidosya",
        commission_amount: 5000,
        commission_rate: 25,
      }),
    ];
    // One-off expense, 20000, on day 1 — no recurring templates, so
    // expensesTotal is exactly this (periodExpensesTotal + 0 recurring).
    const expenses: Expense[] = [
      makeExpense({ amount: 20000, date: "2026-03-01", category: "supplies", description: "Insumos varios" }),
    ];

    useDemoStore.setState({ orders, expenses, recurring_expenses: [] });

    const data = await runAnalytics();

    expect(data.totalRevenue).toBe(90000);
    expect(data.expensesTotal).toBe(20000);
    expect(data.commissionTotal).toBe(10000);
    // The formula: netRevenue = totalRevenue - expensesTotal - commissionTotal.
    expect(data.netRevenue).toBe(60000);
    // Explicit regression guards:
    // 70000 = 90000 - 20000, i.e. commission NOT subtracted at all — the
    // reverted D1 behavior this test exists to catch if it ever comes back.
    expect(data.netRevenue).not.toBe(70000);
    // 80000 = 90000 - 20000 + 10000, i.e. commission wrongly added back.
    expect(data.netRevenue).not.toBe(80000);

    // Rule 4: the ledger's last running balance agrees with netRevenue —
    // both sides subtract commission exactly once.
    const lastRow = data.ledger[data.ledger.length - 1];
    expect(lastRow.balance).toBe(data.netRevenue);
    expect(lastRow.balance).toBe(60000);
  });
});

// ---------------------------------------------------------------------------
// Rule 2 (non-regression, D3) — per-day commission ledger rows
// ---------------------------------------------------------------------------
describe("useOrdersAnalytics — the ledger keeps its per-day commission debit rows (D3 non-regression)", () => {
  it("commission on two distinct days produces two 'Comisión PedidosYa' rows, kind=expense, isProrated=false", async () => {
    const orders: Order[] = [
      makeOrder({
        total_amount: 20000,
        updated_at: "2026-03-01T18:00:00.000Z",
        source: "pedidosya",
        commission_amount: 5000,
      }),
      makeOrder({
        total_amount: 20000,
        updated_at: "2026-03-02T15:00:00.000Z",
        source: "pedidosya",
        commission_amount: 5000,
      }),
    ];
    useDemoStore.setState({ orders, expenses: [], recurring_expenses: [] });

    const data = await runAnalytics();

    const commissionRows = data.ledger.filter((row) => row.concept === "Comisión PedidosYa");
    expect(commissionRows).toHaveLength(2);
    expect(commissionRows.map((r) => r.date).sort()).toEqual(["2026-03-01", "2026-03-02"]);
    for (const row of commissionRows) {
      expect(row.kind).toBe("expense");
      expect(row.isProrated).toBe(false);
      expect(row.amount).toBe(5000);
    }
  });

  it("a commission-free period produces no commission row — never a zero-amount placeholder", async () => {
    const orders: Order[] = [
      makeOrder({
        total_amount: 30000,
        updated_at: "2026-03-01T15:00:00.000Z",
        source: "local",
        commission_amount: 0,
      }),
    ];
    useDemoStore.setState({ orders, expenses: [], recurring_expenses: [] });

    const data = await runAnalytics();

    const commissionRows = data.ledger.filter((row) => row.concept === "Comisión PedidosYa");
    expect(commissionRows).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// Rule 3 — sum(ledger where kind === "expense") === expensesTotal + commissionTotal
// ---------------------------------------------------------------------------
describe("useOrdersAnalytics — ledger expense rows sum to expensesTotal + commissionTotal (rule 3)", () => {
  it("one-off expenses (20000) + commission rows (10000) sum to 30000, not expensesTotal alone", async () => {
    const orders: Order[] = [
      makeOrder({
        total_amount: 50000,
        updated_at: "2026-03-01T15:00:00.000Z",
        source: "local",
        commission_amount: 0,
      }),
      makeOrder({
        total_amount: 20000,
        updated_at: "2026-03-01T18:00:00.000Z",
        source: "pedidosya",
        commission_amount: 5000,
      }),
      makeOrder({
        total_amount: 20000,
        updated_at: "2026-03-02T15:00:00.000Z",
        source: "pedidosya",
        commission_amount: 5000,
      }),
    ];
    const expenses: Expense[] = [
      makeExpense({ amount: 20000, date: "2026-03-01", category: "supplies" }),
    ];
    useDemoStore.setState({ orders, expenses, recurring_expenses: [] });

    const data = await runAnalytics();

    const sumExpenseRows = data.ledger
      .filter((row) => row.kind === "expense")
      .reduce((acc, row) => acc + row.amount, 0);

    expect(sumExpenseRows).toBe(30000); // expensesTotal (20000) + commissionTotal (10000)
    expect(sumExpenseRows).not.toBe(data.expensesTotal); // NOT expensesTotal (20000) alone
    expect(sumExpenseRows).toBe(data.expensesTotal + data.commissionTotal);
  });
});

// ---------------------------------------------------------------------------
// PR2 (C7/D1/D2) — grouped vs per-day recurring proration agree; the review
// contract is that no total moves, only the ledger's row shape changes.
// ---------------------------------------------------------------------------
describe("useOrdersAnalytics — per-day prorated ledger rows agree with the pre-PR2 grouped totals (D2 review contract)", () => {
  it("expensesTotal, expensesByCategory, commissionTotal and netRevenue match the grouped shape within 1e-9; only ledger row count/dates differ", async () => {
    const template = makeRecurringTemplate({
      id: "tmpl-alquiler",
      description: "Alquiler local",
      amount: 3100,
      category: "rent",
      frequency: "monthly",
      start_date: "2026-01-01",
      end_date: null,
    });
    const orders: Order[] = [
      makeOrder({
        total_amount: 50000,
        updated_at: "2026-03-01T15:00:00.000Z",
        source: "local",
        commission_amount: 0,
      }),
      makeOrder({
        total_amount: 20000,
        updated_at: "2026-03-02T15:00:00.000Z",
        source: "pedidosya",
        commission_amount: 5000,
      }),
    ];
    const expenses: Expense[] = [
      makeExpense({ amount: 20000, date: "2026-03-01", category: "supplies" }),
    ];
    useDemoStore.setState({ orders, expenses, recurring_expenses: [template] });

    const data = await runAnalytics();

    // Independently recomputed via the still-exported grouped
    // `expandRecurringExpenses`, over the same calendar bounds the hook
    // derives internally from the custom range (2026-03-01..02, AR-local).
    const periodStart = parseDateUTC("2026-03-01");
    const periodEnd = parseDateUTC("2026-03-02");
    const grouped = expandRecurringExpenses([template], periodStart, periodEnd);
    const groupedRecurringTotal = grouped.reduce((acc, a) => acc + a.amount, 0);
    const expectedExpensesTotal = 20000 + groupedRecurringTotal;

    expect(Math.abs(data.expensesTotal - expectedExpensesTotal)).toBeLessThan(1e-9);
    expect(Math.abs(data.expensesByCategory.rent - groupedRecurringTotal)).toBeLessThan(1e-9);
    expect(data.expensesByCategory.supplies).toBe(20000);
    expect(data.commissionTotal).toBe(5000);

    const expectedNetRevenue = 70000 - expectedExpensesTotal - 5000;
    expect(Math.abs(data.netRevenue - expectedNetRevenue)).toBeLessThan(1e-9);

    // Review contract: one prorated row PER DAY (1 template x 2 days = 2
    // rows), dated the actual day — never a single lump at `endDateStr`.
    const proratedRows = data.ledger.filter((row) => row.isProrated);
    expect(proratedRows).toHaveLength(2);
    expect(proratedRows.map((r) => r.date).sort()).toEqual(["2026-03-01", "2026-03-02"]);
    for (const row of proratedRows) {
      expect(row.concept).toBe("Alquiler local");
    }

    // Rule 4, re-run against the new per-day ledger shape: the last row's
    // running balance still equals netRevenue exactly.
    const lastRow = data.ledger[data.ledger.length - 1];
    expect(lastRow.balance).toBe(data.netRevenue);
  });
});

// ---------------------------------------------------------------------------
// PR2 — zero-amount allocations emit no row; a fully empty period emits []
// ---------------------------------------------------------------------------
describe("useOrdersAnalytics — zero-amount and empty-period guards (PR2)", () => {
  it("a recurring template with amount 0 contributes no prorated ledger row", async () => {
    const zeroTemplate = makeRecurringTemplate({
      id: "tmpl-zero",
      description: "Plantilla en cero",
      amount: 0,
      category: "other",
      frequency: "monthly",
      start_date: "2026-01-01",
      end_date: null,
    });
    useDemoStore.setState({ orders: [], expenses: [], recurring_expenses: [zeroTemplate] });

    const data = await runAnalytics();

    expect(data.ledger.filter((row) => row.isProrated)).toHaveLength(0);
    expect(data.expensesByCategory.other).toBe(0);
  });

  it("an entirely empty period (no orders, expenses or templates) produces an empty ledger", async () => {
    useDemoStore.setState({ orders: [], expenses: [], recurring_expenses: [] });

    const data = await runAnalytics();

    expect(data.ledger).toEqual([]);
    expect(data.netRevenue).toBe(0);
  });
});
