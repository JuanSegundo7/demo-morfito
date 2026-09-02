// Shared local helpers for the one-off and recurring expense tabs — pure
// formatting/labeling utilities that don't belong in lib/utils/expenses.ts
// (which is shared far more broadly across Finanzas) but are used by both
// components/finanzas/expenses-tab.tsx and
// components/finanzas/recurring-expenses-tab.tsx.
import { TZ } from "@/lib/hooks/use-period-selector";
import { monthWindowFor, previewPaydayDates } from "@/lib/utils/expenses";
import type { RecurringExpenseFrequency } from "@/lib/types";

export const frequencyLabels: Record<RecurringExpenseFrequency, string> = {
  weekly: "Semanal",
  biweekly: "Quincenal",
  monthly: "Mensual",
};
export const frequencySuffix: Record<RecurringExpenseFrequency, string> = {
  weekly: "/semana",
  biweekly: "/quincena",
  monthly: "/mes",
};

// "cada semana"/"cada quincena" phrasing for the amount-input replacement
// text below — frequencyLabels holds adjective forms ("Semanal",
// "Quincenal") which read wrong in "se carga cada semanal"; this map holds
// the noun form the sentence actually needs. Only weekly/biweekly ever hit
// this text (monthly keeps its amount input), so monthly isn't listed here.
export const recurringPeriodNoun: Record<"weekly" | "biweekly", string> = {
  weekly: "semana",
  biweekly: "quincena",
};

export function toArStr(d: Date): string {
  return d.toLocaleDateString("en-CA", { timeZone: TZ });
}

export function todayArStr(): string {
  return toArStr(new Date());
}

export function formatDisplayDate(dateStr: string): string {
  return new Date(dateStr + "T12:00:00").toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

// Informational preview shown below the Frecuencia select in the create and
// update recurring-template dialogs. Only weekly/biweekly have discrete
// paydays to preview — monthly stays smoothed, no preview for it. Weekly
// and biweekly are worded asymmetrically on purpose: a weekly payday always
// lands on the same weekday (7 has no remainder mod 7), so naming it is
// accurate; a biweekly payday's weekday drifts by one day every occurrence
// (15 days = 2 weeks + 1 day), so claiming a fixed weekday would be wrong.
export function paydayPreviewText(
  startDate: string,
  frequency: RecurringExpenseFrequency,
  // Which month's window to preview — defaults to startDate's own month
  // (dialog use case: previewing relative to whatever date you're picking).
  // The list row passes today's date instead, so an already-active template
  // shows THIS month's actual payday count, not the month it happened to
  // start in.
  referenceDate: string = startDate
): string | null {
  if (frequency !== "weekly" && frequency !== "biweekly") return null;

  const intervalDays = frequency === "weekly" ? 7 : 15;
  const window = monthWindowFor(referenceDate);
  const occurrences = previewPaydayDates(startDate, intervalDays, window.start, window.end);

  if (frequency === "weekly") {
    const weekday = new Date(startDate + "T12:00:00").toLocaleDateString("es-AR", {
      weekday: "long",
      timeZone: TZ,
    });
    return `Se paga todos los ${weekday} · ${occurrences.length} pagos este mes`;
  }

  return `Se paga cada 15 días desde el ${formatDisplayDate(startDate)} · ${occurrences.length} pagos este mes`;
}

// One calendar day before `dateStr` (both plain YYYY-MM-DD calendar dates,
// no AR-local instant conversion needed here).
export function dayBeforeStr(dateStr: string): string {
  const [year, month, day] = dateStr.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  date.setUTCDate(date.getUTCDate() - 1);
  return date.toISOString().slice(0, 10);
}
