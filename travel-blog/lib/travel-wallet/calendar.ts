import type { Country, Expense } from "./types";
import { convertExpenseToPLN } from "./expenses";

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
 * Grupuje expenses według daty
 */
export function groupExpensesByDay(
  expenses: Expense[]
): Record<string, Expense[]> {
  const grouped: Record<string, Expense[]> = {};

  expenses.forEach((expense) => {
    const date = expense.date; // już w formacie YYYY-MM-DD
    if (!grouped[date]) {
      grouped[date] = [];
    }
    grouped[date].push(expense);
  });

  return grouped;
}

/**
 * Oblicza sumę expenses dla dnia w PLN
 */
function calculateDailyTotal(expenses: Expense[]): number {
  return expenses.reduce((total, expense) => {
    return total + convertExpenseToPLN(expense);
  }, 0);
}

/**
 * Buduje strukturę kalendarza dla kraju
 * Zawiera wszystkie dni między startDate a endDate, nawet bez expenses
 */
export function buildDailyCalendar(
  country: Country,
  expenses: Expense[]
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
      dailyTotal: calculateDailyTotal(dayExpenses),
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
 * Sprawdza czy są expenses dla danej daty
 */
export function hasExpensesOnDate(date: string, expenses: Expense[]): boolean {
  return expenses.some((expense) => expense.date === date);
}

/**
 * Pobiera expenses dla danej daty
 */
export function getExpensesForDate(
  date: string,
  expenses: Expense[]
): Expense[] {
  return expenses.filter((expense) => expense.date === date);
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

