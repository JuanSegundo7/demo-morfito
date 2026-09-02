"use client";

import { create } from "zustand";
import type {
  Burger,
  Extra,
  Customer,
  CustomerAddress,
  Order,
  OrderItem,
  OrderItemExtra,
  ExternalIncome,
  Supply,
  BurgerSupply,
  ExtraSupply,
  Expense,
  RecurringExpense,
} from "@/lib/types";
import type { SeedCombo, SeedComboSlot, SeedComboSlotRule } from "./seed/combos";
import { SEED_CUSTOMERS, SEED_CUSTOMER_ADDRESSES, generateSeedOrders, generateSeedExpenses } from "./seed";
import { getActivePreset } from "./presets/resolve";
import { getPreset } from "./presets/registry";
import type { PresetId } from "./presets/ids";
import type { BusinessPreset } from "./presets/types";
import type { SeedOrderData } from "./seed/orders";
import type { SeedExpenseData } from "./seed/expenses";

// SSR-empty guard (presets plan, "Diseño" §4 / "Riesgo verificado"): this
// module is "use client" but still gets evaluated during prerender. Seeding
// at module scope means that data is shared across every request the
// server process handles — it can't depend on one request's preset cookie.
// Today no seeded data reaches the first paint (every consumer is a client
// component with no prefetch/HydrationBoundary), so this was already
// harmless — this guard makes it an explicit, enforced contract instead of
// an accident: on the server, every table seeds EMPTY, no preset is built,
// and neither generator runs (skips 120 days of order/expense generation
// on every server request, for free). On the client, the active preset
// (resolve.ts, cookie-driven) seeds everything as before.
const isServer = typeof window === "undefined";

const EMPTY_ORDER_DATA: SeedOrderData = { orders: [], order_items: [], order_item_extras: [], external_income: [] };
const EMPTY_EXPENSE_DATA: SeedExpenseData = { expenses: [], recurring_expenses: [] };

// All 15 seeded tables (everything except the two always-transient ones,
// order_stock_movements and _nextOrderNumber's own bookkeeping) as a single
// pure function of a preset (or null for the SSR-empty case). Shared
// between module-eval (below) and the reseed() store action (Phase 3) so
// there is exactly one place that knows how to turn a BusinessPreset into
// seed rows.
function createSeedTables(preset: BusinessPreset | null) {
  const orderData = preset ? generateSeedOrders(preset) : EMPTY_ORDER_DATA;
  const expenseData = preset ? generateSeedExpenses(preset) : EMPTY_EXPENSE_DATA;

  return {
    burgers: preset?.burgers ?? [],
    extras: preset?.extras ?? [],
    combos: preset?.combos ?? [],
    combo_slots: preset?.comboSlots ?? [],
    combo_slots_rules: preset?.comboSlotRules ?? [],
    customers: preset ? SEED_CUSTOMERS : [],
    customer_addresses: preset ? SEED_CUSTOMER_ADDRESSES : [],
    supplies: preset?.supplies ?? [],
    burger_supplies: preset?.burgerSupplies ?? [],
    extra_supplies: preset?.extraSupplies ?? [],
    orders: orderData.orders,
    order_items: orderData.order_items,
    order_item_extras: orderData.order_item_extras,
    external_income: orderData.external_income,
    expenses: expenseData.expenses,
    recurring_expenses: expenseData.recurring_expenses,
  };
}

// Math.max(...[]) === -Infinity on an empty orders array (SSR, or a preset
// with zero seeded orders) — fall back to 1 instead.
function nextOrderNumberFor(orders: Order[]): number {
  return orders.length > 0 ? Math.max(...orders.map((o) => o.order_number)) + 1 : 1;
}

const activePreset = isServer ? null : getActivePreset();
const initialSeed = createSeedTables(activePreset);

const SEED_BURGERS = initialSeed.burgers;
const SEED_EXTRAS = initialSeed.extras;
const SEED_COMBOS = initialSeed.combos;
const SEED_COMBO_SLOTS = initialSeed.combo_slots;
const SEED_COMBO_SLOT_RULES = initialSeed.combo_slots_rules;
const SEED_SUPPLIES = initialSeed.supplies;
const SEED_BURGER_SUPPLIES = initialSeed.burger_supplies;
const SEED_EXTRA_SUPPLIES = initialSeed.extra_supplies;

const SEED_CUSTOMERS_ROWS = initialSeed.customers;
const SEED_CUSTOMER_ADDRESSES_ROWS = initialSeed.customer_addresses;

const SEED_ORDERS = initialSeed.orders;
const SEED_ORDER_ITEMS = initialSeed.order_items;
const SEED_ORDER_ITEM_EXTRAS = initialSeed.order_item_extras;
const SEED_EXTERNAL_INCOME = initialSeed.external_income;

const SEED_EXPENSES = initialSeed.expenses;
const SEED_RECURRING_EXPENSES = initialSeed.recurring_expenses;

// Not part of lib/types — this table is internal to the demo/app, it never
// existed as a jebbs interface (jebbs reads/writes it structurally through
// the Supabase client only). Mirrors scripts/015-order-stock-movements.sql:
// `quantity` here is ALWAYS POSITIVE ("amount subtracted"), never a signed
// delta — the direction (deduct vs. reverse) is implied by which operation
// is running, not by the sign of this column.
export interface DemoOrderStockMovement {
  id: string;
  order_id: string;
  supply_id: string;
  quantity: number;
  created_at: string;
}

// ============================================================
// Types
// ============================================================

// keep in sync with lib/demo/mock-supabase.ts's TableName
type TableName =
  | "burgers"
  | "extras"
  | "combos"
  | "combo_slots"
  | "combo_slots_rules"
  | "customers"
  | "customer_addresses"
  | "orders"
  | "order_items"
  | "order_item_extras"
  | "external_income"
  | "supplies"
  | "burger_supplies"
  | "extra_supplies"
  | "expenses"
  | "recurring_expenses"
  | "order_stock_movements";

interface DemoStore {
  // Tables
  burgers: Burger[];
  extras: Extra[];
  combos: SeedCombo[];
  combo_slots: SeedComboSlot[];
  combo_slots_rules: SeedComboSlotRule[];
  customers: Customer[];
  customer_addresses: CustomerAddress[];
  orders: Order[];
  order_items: OrderItem[];
  order_item_extras: OrderItemExtra[];
  external_income: ExternalIncome[];
  supplies: Supply[];
  burger_supplies: BurgerSupply[];
  extra_supplies: ExtraSupply[];
  expenses: Expense[];
  recurring_expenses: RecurringExpense[];
  // Always empty at seed time — populated at runtime as orders complete
  // (applyOrderStockDeduction) and reversed as they un-complete
  // (reverseOrderStockDeduction). See DemoOrderStockMovement above.
  order_stock_movements: DemoOrderStockMovement[];

  _nextOrderNumber: number;

  // Primitive mutations used by the mock Supabase builder
  insertRow(table: TableName, data: Record<string, unknown>): Record<string, unknown>;
  updateRow(table: TableName, id: string, patch: Record<string, unknown>): void;
  deleteRow(table: TableName, id: string): void;
  deleteRowsWhere(table: TableName, col: string, val: unknown): void;

  // Print modal state
  printModalOrderId: string | null;
  openPrintModal(orderId: string): void;
  closePrintModal(): void;

  // Demo order generator
  generatorEnabled: boolean;
  setGeneratorEnabled(v: boolean): void;

  // Guided tour
  tourActive: boolean;
  tourStep: number;
  tourCompleted: boolean;
  startTour(): void;
  skipTour(): void;
  nextTourStep(): void;
  prevTourStep(): void;

  // Wizard control for tour
  wizardTourOpen: boolean;
  wizardTourForceStep: string | null;
  setWizardTourState(open: boolean, step: string | null): void;

  // Bumped by reseed() so components that hold their own transient UI state
  // referencing row ids (the order wizard, details/payment dialogs — all
  // local useState in orders-dashboard.tsx, not store state) can close
  // themselves on change. See <PresetSwitcher>.
  resetSignal: number;

  // Rebuilds all 15 seeded tables from `presetId`, resets the transient
  // state that would otherwise reference stale ids, and bumps resetSignal.
  // Lets <PresetSwitcher> swap business verticals live, without a reload.
  reseed(presetId: PresetId): void;
}

// ============================================================
// Store
// ============================================================

export const useDemoStore = create<DemoStore>((set, get) => ({
  burgers: SEED_BURGERS,
  extras: SEED_EXTRAS,
  combos: SEED_COMBOS,
  combo_slots: SEED_COMBO_SLOTS,
  combo_slots_rules: SEED_COMBO_SLOT_RULES,
  customers: SEED_CUSTOMERS_ROWS,
  customer_addresses: SEED_CUSTOMER_ADDRESSES_ROWS,
  orders: SEED_ORDERS,
  order_items: SEED_ORDER_ITEMS,
  order_item_extras: SEED_ORDER_ITEM_EXTRAS,
  external_income: SEED_EXTERNAL_INCOME,
  supplies: SEED_SUPPLIES,
  burger_supplies: SEED_BURGER_SUPPLIES,
  extra_supplies: SEED_EXTRA_SUPPLIES,
  expenses: SEED_EXPENSES,
  recurring_expenses: SEED_RECURRING_EXPENSES,
  order_stock_movements: [],

  _nextOrderNumber: nextOrderNumberFor(SEED_ORDERS),

  insertRow(table, data) {
    const id  = crypto.randomUUID();
    const now = new Date().toISOString();
    const row: Record<string, unknown> = { id, created_at: now, updated_at: now, ...data };

    if (table === "orders") {
      const num = get()._nextOrderNumber;
      row.order_number = num;
      set((s) => ({ _nextOrderNumber: s._nextOrderNumber + 1 }));
    }

    set((s) => ({ [table]: [...(s[table] as unknown[]), row] }));
    return row;
  },

  updateRow(table, id, patch) {
    const now = new Date().toISOString();
    set((s) => ({
      [table]: (s[table] as unknown as Array<Record<string, unknown>>).map((r) =>
        r.id === id ? { ...r, ...patch, updated_at: now } : r,
      ),
    }));
  },

  deleteRow(table, id) {
    set((s) => ({
      [table]: (s[table] as unknown as Array<Record<string, unknown>>).filter((r) => r.id !== id),
    }));
  },

  deleteRowsWhere(table, col, val) {
    set((s) => ({
      [table]: (s[table] as unknown as Array<Record<string, unknown>>).filter((r) => r[col] !== val),
    }));
  },

  printModalOrderId: null,
  openPrintModal: (orderId) => set({ printModalOrderId: orderId }),
  closePrintModal: () => set({ printModalOrderId: null }),

  generatorEnabled: true,
  setGeneratorEnabled: (v) => set({ generatorEnabled: v }),

  tourActive: false,
  tourStep: 0,
  tourCompleted: false,
  startTour: () => set({ tourActive: true, tourStep: 0 }),
  skipTour: () => set({ tourActive: false, tourCompleted: true, wizardTourOpen: false, wizardTourForceStep: null }),
  nextTourStep: () => set((s) => ({ tourStep: s.tourStep + 1 })),
  prevTourStep: () => set((s) => ({ tourStep: Math.max(0, s.tourStep - 1) })),

  wizardTourOpen: false,
  wizardTourForceStep: null,
  setWizardTourState: (open, step) => set({ wizardTourOpen: open, wizardTourForceStep: step }),

  resetSignal: 0,

  reseed: (presetId) => {
    const preset = getPreset(presetId);
    const seed = createSeedTables(preset);
    set((s) => ({
      ...seed,
      order_stock_movements: [],
      _nextOrderNumber: nextOrderNumberFor(seed.orders),
      printModalOrderId: null,
      tourActive: false,
      tourStep: 0,
      wizardTourOpen: false,
      wizardTourForceStep: null,
      resetSignal: s.resetSignal + 1,
    }));
  },
}));
