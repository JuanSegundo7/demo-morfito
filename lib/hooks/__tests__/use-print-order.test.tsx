import { describe, it, expect, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import { usePrintOrder, usePrintServiceStatus } from "../use-print-order";
import { useDemoStore } from "@/lib/demo/store";

// ---------------------------------------------------------------------------
// Helpers de wrapper
// ---------------------------------------------------------------------------

function createWrapper() {
  const qc = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return {
    wrapper: ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={qc}>{children}</QueryClientProvider>
    ),
    qc,
  };
}

// ---------------------------------------------------------------------------
// usePrintOrder
//
// dashboard-demo no tiene un print-service real (jebbs-dashboard imprime vía
// fetch a http://localhost:3001, un .exe local). En demo, "imprimir" abre el
// modal de ticket simulado (DemoPrintModal) a través del store, sin red.
// ---------------------------------------------------------------------------

describe("usePrintOrder", () => {
  beforeEach(() => {
    useDemoStore.setState({ printModalOrderId: null });
  });

  it("abre el modal de impresión demo con el orderId y resuelve con { orderId }", async () => {
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => usePrintOrder(), { wrapper });

    let response: unknown;
    await act(async () => {
      response = await result.current.mutateAsync("order-123");
    });

    expect(useDemoStore.getState().printModalOrderId).toBe("order-123");
    expect(response).toEqual({ orderId: "order-123" });
  });
});

// ---------------------------------------------------------------------------
// usePrintServiceStatus
//
// En demo no hay print-service que consultar: el estado se reporta siempre
// disponible con una versión fija, sin llamadas de red.
// ---------------------------------------------------------------------------

describe("usePrintServiceStatus", () => {
  it("reporta isAvailable=true, version='demo' e isChecking=false", () => {
    const { result } = renderHook(() => usePrintServiceStatus());

    expect(result.current.isAvailable).toBe(true);
    expect(result.current.version).toBe("demo");
    expect(result.current.isChecking).toBe(false);
  });
});
