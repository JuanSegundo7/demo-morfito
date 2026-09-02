"use client"

import { useEffect } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { useDemoStore } from "./store"
import { formatCurrency } from "@/lib/utils/format"
import type { Order } from "@/lib/types"

function rnd(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

// Reads product/extra/customer data from the LIVE store rather than the
// preset directly — this future-proofs a reseed() action (Phase 3) and
// means a product created live in /menu during the demo can show up in a
// generator-built order afterwards. Every pick is guarded against an empty
// source array: pick([]) would otherwise produce `undefined` and poison
// the order total with NaN.
function buildLiveOrder(): Order | null {
  const { insertRow, burgers, extras, customers, customer_addresses } = useDemoStore.getState()

  if (burgers.length === 0 || customers.length === 0) return null

  const fries = extras.filter((e) => e.category === "fries")
  const drinks = extras.filter((e) => e.category === "drink")

  const customer = pick(customers)
  const defaultAddress = customer_addresses.find(
    (a) => a.customer_id === customer.id && a.is_default
  )
  const hasAddress = !!defaultAddress
  const isDelivery = hasAddress && Math.random() < 0.45
  const deliveryFee = isDelivery ? 2000 : 0

  let subtotal = 0

  const burgerPicks = Array.from({ length: rnd(1, 2) }, () => pick(burgers))
  burgerPicks.forEach((b) => { subtotal += b.base_price })

  const friesPick = fries.length > 0 && Math.random() < 0.62 ? pick(fries) : null
  if (friesPick) subtotal += friesPick.price

  const drinkPick = drinks.length > 0 && Math.random() < 0.50 ? pick(drinks) : null
  if (drinkPick) subtotal += drinkPick.price

  // Order source: a live generated order always has a known channel (unlike
  // seeded historical rows, which can predate the source column and land in
  // "unknown" — see the comment in lib/demo/seed/orders.ts). ~22% pedidosya,
  // the rest local — the same width as the pedidosya band there
  // (sourceRoll < 0.30 vs < 0.08 = 22 points), just renormalized onto the
  // two channels that apply to a freshly-created order.
  const source: Order["source"] = Math.random() < 0.22 ? "pedidosya" : "local"

  // commission_rate is frozen at order creation, same as
  // use-create-order.ts / generateSeedOrders() — 25% flat, only ever set for
  // pedidosya orders.
  const commissionRate: Order["commission_rate"] = source === "pedidosya" ? 25 : null

  // price_adjustment: manual PedidosYa-only tweak, ~30% of pedidosya orders
  // get one — same probability and value set as generateSeedOrders().
  const priceAdjustment: Order["price_adjustment"] =
    source === "pedidosya" && Math.random() < 0.3 ? pick([-500, 300, 800, 1500]) : 0

  const totalAmount = Math.max(0, subtotal + deliveryFee + priceAdjustment)

  // commission_amount is likewise frozen at creation, computed from the
  // final total exactly like generateSeedOrders()/use-create-order.ts.
  const commissionAmount: Order["commission_amount"] =
    source === "pedidosya" && commissionRate ? Math.round(totalAmount * (commissionRate / 100) * 100) / 100 : 0

  // Typed against the DB-assigned fields (id/order_number/created_at/
  // updated_at come from insertRow itself) so a field missing from this
  // object is a compile error instead of a silent gap papered over by a
  // downstream `as unknown as Order` cast.
  const orderData: Omit<Order, "id" | "order_number" | "created_at" | "updated_at"> = {
    customer_id:         customer.id,
    customer_name:       customer.name,
    customer_address_id: isDelivery ? defaultAddress!.id : null,
    status:              "new",
    is_paid:             false,
    total_amount:        totalAmount,
    delivery_type:       isDelivery ? "delivery" : "pickup",
    delivery_fee:        deliveryFee,
    payment_method:      Math.random() < 0.6 ? "cash" : "transfer",
    delivery_time:       (() => {
      const d = new Date()
      d.setMinutes(d.getMinutes() + rnd(25, 75))
      return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`
    })(),
    discount_type:       "none",
    discount_value:      0,
    discount_amount:     0,
    source,
    commission_amount:   commissionAmount,
    commission_rate:     commissionRate,
    price_adjustment:    priceAdjustment,
    notes:               null,
  }

  // insertRow's own signature returns the generic `Record<string, unknown>`
  // (store.ts, out of scope here) regardless of what's passed in, so this
  // cast is structurally required either way — but the gap this finding
  // flagged is now caught above: `orderData` is checked against
  // Omit<Order, ...> at the call site, so a field missing from the literal
  // is a compile error there, not something this cast can silently swallow.
  const orderRow = insertRow("orders", orderData) as unknown as Order

  for (const b of burgerPicks) {
    insertRow("order_items", {
      order_id:      orderRow.id,
      burger_id:     b.id,
      combo_id:      null,
      burger_name:   b.name,
      quantity:      1,
      unit_price:    b.base_price,
      subtotal:      b.base_price,
      customizations: null,
    })
  }
  if (friesPick) {
    insertRow("order_items", {
      order_id:      orderRow.id,
      burger_id:     null,
      combo_id:      null,
      burger_name:   friesPick.name,
      quantity:      1,
      unit_price:    friesPick.price,
      subtotal:      friesPick.price,
      customizations: null,
    })
  }
  if (drinkPick) {
    insertRow("order_items", {
      order_id:      orderRow.id,
      burger_id:     null,
      combo_id:      null,
      burger_name:   drinkPick.name,
      quantity:      1,
      unit_price:    drinkPick.price,
      subtotal:      drinkPick.price,
      customizations: null,
    })
  }

  return orderRow
}

export function useDemoOrderGenerator() {
  const queryClient = useQueryClient()
  const generatorEnabled = useDemoStore((s) => s.generatorEnabled)

  useEffect(() => {
    if (!generatorEnabled) return

    let timer: ReturnType<typeof setTimeout>

    const schedule = () => {
      const delay = 45_000 + Math.random() * 30_000
      timer = setTimeout(() => {
        const order = buildLiveOrder()
        if (order) {
          queryClient.setQueryData<Order[]>(["orders"], (old) =>
            old ? [...old, order] : [order]
          )
          toast("🔔 Nuevo pedido", {
            description: `#${order.order_number} · ${order.customer_name} · ${formatCurrency(order.total_amount)}`,
            duration: 6000,
          })
        }
        schedule()
      }, delay)
    }

    schedule()
    return () => clearTimeout(timer)
  }, [generatorEnabled, queryClient])
}
