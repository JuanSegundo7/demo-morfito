import type { Order, OrderItem, OrderItemExtra, ExternalIncome } from "@/lib/types";
import type { BusinessPreset } from "../presets/types";
import { SEED_CUSTOMERS, SEED_CUSTOMER_ADDRESSES } from "../presets/shared";

// ============================================================
// Helpers
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

function dateStr(d: Date): string {
  return d.toISOString();
}

function addDays(d: Date, days: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + days);
  return r;
}

function setHour(d: Date, h: number, m = 0): Date {
  const r = new Date(d);
  r.setHours(h, m, 0, 0);
  return r;
}

function addMins(date: Date, mins: number): string {
  const d = new Date(date);
  d.setMinutes(d.getMinutes() + mins);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

// Default delivery address per customer — the customer's own `is_default`
// address (falls back to null, "no saved address", same as a customer with
// no address rows at all). Derived from the shared customer/address tables
// instead of a hand-maintained positional array (today's seed/orders.ts had
// one, CUST_ADDRS, which had drifted out of sync with seed/customers.ts for
// several customers — this derivation is the correct mapping).
function defaultAddressByCustomer(): Map<string, string | null> {
  const map = new Map<string, string | null>();
  for (const c of SEED_CUSTOMERS) map.set(c.id, null);
  for (const addr of SEED_CUSTOMER_ADDRESSES) {
    if (addr.is_default) map.set(addr.customer_id, addr.id);
  }
  return map;
}

// ============================================================
// Order-line data, derived from the BUILT preset (no more hand-duplicated
// flat arrays — BURGER_IDS/NAMES/PRICES, FRIES_*, DRINK_*, CUST_* deleted
// in Phase 1) and shared customers.
// ============================================================

interface OrderGenInputs {
  burgers: { id: string; name: string; price: number }[];
  fries: { id: string; name: string; price: number }[];
  drinks: { id: string; name: string; price: number }[];
  // Extras that can attach to a single burger line — today's "extra"
  // category minus the internal meat-unit role extra (matches the 3
  // hardcoded EXT_* entries this replaces: cheddar/panceta/huevo frito).
  smallExtras: { id: string; name: string; price: number }[];
  customerIds: string[];
  customerNames: string[];
  customerAddressIds: (string | null)[];
}

function buildInputs(preset: BusinessPreset): OrderGenInputs {
  const addressByCustomer = defaultAddressByCustomer();

  return {
    burgers: preset.burgers.map((b) => ({ id: b.id, name: b.name, price: b.base_price })),
    fries: preset.extras
      .filter((e) => e.category === "fries")
      .map((e) => ({ id: e.id, name: e.name, price: e.price })),
    drinks: preset.extras
      .filter((e) => e.category === "drink")
      .map((e) => ({ id: e.id, name: e.name, price: e.price })),
    smallExtras: preset.extras
      .filter((e) => e.category === "extra" && e.id !== preset.roles.meatExtraId)
      .map((e) => ({ id: e.id, name: e.name, price: e.price })),
    customerIds: SEED_CUSTOMERS.map((c) => c.id),
    customerNames: SEED_CUSTOMERS.map((c) => c.name),
    customerAddressIds: SEED_CUSTOMERS.map((c) => addressByCustomer.get(c.id) ?? null),
  };
}

// ============================================================
// Build one order + its items
// ============================================================

interface OrderBundle {
  order: Order;
  items: OrderItem[];
  extras: OrderItemExtra[];
}

function buildOrder(inputs: OrderGenInputs, orderDate: Date, status: Order["status"], orderNum: number): OrderBundle {
  const orderId  = uid("oo");
  const ci       = rnd(0, inputs.customerIds.length - 1);
  const isDelivery = Math.random() < 0.42;
  const addrId   = isDelivery ? (inputs.customerAddressIds[ci] ?? null) : null;
  const fee      = isDelivery ? 900 : 0;
  const payment  = pick(["cash","cash","transfer","transfer","transfer"] as Order["payment_method"][]);
  const isPaid   = status === "completed";

  // Discount: ~12% of orders
  let discType: Order["discount_type"] = "none";
  let discVal  = 0;
  const dr = Math.random();
  if (dr < 0.08)  { discType = "percentage"; discVal = pick([5,10,15]); }
  else if (dr < 0.12) { discType = "amount"; discVal = pick([500,1000,2000]); }

  const nBurgers = Math.random() < 0.4 ? 1 : Math.random() < 0.65 ? 2 : 3;
  const items: OrderItem[] = [];
  const extras: OrderItemExtra[] = [];
  let subtotal = 0;

  for (let j = 0; j < nBurgers; j++) {
    const burger = pick(inputs.burgers);
    const qty   = 1;
    const itemId = uid("ii");
    subtotal += burger.price * qty;
    items.push({
      id: itemId,
      order_id: orderId,
      burger_id: burger.id,
      combo_id: null,
      burger_name: burger.name,
      quantity: qty,
      unit_price: burger.price,
      subtotal: burger.price * qty,
      customizations: null,
      created_at: dateStr(orderDate),
    });
    // 20% chance of extra on this burger
    if (inputs.smallExtras.length > 0 && Math.random() < 0.20) {
      const extra = pick(inputs.smallExtras);
      const extId = uid("xe");
      subtotal += extra.price;
      extras.push({
        id: extId,
        order_item_id: itemId,
        extra_id: extra.id,
        extra_name: extra.name,
        quantity: 1,
        unit_price: extra.price,
        subtotal: extra.price,
        created_at: dateStr(orderDate),
      });
    }
  }

  // 62% fries
  if (inputs.fries.length > 0 && Math.random() < 0.62) {
    const fries = pick(inputs.fries);
    subtotal += fries.price;
    items.push({ id: uid("ii"), order_id: orderId, burger_id: null, combo_id: null, burger_name: fries.name, quantity: 1, unit_price: fries.price, subtotal: fries.price, customizations: null, created_at: dateStr(orderDate) });
  }

  // 50% drink
  if (inputs.drinks.length > 0 && Math.random() < 0.50) {
    const drink = pick(inputs.drinks);
    subtotal += drink.price;
    items.push({ id: uid("ii"), order_id: orderId, burger_id: null, combo_id: null, burger_name: drink.name, quantity: 1, unit_price: drink.price, subtotal: drink.price, customizations: null, created_at: dateStr(orderDate) });
  }

  const discAmt = discType === "percentage" ? Math.round(subtotal * discVal / 100) : discType === "amount" ? Math.min(discVal, subtotal) : 0;

  // Order source: ~70% local, ~22% pedidosya, ~8% unknown (NULL).
  // `source: null` means "desconocido" (predates the column / never set),
  // NEVER "local" — jebbs treats it as a distinct third state. See
  // scripts/010-order-source.sql / scripts/011-backfill-order-source.sql.
  const sourceRoll = Math.random();
  const source: Order["source"] = sourceRoll < 0.08 ? null : sourceRoll < 0.30 ? "pedidosya" : "local";

  // commission_rate is FROZEN at order creation (it's a %, e.g. 25 = 25%)
  // and never re-read from a live "current PedidosYa %" setting — mirrors
  // use-create-order.ts's own comment on this exact field. Only pedidosya
  // orders ever carry a rate; local/unknown orders keep it null.
  const commissionRate = source === "pedidosya" ? 25 : null;

  // price_adjustment is a manual tweak that ONLY exists for PedidosYa
  // orders (e.g. rounding the price up to match what PedidosYa displays) —
  // local orders always carry 0. ~30% of pedidosya orders get one.
  const priceAdjustment = source === "pedidosya" && Math.random() < 0.3 ? pick([-500, 300, 800, 1500]) : 0;

  const total = Math.max(0, subtotal - discAmt + fee + priceAdjustment);

  // commission_amount is likewise frozen at creation — computed from the
  // final total exactly like use-create-order.ts's mutationFn does, never
  // recomputed later from a possibly-changed rate.
  const commissionAmount =
    source === "pedidosya" && commissionRate ? Math.round(total * (commissionRate / 100) * 100) / 100 : 0;

  const order: Order = {
    id: orderId,
    order_number: orderNum,
    customer_id: inputs.customerIds[ci],
    customer_name: inputs.customerNames[ci],
    customer_address_id: addrId,
    status,
    is_paid: isPaid,
    total_amount: total,
    delivery_type: isDelivery ? "delivery" : "pickup",
    delivery_fee: fee,
    payment_method: payment,
    delivery_time: (status === "new" || status === "ready")
      ? addMins(orderDate, rnd(25, 75))
      : null,
    discount_type: discType,
    discount_value: discVal,
    discount_amount: discAmt,
    source,
    commission_amount: commissionAmount,
    commission_rate: commissionRate,
    price_adjustment: priceAdjustment,
    notes: null,
    created_at: dateStr(orderDate),
    updated_at: dateStr(orderDate),
  };

  return { order, items, extras };
}

// ============================================================
// Generate historical orders — last ~4 months
// ============================================================

export interface SeedOrderData {
  orders: Order[];
  order_items: OrderItem[];
  order_item_extras: OrderItemExtra[];
  external_income: ExternalIncome[];
}

export function generateSeedOrders(preset: BusinessPreset): SeedOrderData {
  const today = new Date();
  today.setHours(12, 0, 0, 0);

  const inputs = buildInputs(preset);

  const allOrders:  Order[]          = [];
  const allItems:   OrderItem[]      = [];
  const allExtras:  OrderItemExtra[] = [];
  const allIncome:  ExternalIncome[] = [];

  // Nothing to generate if the preset has no burgers or no customers —
  // a generator must degrade gracefully rather than divide by an empty
  // array (rnd(0, -1) etc.).
  if (inputs.burgers.length === 0 || inputs.customerIds.length === 0) {
    return { orders: [], order_items: [], order_item_extras: [], external_income: [] };
  }

  let orderNum = 100;

  // ── Historical: 120 days back → yesterday ──────────────────
  for (let daysAgo = 120; daysAgo >= 1; daysAgo--) {
    const day = addDays(today, -daysAgo);

    // Volume: recent months more active; weekends slightly heavier
    const monthsAgo = daysAgo / 30;
    const baseVolume =
      monthsAgo > 3 ? rnd(4, 7) :
      monthsAgo > 2 ? rnd(5, 9) :
      monthsAgo > 1 ? rnd(6, 11) :
                       rnd(8, 14);
    const volume = baseVolume + rnd(0, 2); // noise

    for (let k = 0; k < volume; k++) {
      const hour = rnd(11, 22);
      const min  = rnd(0, 59);
      const orderDate = setHour(day, hour, min);

      // 10% canceled
      const status: Order["status"] = Math.random() < 0.10 ? "canceled" : "completed";
      const { order, items, extras } = buildOrder(inputs, orderDate, status, orderNum++);

      allOrders.push(order);
      allItems.push(...items);
      allExtras.push(...extras);
    }
  }

  // ── Today: 3 new + 1 ready + 4 completed ───────────────────
  const todayStatuses: Order["status"][] = ["completed","completed","completed","completed","ready","new","new","new"];
  for (let k = 0; k < todayStatuses.length; k++) {
    const hour = 11 + k * 1;
    const orderDate = setHour(today, hour, rnd(0, 45));
    const { order, items, extras } = buildOrder(inputs, orderDate, todayStatuses[k], orderNum++);
    allOrders.push(order);
    allItems.push(...items);
    allExtras.push(...extras);
  }

  // ── External income — 2-3 entries per month ────────────────
  const incomeDescriptions =
    preset.externalIncomeDescriptions.length > 0
      ? preset.externalIncomeDescriptions
      : ["Ingreso externo"];
  for (let m = 3; m >= 0; m--) {
    const count = rnd(2, 3);
    for (let k = 0; k < count; k++) {
      const incomeDay = addDays(today, -(m * 30 + rnd(1, 25)));
      allIncome.push({
        id: uid("ic"),
        date: incomeDay.toISOString().slice(0, 10),
        amount: rnd(8, 28) * 1000,
        // ~1 in 4 external-income entries came in through PedidosYa too
        // (a catering order placed via the app) — splitExternalBySource
        // reads this the same way it reads orders.source.
        source: Math.random() < 0.25 ? "pedidosya" : null,
        description: pick(incomeDescriptions),
        created_at: dateStr(incomeDay),
      });
    }
  }

  return {
    orders: allOrders,
    order_items: allItems,
    order_item_extras: allExtras,
    external_income: allIncome,
  };
}
