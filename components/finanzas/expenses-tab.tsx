"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Plus, Trash2, Pencil, CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";
import {
  useExpenses,
  useCreateExpense,
  useUpdateExpense,
  useDeleteExpense,
  isStockUpdateFailure,
  isStockRevertFailure,
  isStockAdjustFailure,
} from "@/lib/hooks/use-expenses";
import { useSupplies } from "@/lib/hooks/use-supplies";
import { TZ } from "@/lib/hooks/use-period-selector";
import {
  SupplyQuantityInput,
  resolveSupplyQuantity,
  type SupplyQuantityMode,
} from "@/components/costos/supply-quantity-input";
import type { Expense, ExpenseCategory } from "@/lib/types";
import { formatCurrency } from "@/lib/utils/format";
import { categoryChartColor, categoryLabels, categoryDescriptionPlaceholder } from "@/lib/utils/expenses";
import { todayArStr, formatDisplayDate } from "@/components/finanzas/expenses-shared";

const PAGE_SIZE = 8;

// A one-shot request from the recurring-expenses tab's "Cargar pago" button,
// asking this tab to open its create dialog prefilled for a template.
//
// `recurringExpenseId` is the LINK the payment counter matches on — the
// description is a prefill for the human, never a join key (design D7).
// `category` is the TEMPLATE'S OWN category: this tab no longer assumes
// "salaries", so a weekly `services` cleaning contract logs correctly. This
// tab deliberately knows nothing else about recurring templates — the
// Finanzas page shell owns the tab-switching part and just hands this down.
export type QuickLogRequest = {
  description: string;
  category: ExpenseCategory;
  recurringExpenseId: string;
};

export function ExpensesTab({
  startDate,
  endDate,
  quickLogRequest,
  onQuickLogHandled,
}: {
  startDate: string;
  endDate: string;
  quickLogRequest: QuickLogRequest | null;
  onQuickLogHandled: () => void;
}) {
  const { data: expenses, isLoading: expensesLoading } = useExpenses(startDate, endDate);
  const createExpense = useCreateExpense(startDate, endDate);
  const updateExpense = useUpdateExpense(startDate, endDate);
  const deleteExpense = useDeleteExpense(startDate, endDate);

  const [expensePage, setExpensePage] = useState(1);
  const [expenseDialogOpen, setExpenseDialogOpen] = useState(false);
  const [expenseCalendarOpen, setExpenseCalendarOpen] = useState(false);
  const [expenseDate, setExpenseDate] = useState<string>(todayArStr());
  const [expenseAmount, setExpenseAmount] = useState("");
  const [expenseCategory, setExpenseCategory] = useState<ExpenseCategory>("supplies");
  const [expenseDescription, setExpenseDescription] = useState("");
  const [expenseSupplyId, setExpenseSupplyId] = useState<string | null>(null);
  const [expenseSupplyQuantity, setExpenseSupplyQuantity] = useState("");
  const [expenseSupplyMode, setExpenseSupplyMode] = useState<SupplyQuantityMode>("native");
  const [deletingExpense, setDeletingExpense] = useState<Expense | null>(null);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  // Set only by the quick-log prefill effect below, from
  // `quickLogRequest.recurringExpenseId` — the FK the new expense will carry
  // so `paydayProgressFor` can count it (design D7). Cleared on any dialog
  // close so a manually opened "Nuevo gasto" never inherits a stale link.
  const [quickLogTemplateId, setQuickLogTemplateId] = useState<string | null>(null);

  const { data: supplies } = useSupplies();
  const activeSupplies = useMemo(() => supplies?.filter((s) => s.is_active) ?? [], [supplies]);
  const selectedExpenseSupply = activeSupplies.find((s) => s.id === expenseSupplyId) ?? null;
  // Hoisted to render scope (not just inside handleCreateExpense) so the
  // dialog can show, before the user hits Guardar, whether this expense is
  // actually going to touch stock — an unresolved quantity here used to
  // save silently without ever telling the user their stock link was a
  // no-op.
  const resolvedExpenseSupplyQuantity = selectedExpenseSupply
    ? resolveSupplyQuantity(selectedExpenseSupply, expenseSupplyQuantity, expenseSupplyMode)
    : null;

  // NOTE: this total only sums the one-off `expenses` rows in the period —
  // it deliberately does NOT match `analytics.expensesTotal` (the Resumen
  // KPI), which also prorates recurring monthly templates day-by-day. Two
  // different calculations, so the label below says so explicitly instead
  // of implying they're the same number.
  const oneOffExpensesTotal = expenses?.reduce((acc, e) => acc + Number(e.amount), 0) ?? 0;
  const expenseTotalPages = Math.ceil((expenses?.length ?? 0) / PAGE_SIZE);
  const paginatedExpenses = expenses?.slice((expensePage - 1) * PAGE_SIZE, expensePage * PAGE_SIZE) ?? [];

  function resetExpenseForm() {
    setExpenseDate(todayArStr());
    setExpenseAmount("");
    setExpenseCategory("supplies");
    setExpenseDescription("");
    setExpenseSupplyId(null);
    setExpenseSupplyQuantity("");
    setExpenseSupplyMode("native");
    setEditingExpense(null);
    setQuickLogTemplateId(null);
  }

  // Prefills the same dialog/form used for "Nuevo gasto" from an existing
  // row. The supply quantity is always prefilled in "native" mode: it's
  // already the resolved (native-unit) value stored on the expense, not a
  // per-kilo entry the user typed — showing it any other way would silently
  // re-convert it on save.
  function openEditExpense(expense: Expense) {
    setEditingExpense(expense);
    setExpenseDate(expense.date);
    setExpenseAmount(String(expense.amount));
    setExpenseCategory(expense.category);
    setExpenseDescription(expense.description ?? "");
    setExpenseSupplyId(expense.supply_id ?? null);
    setExpenseSupplyQuantity(expense.quantity != null ? String(expense.quantity) : "");
    setExpenseSupplyMode("native");
    setExpenseDialogOpen(true);
  }

  async function handleCreateExpense() {
    const parsed = parseFloat(expenseAmount.replace(",", "."));
    if (isNaN(parsed) || parsed <= 0) return;

    // Stock is only bumped when the user both picked a supply and entered a
    // valid quantity — an invalid/empty quantity still saves the expense,
    // just without touching stock (same "don't block on this" precedent as
    // the Insumos tab's own stock fields). resolveSupplyQuantity already
    // converts kilos mode down to the supply's native unit, which is what
    // gets persisted — same contract the Insumos tab's restock popover uses.
    const hasSupplyQuantity =
      expenseCategory === "supplies" && !!expenseSupplyId && !!resolvedExpenseSupplyQuantity;

    try {
      await createExpense.mutateAsync({
        date: expenseDate,
        amount: parsed,
        category: expenseCategory,
        description: expenseDescription.trim() || null,
        supply_id: hasSupplyQuantity ? expenseSupplyId : null,
        quantity: hasSupplyQuantity ? resolvedExpenseSupplyQuantity : null,
        recurring_expense_id: quickLogTemplateId,
      });
      toast.success("Gasto registrado");
      setExpenseDialogOpen(false);
      resetExpenseForm();
    } catch (error) {
      if (isStockUpdateFailure(error)) {
        toast.error("El gasto se registró, pero no se pudo actualizar el stock. Corregilo desde Insumos.");
        setExpenseDialogOpen(false);
        resetExpenseForm();
      } else {
        toast.error("Error al registrar el gasto");
      }
    }
  }

  async function handleUpdateExpense() {
    if (!editingExpense) return;
    const parsed = parseFloat(expenseAmount.replace(",", "."));
    if (isNaN(parsed) || parsed <= 0) return;

    const hasSupplyQuantity =
      expenseCategory === "supplies" && !!expenseSupplyId && !!resolvedExpenseSupplyQuantity;

    try {
      await updateExpense.mutateAsync({
        id: editingExpense.id,
        date: expenseDate,
        amount: parsed,
        category: expenseCategory,
        description: expenseDescription.trim() || null,
        supply_id: hasSupplyQuantity ? expenseSupplyId : null,
        quantity: hasSupplyQuantity ? resolvedExpenseSupplyQuantity : null,
      });
      toast.success("Gasto actualizado");
      setExpenseDialogOpen(false);
      resetExpenseForm();
    } catch (error) {
      if (isStockAdjustFailure(error)) {
        toast.error("El gasto se actualizó, pero no se pudo ajustar el stock. Corregilo desde Insumos.");
        setExpenseDialogOpen(false);
        resetExpenseForm();
      } else {
        toast.error("Error al actualizar el gasto");
      }
    }
  }

  async function handleDeleteExpense() {
    if (!deletingExpense) return;
    try {
      await deleteExpense.mutateAsync(deletingExpense.id);
      toast.success("Gasto eliminado");
    } catch (error) {
      if (isStockRevertFailure(error)) {
        toast.error("El gasto se eliminó, pero no se pudo actualizar el stock. Corregilo desde Insumos.");
      } else {
        toast.error("Error al eliminar el gasto");
      }
    } finally {
      setDeletingExpense(null);
    }
  }

  // Consumes a "request" object (rather than the parent calling an
  // imperative method on this component) because this component may not
  // even be mounted at the moment the request is made: the recurring tab's
  // "Cargar pago" button only renders while `gastosSubTab === "recurring"`,
  // and Radix unmounts inactive TabsContent by default (see
  // components/ui/tabs.tsx) — so the "period" sub-tab holding this component
  // is unmounted right up until the same click switches `gastosSubTab` to
  // "period". An effect fires after mount either way, so it sees the
  // request whether this component was already mounted or just got mounted
  // by that same click. `onQuickLogHandled` is deliberately left out of the
  // dependency array — it's a plain closure over clearing the parent's
  // request state, and the `quickLogRequest` guard below already prevents
  // re-processing an already-handled (now null) request.
  useEffect(() => {
    if (!quickLogRequest) return;
    setExpenseDate(todayArStr());
    setExpenseCategory(quickLogRequest.category);
    setExpenseDescription(quickLogRequest.description);
    setExpenseAmount("");
    setQuickLogTemplateId(quickLogRequest.recurringExpenseId);
    setExpenseDialogOpen(true);
    onQuickLogHandled();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quickLogRequest]);

  return (
    <>
      <Card id="gastos-period-card" className="ios-glass bg-card">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium">Gastos puntuales cargados</p>
            <div className="flex items-center gap-3">
              <span className="text-sm font-bold tabular-nums">
                {formatCurrency(oneOffExpensesTotal)}
              </span>
              <Button
                size="sm"
                variant="outline"
                className="h-8 gap-1.5 text-xs"
                onClick={() => setExpenseDialogOpen(true)}
              >
                <Plus className="h-3.5 w-3.5" />
                Agregar
              </Button>
            </div>
          </div>

          {expensesLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-10" />
              <Skeleton className="h-10" />
              <Skeleton className="h-10" />
            </div>
          ) : !expenses || expenses.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Sin gastos en este período
            </p>
          ) : (
            <div className="space-y-2">
              {paginatedExpenses.map((expense) => (
                <div
                  key={expense.id}
                  className="flex items-center gap-3 rounded-xl bg-muted/40 px-4 py-2.5"
                >
                  <span className="text-xs text-muted-foreground w-20 shrink-0">
                    {formatDisplayDate(expense.date)}
                  </span>
                  <Badge variant="outline" className="text-xs bg-card shrink-0">
                    <span
                      className="h-1.5 w-1.5 rounded-full shrink-0"
                      style={{ backgroundColor: categoryChartColor[expense.category] }}
                    />
                    {categoryLabels[expense.category]}
                  </Badge>
                  <span className="flex-1 text-sm text-muted-foreground truncate">
                    {expense.description ?? "—"}
                  </span>
                  <span className="text-sm font-semibold tabular-nums">
                    {formatCurrency(expense.amount)}
                  </span>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 text-muted-foreground shrink-0"
                    onClick={() => openEditExpense(expense)}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 text-muted-foreground hover:text-destructive shrink-0"
                    onClick={() => setDeletingExpense(expense)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}

              {expenseTotalPages > 1 && (
                <div className="flex items-center justify-between pt-1 px-1">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7"
                    onClick={() => setExpensePage((p) => Math.max(1, p - 1))}
                    disabled={expensePage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-xs text-muted-foreground">
                    {expensePage} / {expenseTotalPages}
                  </span>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7"
                    onClick={() => setExpensePage((p) => Math.min(expenseTotalPages, p + 1))}
                    disabled={expensePage === expenseTotalPages}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ─── Create one-off expense dialog ─── */}
      <Dialog
        open={expenseDialogOpen}
        onOpenChange={(open) => {
          setExpenseDialogOpen(open);
          if (!open) resetExpenseForm();
        }}
      >
        <DialogContent className="sm:max-w-xl ios-glass rounded-2xl">
          <DialogHeader>
            <DialogTitle>{editingExpense ? "Editar gasto" : "Nuevo gasto"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Monto</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={expenseAmount}
                  onChange={(e) => setExpenseAmount(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label>Categoría</Label>
                <Select
                  value={expenseCategory}
                  onValueChange={(v) => {
                    const next = v as ExpenseCategory;
                    setExpenseCategory(next);
                    if (next !== "supplies") {
                      setExpenseSupplyId(null);
                      setExpenseSupplyQuantity("");
                      setExpenseSupplyMode("native");
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="supplies">Insumos</SelectItem>
                    <SelectItem value="services">Servicios</SelectItem>
                    <SelectItem value="salaries">Sueldos</SelectItem>
                    <SelectItem value="rent">Alquiler</SelectItem>
                    <SelectItem value="other">Otro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Fecha</Label>
              <Popover open={expenseCalendarOpen} onOpenChange={setExpenseCalendarOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start gap-2 font-normal">
                    <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                    {formatDisplayDate(expenseDate)}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={new Date(expenseDate + "T12:00:00")}
                    onSelect={(date) => {
                      if (date) setExpenseDate(date.toLocaleDateString("en-CA", { timeZone: TZ }));
                      setExpenseCalendarOpen(false);
                    }}
                    disabled={{ after: new Date() }}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-1.5">
              <Label>
                Descripción <span className="text-muted-foreground font-normal">(opcional)</span>
              </Label>
              <Textarea
                placeholder={categoryDescriptionPlaceholder[expenseCategory]}
                value={expenseDescription}
                onChange={(e) => setExpenseDescription(e.target.value)}
                rows={2}
              />
            </div>

            {expenseCategory === "supplies" && (
              <div className="space-y-2">
                <div className="space-y-1.5">
                  <Label>
                    Insumo <span className="text-muted-foreground font-normal">(opcional)</span>
                  </Label>
                  <Select
                    value={expenseSupplyId ?? "none"}
                    onValueChange={(v) => {
                      setExpenseSupplyId(v === "none" ? null : v);
                      setExpenseSupplyQuantity("");
                      setExpenseSupplyMode("native");
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Ninguno</SelectItem>
                      {activeSupplies.map((supply) => (
                        <SelectItem key={supply.id} value={supply.id}>
                          {supply.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {!selectedExpenseSupply && (
                    <p className="text-xs text-muted-foreground">
                      Si vinculás un insumo, el gasto también suma su stock. El costo por unidad no
                      se toca acá — eso se edita desde Insumos.
                    </p>
                  )}
                </div>

                {selectedExpenseSupply && (
                  <div className="space-y-1.5 rounded-xl border p-3">
                    <Label className="text-xs">Cantidad comprada</Label>
                    <SupplyQuantityInput
                      supply={selectedExpenseSupply}
                      value={expenseSupplyQuantity}
                      mode={expenseSupplyMode}
                      onValueChange={setExpenseSupplyQuantity}
                      onModeChange={setExpenseSupplyMode}
                    />
                    {resolvedExpenseSupplyQuantity !== null ? (
                      <p className="text-xs text-muted-foreground">
                        Se suma al stock actual ({selectedExpenseSupply.stock_quantity}{" "}
                        {selectedExpenseSupply.unit})
                      </p>
                    ) : (
                      <p className="text-xs" style={{ color: "var(--status-canceled)" }}>
                        Completá la cantidad para sumarla al stock — si la dejás así, el gasto se
                        guarda sin tocar el stock.
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setExpenseDialogOpen(false);
                resetExpenseForm();
              }}
            >
              Cancelar
            </Button>
            <Button
              onClick={editingExpense ? handleUpdateExpense : handleCreateExpense}
              disabled={
                !expenseAmount ||
                parseFloat(expenseAmount) <= 0 ||
                createExpense.isPending ||
                updateExpense.isPending
              }
            >
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Delete one-off expense confirm ─── */}
      <AlertDialog open={!!deletingExpense} onOpenChange={(open) => !open && setDeletingExpense(null)}>
        <AlertDialogContent className="ios-glass rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar gasto</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Eliminar el gasto {deletingExpense ? `de ${formatCurrency(deletingExpense.amount)}` : ""}?
              Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive" onClick={handleDeleteExpense}>
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
