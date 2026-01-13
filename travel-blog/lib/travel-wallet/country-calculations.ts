import type { Expense } from "./types";
import { convertExpenseToPLN } from "./expenses";

/**
 * Oblicza całkowity faktyczny koszt na podstawie expenses (w PLN)
 */
export function calculateTotalActualCost(expenses: Expense[]): number {
  return expenses.reduce((total, expense) => {
    return total + convertExpenseToPLN(expense);
  }, 0);
}

/**
 * Oblicza liczbę dni podróży na podstawie dat start i end
 */
export function calculateTravelDays(
  startDate?: string,
  endDate?: string
): number {
  if (!startDate || !endDate) return 0;

  const start = new Date(startDate);
  const end = new Date(endDate);

  // Różnica w milisekundach
  const diffTime = end.getTime() - start.getTime();
  // Konwersja na dni (dodajemy 1, żeby uwzględnić dzień startowy)
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

  return diffDays > 0 ? diffDays : 0;
}

/**
 * Oblicza średni dzienny koszt
 */
export function calculateAverageDailyCost(
  totalCost: number,
  days: number
): number {
  if (days === 0) return 0;
  return totalCost / days;
}

/**
 * Oblicza różnicę między planowanym a faktycznym budżetem
 */
export function calculateBudgetDifference(
  planned: number,
  actual: number
): number {
  return actual - planned;
}

/**
 * Sprawdza czy przekroczono budżet
 */
export function isOverBudget(planned: number, actual: number): boolean {
  return actual > planned;
}

