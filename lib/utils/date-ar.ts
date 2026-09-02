// Argentina-timezone (America/Argentina/Buenos_Aires) date-boundary helpers.
// Argentina is always UTC-3 (no DST), which the arithmetic below relies on.
// Load-bearing for financial reporting periods — useOrdersHistory's
// analytics queries and usePeriodSelector's shared month/week/custom period
// state both import from here instead of redefining this math, so the two
// can never drift out of sync with each other.

export const TZ = "America/Argentina/Buenos_Aires";

// Get YYYY-MM-DD in Argentina timezone.
export function toArDateStr(date: Date): string {
  return date.toLocaleDateString("en-CA", { timeZone: TZ }); // en-CA = YYYY-MM-DD
}

// Build UTC Date from an Argentina local date string (YYYY-MM-DD).
// Argentina is always UTC-3 (no DST).
export function arDateToUTC(dateStr: string, endOfDay = false): Date {
  const [year, month, day] = dateStr.split("-").map(Number);
  const h = endOfDay ? 23 : 0;
  const m = endOfDay ? 59 : 0;
  const s = endOfDay ? 59 : 0;
  return new Date(Date.UTC(year, month - 1, day, h + 3, m, s));
}

// The "ar-trick" Date: its system-local wall-clock reading (getFullYear,
// getMonth, getDate, getDay, ...) matches `date`'s wall-clock reading in
// Argentina time, regardless of the host machine's own timezone. Only safe
// to read back with system-local getters/setters — never format it with an
// explicit `timeZone` option (that re-applies a second, likely different,
// offset on top of the trick).
function toArLocalDate(date: Date): Date {
  return new Date(date.toLocaleString("en-US", { timeZone: TZ }));
}

// Monday/Sunday (inclusive) of the Argentina calendar week containing
// `date`, as ar-trick Dates — read them back with system-local getters, or
// hand them to a caller-specific formatter (toArDateStr, toLocaleDateString
// with timeZone: TZ, etc).
export function getArWeekBounds(date: Date): { monday: Date; sunday: Date } {
  const ar = toArLocalDate(date);
  const day = ar.getDay(); // 0=Sun
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const monday = new Date(ar);
  monday.setDate(ar.getDate() + diffToMonday);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return { monday, sunday };
}

// First/last calendar day (YYYY-MM-DD) of the Argentina calendar month
// containing `date`.
export function getArMonthBounds(date: Date): { firstDay: string; lastDay: string } {
  const ar = toArLocalDate(date);
  const year = ar.getFullYear();
  const month = ar.getMonth();
  const lastDate = new Date(year, month + 1, 0).getDate();
  const firstDay = `${year}-${String(month + 1).padStart(2, "0")}-01`;
  const lastDay = `${year}-${String(month + 1).padStart(2, "0")}-${String(lastDate).padStart(2, "0")}`;
  return { firstDay, lastDay };
}

export function getMonthRange(date: Date): { start: Date; end: Date } {
  const { firstDay, lastDay } = getArMonthBounds(date);
  return { start: arDateToUTC(firstDay, false), end: arDateToUTC(lastDay, true) };
}

export function getWeekRange(date: Date): { start: Date; end: Date } {
  const { monday, sunday } = getArWeekBounds(date);
  const fmt = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  return { start: arDateToUTC(fmt(monday), false), end: arDateToUTC(fmt(sunday), true) };
}
