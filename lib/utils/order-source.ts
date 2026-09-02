import type { OrderSource } from "@/lib/types";

export const orderSourceConfig: Record<
  OrderSource,
  {
    label: string;
    className: string;
    color: string;
  }
> = {
  local: {
    label: "🏠 Local",
    className: "bg-muted text-muted-foreground",
    color: "var(--color-chart-2)",
  },
  pedidosya: {
    label: "🛵 PedidosYa",
    className: "bg-red-500 text-white",
    color: "var(--color-chart-1)",
  },
};
