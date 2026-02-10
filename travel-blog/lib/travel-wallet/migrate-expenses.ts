/**
 * Migracja starych wydatków - dodaje domyślne paymentMethod
 * Uruchamia się automatycznie przy załadowaniu expenses
 */

import type { Expense } from "./types";
import { getAllTrips, updateTrip } from "./trips-storage";
import { getAllExpenses, saveExpense } from "./expenses";

/**
 * Sprawdza czy wydatek ma ustawiony paymentMethod
 */
function hasPaymentMethod(expense: Expense): boolean {
  return !!expense.paymentMethod;
}

/**
 * Migruje pojedynczy wydatek - dodaje domyślny paymentMethod
 */
function migrateExpense(expense: Expense): Expense {
  if (hasPaymentMethod(expense)) {
    return expense; // Już zmigrowany
  }

  // Dodaj domyślny paymentMethod (karta PLN)
  return {
    ...expense,
    paymentMethod: {
      type: "card",
      sourceCurrency: "PLN",
    },
  };
}

/**
 * Migruje wszystkie wydatki dla podróży
 */
export function migrateExpensesForTrip(tripId: string): number {
  const expenses = getAllExpenses(tripId);
  let migratedCount = 0;

  expenses.forEach((expense) => {
    if (!hasPaymentMethod(expense)) {
      const migratedExpense = migrateExpense(expense);
      saveExpense(migratedExpense, tripId);
      migratedCount++;
    }
  });

  return migratedCount;
}

/**
 * Migruje wszystkie wydatki we wszystkich podróżach
 */
export function migrateAllExpenses(): {
  tripsProcessed: number;
  expensesMigrated: number;
} {
  const trips = getAllTrips();
  let totalMigrated = 0;

  trips.forEach((trip) => {
    const migrated = migrateExpensesForTrip(trip.id);
    totalMigrated += migrated;
  });

  return {
    tripsProcessed: trips.length,
    expensesMigrated: totalMigrated,
  };
}

/**
 * Sprawdza czy są wydatki wymagające migracji
 */
export function needsMigration(): boolean {
  const trips = getAllTrips();
  
  for (const trip of trips) {
    const expenses = getAllExpenses(trip.id);
    const hasUnmigratedExpenses = expenses.some((exp) => !hasPaymentMethod(exp));
    
    if (hasUnmigratedExpenses) {
      return true;
    }
  }
  
  return false;
}

/**
 * Auto-migracja uruchamiana przy starcie aplikacji
 * Zapisuje informację o migracji w localStorage
 */
export function autoMigrateExpenses(): void {
  const MIGRATION_KEY = "travel-wallet-expenses-migrated";
  const migrated = localStorage.getItem(MIGRATION_KEY);

  if (migrated === "true") {
    return; // Już zmigrowane
  }

  if (needsMigration()) {
    migrateAllExpenses();
    localStorage.setItem(MIGRATION_KEY, "true");
  } else {
    localStorage.setItem(MIGRATION_KEY, "true");
  }
}
