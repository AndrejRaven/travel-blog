/**
 * System logowania zmian w portfelu podróżniczym
 */

export type ActivityLogType =
  | "expense_added"
  | "expense_edited"
  | "expense_deleted"
  | "country_added"
  | "country_edited"
  | "country_deleted"
  | "location_added"
  | "location_edited"
  | "location_deleted"
  | "trip_edited"
  | "currency_transaction_added"
  | "currency_transaction_deleted";

export interface ActivityLog {
  id: string;
  tripId: string;
  type: ActivityLogType;
  timestamp: string; // ISO format
  action: string; // Krótki opis akcji (np. "Dodano wydatek")
  details: Record<string, unknown>; // Szczegóły akcji
}

const STORAGE_KEY_PREFIX = "travel-wallet-activity-logs-";

/**
 * Pobiera klucz localStorage dla logów danej podróży
 */
function getStorageKey(tripId: string): string {
  return `${STORAGE_KEY_PREFIX}${tripId}`;
}

/**
 * Pobiera wszystkie logi dla danej podróży
 */
export function getActivityLogs(tripId: string): ActivityLog[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const key = getStorageKey(tripId);
    const stored = localStorage.getItem(key);
    if (!stored) {
      return [];
    }

    const parsed = JSON.parse(stored);
    if (Array.isArray(parsed)) {
      return parsed as ActivityLog[];
    }

    return [];
  } catch (error) {
    console.error("Error reading activity logs from localStorage:", error);
    return [];
  }
}

/**
 * Zapisuje log do localStorage
 */
function saveActivityLog(log: ActivityLog): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  try {
    const logs = getActivityLogs(log.tripId);
    logs.push(log);
    
    // Ograniczenie do ostatnich 1000 logów na podróż
    const limitedLogs = logs.slice(-1000);
    
    const key = getStorageKey(log.tripId);
    localStorage.setItem(key, JSON.stringify(limitedLogs));
    return true;
  } catch (error) {
    console.error("Error saving activity log to localStorage:", error);
    return false;
  }
}

/**
 * Tworzy nowy log
 */
function createLog(
  tripId: string,
  type: ActivityLogType,
  action: string,
  details: Record<string, unknown> = {}
): ActivityLog {
  return {
    id: Math.random().toString(36).substr(2, 9),
    tripId,
    type,
    timestamp: new Date().toISOString(),
    action,
    details,
  };
}

/**
 * Loguje dodanie wydatku
 */
export function logExpenseAdded(
  tripId: string,
  expenseId: string,
  countryName: string,
  amount: number,
  currency: string,
  description?: string
): void {
  const log = createLog(
    tripId,
    "expense_added",
    "Dodano wydatek",
    {
      expenseId,
      countryName,
      amount,
      currency,
      description: description || "",
    }
  );
  saveActivityLog(log);
}

/**
 * Loguje edycję wydatku
 */
export function logExpenseEdited(
  tripId: string,
  expenseId: string,
  countryName: string,
  changes: Record<string, unknown>
): void {
  const log = createLog(
    tripId,
    "expense_edited",
    "Edytowano wydatek",
    {
      expenseId,
      countryName,
      changes,
    }
  );
  saveActivityLog(log);
}

/**
 * Loguje usunięcie wydatku
 */
export function logExpenseDeleted(
  tripId: string,
  expenseId: string,
  countryName: string,
  amount: number,
  currency: string
): void {
  const log = createLog(
    tripId,
    "expense_deleted",
    "Usunięto wydatek",
    {
      expenseId,
      countryName,
      amount,
      currency,
    }
  );
  saveActivityLog(log);
}

/**
 * Loguje dodanie kraju
 */
export function logCountryAdded(
  tripId: string,
  countryId: string,
  countryName: string,
  startDate?: string,
  endDate?: string
): void {
  const log = createLog(
    tripId,
    "country_added",
    "Dodano kraj",
    {
      countryId,
      countryName,
      startDate: startDate || "",
      endDate: endDate || "",
    }
  );
  saveActivityLog(log);
}

/**
 * Loguje edycję kraju
 */
export function logCountryEdited(
  tripId: string,
  countryId: string,
  countryName: string,
  changes: Record<string, unknown>
): void {
  const log = createLog(
    tripId,
    "country_edited",
    "Edytowano kraj",
    {
      countryId,
      countryName,
      changes,
    }
  );
  saveActivityLog(log);
}

/**
 * Loguje usunięcie kraju
 */
export function logCountryDeleted(
  tripId: string,
  countryId: string,
  countryName: string
): void {
  const log = createLog(
    tripId,
    "country_deleted",
    "Usunięto kraj",
    {
      countryId,
      countryName,
    }
  );
  saveActivityLog(log);
}

/**
 * Loguje dodanie miejsca
 */
export function logLocationAdded(
  tripId: string,
  countryId: string,
  countryName: string,
  locationName: string,
  startDate?: string,
  endDate?: string
): void {
  const log = createLog(
    tripId,
    "location_added",
    "Dodano miejsce",
    {
      countryId,
      countryName,
      locationName,
      startDate: startDate || "",
      endDate: endDate || "",
    }
  );
  saveActivityLog(log);
}

/**
 * Loguje edycję miejsca
 */
export function logLocationEdited(
  tripId: string,
  countryId: string,
  countryName: string,
  oldLocationName: string,
  newLocationName: string,
  changes: Record<string, unknown>
): void {
  const log = createLog(
    tripId,
    "location_edited",
    "Edytowano miejsce",
    {
      countryId,
      countryName,
      oldLocationName,
      newLocationName,
      changes,
    }
  );
  saveActivityLog(log);
}

/**
 * Loguje usunięcie miejsca
 */
export function logLocationDeleted(
  tripId: string,
  countryId: string,
  countryName: string,
  locationName: string
): void {
  const log = createLog(
    tripId,
    "location_deleted",
    "Usunięto miejsce",
    {
      countryId,
      countryName,
      locationName,
    }
  );
  saveActivityLog(log);
}

/**
 * Loguje edycję podróży
 */
export function logTripEdited(
  tripId: string,
  tripName: string,
  changes: Record<string, unknown>
): void {
  const log = createLog(
    tripId,
    "trip_edited",
    "Edytowano podróż",
    {
      tripName,
      changes,
    }
  );
  saveActivityLog(log);
}

/**
 * Loguje dodanie transakcji walutowej
 */
export function logCurrencyTransactionAdded(
  tripId: string,
  transactionId: string,
  fromCurrency: string,
  fromAmount: number,
  toCurrency: string,
  toAmount: number
): void {
  const log = createLog(
    tripId,
    "currency_transaction_added",
    "Dodano transakcję walutową",
    {
      transactionId,
      fromCurrency,
      fromAmount,
      toCurrency,
      toAmount,
    }
  );
  saveActivityLog(log);
}

/**
 * Loguje usunięcie transakcji walutowej
 */
export function logCurrencyTransactionDeleted(
  tripId: string,
  transactionId: string,
  fromCurrency: string,
  fromAmount: number,
  toCurrency: string,
  toAmount: number
): void {
  const log = createLog(
    tripId,
    "currency_transaction_deleted",
    "Usunięto transakcję walutową",
    {
      transactionId,
      fromCurrency,
      fromAmount,
      toCurrency,
      toAmount,
    }
  );
  saveActivityLog(log);
}

/**
 * Usuwa wszystkie logi dla danej podróży
 */
export function clearActivityLogs(tripId: string): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    const key = getStorageKey(tripId);
    localStorage.removeItem(key);
  } catch (error) {
    console.error("Error clearing activity logs:", error);
  }
}
