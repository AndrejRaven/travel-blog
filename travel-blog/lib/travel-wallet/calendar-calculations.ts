import type { DailyCalendarEntry } from "./calendar";

/**
 * Oblicza całkowite wydatki kraju na podstawie kalendarza
 */
export function calculateTotalCountryExpenses(
  calendar: DailyCalendarEntry[]
): number {
  return calendar.reduce((total, day) => total + day.dailyTotal, 0);
}

/**
 * Oblicza średni dzienny koszt
 */
export function calculateAverageDailyCost(
  total: number,
  days: number
): number {
  if (days === 0) return 0;
  return total / days;
}

/**
 * Liczy dni z expenses
 */
export function countDaysWithExpenses(
  calendar: DailyCalendarEntry[]
): number {
  return calendar.filter((day) => day.expenses.length > 0).length;
}

/**
 * Liczy dni bez expenses
 */
export function countDaysWithoutExpenses(
  calendar: DailyCalendarEntry[]
): number {
  return calendar.filter((day) => day.expenses.length === 0).length;
}

