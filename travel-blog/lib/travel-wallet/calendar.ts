import type { Country, Expense } from "./types";
import { convertExpenseToPLN, convertExpenseToBaseByTripId } from "./expenses";

export interface DailyCalendarEntry {
  date: string; // YYYY-MM-DD
  dailyTotal: number; // suma expenses dla dnia (w PLN)
  expenses: Expense[];
}

/**
 * Generuje listę wszystkich dni między startDate a endDate (włącznie)
 * Format: YYYY-MM-DD
 */
export function generateDaysBetween(
  startDate: string,
  endDate: string
): string[] {
  if (!startDate || !endDate) return [];

  const start = new Date(startDate);
  const end = new Date(endDate);

  if (isNaN(start.getTime()) || isNaN(end.getTime())) return [];
  if (start > end) return [];

  const days: string[] = [];
  const current = new Date(start);

  while (current <= end) {
    const year = current.getFullYear();
    const month = String(current.getMonth() + 1).padStart(2, "0");
    const day = String(current.getDate()).padStart(2, "0");
    days.push(`${year}-${month}-${day}`);
    current.setDate(current.getDate() + 1);
  }

  return days;
}

/**
 * Zwraca liczbę dni wydatku (1 gdy brak endDate, inaczej date..endDate włącznie).
 */
export function getExpenseDayCount(expense: Expense): number {
  if (!expense.endDate || expense.endDate === expense.date) return 1;
  const days = generateDaysBetween(expense.date, expense.endDate);
  return days.length;
}

/**
 * Rozkłada wydatek na dni z udziałem kwoty per dzień.
 * Dla wielodniowego: amount / numberOfDays na każdy dzień; dla jednodniowego: jeden element z pełną kwotą.
 */
export function getExpenseDays(
  expense: Expense
): Array<{ date: string; amountPortion: number }> {
  const days = expense.endDate
    ? generateDaysBetween(expense.date, expense.endDate)
    : [expense.date];
  const portion = days.length > 0 ? expense.amount / days.length : 0;
  return days.map((date) => ({ date, amountPortion: portion }));
}

/**
 * Sprawdza, czy dana data (YYYY-MM-DD) należy do okresu wydatku [date, endDate].
 */
export function isDateInExpenseRange(dateStr: string, expense: Expense): boolean {
  if (dateStr < expense.date) return false;
  if (!expense.endDate) return expense.date === dateStr;
  return dateStr <= expense.endDate;
}

/**
 * Dla wszystkich wydatków zwraca płaską listę (dzień, wydatek, udział kwoty w tym dniu).
 * Użyteczne do sum dziennych i kalendarza.
 */
export function getDailyPortions(
  expenses: Expense[]
): Array<{ date: string; expense: Expense; amountPortion: number }> {
  const result: Array<{ date: string; expense: Expense; amountPortion: number }> = [];
  expenses.forEach((expense) => {
    getExpenseDays(expense).forEach(({ date, amountPortion }) => {
      result.push({ date, expense, amountPortion });
    });
  });
  return result;
}

/**
 * Grupuje expenses według daty. Wielodniowe wydatki trafiają do każdego dnia z zakresu [date, endDate].
 */
export function groupExpensesByDay(
  expenses: Expense[]
): Record<string, Expense[]> {
  const grouped: Record<string, Expense[]> = {};

  expenses.forEach((expense) => {
    const dates = getExpenseDays(expense).map((d) => d.date);
    dates.forEach((date) => {
      if (!grouped[date]) grouped[date] = [];
      grouped[date].push(expense);
    });
  });

  return grouped;
}

/**
 * Oblicza sumę expenses dla dnia w walucie bazowej (gdy tripId) lub PLN.
 */
export function calculateDailyTotalWithPortions(
  date: string,
  expenses: Expense[],
  tripId?: string
): number {
  return getDailyTotalInPLNForDate(date, expenses, tripId);
}

/**
 * Buduje strukturę kalendarza dla kraju.
 * Suma dzienna w walucie bazowej gdy podano tripId, inaczej PLN.
 */
export function buildDailyCalendar(
  country: Country,
  expenses: Expense[],
  tripId?: string
): DailyCalendarEntry[] {
  if (!country.startDate || !country.endDate) {
    return [];
  }

  const days = generateDaysBetween(country.startDate, country.endDate);
  const groupedExpenses = groupExpensesByDay(expenses);

  return days.map((date) => {
    const dayExpenses = groupedExpenses[date] || [];
    return {
      date,
      dailyTotal: getDailyTotalInPLNForDate(date, expenses, tripId),
      expenses: dayExpenses,
    };
  });
}

/**
 * Pobiera wszystkie dni w miesiącu
 */
export function getDaysInMonth(year: number, month: number): Date[] {
  const days: Date[] = [];
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);

  for (let day = 1; day <= lastDay.getDate(); day++) {
    days.push(new Date(year, month, day));
  }

  return days;
}

/**
 * Zwraca numer pierwszego dnia tygodnia w miesiącu (0 = niedziela, 1 = poniedziałek, etc.)
 */
export function getFirstDayOfMonth(year: number, month: number): number {
  const firstDay = new Date(year, month, 1);
  return firstDay.getDay();
}

/**
 * Sprawdza czy są expenses dla danej daty (uwzględnia wielodniowe: date w [expense.date, expense.endDate]).
 */
export function hasExpensesOnDate(date: string, expenses: Expense[]): boolean {
  return expenses.some((expense) => isDateInExpenseRange(date, expense));
}

/**
 * Pobiera expenses dotyczące danej daty (wielodniowe traktowane jako „w tym dniu”).
 */
export function getExpensesForDate(
  date: string,
  expenses: Expense[]
): Expense[] {
  return expenses.filter((expense) => isDateInExpenseRange(date, expense));
}

/**
 * Zwraca liczbę dni (w zadanym zakresie), w których występuje przynajmniej jeden udział (portion) wydatku.
 * Wydatek rozłożony na 3 dni daje 3 takie dni – używane do średniej dziennej (wydatek/3 per dzień).
 */
export function getDaysWithExpensePortionsInRange(
  expenses: Expense[],
  startDate: string,
  endDate: string
): number {
  const portions = getDailyPortions(expenses);
  const inRange = portions.filter((p) => p.date >= startDate && p.date <= endDate);
  return new Set(inRange.map((p) => p.date)).size;
}

/**
 * Zwraca liczbę unikalnych dni z udziałami (portions) – bez filtra zakresu.
 * Wydatek na 3 dni = 3 dni.
 */
export function getDaysWithExpensePortions(expenses: Expense[]): number {
  const portions = getDailyPortions(expenses);
  return new Set(portions.map((p) => p.date)).size;
}

/**
 * Suma dzienna dla daty w walucie bazowej (gdy podano tripId) lub PLN.
 */
export function getDailyTotalInPLNForDate(
  date: string,
  expenses: Expense[],
  tripId?: string
): number {
  const portions = getDailyPortions(expenses).filter((p) => p.date === date);
  const convert = tripId
    ? (e: Expense) => convertExpenseToBaseByTripId(e, tripId)
    : (e: Expense) => convertExpenseToPLN(e);
  return portions.reduce((sum, { expense, amountPortion }) => {
    const ratio = expense.amount > 0 ? amountPortion / expense.amount : 0;
    return sum + ratio * convert(expense);
  }, 0);
}

/**
 * Formatuje datę do YYYY-MM-DD
 */
export function formatDateToYYYYMMDD(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

