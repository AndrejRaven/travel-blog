import type { Expense, ExchangeRate } from "./types";
import { convertToBaseCurrency } from "./reference-rates";
import { tripEvents } from "./events";
import { DataAccess } from "./data-access";
import { getTripById, updateTrip } from "./trips-storage";
import { getWallet, updateWallet } from "./wallet-storage";
import { adjustCurrencyBalance } from "./wallet-operations";
import { executeExpense } from "./expense-operations";
import { logExpenseEdited } from "./activity-log";

/**
 * Kursy walut do PLN (przykładowe, później można pobrać z API)
 * rate = ile PLN za 1 jednostkę waluty (np. 1 NOK = 0.36 PLN)
 */
const exchangeRates: Record<string, number> = {
  PLN: 1,
  USD: 4.0,
  EUR: 4.3,
  JPY: 0.027,
  THB: 0.11,
  GBP: 5.1,
  KRW: 0.003,
  TWD: 0.13,
  KZT: 0.007,
  AED: 1.09,
  NOK: 0.36, // 1 NOK ≈ 0.36 PLN
};

/**
 * Konwertuje kwotę w danej walucie na PLN
 */
function convertToPLN(amount: number, currency: string): number {
  const rate = exchangeRates[currency.toUpperCase()] || 1;
  return amount * rate;
}


/**
 * Pobiera wszystkie expenses z trip.data.expenses
 */
function getAllExpensesFromStorage(tripId: string): Expense[] {
  if (typeof window === "undefined") {
    return [];
  }

  if (!tripId) {
    throw new Error("tripId is required");
  }

  const trip = getTripById(tripId);

  return trip?.data.expenses || [];
}

/**
 * Zapisuje wszystkie expenses do trip.data.expenses
 */
function saveExpensesToStorage(expenses: Expense[], tripId: string): boolean {
  if (typeof window === "undefined" || !tripId) {
    return false;
  }

  const trip = getTripById(tripId);

  if (!trip) {
    return false;
  }

  return updateTrip(tripId, {
    data: {
      ...trip.data,
      expenses,
    },
    updatedAt: new Date().toISOString(),
  });
}


/**
 * Generuje unikalne ID dla expense
 */
function generateExpenseId(): string {
  return `exp-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}

/**
 * Pobiera wszystkie expenses dla podróży
 * @param tripId - ID podróży (wymagane)
 */
export function getAllExpenses(tripId: string): Expense[] {
  if (!tripId) {
    throw new Error("tripId is required");
  }
  return getAllExpensesFromStorage(tripId);
}

/**
 * Pobiera wszystkie expenses dla danego kraju
 * @param countryId - ID kraju
 * @param tripId - ID podróży (wymagane)
 */
export function getExpensesByCountryId(
  countryId: string,
  tripId: string
): Expense[] {
  return getAllExpenses(tripId).filter(
    (expense) => expense.countryId === countryId
  );
}

/**
 * Sprawdza czy kraj ma wydatki
 * @param tripId - ID podróży
 * @param countryId - ID kraju
 * @returns true jeśli kraj ma wydatki
 */
export function hasExpensesForCountry(
  tripId: string,
  countryId: string
): boolean {
  const expenses = getExpensesByCountryId(countryId, tripId);
  return expenses.length > 0;
}

/**
 * Pobiera expense po ID
 * @param id - ID expense
 * @param tripId - ID podróży (wymagane)
 */
export function getExpenseById(id: string, tripId: string): Expense | null {
  return getAllExpenses(tripId).find((expense) => expense.id === id) || null;
}

/**
 * Dodaje nowy expense z auto-generowanym ID
 * @param expenseData - dane expense (bez ID, tripId jest wymagane)
 * @param tripId - ID podróży (wymagane)
 */
export function addExpense(
  expenseData: Omit<Expense, "id">,
  tripId: string
): Expense {
  if (!tripId) {
    throw new Error("tripId is required");
  }

  const newExpense: Expense = {
    ...expenseData,
    id: generateExpenseId(),
    tripId,
  };

  // Walidacja przed zapisem
  const validation = DataAccess.validateExpense(newExpense, tripId);
  if (!validation.valid) {
    console.error("[addExpense] Validation failed:", validation.errors);
    throw new Error(`Expense validation failed: ${validation.errors.join(", ")}`);
  }

  // Try to update wallet if new system is available
  try {

    const wallet = getWallet(tripId);
    if (wallet) {
      const result = executeExpense(wallet, newExpense);
      if (result.success) {
        updateWallet(tripId, result.newWallet);
      } else {
        throw new Error(result.error || "Failed to execute expense in wallet");
      }
    }
  } catch (error) {
    // If wallet system not available, continue with old system
    console.warn("Wallet system not available, using legacy expense storage:", error);
  }

  const allExpenses = getAllExpensesFromStorage(tripId);
  allExpenses.push(newExpense);
  const success = saveExpensesToStorage(allExpenses, tripId);

  if (success) {
    tripEvents.emit("expense:added", tripId, newExpense);

    // Oznacz podróż jako pending do synchronizacji
    if (typeof window !== "undefined") {
      const trip = getTripById(tripId);
      if (trip && trip.syncStatus !== 'pending') {
        updateTrip(tripId, {
          syncStatus: 'pending' as const,
          localVersion: (trip.localVersion || 0) + 1,
        });
      }
    }
  }

  return newExpense;
}

/**
 * Zapisuje expense (aktualizuje istniejący lub dodaje nowy)
 * @param expense - expense do zapisania (musi mieć tripId)
 * @param tripId - ID podróży (wymagane)
 */
export function saveExpense(expense: Expense, tripId: string): boolean {
  if (!tripId) {
    return false;
  }

  // Walidacja przed zapisem
  const validation = DataAccess.validateExpense(expense, tripId);
  if (!validation.valid) {
    console.error("[saveExpense] Validation failed:", validation.errors);
    return false;
  }

  const allExpenses = getAllExpensesFromStorage(tripId);
  const index = allExpenses.findIndex((e) => e.id === expense.id);
  // Głęboka kopia starej wartości PRZED aktualizacją
  const oldExpense = index >= 0 ? { ...allExpenses[index] } : null;

  // Try to update wallet if new system is available
  if (oldExpense) {
    try {
      const wallet = getWallet(tripId);
      if (wallet) {
        // Reverse old expense
        const updatedWallet = adjustCurrencyBalance(
          wallet,
          oldExpense.currency,
          oldExpense.amount
        );
        // Apply new expense
        const result = executeExpense(updatedWallet, expense);
        if (result.success) {
          updateWallet(tripId, result.newWallet);
        } else {
          console.error("Failed to update expense in wallet:", result.error);
        }
      }
    } catch (error) {
      console.warn("Wallet system not available:", error);
    }
  } else {
    // New expense - handle wallet update inline to avoid circular dependency
    try {
      const wallet = getWallet(tripId);
      if (wallet) {
        const result = executeExpense(wallet, expense);
        if (result.success) {
          updateWallet(tripId, result.newWallet);
        } else {
          throw new Error(result.error || "Failed to execute expense in wallet");
        }
      }
    } catch (error) {
      console.warn("Wallet system not available:", error);
    }
  }

  // Loguj edycję PRZED aktualizacją wydatku w storage (aby snapshot miał starą wartość)
  if (index >= 0 && oldExpense) {
    logExpenseEdited(tripId, expense.id, {
      amount: oldExpense.amount,
      currency: oldExpense.currency,
      description: oldExpense.description,
      date: oldExpense.date,
      endDate: oldExpense.endDate,
      category: oldExpense.category,
      countryId: oldExpense.countryId,
      location: oldExpense.location,
      note: oldExpense.note,
      accommodationType: oldExpense.accommodationType,
    }, {
      amount: expense.amount,
      currency: expense.currency,
      description: expense.description,
      date: expense.date,
      endDate: expense.endDate,
      category: expense.category,
      countryId: expense.countryId,
      location: expense.location,
      note: expense.note,
      accommodationType: expense.accommodationType,
    });
  }

  if (index >= 0) {
    // Aktualizuj istniejący
    allExpenses[index] = { ...expense, tripId };
  } else {
    // Dodaj nowy
    allExpenses.push({ ...expense, tripId });
  }

  const success = saveExpensesToStorage(allExpenses, tripId);

  if (success) {
    if (index >= 0) {
      tripEvents.emit("expense:updated", tripId, expense);
    } else {
      tripEvents.emit("expense:added", tripId, expense);
    }

    // Oznacz podróż jako pending do synchronizacji
    if (typeof window !== "undefined") {
      const trip = getTripById(tripId);
      if (trip && trip.syncStatus !== 'pending') {
        updateTrip(tripId, {
          syncStatus: 'pending' as const,
          localVersion: (trip.localVersion || 0) + 1,
        });
      }
    }
  }

  return success;
}

/**
 * Usuwa expense po ID
 * @param id - ID expense do usunięcia
 * @param tripId - ID podróży (wymagane)
 */
export function deleteExpense(id: string, tripId: string): boolean {
  if (!tripId) {
    return false;
  }

  const allExpenses = getAllExpensesFromStorage(tripId);
  const expenseToDelete = allExpenses.find((e) => e.id === id);
  const filtered = allExpenses.filter((e) => e.id !== id);

  if (filtered.length === allExpenses.length) {
    // Nie znaleziono expense do usunięcia
    return false;
  }

  const success = saveExpensesToStorage(filtered, tripId);

  if (success && expenseToDelete) {
    tripEvents.emit("expense:deleted", tripId, expenseToDelete);

    // Oznacz podróż jako pending do synchronizacji
    if (typeof window !== "undefined") {
      const trip = getTripById(tripId);
      if (trip && trip.syncStatus !== 'pending') {
        updateTrip(tripId, {
          syncStatus: 'pending' as const,
          localVersion: (trip.localVersion || 0) + 1,
        });
      }
    }
  }

  return success;
}

/**
 * Konwertuje expense na kwotę w walucie bazowej (używa reference rates z portfela)
 */
export function convertExpenseToBase(
  expense: Expense,
  baseCurrency: string,
  referenceRates: ExchangeRate[]
): number {
  if (!expense || typeof expense.amount !== "number" || !expense.currency) {
    return 0;
  }
  return convertToBaseCurrency(
    expense.amount,
    expense.currency,
    baseCurrency,
    referenceRates
  );
}

/**
 * Konwertuje expense na walutę bazową podróży (pobiera wallet po tripId)
 */
export function convertExpenseToBaseByTripId(
  expense: Expense,
  tripId: string
): number {
  if (!expense || !tripId) return 0;
  const wallet = getWallet(tripId);
  if (!wallet) {
    return convertExpenseToPLN(expense);
  }
  return convertExpenseToBase(
    expense,
    wallet.baseCurrency,
    wallet.referenceRates
  );
}

/**
 * Konwertuje expense na PLN (fallback gdy brak tripId / wallet)
 */
export function convertExpenseToPLN(expense: Expense): number {
  if (!expense || typeof expense.amount !== 'number' || !expense.currency) {
    return 0;
  }
  return convertToPLN(expense.amount, expense.currency);
}

/**
 * Filtruje wydatki według lokalizacji
 * @param expenses - lista wydatków
 * @param location - lokalizacja do filtrowania (undefined = wszystkie lokalizacje)
 * @returns przefiltrowana lista wydatków
 */
export function filterExpensesByLocation(
  expenses: Expense[],
  location?: string
): Expense[] {
  if (!location) {
    return expenses; // Zwróć wszystkie wydatki
  }
  return expenses.filter((expense) => expense.location === location);
}

/**
 * Pobiera unikalne lokalizacje z listy wydatków
 * @param expenses - lista wydatków
 * @returns tablica unikalnych lokalizacji (bez duplikatów)
 */
export function getUniqueLocationsFromExpenses(expenses: Expense[]): string[] {
  const locations = expenses
    .map((expense) => expense.location)
    .filter((location): location is string => !!location); // Filtruj puste/undefined
  return Array.from(new Set(locations)).sort();
}

/**
 * Aktualizuje lokalizację we wszystkich wydatkach dla danego kraju
 * @param tripId - ID podróży
 * @param countryId - ID kraju
 * @param oldLocation - stara nazwa lokalizacji
 * @param newLocation - nowa nazwa lokalizacji
 * @returns true jeśli aktualizacja się powiodła
 */
export function updateExpenseLocation(
  tripId: string,
  countryId: string,
  oldLocation: string,
  newLocation: string
): boolean {
  if (typeof window === "undefined") return false;

  try {
    const expenses = getAllExpensesFromStorage(tripId);
    let needsUpdate = false;

    // Zaktualizuj lokalizację we wszystkich wydatkach dla danego kraju
    expenses.forEach((expense) => {
      if (
        expense.countryId === countryId &&
        expense.tripId === tripId &&
        expense.location === oldLocation
      ) {
        expense.location = newLocation;
        needsUpdate = true;
      }
    });

    if (needsUpdate) {
      const success = saveExpensesToStorage(expenses, tripId);
      if (success) {
        tripEvents.emit("expense:updated", tripId);
      }
      return success;
    }

    return true; // Brak wydatków do aktualizacji, ale to nie jest błąd
  } catch (error) {
    console.error("Error updating expense location:", error);
    return false;
  }
}

/**
 * Automatycznie dodaje lokalizację do wydatków bez lokalizacji w zakresie dat
 * @param tripId - ID podróży
 * @param countryId - ID kraju
 * @param location - nazwa lokalizacji do dodania
 * @param startDate - data rozpoczęcia zakresu (YYYY-MM-DD)
 * @param endDate - data zakończenia zakresu (YYYY-MM-DD)
 * @returns true jeśli aktualizacja się powiodła
 */
export function addLocationToExpensesInDateRange(
  tripId: string,
  countryId: string,
  location: string,
  startDate: string,
  endDate: string
): boolean {
  if (typeof window === "undefined") return false;

  try {
    const expenses = getAllExpensesFromStorage(tripId);
    let needsUpdate = false;

    const start = new Date(startDate);
    const end = new Date(endDate);

    // Zaktualizuj lokalizację we wszystkich wydatkach dla danego kraju
    // które są w zakresie dat i nie mają jeszcze lokalizacji
    expenses.forEach((expense) => {
      if (
        expense.countryId === countryId &&
        expense.tripId === tripId &&
        (!expense.location || expense.location.trim() === "")
      ) {
        const expenseDate = new Date(expense.date);
        // Sprawdź czy data wydatku jest w zakresie lokalizacji
        if (expenseDate >= start && expenseDate <= end) {
          expense.location = location;
          needsUpdate = true;
        }
      }
    });

    if (needsUpdate) {
      const success = saveExpensesToStorage(expenses, tripId);
      if (success) {
        tripEvents.emit("expense:updated", tripId);
      }
      return success;
    }

    return true; // Brak wydatków do aktualizacji, ale to nie jest błąd
  } catch (error) {
    console.error("Error adding location to expenses:", error);
    return false;
  }
}

/**
 * Oblicza kategorie wydatków na podstawie listy wydatków
 * @param expenses - lista wydatków
 * @param plannedCategories - opcjonalne planowane kategorie (zachowuje plannedAmount)
 * @returns tablica kategorii z obliczonymi kwotami
 */
export function calculateExpenseCategories(
  expenses: Expense[],
  plannedCategories?: Array<{ name: string; plannedAmount: number }>
): Array<{ name: string; amount: number; plannedAmount: number }> {
  const categoryMap = new Map<string, number>();

  // Oblicz faktyczne wydatki dla każdej kategorii
  expenses.forEach((expense) => {
    const amountInPLN = convertExpenseToPLN(expense);
    const currentAmount = categoryMap.get(expense.category) || 0;
    categoryMap.set(expense.category, currentAmount + amountInPLN);
  });

  // Stwórz mapę planowanych kwot
  const plannedMap = new Map<string, number>();
  if (plannedCategories) {
    plannedCategories.forEach((cat) => {
      plannedMap.set(cat.name, cat.plannedAmount);
    });
  }

  // Konwertuj na tablicę i dodaj planowane kwoty
  const categories = Array.from(categoryMap.entries()).map(([name, amount]) => ({
    name,
    amount,
    plannedAmount: plannedMap.get(name) || 0,
  }));

  // Dodaj kategorie, które mają planowane kwoty ale nie mają jeszcze wydatków
  if (plannedCategories) {
    plannedCategories.forEach((plannedCat) => {
      if (!categoryMap.has(plannedCat.name)) {
        categories.push({
          name: plannedCat.name,
          amount: 0,
          plannedAmount: plannedCat.plannedAmount,
        });
      }
    });
  }

  // Sortuj alfabetycznie
  return categories.sort((a, b) => a.name.localeCompare(b.name));
}

