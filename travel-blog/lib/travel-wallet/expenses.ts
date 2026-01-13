import type { Expense } from "./types";

/**
 * Kursy walut do PLN (przykładowe, później można pobrać z API)
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
};

/**
 * Konwertuje kwotę w danej walucie na PLN
 */
function convertToPLN(amount: number, currency: string): number {
  const rate = exchangeRates[currency.toUpperCase()] || 1;
  return amount * rate;
}

/**
 * Mock data dla expenses
 */
const mockExpenses: Expense[] = [
  // Tajlandia (id: "1")
  {
    id: "exp-1",
    countryId: "1",
    amount: 150,
    currency: "PLN",
    category: "Jedzenie",
    description: "Obiad w restauracji",
    note: "Pyszne lokalne jedzenie",
    date: "2026-06-15",
  },
  {
    id: "exp-2",
    countryId: "1",
    amount: 300,
    currency: "PLN",
    category: "Noclegi",
    description: "Hotel Bangkok",
    note: "Świetna lokalizacja w centrum",
    date: "2026-06-16",
  },
  {
    id: "exp-3",
    countryId: "1",
    amount: 200,
    currency: "THB",
    category: "Transport",
    description: "Taksówka",
    date: "2026-06-17",
  },
  {
    id: "exp-4",
    countryId: "1",
    amount: 500,
    currency: "PLN",
    category: "Noclegi",
    description: "Hotel Phuket",
    date: "2026-06-20",
  },
  {
    id: "exp-5",
    countryId: "1",
    amount: 100,
    currency: "PLN",
    category: "Jedzenie",
    description: "Śniadanie",
    date: "2026-06-21",
  },
  {
    id: "exp-6",
    countryId: "1",
    amount: 150,
    currency: "USD",
    category: "Aktywności",
    description: "Wycieczka na wyspy",
    note: "Całodniowa wycieczka, warto!",
    date: "2026-06-25",
  },
  {
    id: "exp-7",
    countryId: "1",
    amount: 400,
    currency: "PLN",
    category: "Noclegi",
    description: "Ostatni hotel",
    date: "2026-06-28",
  },
  {
    id: "exp-8",
    countryId: "1",
    amount: 250,
    currency: "PLN",
    category: "Jedzenie",
    description: "Kolacja",
    date: "2026-07-01",
  },
  // Wietnam (id: "2")
  {
    id: "exp-9",
    countryId: "2",
    amount: 200,
    currency: "PLN",
    category: "Jedzenie",
    description: "Obiad",
    date: "2026-07-03",
  },
  {
    id: "exp-10",
    countryId: "2",
    amount: 400,
    currency: "PLN",
    category: "Noclegi",
    description: "Hotel Ho Chi Minh",
    date: "2026-07-04",
  },
  {
    id: "exp-11",
    countryId: "2",
    amount: 150,
    currency: "PLN",
    category: "Transport",
    description: "Lot wewnętrzny",
    date: "2026-07-10",
  },
  {
    id: "exp-12",
    countryId: "2",
    amount: 400,
    currency: "PLN",
    category: "Noclegi",
    description: "Hotel Hanoi",
    date: "2026-07-11",
  },
  {
    id: "exp-13",
    countryId: "2",
    amount: 200,
    currency: "PLN",
    category: "Jedzenie",
    description: "Obiad",
    date: "2026-07-15",
  },
  {
    id: "exp-14",
    countryId: "2",
    amount: 150,
    currency: "USD",
    category: "Aktywności",
    description: "Wycieczka do Ha Long Bay",
    note: "Niesamowite widoki",
    date: "2026-07-18",
  },
  // Japonia (id: "3")
  {
    id: "exp-15",
    countryId: "3",
    amount: 400,
    currency: "PLN",
    category: "Jedzenie",
    description: "Obiad w Tokio",
    date: "2026-07-21",
  },
  {
    id: "exp-16",
    countryId: "3",
    amount: 600,
    currency: "PLN",
    category: "Noclegi",
    description: "Hotel Tokio",
    date: "2026-07-22",
  },
  {
    id: "exp-17",
    countryId: "3",
    amount: 200,
    currency: "JPY",
    category: "Transport",
    description: "Bilet kolejowy",
    date: "2026-07-25",
  },
  {
    id: "exp-18",
    countryId: "3",
    amount: 500,
    currency: "PLN",
    category: "Noclegi",
    description: "Hotel Kioto",
    date: "2026-07-28",
  },
  {
    id: "exp-19",
    countryId: "3",
    amount: 300,
    currency: "PLN",
    category: "Jedzenie",
    description: "Obiad",
    date: "2026-08-02",
  },
  {
    id: "exp-20",
    countryId: "3",
    amount: 500,
    currency: "PLN",
    category: "Noclegi",
    description: "Hotel Osaka",
    date: "2026-08-05",
  },
  {
    id: "exp-21",
    countryId: "3",
    amount: 200,
    currency: "PLN",
    category: "Transport",
    description: "Bilet kolejowy",
    date: "2026-08-08",
  },
  {
    id: "exp-22",
    countryId: "3",
    amount: 100,
    currency: "USD",
    category: "Aktywności",
    description: "Muzeum",
    date: "2026-08-10",
  },
];

const STORAGE_KEY = "travel-wallet-expenses";
const getStorageKey = (tripId?: string) => {
  return tripId ? `travel-wallet-expenses-${tripId}` : STORAGE_KEY;
};

/**
 * Pobiera wszystkie expenses z localStorage i łączy z mock data
 */
function getAllExpensesFromStorage(tripId?: string): Expense[] {
  if (typeof window === "undefined") {
    // Na serwerze zwracamy mock expenses bez filtrowania po tripId (są to przykładowe dane)
    return mockExpenses;
  }

  try {
    const storageKey = getStorageKey(tripId);
    const stored = localStorage.getItem(storageKey);
    
    let userExpenses: Expense[] = [];
    if (stored) {
      userExpenses = JSON.parse(stored) as Expense[];
    } else if (!tripId) {
      // Dla backward compatibility, sprawdź stary klucz jeśli tripId nie jest podane
      const oldStored = localStorage.getItem(STORAGE_KEY);
      if (oldStored) {
        userExpenses = JSON.parse(oldStored) as Expense[];
      }
    }

    // Łączymy mock data z danymi z localStorage
    // Mock expenses są wyświetlane zawsze jako przykładowe dane
    const storedIds = new Set(userExpenses.map((e) => e.id));
    const mockOnly = mockExpenses.filter((e) => !storedIds.has(e.id));
    
    return [...userExpenses, ...mockOnly];
  } catch (error) {
    console.error("Error reading expenses from localStorage:", error);
    // W przypadku błędu zwracamy mock expenses
    return mockExpenses;
  }
}

/**
 * Zapisuje wszystkie expenses do localStorage
 */
function saveExpensesToStorage(expenses: Expense[], tripId?: string): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  try {
    const storageKey = getStorageKey(tripId);
    // Filtrujemy mock data - zapisujemy tylko te z localStorage
    const mockIds = new Set(mockExpenses.map((e) => e.id));
    const userExpenses = expenses.filter((e) => !mockIds.has(e.id));
    localStorage.setItem(storageKey, JSON.stringify(userExpenses));
    return true;
  } catch (error) {
    console.error("Error saving expenses to localStorage:", error);
    return false;
  }
}

/**
 * Generuje unikalne ID dla expense
 */
function generateExpenseId(): string {
  return `exp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Pobiera wszystkie expenses (z localStorage + mock data)
 * @param tripId - opcjonalne ID podróży do filtrowania
 */
export function getAllExpenses(tripId?: string): Expense[] {
  return getAllExpensesFromStorage(tripId);
}

/**
 * Pobiera wszystkie expenses dla danego kraju
 * @param countryId - ID kraju
 * @param tripId - opcjonalne ID podróży
 */
export function getExpensesByCountryId(
  countryId: string,
  tripId?: string
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
 * @param tripId - opcjonalne ID podróży
 */
export function getExpenseById(id: string, tripId?: string): Expense | null {
  return getAllExpenses(tripId).find((expense) => expense.id === id) || null;
}

/**
 * Dodaje nowy expense z auto-generowanym ID
 * @param expenseData - dane expense (bez ID)
 * @param tripId - opcjonalne ID podróży (jeśli nie podane, użyje z expenseData.tripId)
 */
export function addExpense(
  expenseData: Omit<Expense, "id">,
  tripId?: string
): Expense {
  const finalTripId = tripId || expenseData.tripId;
  const newExpense: Expense = {
    ...expenseData,
    id: generateExpenseId(),
    tripId: finalTripId,
  };

  const allExpenses = getAllExpensesFromStorage(finalTripId);
  allExpenses.push(newExpense);
  saveExpensesToStorage(allExpenses, finalTripId);

  return newExpense;
}

/**
 * Zapisuje expense (aktualizuje istniejący lub dodaje nowy)
 * @param expense - expense do zapisania
 * @param tripId - opcjonalne ID podróży (jeśli nie podane, użyje z expense.tripId)
 */
export function saveExpense(expense: Expense, tripId?: string): boolean {
  const finalTripId = tripId || expense.tripId;
  const allExpenses = getAllExpensesFromStorage(finalTripId);
  const index = allExpenses.findIndex((e) => e.id === expense.id);

  if (index >= 0) {
    // Aktualizuj istniejący
    allExpenses[index] = { ...expense, tripId: finalTripId };
  } else {
    // Dodaj nowy
    allExpenses.push({ ...expense, tripId: finalTripId });
  }

  return saveExpensesToStorage(allExpenses, finalTripId);
}

/**
 * Usuwa expense po ID
 * @param id - ID expense do usunięcia
 * @param tripId - opcjonalne ID podróży
 */
export function deleteExpense(id: string, tripId?: string): boolean {
  const allExpenses = getAllExpensesFromStorage(tripId);
  const filtered = allExpenses.filter((e) => e.id !== id);

  if (filtered.length === allExpenses.length) {
    // Nie znaleziono expense do usunięcia
    return false;
  }

  return saveExpensesToStorage(filtered, tripId);
}

/**
 * Konwertuje expense na PLN
 */
export function convertExpenseToPLN(expense: Expense): number {
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
      return saveExpensesToStorage(expenses, tripId);
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
      return saveExpensesToStorage(expenses, tripId);
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

