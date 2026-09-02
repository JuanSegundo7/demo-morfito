"use client"

import { useMemo } from "react"
import { useDemoStore } from "@/lib/demo/store"
import { useShallow } from "zustand/react/shallow"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { formatCurrency } from "@/lib/utils/format"
import { Printer } from "lucide-react"
import { getActivePreset } from "@/lib/demo/presets/resolve"

export function DemoPrintModal() {
  const preset = useMemo(() => getActivePreset(), [])
  const printModalOrderId = useDemoStore((s) => s.printModalOrderId)
  const closePrintModal   = useDemoStore((s) => s.closePrintModal)

  const order   = useDemoStore((s) => s.orders.find((o) => o.id === printModalOrderId) ?? null)
  const items   = useDemoStore(useShallow((s) => s.order_items.filter((i) => i.order_id === printModalOrderId)))
  const allExtras = useDemoStore((s) => s.order_item_extras)
  const address = useDemoStore((s) => s.customer_addresses.find((a) => a.id === order?.customer_address_id) ?? null)

  if (!order) return null

  const now = new Date(order.created_at)
  const dateLabel = now.toLocaleString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })

  return (
    <Dialog open={!!printModalOrderId} onOpenChange={(open) => !open && closePrintModal()}>
      <DialogContent className="sm:max-w-xs">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <Printer className="h-4 w-4" />
            Ticket impreso
          </DialogTitle>
        </DialogHeader>

        <div className="rounded-lg border bg-card p-4 font-mono text-xs space-y-2">
          {/* Header */}
          <div className="text-center space-y-0.5">
            <div className="font-bold text-sm">{preset.label.toUpperCase()} DEMO</div>
            <div className="text-muted-foreground text-[10px]">{dateLabel}</div>
          </div>

          <Separator />

          {/* Order number */}
          <div className="text-center">
            <span className="font-bold text-base">PEDIDO #{order.order_number}</span>
          </div>

          <Separator />

          {/* Customer */}
          <div className="space-y-0.5">
            <div className="font-semibold">{order.customer_name}</div>
            {order.delivery_type === "delivery" && address && (
              <div className="text-muted-foreground">{address.address}</div>
            )}
            <div className="text-muted-foreground capitalize">
              {order.delivery_type === "delivery" ? "🛵 Delivery" : "🏠 Retira en local"}
            </div>
          </div>

          <Separator />

          {/* Items */}
          <div className="space-y-1.5">
            {items.map((item) => {
              const itemExtras = allExtras.filter((e) => e.order_item_id === item.id)
              return (
                <div key={item.id}>
                  <div className="flex justify-between">
                    <span>{item.quantity}x {item.burger_name}</span>
                    <span>{formatCurrency(item.subtotal)}</span>
                  </div>
                  {itemExtras.map((ext) => (
                    <div key={ext.id} className="flex justify-between pl-3 text-muted-foreground">
                      <span>+ {ext.quantity}x {ext.extra_name}</span>
                      <span>{formatCurrency(ext.subtotal)}</span>
                    </div>
                  ))}
                </div>
              )
            })}
          </div>

          <Separator />

          {/* Totals */}
          <div className="space-y-0.5">
            {order.delivery_fee > 0 && (
              <div className="flex justify-between text-muted-foreground">
                <span>Envío</span>
                <span>{formatCurrency(order.delivery_fee)}</span>
              </div>
            )}
            {order.discount_amount > 0 && (
              <div className="flex justify-between text-muted-foreground">
                <span>Descuento</span>
                <span>- {formatCurrency(order.discount_amount)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-sm pt-0.5">
              <span>TOTAL</span>
              <span>{formatCurrency(order.total_amount)}</span>
            </div>
            <div className="text-muted-foreground capitalize pt-0.5">
              {order.payment_method === "cash" ? "💵 Efectivo" : "🏦 Transferencia"}
            </div>
          </div>

          <Separator />

          <div className="text-center text-muted-foreground text-[10px]">
            ¡Gracias por elegirnos!
          </div>
        </div>

        <DialogFooter>
          <Button className="w-full" onClick={closePrintModal}>
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
