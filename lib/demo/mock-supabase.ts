/**
 * Mock Supabase client for the demo.
 *
 * Implements the same PostgREST builder interface so every existing hook
 * works without changes. Data is stored in the Zustand DemoStore (RAM only).
 *
 * Strategy: ignore the select-string, always return "fat" objects with
 * pre-computed joins. Extra fields are silently ignored by consumers.
 */

import { useDemoStore } from "./store";
import { getActivePreset } from "./presets/resolve";

// keep in sync with lib/demo/store.ts's TableName
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

type Row = Record<string, unknown>;
type MockResult<T = any> = { data: T; error: null; count?: number | null };
type MockError    = { data: null; error: { message: string; code?: string }; count?: null };

type FilterOp = "eq" | "neq" | "gte" | "lte" | "gt" | "lt" | "ilike" | "in";

interface Filter {
  column: string;
  op: FilterOp;
  value: unknown;
}

// ============================================================
// Joins — enrich rows with related data from the store
// ============================================================

function resolveRow(row: Row, table: TableName, store: ReturnType<typeof useDemoStore.getState>): Row {
  if (table === "orders") {
    const customer = store.customers.find((c) => c.id === row.customer_id) ?? null;
    const customerAddresses = customer
      ? store.customer_addresses.filter((a) => a.customer_id === customer.id)
      : [];
    const customerAddress = store.customer_addresses.find((a) => a.id === row.customer_address_id) ?? null;

    const order_items = store.order_items
      .filter((i) => i.order_id === row.id)
      .map((item) => {
        const order_item_extras = store.order_item_extras
          .filter((e) => e.order_item_id === item.id)
          .map((ext) => ({
            ...ext,
            extras: store.extras.find((e) => e.id === ext.extra_id) ?? null,
          }));
        return {
          ...item,
          order_item_extras,
          extras: order_item_extras, // alias used by some hooks
        };
      });

    return {
      ...row,
      customer: customer ? { ...customer, customer_addresses: customerAddresses } : null,
      customer_address: customerAddress,
      customerAddress: customerAddress,
      order_items,
      items: order_items, // alias used by useOrderForEdit
    };
  }

  if (table === "order_items") {
    const burger = store.burgers.find((b) => b.id === row.burger_id) ?? null;
    const extra  = store.extras.find((e) => e.id === row.extra_id) ?? null;
    const order_item_extras = store.order_item_extras
      .filter((e) => e.order_item_id === row.id)
      .map((ext) => ({
        ...ext,
        extras: store.extras.find((e) => e.id === ext.extra_id) ?? null,
      }));

    return { ...row, burgers: burger, extras: order_item_extras, order_item_extras };
  }

  if (table === "combos") {
    const combo_slots = store.combo_slots
      .filter((s) => s.combo_id === row.id)
      .map((slot) => ({
        ...slot,
        combo_slots_rules: store.combo_slots_rules.filter((r) => r.combo_slot_id === slot.id),
      }));
    return { ...row, combo_slots };
  }

  if (table === "customers") {
    const customer_addresses = store.customer_addresses.filter((a) => a.customer_id === row.id);
    return { ...row, customer_addresses };
  }

  // use-supplies.ts:177 — useAllBurgersWithRecipes() selects
  // "*, burger_supplies(*, supply:supplies(*))". `burgers` had no join
  // branch at all before this table existed to justify one.
  if (table === "burgers") {
    const burger_supplies = store.burger_supplies
      .filter((bs) => bs.burger_id === row.id)
      .map((bs) => ({ ...bs, supply: store.supplies.find((s) => s.id === bs.supply_id) ?? null }));
    return { ...row, burger_supplies };
  }

  // use-supplies.ts:280 — useAllExtrasWithRecipes() selects
  // "*, extra_supplies(*, supply:supplies(*))". Mirrors the `burgers`
  // branch above exactly.
  if (table === "extras") {
    const extra_supplies = store.extra_supplies
      .filter((es) => es.extra_id === row.id)
      .map((es) => ({ ...es, supply: store.supplies.find((s) => s.id === es.supply_id) ?? null }));
    return { ...row, extra_supplies };
  }

  // use-supplies.ts:159 selects "*, supply:supplies(*)" (aliased) on
  // burger_supplies directly; use-order-stock.ts:133 separately selects
  // "burgers(default_meat_quantity, default_fries_quantity)" (unaliased)
  // on the SAME table. Both embeds have to come back on every row — the
  // two call sites don't know about each other's field name.
  if (table === "burger_supplies") {
    const supply = store.supplies.find((s) => s.id === row.supply_id) ?? null;
    const burgers = store.burgers.find((b) => b.id === row.burger_id) ?? null;
    return { ...row, supply, burgers };
  }

  // use-supplies.ts:259 selects "*, supply:supplies(*)" on extra_supplies —
  // same aliased shape as burger_supplies above, no unaliased sibling needed
  // (nothing embeds extra_supplies the way use-order-stock.ts embeds
  // burger_supplies).
  if (table === "extra_supplies") {
    const supply = store.supplies.find((s) => s.id === row.supply_id) ?? null;
    return { ...row, supply };
  }

  return row;
}

// ============================================================
// Query builder
// ============================================================

// Two generic slots, mirroring how postgrest-js keeps a row type separate
// from the shape a given call chain ultimately resolves to: `T` is always
// the row shape, `TResult` is what `.then()` actually hands back — `T[]`
// for a plain `.select()`, narrowed to plain `T` by `.single()` /
// `.maybeSingle()`. Without this split, every awaited call resolved to
// bare `data: T` (effectively `data: any` since nobody parametrizes
// `.from<T>()`), and `any` — unlike `any[]` — gives arrow-callback
// parameters passed to `.reduce()`/`.map()`/etc. no contextual type at
// all, so they come back as implicit `any` under `noImplicitAny`. Real
// supabase-js never hits this because its list-mode builder is typed as
// an actual array from the start.
class MockQueryBuilder<T = any, TResult = T[]> {
  private _table: TableName;
  private _filters: Filter[] = [];
  private _orFilter: string | null = null;
  // Supports chained .order("a").order("b") — Postgres (and real
  // PostgREST) applies every .order() call as a secondary sort key, but
  // this builder used to keep only the LAST one (`_orderCol` got
  // overwritten). use-supplies.ts:281-282 does exactly
  // .order("category").order("name") and expects both to hold.
  private _orders: { col: string; ascending: boolean }[] = [];
  private _limitN: number | null = null;
  private _isSingle = false;
  private _isMaybeSingle = false;
  private _isHead = false;
  private _countMode = false;

  // Mutation state
  private _insertData: Row | Row[] | null = null;
  private _updateData: Row | null = null;
  private _isDelete = false;
  private _upsertData: Row | Row[] | null = null;
  private _upsertConflict: string[] | null = null;

  constructor(table: TableName) {
    this._table = table;
  }

  // ── Query modifiers ──────────────────────────────────────────

  select(_cols?: string, opts?: { count?: string; head?: boolean }) {
    if (opts?.head) this._isHead = true;
    if (opts?.count) this._countMode = true;
    return this;
  }

  eq(col: string, val: unknown)    { this._filters.push({ column: col, op: "eq",  value: val }); return this; }
  neq(col: string, val: unknown)   { this._filters.push({ column: col, op: "neq", value: val }); return this; }
  gte(col: string, val: unknown)   { this._filters.push({ column: col, op: "gte", value: val }); return this; }
  lte(col: string, val: unknown)   { this._filters.push({ column: col, op: "lte", value: val }); return this; }
  gt(col: string, val: unknown)    { this._filters.push({ column: col, op: "gt",  value: val }); return this; }
  lt(col: string, val: unknown)    { this._filters.push({ column: col, op: "lt",  value: val }); return this; }
  ilike(col: string, pat: string)  { this._filters.push({ column: col, op: "ilike", value: pat }); return this; }
  in(col: string, vals: unknown[]) { this._filters.push({ column: col, op: "in", value: vals }); return this; }

  or(filterStr: string) { this._orFilter = filterStr; return this; }

  order(col: string, opts?: { ascending?: boolean }) {
    this._orders.push({ col, ascending: opts?.ascending ?? true });
    return this;
  }

  limit(n: number)  { this._limitN = n; return this; }
  // Return type narrows TResult from the list default (T[]) to plain T —
  // see the class-level comment on why this split exists.
  single(): MockQueryBuilder<T, T> {
    this._isSingle = true;
    return this as unknown as MockQueryBuilder<T, T>;
  }
  // Same as single() but resolves { data: null, error: null } on zero rows
  // instead of PGRST116 — use-expenses.ts:208/:298 rely on "no row" being a
  // clean, non-error result (the linked supply may have been deleted
  // independently of the expense that referenced it).
  maybeSingle(): MockQueryBuilder<T, T> {
    this._isSingle = true;
    this._isMaybeSingle = true;
    return this as unknown as MockQueryBuilder<T, T>;
  }

  // ── Mutations ────────────────────────────────────────────────

  // Insert-or-update on a (possibly composite) unique conflict target —
  // e.g. onConflict: "burger_id,supply_id". Real Postgres resolves this via
  // a UNIQUE index; here it's a linear scan comparing every column named in
  // onConflict. See _execute() below for the snapshot-freshness trap this
  // must avoid.
  upsert(data: Row | Row[], opts: { onConflict: string }) {
    const clone = new MockQueryBuilder<T>(this._table);
    clone._upsertData = data;
    clone._upsertConflict = opts.onConflict.split(",").map((c) => c.trim());
    return clone;
  }

  insert(data: Row | Row[]) {
    const clone = new MockQueryBuilder<T>(this._table);
    clone._insertData = data;
    return clone;
  }

  update(data: Row) {
    const clone = new MockQueryBuilder<T>(this._table);
    clone._updateData = data;
    clone._filters = [...this._filters];
    return clone;
  }

  delete() {
    const clone = new MockQueryBuilder<T>(this._table);
    clone._isDelete = true;
    clone._filters = [...this._filters];
    return clone;
  }

  // ── Execution ────────────────────────────────────────────────

  private _execute(): MockResult<unknown> | MockError {
    const store = useDemoStore.getState();

    // ── UPSERT ──────────────────────────────────────────────
    // use-supplies.ts:208 (onConflict: "burger_id,supply_id") and :300
    // (onConflict: "extra_id,supply_id") — insert-or-update on a composite
    // conflict target, since neither of those columns alone is unique.
    if (this._upsertData !== null) {
      const rows = Array.isArray(this._upsertData) ? this._upsertData : [this._upsertData];
      const conflictCols = this._upsertConflict ?? [];
      let lastRow: Row | null = null;

      for (const row of rows) {
        // Deliberately re-read the store INSIDE the loop, not once before
        // it (unlike INSERT below, which only calls stable actions and
        // never reads the table itself). Deciding insert-vs-update here
        // means READING store[this._table] — reusing the outer `store`
        // snapshot captured at the top of _execute() would make every row
        // after the first look for a match against data that's already
        // stale. Concretely: saving the same recipe line twice in a row
        // would insert two rows instead of updating the one just written,
        // and the bug would only show up on the SECOND save, not the first.
        const currentTable = useDemoStore.getState()[this._table] as unknown as Row[];
        const existing =
          conflictCols.length > 0
            ? currentTable.find((r) => conflictCols.every((col) => r[col] === row[col]))
            : undefined;

        if (existing) {
          store.updateRow(this._table, existing.id as string, row);
          const after = useDemoStore.getState()[this._table] as unknown as Row[];
          lastRow = after.find((r) => r.id === existing.id) ?? { ...existing, ...row };
        } else {
          lastRow = store.insertRow(this._table, row) as Row;
        }
      }

      const freshState = useDemoStore.getState();
      if (this._isSingle) {
        const enriched = resolveRow(lastRow!, this._table, freshState);
        return { data: enriched, error: null };
      }
      return { data: rows.length === 1 ? resolveRow(lastRow!, this._table, freshState) : rows, error: null };
    }

    // ── INSERT ──────────────────────────────────────────────
    if (this._insertData !== null) {
      const rows = Array.isArray(this._insertData) ? this._insertData : [this._insertData];
      let lastRow: Row | null = null;

      for (const row of rows) {
        lastRow = store.insertRow(this._table, row) as Row;
      }

      if (this._isSingle) {
        const enriched = resolveRow(lastRow!, this._table, useDemoStore.getState());
        return { data: enriched, error: null };
      }
      return { data: rows.length === 1 ? resolveRow(lastRow!, this._table, useDemoStore.getState()) : rows, error: null };
    }

    // ── UPDATE ──────────────────────────────────────────────
    if (this._updateData !== null) {
      const table = store[this._table] as unknown as Row[];
      const eqFilter = this._filters.find((f) => f.op === "eq" && f.column === "id");

      if (eqFilter) {
        store.updateRow(this._table, eqFilter.value as string, this._updateData);
      } else {
        // Update all matching rows (e.g. bulk update with eq on non-id col)
        const matching = this._applyFilters(table);
        for (const row of matching) {
          store.updateRow(this._table, row.id as string, this._updateData!);
        }
      }

      if (this._isSingle) {
        const eqId = eqFilter?.value as string | undefined;
        const fresh = useDemoStore.getState()[this._table] as unknown as Row[];
        const updated = eqId ? fresh.find((r) => r.id === eqId) : fresh[0];
        return { data: updated ? resolveRow(updated, this._table, useDemoStore.getState()) : null, error: null };
      }
      return { data: null, error: null };
    }

    // ── DELETE ──────────────────────────────────────────────
    if (this._isDelete) {
      const table = store[this._table] as unknown as Row[];
      const eqFilter = this._filters.find((f) => f.op === "eq" && f.column === "id");
      const inFilter  = this._filters.find((f) => f.op === "in"  && f.column === "id");

      if (eqFilter) {
        store.deleteRow(this._table, eqFilter.value as string);
      } else if (inFilter) {
        for (const id of inFilter.value as string[]) {
          store.deleteRow(this._table, id);
        }
      } else {
        // DELETE WHERE col = val  (e.g. delete by order_id)
        const nonIdEq = this._filters.find((f) => f.op === "eq");
        if (nonIdEq) store.deleteRowsWhere(this._table, nonIdEq.column, nonIdEq.value);
        else {
          // Delete all matching (fallback)
          const matching = this._applyFilters(table);
          for (const r of matching) store.deleteRow(this._table, r.id as string);
        }
      }
      return { data: null, error: null };
    }

    // ── SELECT ──────────────────────────────────────────────
    let rows = (store[this._table] as unknown as Row[]).slice();
    rows = this._applyFilters(rows);
    rows = rows.map((r) => resolveRow(r, this._table, store));

    // Count-only (HEAD)
    if (this._isHead) {
      return { data: null as unknown, error: null, count: rows.length };
    }

    // Order — every .order() call is a secondary sort key, in call order
    // (e.g. .order("category").order("name") sorts by category first, then
    // name within each category), matching real PostgREST/Postgres
    // ORDER BY col1, col2 semantics.
    if (this._orders.length > 0) {
      const orders = this._orders;
      rows.sort((a, b) => {
        for (const { col, ascending } of orders) {
          const av = a[col] as string;
          const bv = b[col] as string;
          if (av < bv) return ascending ? -1 : 1;
          if (av > bv) return ascending ? 1 : -1;
        }
        return 0;
      });
    }

    // Limit
    if (this._limitN !== null) rows = rows.slice(0, this._limitN);

    // Single
    if (this._isSingle) {
      if (rows.length === 0) {
        // maybeSingle(): zero rows is a clean result, not PGRST116 — the
        // caller (e.g. use-expenses.ts) treats `data: null` as "nothing to
        // do here", not as a failure to surface.
        if (this._isMaybeSingle) return { data: null, error: null };
        return { data: null, error: { message: "Row not found", code: "PGRST116" } };
      }
      return { data: rows[0], error: null };
    }

    const result: MockResult<unknown> = { data: rows, error: null };
    if (this._countMode) result.count = rows.length;
    return result;
  }

  private _applyFilters(rows: Row[]): Row[] {
    let result = rows;

    for (const f of this._filters) {
      result = result.filter((row) => {
        const val = row[f.column];
        switch (f.op) {
          case "eq":    return val === f.value;
          case "neq":   return val !== f.value;
          case "gte":   return (val as string) >= (f.value as string);
          case "lte":   return (val as string) <= (f.value as string);
          case "gt":    return (val as string) >  (f.value as string);
          case "lt":    return (val as string) <  (f.value as string);
          case "in":    return (f.value as unknown[]).includes(val);
          case "ilike": {
            const pattern = String(f.value).replace(/%/g, "").toLowerCase();
            return String(val ?? "").toLowerCase().includes(pattern);
          }
        }
      });
    }

    if (this._orFilter) {
      // Parse "col1.op.val1,col2.op.val2" — used by customer search
      const parts = this._orFilter.split(",");
      result = result.filter((row) =>
        parts.some((part) => {
          const segments = part.trim().split(".");
          const col = segments[0];
          const op  = segments[1];
          const rawVal = segments.slice(2).join("."); // handle dots in value
          const rowVal = String(row[col] ?? "").toLowerCase();
          if (op === "ilike") {
            const pattern = rawVal.replace(/%/g, "").toLowerCase();
            return rowVal.includes(pattern);
          }
          return false;
        }),
      );
    }

    return result;
  }

  // Make the builder awaitable (PromiseLike)
  then<TResult1 = MockResult<TResult>, TResult2 = never>(
    resolve: (value: MockResult<TResult>) => TResult1 | PromiseLike<TResult1>,
    reject?: (reason: unknown) => TResult2 | PromiseLike<TResult2>,
  ): Promise<TResult1 | TResult2> {
    try {
      const result = this._execute();
      return Promise.resolve(resolve(result as MockResult<TResult>));
    } catch (err) {
      if (reject) return Promise.resolve(reject(err));
      return Promise.reject(err);
    }
  }
}

// ============================================================
// Auth stub
// ============================================================

// Computed lazily (not at module eval) so it always reflects the preset the
// CURRENT cookie resolves to, not whatever was active when this module
// first loaded in the process.
function getDemoUser() {
  return {
    id: "demo-admin-00000000-0000-0000-0000",
    email: `demo@${getActivePreset().id}.com`,
    user_metadata: { role: "admin", name: "Demo Admin" },
    aud: "authenticated",
    created_at: new Date().toISOString(),
  };
}

const demoAuth = {
  getUser: async () => ({ data: { user: getDemoUser() }, error: null }),
  signInWithPassword: async () => ({ data: { user: getDemoUser(), session: { access_token: "demo" } }, error: null }),
  signOut: async () => ({ error: null }),
  onAuthStateChange: (_event: string, _cb: unknown) => ({ data: { subscription: { unsubscribe: () => {} } } }),
  admin: {
    listUsers: async () => ({ data: { users: [] }, error: null }),
    createUser: async () => ({ data: { user: null }, error: null }),
    updateUserById: async () => ({ data: { user: null }, error: null }),
  },
};

// ============================================================
// Storage stub
// ============================================================

const demoStorage = {
  from: (_bucket: string) => ({
    upload: async (_path: string, _file: unknown) => ({
      data: { path: _path },
      error: null,
    }),
    getPublicUrl: (_path: string) => ({
      data: { publicUrl: "https://placehold.co/400x300/f97316/ffffff?text=Demo" },
    }),
    remove: async () => ({ error: null }),
  }),
};

// ============================================================
// Channel stub (Realtime — not used in demo)
// ============================================================

const demoChannel = {
  on: () => demoChannel,
  subscribe: () => demoChannel,
  unsubscribe: () => Promise.resolve("ok" as const),
};

// ============================================================
// Public factory
// ============================================================

export function createClient() {
  return {
    from: (table: string) => new MockQueryBuilder(table as TableName),
    auth: demoAuth,
    storage: demoStorage,
    channel: (_name: string) => demoChannel,
    removeChannel: () => Promise.resolve("ok" as const),
  };
}
