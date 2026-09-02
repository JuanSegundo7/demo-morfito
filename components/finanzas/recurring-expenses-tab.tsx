"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  DialogDescription,
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
import { Plus, Trash2, CalendarIcon, RefreshCcw } from "lucide-react";
import {
  useExpenses,
  useRecurringExpenses,
  useCreateRecurringExpense,
  useCloseAndReplaceRecurringExpense,
  useDeleteRecurringExpense,
} from "@/lib/hooks/use-expenses";
import { TZ } from "@/lib/hooks/use-period-selector";
import type { ExpenseCategory, RecurringExpense, RecurringExpenseFrequency } from "@/lib/types";
import { formatCurrency } from "@/lib/utils/format";
import {
  monthWindowFor,
  categoryChartColor,
  categoryLabels,
  categoryTemplateDescriptionPlaceholder,
  isInformationalPaydayTemplate,
  paydayProgressFor,
} from "@/lib/utils/expenses";
import {
  todayArStr,
  formatDisplayDate,
  dayBeforeStr,
  paydayPreviewText,
  frequencyLabels,
  frequencySuffix,
  recurringPeriodNoun,
} from "@/components/finanzas/expenses-shared";

export function RecurringExpensesTab({
  onQuickLogPayment,
}: {
  // Owned by the Finanzas page shell: switches to the "Del período" sub-tab
  // and tells the one-off ExpensesTab (via its imperative handle) to open
  // its create dialog prefilled with this template's description. This tab
  // deliberately knows nothing about that dialog or tab-switching.
  onQuickLogPayment: (template: RecurringExpense) => void;
}) {
  const { data: recurringExpenses, isLoading: recurringLoading } = useRecurringExpenses();
  const createRecurring = useCreateRecurringExpense();
  const closeAndReplace = useCloseAndReplaceRecurringExpense();
  const deleteRecurring = useDeleteRecurringExpense();

  // This month's expenses, scoped to the real current calendar month
  // (independent of whatever period "Del período" happens to be viewing) —
  // used to count how many one-off salary payments have already been logged
  // against each weekly/biweekly recurring template below.
  const thisMonthWindow = monthWindowFor(todayArStr());
  const thisMonthStart = thisMonthWindow.start.toISOString().slice(0, 10);
  const thisMonthEnd = thisMonthWindow.end.toISOString().slice(0, 10);
  const { data: thisMonthExpenses } = useExpenses(thisMonthStart, thisMonthEnd);

  const [recurringDialogOpen, setRecurringDialogOpen] = useState(false);
  const [recurringCalendarOpen, setRecurringCalendarOpen] = useState(false);
  const [recurringStartDate, setRecurringStartDate] = useState<string>(todayArStr());
  const [recurringAmount, setRecurringAmount] = useState("");
  const [recurringCategory, setRecurringCategory] = useState<ExpenseCategory>("rent");
  const [recurringFrequency, setRecurringFrequency] =
    useState<RecurringExpenseFrequency>("monthly");
  const [recurringDescription, setRecurringDescription] = useState("");

  const [updateDialogOpen, setUpdateDialogOpen] = useState(false);
  const [updateCalendarOpen, setUpdateCalendarOpen] = useState(false);
  const [updatingTemplate, setUpdatingTemplate] = useState<RecurringExpense | null>(null);
  const [updateAmount, setUpdateAmount] = useState("");
  const [updateFrequency, setUpdateFrequency] =
    useState<RecurringExpenseFrequency>("monthly");
  const [updateStartDate, setUpdateStartDate] = useState<string>(todayArStr());

  const [deletingRecurring, setDeletingRecurring] = useState<RecurringExpense | null>(null);

  function resetRecurringForm() {
    setRecurringStartDate(todayArStr());
    setRecurringAmount("");
    setRecurringCategory("rent");
    setRecurringFrequency("monthly");
    setRecurringDescription("");
  }

  async function handleCreateRecurring() {
    const isMonthly = recurringFrequency === "monthly";
    const parsed = parseFloat(recurringAmount.replace(",", "."));
    if (isMonthly && (isNaN(parsed) || parsed <= 0)) return;
    if (!recurringDescription.trim()) return;

    try {
      await createRecurring.mutateAsync({
        amount: isMonthly ? parsed : null,
        category: recurringCategory,
        frequency: recurringFrequency,
        description: recurringDescription.trim(),
        start_date: recurringStartDate,
        end_date: null,
      });
      toast.success("Gasto fijo creado");
      setRecurringDialogOpen(false);
      resetRecurringForm();
    } catch {
      toast.error("Error al crear el gasto fijo");
    }
  }

  function openUpdateDialog(template: RecurringExpense) {
    setUpdatingTemplate(template);
    setUpdateAmount(template.amount != null ? template.amount.toString() : "");
    setUpdateFrequency(template.frequency);
    setUpdateStartDate(todayArStr());
    setUpdateDialogOpen(true);
  }

  async function handleUpdateRecurring() {
    if (!updatingTemplate) return;
    const isMonthly = updateFrequency === "monthly";
    const parsed = parseFloat(updateAmount.replace(",", "."));
    if (isMonthly && (isNaN(parsed) || parsed <= 0)) return;

    try {
      await closeAndReplace.mutateAsync({
        closeId: updatingTemplate.id,
        closeEndDate: dayBeforeStr(updateStartDate),
        newExpense: {
          amount: isMonthly ? parsed : null,
          category: updatingTemplate.category,
          frequency: updateFrequency,
          description: updatingTemplate.description,
          start_date: updateStartDate,
        },
      });
      toast.success("Gasto fijo actualizado: se cerró el anterior y se creó uno nuevo");
      setUpdateDialogOpen(false);
      setUpdatingTemplate(null);
    } catch {
      toast.error("Error al actualizar el monto");
    }
  }

  async function handleDeleteRecurring() {
    if (!deletingRecurring) return;
    try {
      await deleteRecurring.mutateAsync(deletingRecurring.id);
      toast.success("Gasto fijo eliminado");
    } catch {
      toast.error("Error al eliminar el gasto fijo");
    } finally {
      setDeletingRecurring(null);
    }
  }

  const recurringPaydayPreview = paydayPreviewText(recurringStartDate, recurringFrequency);
  const updatePaydayPreview = paydayPreviewText(updateStartDate, updateFrequency);

  return (
    <>
      <Card id="gastos-recurring-card" className="ios-glass bg-card">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium">Gastos fijos mensuales</p>
            <Button
              id="gastos-add-recurring-button"
              size="sm"
              variant="outline"
              className="h-8 gap-1.5 text-xs"
              onClick={() => setRecurringDialogOpen(true)}
            >
              <Plus className="h-3.5 w-3.5" />
              Agregar
            </Button>
          </div>

          {recurringLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-16" />
              <Skeleton className="h-16" />
            </div>
          ) : !recurringExpenses || recurringExpenses.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No hay gastos fijos configurados
            </p>
          ) : (
            <div className="space-y-2">
              {recurringExpenses.map((template) => {
                const isActive = template.end_date == null;
                // Weekly/biweekly informational templates get a
                // "loaded this month" counter + quick-log button —
                // monthly templates don't (paydayPreviewText itself
                // returns null for monthly, so this mirrors that
                // same gate). Also gated on isActive: a closed
                // template (employee no longer paid) shouldn't
                // prompt you to log a payment for it.
                const isInformationalPayday = isInformationalPaydayTemplate(template);
                const progress = isInformationalPayday
                  ? paydayProgressFor(
                      template,
                      thisMonthExpenses,
                      thisMonthWindow.start,
                      thisMonthWindow.end
                    )
                  : null;
                return (
                  <div
                    key={template.id}
                    className="flex flex-col gap-2 rounded-xl bg-muted/40 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium truncate">
                          {template.description}
                        </span>
                        <Badge variant="outline" className="text-xs bg-card shrink-0">
                          <span
                            className="h-1.5 w-1.5 rounded-full shrink-0"
                            style={{ backgroundColor: categoryChartColor[template.category] }}
                          />
                          {categoryLabels[template.category]}
                        </Badge>
                        <Badge variant="outline" className="text-xs bg-card shrink-0">
                          {frequencyLabels[template.frequency]}
                        </Badge>
                        <Badge
                          variant={isActive ? "default" : "secondary"}
                          className="text-xs shrink-0"
                        >
                          {isActive ? "Activo" : `Cerrado el ${formatDisplayDate(template.end_date!)}`}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Desde {formatDisplayDate(template.start_date)}
                      </p>
                      {progress && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {progress.loaded} de {progress.expected} pagos cargados este mes
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-sm font-semibold tabular-nums">
                        {template.amount != null
                          ? `${formatCurrency(template.amount)}${frequencySuffix[template.frequency]}`
                          : paydayPreviewText(template.start_date, template.frequency, todayArStr())}
                      </span>
                      {isInformationalPayday && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 gap-1.5 text-xs"
                          onClick={() => onQuickLogPayment(template)}
                        >
                          <Plus className="h-3.5 w-3.5" />
                          Cargar pago
                        </Button>
                      )}
                      {isActive && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 gap-1.5 text-xs"
                          onClick={() => openUpdateDialog(template)}
                        >
                          <RefreshCcw className="h-3.5 w-3.5" />
                          Actualizar
                        </Button>
                      )}
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-muted-foreground hover:text-destructive"
                        onClick={() => setDeletingRecurring(template)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ─── Create recurring template dialog ─── */}
      <Dialog
        open={recurringDialogOpen}
        onOpenChange={(open) => {
          setRecurringDialogOpen(open);
          if (!open) resetRecurringForm();
        }}
      >
        <DialogContent className="sm:max-w-xl ios-glass rounded-2xl">
          <DialogHeader>
            <DialogTitle>Nuevo gasto fijo</DialogTitle>
            <DialogDescription>
              Plantilla mensual — alquiler, sueldos, servicios recurrentes.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Descripción</Label>
                <Input
                  placeholder={categoryTemplateDescriptionPlaceholder[recurringCategory]}
                  value={recurringDescription}
                  onChange={(e) => setRecurringDescription(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label>Categoría</Label>
                <Select
                  value={recurringCategory}
                  onValueChange={(v) => {
                    const next = v as ExpenseCategory;
                    setRecurringCategory(next);
                    if (next !== "salaries") setRecurringFrequency("monthly");
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

            {recurringFrequency === "monthly" ? (
              <div className="space-y-1.5">
                <Label>Monto {frequencyLabels[recurringFrequency].toLowerCase()}</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={recurringAmount}
                  onChange={(e) => setRecurringAmount(e.target.value)}
                />
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">
                El monto se carga cada {recurringPeriodNoun[recurringFrequency]} en &quot;Del
                período&quot;, ya que puede variar.
              </p>
            )}

            {recurringCategory === "salaries" && (
              <div className="space-y-1.5">
                <Label>Frecuencia</Label>
                <Select
                  value={recurringFrequency}
                  onValueChange={(v) => setRecurringFrequency(v as RecurringExpenseFrequency)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="weekly">{frequencyLabels.weekly}</SelectItem>
                    <SelectItem value="biweekly">{frequencyLabels.biweekly}</SelectItem>
                    <SelectItem value="monthly">{frequencyLabels.monthly}</SelectItem>
                  </SelectContent>
                </Select>
                {recurringPaydayPreview && (
                  <p className="text-xs text-muted-foreground">{recurringPaydayPreview}</p>
                )}
              </div>
            )}

            <div className="space-y-1.5">
              <Label>Vigente desde</Label>
              <Popover open={recurringCalendarOpen} onOpenChange={setRecurringCalendarOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start gap-2 font-normal">
                    <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                    {formatDisplayDate(recurringStartDate)}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={new Date(recurringStartDate + "T12:00:00")}
                    onSelect={(date) => {
                      if (date) setRecurringStartDate(date.toLocaleDateString("en-CA", { timeZone: TZ }));
                      setRecurringCalendarOpen(false);
                    }}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setRecurringDialogOpen(false);
                resetRecurringForm();
              }}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleCreateRecurring}
              disabled={
                (recurringFrequency === "monthly" &&
                  (!recurringAmount || parseFloat(recurringAmount) <= 0)) ||
                !recurringDescription.trim() ||
                createRecurring.isPending
              }
            >
              Crear
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Update (close + replace) recurring template dialog ─── */}
      <Dialog
        open={updateDialogOpen}
        onOpenChange={(open) => {
          setUpdateDialogOpen(open);
          if (!open) setUpdatingTemplate(null);
        }}
      >
        <DialogContent className="sm:max-w-xl ios-glass rounded-2xl">
          <DialogHeader>
            <DialogTitle>Actualizar</DialogTitle>
            <DialogDescription>
              Esto NO edita el gasto actual: cierra &quot;{updatingTemplate?.description}&quot; el día
              anterior a la nueva fecha y crea un gasto fijo nuevo con el monto y la frecuencia
              actualizados. El histórico queda intacto.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {updateFrequency === "monthly" ? (
              <div className="space-y-1.5">
                <Label>Nuevo monto {frequencyLabels[updateFrequency].toLowerCase()}</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={updateAmount}
                  onChange={(e) => setUpdateAmount(e.target.value)}
                />
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">
                El monto se carga cada {recurringPeriodNoun[updateFrequency]} en &quot;Del
                período&quot;, ya que puede variar.
              </p>
            )}

            {updatingTemplate?.category === "salaries" && (
              <div className="space-y-1.5">
                <Label>Frecuencia</Label>
                <Select
                  value={updateFrequency}
                  onValueChange={(v) => setUpdateFrequency(v as RecurringExpenseFrequency)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="weekly">{frequencyLabels.weekly}</SelectItem>
                    <SelectItem value="biweekly">{frequencyLabels.biweekly}</SelectItem>
                    <SelectItem value="monthly">{frequencyLabels.monthly}</SelectItem>
                  </SelectContent>
                </Select>
                {updatePaydayPreview && (
                  <p className="text-xs text-muted-foreground">{updatePaydayPreview}</p>
                )}
              </div>
            )}

            <div className="space-y-1.5">
              <Label>Vigente desde</Label>
              <Popover open={updateCalendarOpen} onOpenChange={setUpdateCalendarOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start gap-2 font-normal">
                    <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                    {formatDisplayDate(updateStartDate)}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={new Date(updateStartDate + "T12:00:00")}
                    onSelect={(date) => {
                      if (date) setUpdateStartDate(date.toLocaleDateString("en-CA", { timeZone: TZ }));
                      setUpdateCalendarOpen(false);
                    }}
                  />
                </PopoverContent>
              </Popover>
              {updatingTemplate && (
                <p className="text-xs text-muted-foreground">
                  El gasto anterior se cerrará el {formatDisplayDate(dayBeforeStr(updateStartDate))}.
                </p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setUpdateDialogOpen(false);
                setUpdatingTemplate(null);
              }}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleUpdateRecurring}
              disabled={
                (updateFrequency === "monthly" &&
                  (!updateAmount || parseFloat(updateAmount) <= 0)) ||
                closeAndReplace.isPending
              }
            >
              Cerrar y crear nuevo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Delete recurring template confirm ─── */}
      <AlertDialog
        open={!!deletingRecurring}
        onOpenChange={(open) => !open && setDeletingRecurring(null)}
      >
        <AlertDialogContent className="ios-glass rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar gasto fijo</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Eliminar &quot;{deletingRecurring?.description}&quot;? Usá esto solo para entradas
              cargadas por error, no para cambios de monto. Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive" onClick={handleDeleteRecurring}>
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
