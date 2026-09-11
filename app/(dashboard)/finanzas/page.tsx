"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Header } from "@/components/layout/header";
import { HelpButton } from "@/components/demo/help-button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  useExpenses,
  useRecurringExpenses,
} from "@/lib/hooks/use-expenses";
import { useOrdersAnalytics } from "@/lib/hooks/orders/use-orders-history";
import { usePeriodSelector } from "@/lib/hooks/use-period-selector";
import { PeriodSelector } from "@/components/shared/period-selector";
import { NetRevenueCard } from "@/components/finanzas/net-revenue-card";
import { DailyLedger } from "@/components/finanzas/daily-ledger";
import { GastosSummaryRow } from "@/components/finanzas/gastos-summary-row";
import { ExpensesByCategoryChart } from "@/components/finanzas/expenses-by-category-chart";
import {
  DailyIncomeVsExpensesChart,
  type DailyIncomeVsExpenseRow,
} from "@/components/finanzas/daily-income-vs-expenses-chart";
import { ExpensesTab, type QuickLogRequest } from "@/components/finanzas/expenses-tab";
import { RecurringExpensesTab } from "@/components/finanzas/recurring-expenses-tab";
import { CostosSummaryRow } from "@/components/costos/costos-summary-row";
import { SuppliesTab } from "@/components/costos/supplies-tab";
import { RecipesTab } from "@/components/costos/recipes-tab";
import type { ExpenseCategory, RecurringExpense } from "@/lib/types";
import {
  categoryChartColor,
  categoryLabels,
  parseDateUTC,
  aggregatePaydayProgress,
} from "@/lib/utils/expenses";

type FinanzasTab = "resumen" | "gastos" | "insumos" | "recetas";
type GastosSubTab = "period" | "recurring";

function isFinanzasTab(value: string | null): value is FinanzasTab {
  return value === "resumen" || value === "gastos" || value === "insumos" || value === "recetas";
}

export default function FinanzasPage() {
  return (
    <Suspense fallback={<FinanzasPageSkeleton />}>
      <FinanzasPageContent />
    </Suspense>
  );
}

function FinanzasPageSkeleton() {
  return (
    <section className="flex h-screen flex-col">
      <div className="flex-1 overflow-auto py-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="mt-4 h-24" />
      </div>
    </section>
  );
}

function FinanzasPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabFromUrl = searchParams.get("tab");
  const [tab, setTab] = useState<FinanzasTab>(
    isFinanzasTab(tabFromUrl) ? tabFromUrl : "resumen"
  );
  const [gastosSubTab, setGastosSubTab] = useState<GastosSubTab>("period");

  // Keeps the URL's `?tab=` in sync (deep-link support, and the target for
  // the /gastos and /costos redirects) — router.replace so it doesn't grow
  // the browser history stack on every tab click.
  function goToTab(next: FinanzasTab) {
    setTab(next);
    router.replace(`/finanzas?tab=${next}`, { scroll: false });
  }

  // Radix Tabs unmounts inactive TabsContent by default, so a tour step
  // targeting an element inside another tab needs that tab mounted first.
  // This syncs this page's tab state to whichever step of the active tour
  // is currently showing. The "gastos" and "costos" tours stay separate
  // (see components/onboarding/tours.tsx) — merging them into one tour id
  // would require components/costos/recipes-tab.tsx to know about the new
  // id too, and that file is reused as-is. A single HelpButton below picks
  // whichever tour matches the active tab instead.
  const currentTour: string | null = null;
  const currentStep = 0;
  useEffect(() => {
    if (currentTour === "gastos") {
      if (currentStep <= 3) {
        setTab("gastos");
        setGastosSubTab(currentStep <= 1 ? "period" : "recurring");
      } else {
        setTab("resumen");
      }
    } else if (currentTour === "costos") {
      setTab(currentStep <= 4 ? "insumos" : "recetas");
    }
  }, [currentTour, currentStep]);

  const activeTour = tab === "insumos" || tab === "recetas" ? "costos" : "gastos";

  // ── Shared period selector (Resumen + Gastos tabs only) ──
  const period = usePeriodSelector();
  const { startDate, endDate, periodLabel } = period;

  // ── Resumen tab (financial hub summary — heavy query gated to this tab) ──
  const { data: analytics, isLoading: analyticsLoading } = useOrdersAnalytics(
    period.selectedDate,
    period.viewMode,
    period.customRange,
    tab === "resumen"
  );

  // The Resumen tab's "Sueldos" KPI needs both the period-scoped one-off
  // expenses and the recurring templates. ExpensesTab/RecurringExpensesTab
  // below also fetch these independently for their own CRUD — React Query
  // dedupes identical query keys, so this doesn't add extra network calls,
  // it's just two subscribers to the same cached query.
  const { data: expenses } = useExpenses(startDate, endDate);
  const { data: recurringExpenses } = useRecurringExpenses();

  // Payday completion for the "Sueldos" KPI tile, measured over the
  // SELECTED PERIOD (not the real calendar month) so the counter always
  // agrees with the peso amount shown right next to it in the same card —
  // mixing two different time windows inside one card would make the
  // numbers not add up when viewing e.g. a single week.
  const salariesProgress = useMemo(
    () =>
      aggregatePaydayProgress(
        recurringExpenses,
        expenses,
        parseDateUTC(startDate),
        parseDateUTC(endDate)
      ),
    [recurringExpenses, expenses, startDate, endDate]
  );

  // Highest-spend category this period, for the "Categoría con más gasto"
  // tile. Zero-amount categories never win (all-zero => null, tile shows
  // "—" instead of crashing).
  const topCategory = useMemo(() => {
    const byCategory = analytics?.expensesByCategory;
    if (!byCategory) return null;
    let best: { category: ExpenseCategory; amount: number } | null = null;
    for (const category of Object.keys(byCategory) as ExpenseCategory[]) {
      const amount = byCategory[category];
      if (amount > 0 && (!best || amount > best.amount)) {
        best = { category, amount };
      }
    }
    if (!best) return null;
    return {
      label: categoryLabels[best.category],
      amount: best.amount,
      color: categoryChartColor[best.category],
    };
  }, [analytics?.expensesByCategory]);

  // Daily income vs. expense series for the chart, grouped from
  // `analytics.ledger` client-side (ledger already carries date/kind/amount
  // per movement — no new query). Sum of `income` across days equals
  // `analytics.totalRevenue`; sum of `expense` equals
  // `analytics.expensesTotal + analytics.commissionTotal` — NOT
  // expensesTotal alone, because PedidosYa commission rows carry
  // kind: "expense" while living outside expensesTotal (see
  // use-orders-history.ts's commissionByDate block). Pinned by the rule-3
  // assertion in lib/utils/__tests__/net-revenue.test.ts.
  const dailyIncomeVsExpense = useMemo<DailyIncomeVsExpenseRow[]>(() => {
    const byDate = new Map<string, DailyIncomeVsExpenseRow>();
    for (const entry of analytics?.ledger ?? []) {
      let row = byDate.get(entry.date);
      if (!row) {
        row = { date: entry.date, income: 0, expense: 0 };
        byDate.set(entry.date, row);
      }
      if (entry.kind === "income") row.income += entry.amount;
      else row.expense += entry.amount;
    }
    return Array.from(byDate.values()).sort((a, b) => a.date.localeCompare(b.date));
  }, [analytics?.ledger]);

  // Bridges the recurring-expenses tab's "Cargar pago" button to the
  // one-off ExpensesTab's create dialog: switches to the "Del período"
  // sub-tab and hands ExpensesTab a one-shot request to prefill + open its
  // dialog. See components/finanzas/expenses-tab.tsx's QuickLogRequest
  // comment for why this is a request object rather than an imperative ref
  // call (ExpensesTab may not be mounted yet at the moment of the click).
  const [quickLogRequest, setQuickLogRequest] = useState<QuickLogRequest | null>(null);

  function handleQuickLogPayment(template: RecurringExpense) {
    goToTab("gastos");
    setGastosSubTab("period");
    setQuickLogRequest({
      description: template.description,
      category: template.category,
      recurringExpenseId: template.id,
    });
  }

  return (
    <section className="flex h-screen flex-col">
      <Header
        title="Finanzas"
        subtitle="Gastos, insumos y recetas"
        extraActions={<HelpButton />}
      />

      <div className="flex-1 overflow-auto py-4">
        <Tabs value={tab} onValueChange={(v) => goToTab(v as FinanzasTab)}>
          <TabsList id="finanzas-tabs-list" className="rounded-full p-1">
            <TabsTrigger value="resumen" className="rounded-full px-6 text-sm">
              Resumen
            </TabsTrigger>
            <TabsTrigger value="gastos" className="rounded-full px-6 text-sm">
              Gastos
            </TabsTrigger>
            <TabsTrigger value="insumos" id="costos-tab-supplies" className="rounded-full px-6 text-sm">
              Insumos
            </TabsTrigger>
            <TabsTrigger value="recetas" id="costos-tab-recipes" className="rounded-full px-6 text-sm">
              Recetas
            </TabsTrigger>
          </TabsList>

          {/* Period selector — shared by Resumen and Gastos, hidden for
              Insumos/Recetas on purpose: those tabs have no time dimension. */}
          {(tab === "resumen" || tab === "gastos") && (
            <PeriodSelector period={period} className="mt-4" />
          )}

          {/* ─── Resumen ─── */}
          <TabsContent value="resumen" className="mt-4">
            <div>
              <GastosSummaryRow
                isLoading={analyticsLoading}
                expensesTotal={analytics?.expensesTotal ?? 0}
                netRevenue={analytics?.netRevenue ?? 0}
                topCategory={topCategory}
                salariesTotal={analytics?.expensesByCategory?.salaries ?? 0}
                salariesProgress={salariesProgress}
              />
            </div>

            <div className="mt-4 grid gap-4 lg:grid-cols-2">
              <ExpensesByCategoryChart
                data={analytics?.expensesByCategory}
                isLoading={analyticsLoading}
              />
              <DailyIncomeVsExpensesChart
                dailyData={dailyIncomeVsExpense}
                isLoading={analyticsLoading}
              />
            </div>

            <div className="mt-4" id="gastos-ledger-summary">
              <NetRevenueCard
                grossRevenue={analytics?.totalRevenue ?? 0}
                expensesTotal={analytics?.expensesTotal ?? 0}
                commissionTotal={analytics?.commissionTotal ?? 0}
                netRevenue={analytics?.netRevenue ?? 0}
                isLoading={analyticsLoading}
              />
            </div>

            <div id="gastos-ledger-table-card">
              <DailyLedger
                entries={analytics?.ledger}
                closingBalance={analytics?.netRevenue ?? 0}
                isLoading={analyticsLoading}
                periodLabel={periodLabel}
                startDate={startDate}
                endDate={endDate}
              />
            </div>
          </TabsContent>

          {/* ─── Gastos (agrupa "Del período" + "Fijos mensuales") ─── */}
          <TabsContent value="gastos" className="mt-4">
            <Tabs value={gastosSubTab} onValueChange={(v) => setGastosSubTab(v as GastosSubTab)}>
              <TabsList className="rounded-full p-0.5 h-8">
                <TabsTrigger value="period" className="rounded-full px-3 text-xs">
                  Del período
                </TabsTrigger>
                <TabsTrigger value="recurring" className="rounded-full px-3 text-xs">
                  Fijos mensuales
                </TabsTrigger>
              </TabsList>

              {/* ─── Del período (period selector lives at page level now) ─── */}
              <TabsContent value="period" className="mt-3">
                <ExpensesTab
                  startDate={startDate}
                  endDate={endDate}
                  quickLogRequest={quickLogRequest}
                  onQuickLogHandled={() => setQuickLogRequest(null)}
                />
              </TabsContent>

              {/* ─── Fijos mensuales ─── */}
              <TabsContent value="recurring" className="mt-3">
                <RecurringExpensesTab onQuickLogPayment={handleQuickLogPayment} />
              </TabsContent>
            </Tabs>
          </TabsContent>

          {/* ─── Insumos ─── */}
          <TabsContent value="insumos" className="mt-4">
            <div className="mb-4">
              <CostosSummaryRow />
            </div>
            <SuppliesTab />
          </TabsContent>

          {/* ─── Recetas ─── */}
          <TabsContent value="recetas" className="mt-4">
            <RecipesTab />
          </TabsContent>
        </Tabs>
      </div>
    </section>
  );
}
